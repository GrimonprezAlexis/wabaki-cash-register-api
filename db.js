const mongoose = require(`mongoose`);
const config = require(`./config`);

// Connect to MongoDB using mongoose
let isConnected;

const connectDB = async () => {
    if(mongoose.connection.readyState === 1){
        console.log('>> using existing database connection');
        return;
    }

    console.log('>> using new database connection');
    try {
        await mongoose.connect(`${config.mongoURI}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }); 
    } catch(err){
        console.log('Error connecting to database', err);
        throw err;
    }
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