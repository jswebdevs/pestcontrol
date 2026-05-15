export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  appName: process.env.APP_NAME || 'API',
  cookiePrefix: process.env.COOKIE_PREFIX || 'app',
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    otpSecret: process.env.OTP_JWT_SECRET!,
    inviteSecret: process.env.INVITE_TOKEN_SECRET!,
    previewSecret: process.env.PREVIEW_TOKEN_SECRET!,
  },
  cookie: {
    secret: process.env.COOKIE_SECRET!,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
    folder: process.env.CLOUDINARY_FOLDER || '',
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '465', 10),
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || '',
    adminNotify: process.env.ADMIN_NOTIFY_EMAIL || '',
  },
  sms: {
    apiKey: process.env.BULKSMSBD_API_KEY || '',
    senderId: process.env.BULKSMSBD_SENDER_ID || '',
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    adminPhone: process.env.SEED_ADMIN_PHONE || '01700000000',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2026',
  },
});

export type AppConfig = ReturnType<typeof import('./configuration').default>;
