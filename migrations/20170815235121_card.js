
exports.up = function(knex, Promise) {
  return knex.schema.createTable('cards', function(table) {
    table.string('id').primary()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('cards')
};
