// Re-export all Edge-compatible functions
export {
  createToken,
  verifyToken,
  setAuthCookie,
  getAuthCookie,
  removeAuthCookie,
  isAuthenticated,
  verifyPassword
} from './auth-edge'

// Re-export Node.js-only functions
export {
  authenticateUser,
  hashPassword
} from './auth-node'