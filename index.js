require('dotenv').config()

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const wrap = require('express-async-wrap')
const passport = require('passport')
const trello = require('passport-trello')
const morgan = require('morgan')
const {knex} = require('./db')
const _ = require('lodash')
const log = require('loglevel')
const cors = require('cors')

const app = express()
const PORT = 3001
const PROD = process.env.NODE_ENV === 'production'
const corsOption = {
  origin: process.env.SPA_ORIGIN,
  credentials: true,
  maxAge: 600
}
const corsMiddleware = cors(corsOption)

log.setLevel(PROD ? 'warn' : 'debug')

app.use(corsMiddleware)
app.options('*', corsMiddleware)

app.use(bodyParser.json())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: PROD,
  }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(morgan('combined'))

function makeExpressUserFromRow(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    createdAt: row.created_at
  }
}

passport.use('trello', new trello.Strategy({ // FIXME
  consumerKey: process.env.TRELLO_CONSUMER_KEY,
  consumerSecret: process.env.TRELLO_CONSUMER_SECRET,
  callbackURL: process.env.TRELLO_CALLBACK_URL,
  passReqToCallback: true,
  trelloParams: {
    scope: "read,account",
    name: "MyApp",
    expiration: "never"
  }
}, (req, token, tokenSecret, profile, done) => {
  knex.transaction(trx => {
    // 해당 id에 해당하는 user가 데이터베이스에 존재하면 찾아서 반환하고 없으면 만든다.
    return trx('users')
      .forUpdate()
      .where({id: profile.id})
      .first()
      .then(row => {
        if (row) {
          done(null, makeExpressUserFromRow(row))
        } else {
          return knex('users')
            .insert({
              id: profile.id,
              token,
              token_secret: tokenSecret,
              email: profile.emails[0].value,
              display_name: profile.displayName
            }, '*')
            .then(rows => {
              done(null, makeExpressUserFromRow(rows[0]))
            })
        }
      })
      .catch(done)
  })
}))

passport.serializeUser(function(user, done) {
  done(null, user.id)
});

passport.deserializeUser(function(id, done) {
  knex('users').where({id}).first().then(row => {
    const user = {
      id,
      displayName: row.display_name,
      email: row.email,
      createdAt: row.created_at
    }
    done(null, row)
  }).catch(done)
});

app.get('/login', passport.authenticate('trello'))

app.get('/login/callback', passport.authenticate('trello', {
  successRedirect: '/login/success',
  failureRedirect: '/login/failure'
}))

app.get('/login/success', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(`success <script>window.opener.postMessage('success', '*')</script>`)
})

app.get('/login/failure', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(`success <script>window.opener.postMessage('failure', '*')</script>`)
})

app.delete('/login', (req, res) => {
  req.logout()
  res.send({ok: true})
})

app.get('/', (req, res) => {
  if (req.user) {
    res.send(JSON.stringify(req.user))
  } else {
    res.send('no user')
  }
})

app.get('/user', (req, res) => {
  // FIXME
  log.info(`cookie: ${JSON.stringify(req.cookies)}`)
  if (req.user) {
    res.send({
      ok: true,
      data: makeExpressUserFromRow(req.user)
    })
  } else {
    res.status(400).send({ok: false})
  }
})

app.listen(PORT, () => {
  log.info(`listening ${PORT}...`)
})
