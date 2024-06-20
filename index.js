const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const swaggerSetup = require('./swagger');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// CORS Middleware
app.use(cors({
    origin: '*', // You can specify specific origins here if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));

// Error Handling Middleware
app.use(errorHandler);

// Setup Swagger
swaggerSetup(app);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


// const corsOptions = {
//     origin: ['http://localhost:3000', 'https://yourfrontenddomain.com'],
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
// };

// app.use(cors(corsOptions));