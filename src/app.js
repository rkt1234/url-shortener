const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoute');
const helmet = require('helmet');
const urlRoutes = require('./routes/urlRoute');

dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet());
app.use('/auth', authRoutes);
app.use('/', urlRoutes);

module.exports = app;
