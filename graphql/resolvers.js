const log = require('loglevel')
const { GraphQLDateTime } = require('graphql-iso-date')

function blockFromRow (row) {
  return {
    id: row.id,
    length: row.length,
    createdAt: row.created_at,
    cardId: row.card_id
  }
}

function blockFromInput (input, userId) {
  return {
    length: input.length,
    card_id: input.cardId,
    user_id: userId
  }
}

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
  Mutation: {
    newBlock: async function (obj, args, ctx) {
      log.info(`newBlock start: cardId(${args.cardId})`)
      return ctx.knex.transaction(async trx => {
        const card = await trx('cards').where({id: args.cardId}).first()
        if (!card) {
          await trx('cards').insert({id: args.cardId})
        }
        const ids = await trx('blocks')
          .insert(blockFromInput(args, ctx.user.id), 'id')
        const row = await trx('blocks')
          .where({id: ids[0]})
          .first()
        return blockFromRow(row)
      })
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
    },
    blocks: async function (obj, args, ctx) {
      const filter = {
        user_id: ctx.user.id
      }
      if (args.cardId) {
        filter.card_id = args.cardId
      }
      const rows = await ctx.knex('blocks')
        .where(filter)
        .first(args.first)
        .offset(args.offset)
      return rows.map(blockFromRow)
    }
  },
  GraphQLDateTime
}
