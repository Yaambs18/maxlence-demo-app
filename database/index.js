const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./models/user')(sequelize, Sequelize);

sequelize.sync()
  .then(() => {
    console.log('Database synced (models created/updated).');
  })
  .catch((err) => {
    console.error('Error syncing the database:', err);
  });

module.exports = db;