const gql = require('graphql-tag')

module.exports = gql`
type Query {
  # authenticated user
  currentUser: User
  board(id: String!): BoardWithCards
}

type Mutation {
  newBlock(cardId: String!, length: Int!): Block
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
  blocks(cardId: String, first: Int = 20, offset: Int = 0): [Block!]!
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

type Block {
  id: Int!
  length: Int!
  createdAt: GraphQLDateTime!
  cardId: String!
}

`
