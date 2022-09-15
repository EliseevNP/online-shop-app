import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: envFile });

const {
  MS_CFG_POSTGRES_DB,
  MS_CFG_POSTGRES_USER,
  MS_CFG_POSTGRES_PASSWORD,
  MS_CFG_POSTGRES_HOST,
  MS_CFG_POSTGRES_OUT_PORT,
} = process.env;

export const DB_CONFIG = {
  database: MS_CFG_POSTGRES_DB,
  username: MS_CFG_POSTGRES_USER,
  password: MS_CFG_POSTGRES_PASSWORD,
  host: MS_CFG_POSTGRES_HOST,
  port: MS_CFG_POSTGRES_OUT_PORT,
};

const {
  MS_CFG_HASH_SALT_ROUNDS,
  MS_CFG_JWT_AUDIENCE,
  MS_CFG_JWT_ISSUER,
  MS_CFG_JWT_ACCESS_TOKEN_SECRET,
  MS_CFG_JWT_REFRESH_TOKEN_SECRET,
  MS_CFG_JWT_ACCESS_TOKEN_EXPIRES_IN,
  MS_CFG_JWT_REFRESH_TOKEN_EXPIRES_IN,
} = process.env;

export const AUTH_CONFIG = {
  hash: {
    saltRounds: Number(MS_CFG_HASH_SALT_ROUNDS) || 10,
  },
  jwt: {
    common: {
      algorithm: 'HS256' as const,
      audience: MS_CFG_JWT_AUDIENCE ? MS_CFG_JWT_AUDIENCE.split(',') : ['order'],
      issuer: MS_CFG_JWT_ISSUER || 'arch.homework',
    },
    accessToken: {
      secret: MS_CFG_JWT_ACCESS_TOKEN_SECRET || 'access token secret',
      expiresIn: MS_CFG_JWT_ACCESS_TOKEN_EXPIRES_IN || '30 min',
    },
    refreshToken: {
      secret: MS_CFG_JWT_REFRESH_TOKEN_SECRET || 'refresh token secret',
      expiresIn: MS_CFG_JWT_REFRESH_TOKEN_EXPIRES_IN || '60 min',
    },
  }
};
