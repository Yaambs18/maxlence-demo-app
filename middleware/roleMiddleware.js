const checkRole = (role) => {
    return (req, res, next) => {
      if (req.user && req.user.role === role) {
        return next();
      } else {
        return res.status(403).json({ message: `Forbidden - You are not Authorised for this action.` });
      }
    };
  };
  
  module.exports = checkRole;