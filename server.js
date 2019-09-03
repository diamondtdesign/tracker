'use strict'

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const router = express.Router();
const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// use router
app.use('/api/exercise', router)


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})




// Schema setup
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique:true,
    maxlength: [25, 'username too long – max 25 characters']
  },
  exercises: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: Date, default: Date.now()},
  }],
})
const User = mongoose.model('User', userSchema)


// add new user
router.post('/new-user', (req, res, next) => {
  const user = new User({username: req.body.username})
  user.save((err, data) => {
    if (err) {
      if (err.code==11000) { // err: duplicate username
        return res.send('username already taken')
      }
      return next(err) // err: all
    }
    res.json({ username:user.username, id:user._id})
    console.log(data)
    next(null, data)
  })
})

// add exercises
router.post('/add', (req, res, done) => {
  const id = req.body.userId
  const description = req.body.description
  const duration = req.body.duration
  const exercise = {description, duration}
  if (req.body.date) {exercise.date = new Date(req.body.date)}
  if (!(id && description && duration)) {
    res.send('fill in all required fields');
    done(new Error('not all fields filled in'))
  }
  User.findByIdAndUpdate(
    id, // find by
    {$push: {'exercises': exercise}}, // push to exercises
    {'new': true}, // new
    function(err, data) {
      if (err) {
        if (err.path === '_id') {res.send('userId doesn\'t exist')}
        return done(err);
      }
      // console.log(data)
      res.json(data.exercises[data.exercises.length-1]);
      done(null, data)
    })
})

// get user data
router.get('/log', (req, res, next) => {
  const id = req.query.userId
  const from = Date.parse(new Date(req.query.from))
  const to = Date.parse(new Date(req.query.to))
  const limit = req.query.limit
  User.findById(id, function(err, data) {
    if (err) return next(err);
    let exercises = data.exercises
    if (from) { exercises = exercises.filter((ex) => {return Date.parse(ex.date)>=from}) }
    if (to) { exercises = exercises.filter((ex) => {return Date.parse(ex.date)<=to}) }
    if (exercises.length>limit) {
      exercises = exercises.slice(0, limit)
    }
    res.json({
      _id: data._id,
      username: data.username,
      exercises: exercises
    })
  })
})

















const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
