require(`dotenv`).config();

const express = require(`express`);
const app = express();

app.use(require(`./logger`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up CORS headers
const cors = require(`cors`);
const connectDB = require("./db");
app.use(cors({
    origin: '*',
    credentials: true
}));

const port = process.env.PORT || 5000;
const router = express.Router({mergeParams: true});
const apiRouter = require(`./router`)(router);

connectDB().then(() => {
    console.log(`Connected to MongoDB`);
    app.use(`/v1`, apiRouter);
    app.listen(port, () => console.log(`Server is running on port ${port}`));
}).catch(err => {
    console.log(`Failed to connect to MongoDB`, err);
    process.exit(1);
})

module.exports = app;