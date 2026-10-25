import express from 'express';
import bodyParser from 'body-parser'; 
import mongoose from 'mongoose';
import studentRouter from './routes/studentRouter.js';
import productRouter from './routes/productRouter.js'; // Import the productRouter
import userRouter from './routes/userRouter.js'; // Import the userRouter
import orderRouter from './routes/orderRouter.js'; // Import the orderRouter
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

let app = express();    

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());// Middleware to parse JSON


app.use((req, res, next) => {
    const tokenString = req.header('authorization');

    if (tokenString != null) {
        const token = tokenString.replace('Bearer ', '');
        
        jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
            if (decoded != null) {
                console.log("Token verified successfully:", decoded);
                req.user = decoded;
                next(); // ✅ Token එක valid නම් පමණක් route handler එකට යවයි
            } else {
                console.error("Token verification failed:", err);
                res.status(403).json({
                    message: "Invalid token"
                });
            }
        });
    } else {
        next(); // ✅ Token එකක් නැති විට පමණක් (Login/Register වැනි public routes වලට) යවයි
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Routes
app.use('/students', studentRouter);
app.use('/products', productRouter); 
app.use('/users', userRouter); 
app.use('/orders', orderRouter); 

// Start Server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});