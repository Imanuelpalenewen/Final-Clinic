import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'klinik-sentosa-secret-key-2025';

// Middleware untuk verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak valid atau sudah expired.' 
    });
  }
};

// Middleware untuk check role
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized access.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Anda tidak memiliki akses ke resource ini.' 
      });
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.full_name
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};
