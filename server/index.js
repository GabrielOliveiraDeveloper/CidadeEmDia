const dotenv = require('dotenv').config();

const express = require('express');
const routes = require('./routes/routes');
const connectToDB = require('./db/connectToDB');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(routes);

connectToDB();

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});