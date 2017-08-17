require('dotenv').config()

const createExpressApp = require('./server')
const graphqlSchema = require('./graphql')
const {knex} = require('./database')
const log = require('loglevel')

const env = process.env
const isProduction = env.NODE_ENV === 'production'
const corsOrigin = env.CORS_ORIGIN
const consumerKey = env.TRELLO_CONSUMER_KEY
const consumerSecret = env.TRELLO_CONSUMER_SECRET
const callbackURL = env.TRELLO_CALLBACK_URL
const port = env.PORT || 3001
const sessionSecret = env.SESSION_SECRET || 'secret'

log.setLevel(isProduction ? 'info' : 'debug')

const app = createExpressApp({
  knex,
  isProduction,
  corsOrigin,
  sessionSecret,
  graphqlSchema,
  trello: {
    consumerKey,
    consumerSecret,
    callbackURL
  }
})

app.listen(port, function () {
  log.info(`current NODE_ENV: ${env.NODE_ENV}`)
  log.info(`listening ${port}...`)
})
