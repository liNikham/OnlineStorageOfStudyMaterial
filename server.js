const express = require('express');
const mongoose = require('mongoose');
const session = require('./config/session');
const authRoutes = require('./routes/authRoutes');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const config = require('./secrets/secret.js');
const app = express();

const oauth2Client = new OAuth2Client(config.googleClientId, config.googleClientSecret, [
  'http://localhost:3000/auth/google/callback',
]);
// Connect to the MongoDB database using mongoose
mongoose.connect(config.mongoDBUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// Use the express.json middleware to parse JSON request bodies
app.use(express.json());
app.use(session);
// Use the authRoutes middleware to handle authentication and registration requests
app.use( authRoutes);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
