require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Exercise = require('./models/Exercise');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({optionsSuccessStatus: 200}));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('❌ MongoDB disconnected');
});

console.log('MongoDB URI:', process.env.MONGO_URI ? 'Loaded' : 'Missing');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    console.log('Creating user:', username);
    const newUser = new User({ username });
    const savedUser = await newUser.save();
    console.log('User saved:', savedUser);
    console.log('User collection name:', User.collection.name);
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (error) {
    console.log('User creation error:', error.message);
    res.json({ error: 'Username already exists' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching users...');
    const users = await User.find({}, 'username _id');
    console.log('Found users:', users);
    console.log('User collection name:', User.collection.name);
    res.json(users);
  } catch (error) {
    console.log('Error fetching users:', error);
    res.json({ error: 'Could not fetch users' });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ error: 'User not found' });
    }

    const exerciseDate = date ? new Date(date) : new Date();
    
    const newExercise = new Exercise({
      userId: userId,
      description: description,
      duration: parseInt(duration),
      date: exerciseDate
    });

    const savedExercise = await newExercise.save();

    res.json({
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString(),
      _id: user._id
    });
  } catch (error) {
    res.json({ error: 'Could not save exercise' });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    const { from, to, limit } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ error: 'User not found' });
    }

    let filter = { userId: userId };

    if (from || to) {
      filter.date = {};
      if (from) {
        filter.date.$gte = new Date(from);
      }
      if (to) {
        filter.date.$lte = new Date(to);
      }
    }

    let query = Exercise.find(filter).select('description duration date -_id');
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const exercises = await query.exec();
    const count = await Exercise.countDocuments(filter);

    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    res.json({
      username: user.username,
      count: count,
      _id: user._id,
      log: log
    });
  } catch (error) {
    res.json({ error: 'Could not fetch exercise log' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});