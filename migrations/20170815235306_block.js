
exports.up = function(knex, Promise) {
  return knex.schema.createTable('blocks', function(table) {
    table.increments()
    table.integer('length').notNullable()
    table.string('card_id').notNullable()
    table.foreign('card_id').references('cards.id')
    table.string('user_id').notNullable()
    table.foreign('user_id').references('users.id')
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('blocks')
};
