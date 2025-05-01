const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// JWT token
exports.generateToken = (payload, secretKey, options = {}) => {
  return jwt.sign(payload, secretKey, options);
};


// Configure multer for image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

exports.upload = multer({ storage: storage });