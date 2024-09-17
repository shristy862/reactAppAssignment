const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

// Firebase Admin Setup
const serviceAccount = require('./ServiceAccountKey.json.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware to parse cookies
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../build')));

// Middleware to set user cookies if not already present
app.use((req, res, next) => {
  if (!req.cookies.userId) {
    const uniqueId = uuidv4();
    res.cookie('userId', uniqueId, { maxAge: 60000, httpOnly: true });

    console.log(`New user with ID: ${uniqueId}`);
  } else {
    console.log(`Returning user with ID: ${req.cookies.userId}`);
  }
  next();
});

// Route to seed default survey questions into "surveyquestions" collection
app.get('/seed-questions', async (req, res) => {
  const defaultQuestions = [
    { text: 'How fair are the prices compared to similar retailers?', fieldName: 'priceFairness', type: 'rating' },
    { text: 'How satisfied are you with the value for money of your purchase?', fieldName: 'valueForMoney', type: 'rating' },
    { text: 'On a scale of 1-10, how likely are you to recommend us to your friends and family?', fieldName: 'recommendScore', type: 'rating' },
    { text: 'How satisfied are you with our products?', fieldName: 'productSatisfaction', type: 'rating' },
    { text: 'What could we do to improve our service?', fieldName: 'improvementSuggestion', type: 'text' }
  ];

  try { 
    const questionsCollection = db.collection('surveyquestions');
    for (const question of defaultQuestions) {
      await questionsCollection.doc(question.fieldName).set(question);
    }
    console.log('Default questions have been added to Firestore in the "surveyquestions" collection.');
    res.status(200).send('Default questions added to Firestore in the "surveyquestions" collection.');
  } catch (error) {
    console.error('Error adding questions to Firestore:', error);
    res.status(500).send('Error adding questions to Firestore.');
  }
});


// Route to add new questions to the "surveyquestions" collection
app.post('/add-question', async (req, res) => {
  const { text, fieldName, type } = req.body;
  console.log(req.body);
  
  if (!text || !fieldName || !type) {
    return res.status(400).send('Missing required fields');
  }

  try {
    await db.collection('surveyquestions').doc(fieldName).set({
      text,
      fieldName,
      type,
    });
    res.status(200).send('Question added successfully');
  } catch (error) {
    console.error('Error adding question to Firestore:', error);
    res.status(500).send('Error adding question to Firestore');
  }
});

// Route to fetch all questions from Firestore (default + user-added)
app.get('/get-questions', async (req, res) => {
  // console.log('Request received for /get-questions');
  try {
    const snapshot = await db.collection('surveyquestions').get();
    if (snapshot.empty) {
      console.log('No questions found.');
      res.status(404).send('No questions found.');
      return;
    }
    const questions = snapshot.docs.map(doc => doc.data());
    console.log('Fetched questions:', questions);
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).send('Error fetching questions');
  }
});

// Route to handle survey responses
app.post('/submit-survey', async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    const { userId, surveyAnswers } = req.body;

    if (!userId || !surveyAnswers) {
      return res.status(400).send('Missing userId or surveyAnswers');
    }

    await db.collection('surveys').doc(userId).set({
      userId,
      surveyAnswers,
      submittedAt: new Date().toISOString(),
    });

    res.status(200).send('Survey submitted successfully');
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).send('Error submitting survey');
  }
});

// Catch-all route for all other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
