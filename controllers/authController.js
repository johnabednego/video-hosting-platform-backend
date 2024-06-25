const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// Send OTP via email
const sendOTPEmail = async (email, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: text,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

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

        const otp = generateOTP();
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user', // Default to 'user' if no role is specified
            emailVerificationOTP: otp,
            emailVerificationExpires: Date.now() + 3600000, // 1 hour
        });

        await user.save();

        const subject = 'Videoplay Account Verification';
        const text = `Hello ${name},\n\nPlease verify your account using the OTP: ${otp}\n\nThank You!\n`;

        const emailResponse = await sendOTPEmail(email, subject, text);

        if (!emailResponse.success) {
            return res.status(500).json({ success: false, msg: 'Failed to send verification email', error: emailResponse.error });
        }

        res.status(201).json({ success: true, msg: 'User registered successfully. Please check your email to verify your account.' });
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

        res.json({ success: true, token, data: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, country: user.country, city: user.city } });
    } catch (err) {
        next(err);
    }
};


// Verify Email OTP
exports.verifyEmailOTP = async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, msg: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, msg: 'User already verified' });
        }

        if (user.emailVerificationOTP !== otp || Date.now() > user.emailVerificationExpires) {
            return res.status(400).json({ success: false, msg: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.emailVerificationOTP = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        res.json({ success: true, msg: 'Email verified successfully' });
    } catch (err) {
        next(err);
    }
};

// Request Password Reset
exports.requestPasswordReset = async (req, res, next) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ success: false, msg: 'Please provide an email' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, msg: 'User not found' });
        }

        const otp = generateOTP();

        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const subject = 'Videoplay Password Reset';
        const text = `Hello,\n\nPlease reset your password using the OTP: ${otp}\n\nThank You!\n`;

        const emailResponse = await sendOTPEmail(email, subject, text);

        if (!emailResponse.success) {
            return res.status(500).json({ success: false, msg: 'Failed to send password reset email', error: emailResponse.error });
        }

        res.json({ success: true, msg: 'Password reset OTP sent' });
    } catch (err) {
        next(err);
    }
};

// Verify Password Reset OTP
exports.verifyPasswordResetOTP = async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ success: false, msg: 'Please provide email and OTP' });
        }

        let user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, msg: 'Invalid or expired OTP' });
        }

        res.json({ success: true, msg: 'OTP verified successfully' });
    } catch (err) {
        next(err);
    }
};


// Set New Password
exports.setNewPassword = async (req, res, next) => {
    const { email, newPassword } = req.body;

    try {
        if (!email || !newPassword) {
            return res.status(400).json({ success: false, msg: 'Please provide email and new password' });
        }

        let user = await User.findOne({ email });

        if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires || Date.now() > user.resetPasswordExpires) {
            return res.status(400).json({ success: false, msg: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ success: true, msg: 'Password reset successfully' });
    } catch (err) {
        next(err);
    }
};


// Verify Password Reset OTP and Set New Password
// exports.verifyPasswordResetOTP = async (req, res, next) => {
//     const { email, otp, newPassword } = req.body;

//     try {
//         if (!email || !otp || !newPassword) {
//             return res.status(400).json({ success: false, msg: 'Please provide email, OTP, and new password' });
//         }

//         let user = await User.findOne({
//             email,
//             resetPasswordOTP: otp,
//             resetPasswordExpires: { $gt: Date.now() },
//         });

//         if (!user) {
//             return res.status(400).json({ success: false, msg: 'Invalid or expired OTP' });
//         }

//         const salt = await bcrypt.genSalt(10);
//         user.password = await bcrypt.hash(newPassword, salt);

//         user.resetPasswordOTP = undefined;
//         user.resetPasswordExpires = undefined;

//         await user.save();

//         res.json({ success: true, msg: 'Password reset successfully' });
//     } catch (err) {
//         next(err);
//     }
// };

// Resend OTP
exports.resendOTP = async (req, res, next) => {
    const { email, type } = req.body; // type can be 'email' or 'password'

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, msg: 'User not found' });
        }

        const otp = generateOTP();
        let subject, text;

        if (type === 'email') {
            user.emailVerificationOTP = otp;
            user.emailVerificationExpires = Date.now() + 3600000; // 1 hour
            subject = 'Videoplay Account Verification';
            text = `Hello ${user.name},\n\nPlease verify your account using the OTP: ${otp}\n\nThank You!\n`;
        } else if (type === 'password') {
            user.resetPasswordOTP = otp;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            subject = 'Videoplay Password Reset';
            text = `Hello,\n\nPlease reset your password using the OTP: ${otp}\n\nThank You!\n`;
        } else {
            return res.status(400).json({ success: false, msg: 'Invalid type' });
        }

        await user.save();

        const emailResponse = await sendOTPEmail(email, subject, text);

        if (!emailResponse.success) {
            return res.status(500).json({ success: false, msg: `Failed to send ${type === 'email' ? 'verification' : 'password reset'} OTP`, error: emailResponse.error });
        }

        res.json({ success: true, msg: `${type === 'email' ? 'Verification' : 'Password reset'} OTP sent` });
    } catch (err) {
        next(err);
    }
};
