const { makeExecutableSchema } = require('graphql-tools')
const typeDefs = require('./typedefs')
const resolvers = require('./resolvers')

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers
})
