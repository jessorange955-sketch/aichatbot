# Neon Database Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Setup
Your application now supports all Neon database environment variables with the following priority:

**Primary (Production) Variables:**
- `db_POSTGRES_URL` - Main connection string (pooled)
- `db_DATABASE_URL` - Alternative main connection string
- `db_POSTGRES_URL_NON_POOLING` - Non-pooled connection
- `db_DATABASE_URL_UNPOOLED` - Unpooled connection

**Individual Parameters:**
- `db_PGHOST` / `db_POSTGRES_HOST` - Database host
- `db_PGUSER` / `db_POSTGRES_USER` - Database user
- `db_PGPASSWORD` / `db_POSTGRES_PASSWORD` - Database password
- `db_PGDATABASE` / `db_POSTGRES_DATABASE` - Database name

**Fallback Variables:**
- Standard `POSTGRES_URL`, `DATABASE_URL`, etc.

### 2. Test Your Connection Locally

```bash
# Install dependencies
npm install

# Test database connection
npm run verify-db

# Start development server
npm run dev
```

### 3. Verify Database Health
Visit `http://localhost:3000/api/health` to check:
- ✅ Database connection status
- ✅ Response time
- ✅ Available tables
- ✅ User count

## 🚀 Deployment Steps

### 1. Vercel Environment Variables
In your Vercel dashboard, add these environment variables:

```
db_POSTGRES_URL=your-neon-connection-string
db_DATABASE_URL=your-neon-connection-string
SESSION_SECRET=your-random-secret-key
NODE_ENV=production
```

### 2. Deploy to Vercel
```bash
# Deploy using Vercel CLI
vercel --prod

# Or push to your connected Git repository
git add .
git commit -m "Updated for Neon database"
git push origin main
```

### 3. Post-Deployment Verification
After deployment, test these endpoints:

- `https://your-app.vercel.app/api/health` - Database health check
- `https://your-app.vercel.app/api/test-db` - Legacy database test
- `https://your-app.vercel.app/` - Main application

## 🔧 Troubleshooting

### Connection Issues
1. **Check Environment Variables**: Ensure all required variables are set in Vercel
2. **SSL Configuration**: Neon requires SSL - this is handled automatically
3. **Connection Limits**: Use pooled connections for better performance

### Common Error Messages
- `Database connection validation failed` - Check your connection string
- `relation "users" does not exist` - Database tables will be created automatically
- `SSL required` - Ensure you're using the SSL-enabled connection string

### Debug Information
The application logs detailed connection information on startup:
- ✅ Connection validation
- 📊 Database details (host, port, database name)
- 🔗 Available environment variables (passwords masked)

## 📊 Monitoring

### Health Check Endpoint
`GET /api/health` returns:
```json
{
  "success": true,
  "status": "healthy",
  "database": {
    "connected": true,
    "responseTime": "45ms",
    "currentTime": "2024-01-01T12:00:00.000Z",
    "tables": ["users", "sessions", "messages"],
    "userCount": 1
  },
  "environment": "production"
}
```

### Performance Tips
1. Use `db_POSTGRES_URL` (pooled) for most operations
2. Use `db_POSTGRES_URL_NON_POOLING` only when needed
3. Monitor connection count in Neon dashboard
4. Set appropriate connection pool limits

## 🎯 Next Steps

1. **Security**: Update `SESSION_SECRET` to a strong random value
2. **Monitoring**: Set up alerts for database connection failures
3. **Backup**: Configure automated backups in Neon dashboard
4. **Scaling**: Monitor connection usage and adjust pool settings

---

**Need Help?**
- Check the application logs in Vercel dashboard
- Run `npm run verify-db` locally to test connection
- Visit `/api/health` endpoint for real-time status