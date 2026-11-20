import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    otp: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    },
    attempts: {
        type: Number,
        default: 0,
        min: 0,
    },
});

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
