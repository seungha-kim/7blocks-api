const express = require('express')
const session = require('express-session')
const passport = require('passport')
const trello = require('passport-trello')
const morgan = require('morgan')
const log = require('loglevel')
const cors = require('cors')
const graphqlHTTP = require('express-graphql')
const connectSessionKnex = require('connect-session-knex')
const axios = require('axios')

const TRELLO_SESSION_KEY = 'oauth:trello'

function trelloMiddleware (consumerKey) {
  return (req, res, next) => {
    if (req.user) {
      const instance = axios.create({
        baseURL: 'https://api.trello.com/1/',
        params: {
          key: consumerKey,
          token: req.user.token
        }
      })
      req.trello = instance
    }
    next()
  }
}

function knexMiddleware (knex) {
  return (req, res, next) => {
    req.knex = knex
    next()
  }
}

module.exports = function createApp (options) {
  const {
    knex,
    isProduction,
    corsOrigin,
    sessionSecret,
    trello: {
      consumerKey,
      consumerSecret,
      callbackURL
    },
    graphqlSchema
  } = options
  const corsOption = {
    origin: corsOrigin,
    credentials: true,
    maxAge: 600
  }
  const corsMiddleware = cors(corsOption)
  const app = express()

  app.use(corsMiddleware)
  app.options('*', corsMiddleware)

  if (isProduction) {
    app.set('trust proxy', 1)
  }

  const KnexSessionStore = connectSessionKnex(session)
  const sessionStore = new KnexSessionStore({
    knex
  })
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction
    },
    store: sessionStore
  }))

  function makeExpressUserFromRow (row) {
    return {
      id: row.id,
      displayName: row.display_name,
      email: row.email,
      createdAt: row.created_at,
      token: row.token,
      token_secret: row.token_secret
    }
  }

  passport.use('trello', new trello.Strategy({ // FIXME
    sessionKey: TRELLO_SESSION_KEY,
    consumerKey,
    consumerSecret,
    callbackURL,
    passReqToCallback: true,
    trelloParams: {
      scope: 'read,account',
      name: '7blocks',
      expiration: 'never'
    }
  }, (req, token, tokenSecret, profile, done) => {
    knex('users')
      .where({id: profile.id})
      .first()
      .then(row => {
        if (row) {
          // TODO: update stale info
          done(null, makeExpressUserFromRow(row))
        } else {
          return knex('users')
            .insert({
              id: profile.id,
              token,
              token_secret: tokenSecret,
              email: profile.emails[0].value,
              display_name: profile.displayName
            }, 'id')
            .then(ids => {
              return knex('users')
                .where({id: ids[0]})
                .first()
            })
            .then(row => {
              done(null, makeExpressUserFromRow(row))
            })
        }
      })
      .catch(done)
  }))

  passport.serializeUser(function (user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function (id, done) {
    log.debug(`deserializeUser ${id}`)
    knex('users').where({id}).first().then(row => {
      const user = {
        id,
        displayName: row.display_name,
        email: row.email,
        createdAt: row.created_at,
        token: row.token
      }
      done(null, user)
    }).catch(done)
  })
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(morgan('combined'))

  app.get('/auth', passport.authenticate('trello'))

  app.get('/auth/callback', (req, res, next) => {
    // FIXME
    log.info(req.session)
    log.info(req.session[TRELLO_SESSION_KEY])
    next()
  }, passport.authenticate('trello', {
    successRedirect: '/auth/success',
    failureRedirect: '/auth/failure'
  }))

  app.get('/auth/success', (req, res) => {
    res.set('Content-Type', 'text/html')
    res.send(`success <script>window.opener.postMessage('success', '*')</script>`)
  })

  app.get('/auth/failure', (req, res) => {
    res.set('Content-Type', 'text/html')
    res.send(`success <script>window.opener.postMessage('failure', '*')</script>`)
  })

  app.delete('/auth', (req, res) => {
    req.logout()
    res.send({ok: true})
  })

  app.use('/graphql', knexMiddleware(knex), trelloMiddleware(consumerKey), graphqlHTTP({
    schema: graphqlSchema,
    graphiql: !isProduction
  }))
  return app
}
