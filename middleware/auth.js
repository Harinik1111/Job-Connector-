// middleware/auth.js
// - protect: verifies the JWT sent in the Authorization header and attaches
//   the logged-in user (minus password) to req.user
// - authorize(...roles): restricts a route to specific roles, e.g.
//   authorize('Recruiter') on the "post job" route

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data (in case role/name changed) and exclude password
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists' });
    }

    req.user = user; // available in all downstream route handlers
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Usage: authorize('Recruiter') or authorize('Recruiter', 'Job Seeker')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This action requires role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
