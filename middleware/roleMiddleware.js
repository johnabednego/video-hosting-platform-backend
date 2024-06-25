const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, msg: 'Access denied. Admins only.' });
    }
  };
  
  module.exports = { isAdmin };
  