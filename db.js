const mongoose = require(`mongoose`);
const config = require(`./config`);

// Connect to MongoDB using mongoose
let isConnected;

const connectDB = async () => {
    if(isConnected){
        console.log('>> using existing database connection');
        return Promise.resolve();
    }
    console.log('>> using new database connection');
    await mongoose.connect(`${config.mongoURI}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    isConnected = mongoose.connection.readyState;
};

mongoose.connection.on('connected', () => {
    console.log('>> Mongosse connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.log('>> Mongosse connection error', err);
});

mongoose.connection.on('disconnected', (err) => {
    console.log('>> Mongosse disconnected');
});

module.exports = connectDB;