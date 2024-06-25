const User = require('../models/User');

// Edit User Information (User)
exports.editUserInfo = async (req, res, next) => {
    const { firstName, lastName, country, city } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.country = country || user.country;
        user.city = city || user.city;

        await user.save();

        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// Get All Users (Admin)
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

// Get User Details (Admin)
exports.getUserDetails = async (req, res, next) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// Get Logged-in User Info
exports.getUserInfo = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};
