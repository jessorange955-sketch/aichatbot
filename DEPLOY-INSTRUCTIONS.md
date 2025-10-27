# Deploy to Vercel - Step by Step

You already have a Neon database configured! Now let's deploy.

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Deploy

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → ai-chat-app (or any name)
- **Directory?** → ./ (press Enter)
- **Override settings?** → No

## Step 4: Add Environment Variables

After first deployment, add your database credentials:

```bash
# Add all environment variables from your .env file
vercel env add POSTGRES_URL
# Paste: postgresql://neondb_owner:npg_HSkIprE8jXm5@ep-aged-snow-a1hxbxof-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

vercel env add POSTGRES_USER
# Paste: neondb_owner

vercel env add POSTGRES_HOST
# Paste: ep-aged-snow-a1hxbxof-pooler.ap-southeast-1.aws.neon.tech

vercel env add POSTGRES_PASSWORD
# Paste: npg_HSkIprE8jXm5

vercel env add POSTGRES_DATABASE
# Paste: neondb

vercel env add SESSION_SECRET
# Paste: any-random-secret-key-here
```

## Step 5: Deploy to Production

```bash
vercel --prod
```

## Done! 🎉

Your app will be live at: `https://your-app.vercel.app`

## Quick Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Open in browser
vercel --prod --open
```

## Default Login

- **Username:** defaultuser
- **Password:** user1default

## Troubleshooting

If you get errors:
1. Make sure all environment variables are added
2. Redeploy: `vercel --prod`
3. Check logs: `vercel logs`

## Local Testing

To test locally with your Neon database:

```bash
npm install
npm start
```

Visit: http://localhost:3000
