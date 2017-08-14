const gql = require('graphql-tag')

module.exports = gql`
type Query {
  # authenticated user
  currentUser: User
  board(id: String!): BoardWithCards
}

scalar GraphQLDateTime

type User {
  # user's first email registered in Trello
  id: String!
  displayName: String!
  email: String!
  createdAt: GraphQLDateTime!
  assignedCards: [Card!]!
  boards: [Board!]!
}

type Card {
  id: String!
  shortUrl: String!
  name: String!
}

interface BoardInterface {
  id: String!
  name: String!
  shortUrl: String!
}

type Board implements BoardInterface {
  id: String!
  name: String!
  shortUrl: String!
}

type BoardWithCards implements BoardInterface {
  id: String!
  name: String!
  shortUrl: String!
  cards: [Card!]!
}
`
