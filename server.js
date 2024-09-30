// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || 'your_default_mongo_uri';

app.use(require('./logger'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up CORS headers
app.use(cors({
    origin: '*',
    credentials: true
}));

// Connect to MongoDB using mongoose
async function connectToMongo() {
    try {
        const connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        await mongoose.connect(mongoURI, connectionOptions);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process on connection error
    }
}

// Function to handle SIGINT signal
function handleSIGINT() {
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0); // Exit the process after closing MongoDB connection
    });
}

// Use const for constants
const router = express.Router({ mergeParams: true });
const apiRouter = require('./router')(router);

// Use async/await for better readability
(async () => {
    await connectToMongo();

    // Handle SIGINT signal for graceful shutdown
    process.on('SIGINT', handleSIGINT);

    app.use('/v1', apiRouter);

    // Add generic error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something went wrong!');
    });

    app.listen(port, () => console.log(`Server is running on port ${port}`));
})();