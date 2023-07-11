const User = require('../models/User');
const nodemailer = require('nodemailer');

// Set up nodemailer with your email account credentials
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'loren.wehner40@ethereal.email',
        pass: 'NzVTsrX3egCR8Gb6bj'
    }
});

exports.register = async (req, res) => {
  try {
    // Get user data from the request body
    const { username, email, password } = req.body;
   console.log(username);
    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Create a new user document in the database
    const user = new User({ username, email, password });
    await user.save();

    // Generate a random OTP and store it in the database
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    await user.save();

    // Send the OTP to the user's email address using nodemailer
    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: email,
      subject: 'OTP for Email Verification',
      text: `Your OTP is ${otp}`
    });

    res.status(201).json({ message: 'User registered successfully' });
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

    // TODO: Implement an authentication system to keep track of logged-in users

    res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
