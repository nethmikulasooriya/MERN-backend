import User from '../models/user.js';
import OTP from '../models/otp.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import { randomInt } from 'node:crypto';
import nodemailer from "nodemailer";
dotenv.config();

const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export function createUser(req, res) {
    // Admin කෙනෙක් create කරන්න හදනවා නම් පමණක් request එක එවපු කෙනා Admin ද කියා පරික්ෂා කරයි
    if (req.body.role === "admin") {
        if (req.user != null) {
            if (req.user.role !== "admin") {
                return res.status(403).json({
                    message: "Unauthorized! Only admin can create admin users",
                });
            }
        } else {
            return res.status(403).json({
                message: "You are not authorized to create admin accounts. Please log in as an admin.",
            });
        }
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email ? req.body.email.trim().toLowerCase() : "",
        password: hashedPassword,
        role: req.body.role || "customer",
    });

    user.save()
        .then(() => {
            res.json({
                message: "User created successfully",
            });
        })
        .catch((err) => {
            res.status(500).json({
                message: "User creation failed",
                error: err.message,
            });
        });
}

/*export function loginUser(req, res) {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
    const password = req.body.password;

    User.findOne({ email: email })
        .then((user) => {
            if (user == null) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password);
            if (isPasswordValid) {
                const token = jwt.sign(
                    { 
                        email: user.email, 
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        img: user.img 
                    },
                    "abc@123"
                );

                res.json({
                    message: "Login successful",
                    token: token,
                    user: user
                });
            } else {
                res.status(401).json({
                    message: "Invalid password"
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                message: "Internal server error",
                error: err.message
            });
        });
} */
export function loginUser(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    console.log("--> Login attempt with email:", `"${email}"`);

    // අදාළ email එකෙන් user ව සෙවීම
    User.findOne({ email: email }).then((user) => {
        console.log("--> FindOne Result:", user);

        if (user == null) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (isPasswordValid) {
            const token = jwt.sign(
                { 
                    email: user.email, 
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    img: user.img 
                },
                process.env.JWT_KEY
            );

            res.json({
                message: "Login successful",
                token: token,
                user: user
            });
        } else {
            res.status(401).json({
                message: "Invalid password"
            });
        }
    }).catch((err) => {
        console.error("--> DB Error:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    });
}

export async function loginWithGoogle(req, res) {
    const token = req.body.accessToken;

    if (!token) {
        return res.status(400).json({
            message: "Access token is required"
        });
    }

    try {
        const response = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const googleUser = response.data;
        const email = googleUser.email ? googleUser.email.trim().toLowerCase() : "";

        if (!email) {
            return res.status(400).json({
                message: "Google account email is required"
            });
        }

        let user = await User.findOne({ email });

        if (user == null) {
            const randomPassword = bcrypt.hashSync(
                `${googleUser.sub}-${Date.now()}`,
                10
            );

            user = new User({
                firstName: googleUser.given_name || googleUser.name || "Google",
                lastName: googleUser.family_name || "User",
                email,
                password: randomPassword,
                role: "customer",
                img: googleUser.picture
            });

            await user.save();
        }

        const authToken = jwt.sign(
            {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                img: user.img
            },
            process.env.JWT_KEY
        );

        return res.json({
            message: "Login successful",
            token: authToken,
            role: user.role,
            user
        });
    } catch (err) {
        return res.status(401).json({
            message: "Google login failed",
            error: err.response?.data || err.message
        });
    }
}

export async function sendOTP(req, res) {
    const email = typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
        return res.status(400).json({
            message: "Email is required",
        });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(503).json({
            message: "Email service is not configured",
        });
    }

    try {
        const user = await User.findOne({ email });

        if (user == null) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const otp = randomInt(100000, 1000000).toString();
        await OTP.findOneAndUpdate(
            { email },
            {
                $set: {
                    otp: Number(otp),
                    createdAt: new Date(),
                    attempts: 0,
                },
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
            }
        );

        try {
            await transport.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Resetting password for crystal beauty clear.",
                text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
            });
        } catch (error) {
            try {
                await OTP.deleteOne({ email, otp: Number(otp) });
            } catch (cleanupError) {
                console.error("Failed to remove OTP after email delivery failure:", cleanupError);
            }
            throw error;
        }

        return res.json({
            message: "OTP sent successfully",
        });
    } catch (error) {
        console.error("Failed to send password reset OTP:", error);
        return res.status(500).json({
            message: "Failed to send OTP",
        });
    }
}

export async function resetPassword(req, res) {
    const email = typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const otpValue = req.body.otp;
    const otp = typeof otpValue === "string" || typeof otpValue === "number"
        ? String(otpValue)
        : "";
    const newPassword = req.body.newPassword;

    if (!email || !/^\d{6}$/.test(otp) || typeof newPassword !== "string" || !newPassword) {
        return res.status(400).json({
            message: "Email, a six-digit OTP, and a new password are required",
        });
    }

    if (Buffer.byteLength(newPassword, "utf8") > 72) {
        return res.status(400).json({
            message: "New password must be 72 bytes or fewer",
        });
    }

    try {
        const user = await User.findOne({ email });
        if (user == null) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const otpRecord = await OTP.findOne({ email });
        const otpExpiry = () => new Date(Date.now() - 10 * 60 * 1000);

        if (
            otpRecord == null ||
            !otpRecord.createdAt ||
            otpRecord.createdAt <= otpExpiry() ||
            otpRecord.attempts >= 5
        ) {
            return res.status(400).json({
                message: "No valid OTP request found. Please request a new OTP",
            });
        }

        const otpMatches = Number(otp) === otpRecord.otp;
        if (!otpMatches) {
            await OTP.updateOne(
                {
                    _id: otpRecord._id,
                    otp: otpRecord.otp,
                    createdAt: { $gt: otpExpiry() },
                    attempts: { $lt: 5 },
                },
                {
                    $inc: { attempts: 1 },
                }
            );

            return res.status(403).json({
                message: "OTP does not match",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const consumedOTP = await OTP.findOneAndDelete(
            {
                _id: otpRecord._id,
                otp: otpRecord.otp,
                createdAt: { $gt: otpExpiry() },
                attempts: { $lt: 5 },
            }
        );

        if (consumedOTP == null) {
            return res.status(400).json({
                message: "OTP is invalid or has expired. Please request a new OTP",
            });
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );

        if (updatedUser == null) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.json({
            message: "Password has been reset successfully",
        });
    } catch (error) {
        console.error("Failed to reset password:", error);
        return res.status(500).json({
            message: "Failed to reset password",
        });
    }
}

export function isAdmin(req) {
    if (req.user == null) {
        return false;
    }
    if (req.user.role !== "admin") {
        return false;
    }
    return true;
}