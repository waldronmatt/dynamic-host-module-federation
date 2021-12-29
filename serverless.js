const compression = require('compression');
const express = require('express');

// setup
const app = express();

// compress all responses
app.use(compression());

// use express.static() to serve files from several directories
app.use(express.static(__dirname));

// serve the index file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// path must route to lambda
app.use('/.netlify/functions/server', app);

module.exports.handler = serverless(app);
