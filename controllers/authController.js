const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Register User
exports.register = async (req, res, next) => {
    const { name, email, password, role } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, msg: 'Please provide name, email, and password' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user', // Default to 'user' if no role is specified
        });

        const savedUser = await user.save();

        const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        const verificationUrl = `https://videohostingplatform.vercel.app/api/auth/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Account Verification',
            text: `Hello ${name},\n\nPlease verify your account by clicking the link: \n${verificationUrl}\n\nThank You!\n`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ msg: 'Verification email could not be sent. Please try again.' });
            }

            res.status(201).json({ success: true, msg: 'User registered successfully. Please check your email to verify your account.' });
        });
    } catch (err) {
        next(err);
    }
};

// Login User
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, msg: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ success: false, msg: 'Please verify your email before logging in' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role, // Include the role in the token payload
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ success: true, token });
    } catch (err) {
        next(err);
    }
};


// Verify Email
exports.verifyEmail = async (req, res, next) => {
    const token = req.query.token;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(400).json({ success: false, msg: 'Invalid token' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, msg: 'User already verified' });
        }

        user.isVerified = true;
        await user.save();

        res.json({ success: true, msg: 'Account verified successfully' });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Verification token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid verification token' });
        }
        next(err);
    }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ success: false, msg: 'Please provide an email' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, msg: 'User not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const resetUrl = `https://videohostingplatform.vercel.app/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset',
            text: `Hello,\n\nPlease reset your password by clicking the link: \n${resetUrl}\n\nThank You!\n`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Email sent: ' + info.response);
        });

        res.json({ success: true, msg: 'Password reset email sent' });
    } catch (err) {
        next(err);
    }
};

// Set New Password
exports.setNewPassword = async (req, res, next) => {
    const { token, newPassword } = req.body;

    try {
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, msg: 'Please provide token and new password' });
        }

        let user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, msg: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ success: true, msg: 'Password reset successfully' });
    } catch (err) {
        next(err);
    }
};
