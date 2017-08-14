// Update with your config settings.

require('dotenv').config()

module.exports = {
  client: 'mariasql',
  connection: process.env.DATABASE_URL
}
