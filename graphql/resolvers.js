const log = require('loglevel')
const { GraphQLDateTime } = require('graphql-iso-date')

module.exports = {
  Query: {
    currentUser: async function (obj, args, ctx) {
      log.debug(`queried user: ctx.user`)
      return ctx.user
    },
    board: async function (obj, args, ctx) {
      const { id } = args
      const res = await ctx.trello.get(`boards/${id}`, {
        params: {
          fields: ['id', 'name', 'shortUrl'].join(',')
        }
      })
      return res.data
    }
  },
  BoardWithCards: {
    cards: async function (obj, args, ctx) {
      const { id } = obj
      const res = await ctx.trello.get(`boards/${id}/cards`, {
        params: {
          fields: ['id', 'name', 'shortUrl'].join(',')
        }
      })
      return res.data
    }
  },
  User: {
    assignedCards: async function (obj, args, ctx) {
      const res = await ctx.trello.get('members/me/cards', {
        params: {
          fields: ['id', 'name', 'shortUrl'].join(',')
        }
      })
      return res.data
    },
    boards: async function (obj, args, ctx) {
      const res = await ctx.trello.get('members/me/boards', {
        params: {
          fields: ['id', 'name', 'shortUrl'].join(','),
          filter: 'open'
        }
      })
      return res.data
    }
  },
  GraphQLDateTime
}
