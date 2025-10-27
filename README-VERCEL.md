# Deploy to Vercel

## Prerequisites
- Vercel account (free)
- GitHub account

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Create Vercel Postgres Database

1. Go to https://vercel.com/dashboard
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a name (e.g., "ai-chat-db")
6. Click "Create"

## Step 4: Link Project and Deploy

```bash
# Link to Vercel project
vercel link

# Pull environment variables (database credentials)
vercel env pull

# Deploy
vercel --prod
```

## Step 5: Initialize Database

After first deployment, visit:
```
https://your-app.vercel.app/
```

The database tables will be created automatically on first run.

## Environment Variables

Vercel automatically sets these when you create a Postgres database:
- POSTGRES_URL
- POSTGRES_PRISMA_URL
- POSTGRES_URL_NON_POOLING
- POSTGRES_USER
- POSTGRES_HOST
- POSTGRES_PASSWORD
- POSTGRES_DATABASE

You may want to add:
- SESSION_SECRET (for secure sessions)

## Default Admin Login

- Username: `defaultuser`
- Password: `user1default`

## Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View logs
vercel logs

# Open dashboard
vercel
```

## Troubleshooting

If you get database errors:
1. Make sure Postgres database is created in Vercel dashboard
2. Run `vercel env pull` to get latest credentials
3. Redeploy with `vercel --prod`

## Local Development

For local development with Vercel Postgres:

```bash
# Pull environment variables
vercel env pull .env.local

# Install dependencies
npm install

# Run locally
npm start
```

## Notes

- Free tier includes 256 MB Postgres storage
- Serverless functions have 10-second timeout
- Sessions are stored in memory (consider Redis for production)
