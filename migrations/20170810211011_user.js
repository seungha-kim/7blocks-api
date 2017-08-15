
exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function(table) {
    table.string('id').primary()
    table.string('token').notNullable()
    table.string('token_secret').notNullable()
    table.string('email').notNullable()
    table.string('display_name').notNullable()
    table.timestamps(false, true)
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users')
};
