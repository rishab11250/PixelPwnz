const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const { seedData } = require('../seed');

const connectDB = async () => {
    const remoteUri = (process.env.MONGO_URI || '').trim();
    const localUri = 'mongodb://127.0.0.1:27017/datatime';

    if (remoteUri) {
        try {
            console.log(`Attempting to connect to Remote MongoDB...`);
            const conn = await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 10000 });
            console.log(`✅ Remote MongoDB Connected: ${conn.connection.host}`);
            return false; // Not freshly seeded
        } catch (error) {
            console.error(`❌ Remote MongoDB Connection Failed: ${error.message}`);
            console.log('Falling back to local MongoDB...');
        }
    }

    try {
        console.log(`Connecting to Local MongoDB: ${localUri}`);
        const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);

        // Check if seed is needed
        const count = await Dataset.countDocuments();
        if (count === 0) {
            console.log('⚠️  Local database is empty. Seeding initial data...');
            await seedData(false);
            return true; // Freshly seeded
        }
        return false;
    } catch (error) {
        console.error(`❌ Local MongoDB Connection Failed: ${error.message}`);
        console.log('\n💡 TIP: Make sure MongoDB is running locally (default port 27017).');
        process.exit(1);
    }
};

module.exports = connectDB;
