const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoute');

dotenv.config();

const app = express();
app.use(express.json());
const urlRoutes = require('./routes/urlRoute');

app.use('/auth', authRoutes);
app.use('/', urlRoutes);

module.exports = app;
