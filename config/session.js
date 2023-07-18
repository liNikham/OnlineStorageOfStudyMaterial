const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const config = require('../secrets/secret.js');
// Create a MongoDBStore instance
const store = new MongoDBStore({
  uri: config.mongoDBUri,
  collection: 'sessions',
  mongooseConnection: mongoose.connection,
});

// Catch any errors that occur when initializing the store
store.on('error', (error) => {
  console.error('Session store error:', error);
});

const sessionConfig = {
  secret: 'jfdsjfsajfsjfl47629472jhlkjljf', // Change this to a random string of your choice
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: false,
      secure: false,
    maxAge: 3600000, // Session expiration time in milliseconds (1 hour)
  },
  store: store,
};

module.exports = session(sessionConfig);
