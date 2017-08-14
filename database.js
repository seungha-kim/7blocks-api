const knexFactory = require('knex')
const knexConfig = require('./knexfile')

exports.knex = knexFactory(knexConfig)
