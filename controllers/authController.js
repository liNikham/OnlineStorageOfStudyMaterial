const User = require('../models/User');
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');



// Set up nodemailer with your email account credentials

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
      user: 'nikhil.212708111@vcet.edu.in',
      pass: 'hzhquqgmcajxiqkz'
  }
});

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    // Get user data from the request body
    const { username, email, password } = req.body;

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Create a new user document in the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ username, email, password: hashedPassword });

    // Save the user document in the database
    user.save();

    // Generate a random OTP and store it in the database
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;

    // Send the OTP to the user's email address using the Gmail API
    const mailOptions = {
      from: 'nikhil.212708111@vcet.edu.in',
      to: email,
      subject: 'Email Verification',
      text: `Welcom to Adarsh,Sachin and Nikhil website . Your OTP is ${otp}`,
    };

    // Send the email using Nodemailer
    transporter.sendMail(mailOptions, async(error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send email' });
      }
      console.log('Email sent:', info.response);
      
      
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.verifyOTP = async (req, res) => {
  try {
    // Get the OTP from the request body
    const { otp } = req.body;

    // Find the user document in the database and check if the OTP matches
    const user = await User.findOne({ otp });
    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update the user document to indicate that their email has been verified
    user.emailVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    // Get login credentials from the request body
    const { email, password } = req.body;

    // Find the user document in the database and check if their password matches
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    req.session.userId = user._id;
    // TODO: Implement an authentication system to keep track of logged-in users

    res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.logout = async (req, res) => {
  try {
    // Destroy the session to log the user out
    await req.session.destroy();

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a unique token for password reset
    const resetToken = crypto.randomBytes(20).toString('hex');
    // console.log(resetToken)
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send the password reset link to the user's email address using nodemailer
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: 'nikhil.212708111@vcet.edu.in',
      to: email,
      subject: 'Password Reset',
      text: `Click the link to reset your password: ${resetUrl}`,
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.query.token;
    const { newPassword, confirmPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Update the user's password and clear the reset token fields
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const userData = await User.findByIdAndUpdate(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: '', resetPasswordTokenExpiry: '' },
        tokens: { refreshToken: '', accessToken: '' } // Clear the tokens
      },
      { new: true }
    );
    

    
  

    res.status(200).send({ msg: 'User Password has been reset', data: userData });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: error.message });
  }
};

