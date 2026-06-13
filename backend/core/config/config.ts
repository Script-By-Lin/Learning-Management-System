export const config = {
  db: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_token_for_lms_application_2026',
    expiresIn: '7d', // Session lifespan (7 days)
  },
  mcp: {
    url: process.env.MCP_SERVER_URL || '',
    apiKey: process.env.MCP_API_KEY || '',
    timeout: parseInt(process.env.MCP_TIMEOUT || '10000', 10),
  },
  email: {
    apiKey: process.env.EMAIL_API_KEY || '',
  },
  env: process.env.NODE_ENV || 'development',
};

// Validate critical variables on startup in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET environment variable is missing. Using fallback!');
  }
}
export default config;
