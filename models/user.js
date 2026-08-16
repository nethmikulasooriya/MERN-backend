import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: "customer"
    },
    isBlocked: {
        type: Boolean,
        required: true,
        default: false
    },
    img: {
        type: String,
        required: true,
        default: "https://pixabay.com/vectors/user-avatar-log-in-photo-1808597/"
    }
});

const user = mongoose.model('users', userSchema);
export default user;