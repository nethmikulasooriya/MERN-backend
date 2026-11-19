import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    otpHash: {
        type: String,
        required: true,
        select: false,
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0,
    },
    attempts: {
        type: Number,
        default: 0,
        min: 0,
    },
});

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
