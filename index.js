import express from 'express';
import bodyParser from 'body-parser'; 
import mongoose from 'mongoose';
import studentRouter from './routes/studentRouter.js';
import productRouter from './routes/productRouter.js'; // Import the productRouter
import userRouter from './routes/userRouter.js'; // Import the userRouter
//import Student from "../models/student.js";
import jwt from 'jsonwebtoken';

let app = express();    
 
// Middleware to parse JSON
app.use(bodyParser.json());

app.use((req, res, next) => {
    const tokenString = req.header('authorization');

    if (tokenString != null) {
        const token = tokenString.replace('Bearer ', '');
        
        jwt.verify(token, "abc@123", (err, decoded) => {
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
mongoose.connect('mongodb://admin:123@ac-2mcbn27-shard-00-00.ddj6re8.mongodb.net:27017,ac-2mcbn27-shard-00-01.ddj6re8.mongodb.net:27017,ac-2mcbn27-shard-00-02.ddj6re8.mongodb.net:27017/test?ssl=true&replicaSet=atlas-382o7k-shard-0&authSource=admin&appName=Cluster0')
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Routes
app.use('/students', studentRouter);
app.use('/products', productRouter); 
app.use('/users', userRouter); // Add this line to use the userRouter

// Start Server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});