function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server Error',
    });
}

module.exports = errorHandler;