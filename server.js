const express = require('express');
const mongoose = require('mongoose');
const session = require('./config/session');
const authRoutes = require('./routes/authRoutes');


const app = express();

// Connect to the MongoDB database using mongoose
mongoose.connect('mongodb+srv://mahadiknikhil2508:EVPB13rCxUW4GfiZ@cluster0.t65644e.mongodb.net/userLogin?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Use the express.json middleware to parse JSON request bodies
app.use(express.json());
app.use(session);
// Use the authRoutes middleware to handle authentication and registration requests
app.use('/auth', authRoutes);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
