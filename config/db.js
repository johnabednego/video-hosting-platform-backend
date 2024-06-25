const mongoose = require('mongoose');
require('dotenv').config();

let gridfsBucket;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_URI);

        console.log('MongoDB Connected...');

        // Initialize GridFSBucket
        gridfsBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
            bucketName: 'uploads'
        });

        // Register GridFS collections as models
        const filesSchema = new mongoose.Schema({}, { strict: false, collection: 'uploads.files' });
        const chunksSchema = new mongoose.Schema({}, { strict: false, collection: 'uploads.chunks' });

        mongoose.model('uploads.files', filesSchema);
        mongoose.model('uploads.chunks', chunksSchema);
    } catch (err) {
        console.error('Could not connect to MongoDB:', err.message);
        console.error('Make sure your current IP address is on your Atlas cluster\'s IP whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/');
        process.exit(1);
    }
};

const getGridfsBucket = () => gridfsBucket;

module.exports = { connectDB, getGridfsBucket };
