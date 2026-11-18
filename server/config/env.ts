import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI?.trim() || '',
  JWT_SECRET:
    process.env.JWT_SECRET?.trim() || 'motobay_dev_jwt_secret_change_in_production',
  CLIENT_URL: process.env.CLIENT_URL?.trim() || '*',
};
