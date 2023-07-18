const express = require('express');
const User = require('../models/User');
const router = express.Router();
const authController = require('../controllers/authController');
const { OAuth2Client } = require('google-auth-library');
const credentials = require('../secrets/credentials.json');

const clientConfig = credentials.web;
const oauth2Client = new OAuth2Client(
  clientConfig.client_id,
  clientConfig.client_secret,
  clientConfig.redirect_uris
);

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password', authController.resetPassword);
router.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    scope: ['https://www.googleapis.com/auth/gmail.send'], // Adjust scopes as needed
  });
  res.redirect(authUrl);
});


// ...

router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Get the user from the database or create a new user if not found
    let user = await User.findOne({ _id: req.session.userId });
    if (!user) {
      // Create a new user document in the database
      user = new User();
      // Set the email for the new user
      user.email = 'nikhil.212708111@vcet.edu.in';
    }

    // Update the user with the received tokens
    user.tokens = {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
    };

    // Save the user document
    await user.save();

    res.send('Authentication successful!'); // or redirect to a success page
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
