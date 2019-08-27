"use strict";
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

// serve a static client:
app.use(express.static("public"));

// link the app... .js
app.use(require('./appGet.js'));
app.use(require('./appPost.js'));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
