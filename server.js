// Load environment variables
require('dotenv').config();

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines with actual newlines
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    databaseURL: 'https://wabaki-cash-register-ionic-default-rtdb.firebaseio.com/'
});

const db = admin.database();


app.use(require('./logger'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up CORS headers
app.use(cors({
    origin: '*',
    credentials: true
}));

// Graceful shutdown
function handleSIGINT() {
    console.log('Firebase Realtime Database connection closed');
    process.exit(0); 
}

// Use const for constants
const router = express.Router({ mergeParams: true });
const apiRouter = require('./router')(router);

(async () => {
    process.on('SIGINT', handleSIGINT);
    app.use('/v1', apiRouter);

    // Add generic error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something went wrong!');
    });

    app.listen(port, () => console.log(`Server is running on port ${port}`));
})();
