import dotenv from 'dotenv'
dotenv.config()

function required(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing required env var: ${key}`)
  return v
}

export const config = {
  env:          process.env.NODE_ENV || 'development',
  port:         parseInt(process.env.PORT || '5000', 10),
  databaseUrl:  required('DATABASE_URL'),
  jwt: {
    accessSecret:  required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES  || '15m',
    refreshExpires:process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  clientOrigin:    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  uploadDir:       process.env.UPLOAD_DIR    || 'uploads',
  maxFileSizeMb:   parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
  supabaseUrl:     required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  isDev:           process.env.NODE_ENV === 'development',
  isProd:          process.env.NODE_ENV === 'production',
}