const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/repositoryRegistry';

const connectDB = async() => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);

    }
};

module.exports = connectDB;