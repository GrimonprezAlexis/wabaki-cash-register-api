require(`dotenv`).config();

const express = require(`express`);
const app = express();

app.use(require(`./logger`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up CORS headers
const cors = require(`cors`);
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});


// Connect to MongoDB using mongoose
const mongoose = require(`mongoose`);
const config = require(`./config`);
const port = process.env.PORT || 5000;

mongoose.connect(`${config.mongoURI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
const router = express.Router({mergeParams: true});
const apiRouter = require(`./router`)(router);

db.once(`open`, () => {
    console.log(`Connected to MongoDB`);
    app.use(`/v1`, apiRouter);
    app.listen(port, () => console.log(`Server is running on port ${port}`));
});

db.on(`error`, (err) => {
    console.error(`MongoDB connection error:`, err);
});

module.exports = app;