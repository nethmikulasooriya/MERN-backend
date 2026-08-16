import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

    // DB එකේ දැනට ඉන්න සියලුම users ලාව print කර බැලීමට
    User.find({}).then(allUsers => {
        console.log("--> All users currently in DB:", allUsers.map(u => u.email));
    });

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
    }).catch((err) => {
        console.error("--> DB Error:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    });
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