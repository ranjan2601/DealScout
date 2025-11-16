# DealScout - Fly.io Deployment Guide

## Prerequisites
- Fly.io account created at https://fly.io
- Fly CLI installed (`flyctl`)
- Git repository initialized (already done)

---

## Step 1: Authenticate with Fly.io

```bash
/Users/shriranjanpatil/.fly/bin/flyctl auth login
```

Follow the prompts to log in or create an account.

---

## Step 2: Deploy the Backend (Python API)

```bash
cd /Users/shriranjanpatil/Data/VS_Code/HackNYU

# Create the Fly app
/Users/shriranjanpatil/.fly/bin/flyctl launch --no-deploy --name dealscout-api --region ord

# Set environment variables
/Users/shriranjanpatil/.fly/bin/flyctl secrets set \
  OPENROUTER_API_KEY="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" \
  MONGODB_URI="mongodb://localhost:27017" \
  DATABASE_NAME="dealscout"

# Deploy
/Users/shriranjanpatil/.fly/bin/flyctl deploy
```

This will:
1. Build the Docker image from `Dockerfile`
2. Deploy to Fly.io
3. Seed the database with sample data on release

**Your backend URL will be:** `https://dealscout-api.fly.dev`

---

## Step 3: Deploy the Frontend (Next.js)

```bash
cd /Users/shriranjanpatil/Data/VS_Code/HackNYU/frontend

# Create the Fly app
/Users/shriranjanpatil/.fly/bin/flyctl launch --no-deploy --name dealscout-web --region ord

# Set environment variable to point to backend
/Users/shriranjanpatil/.fly/bin/flyctl secrets set \
  NEXT_PUBLIC_API_URL="https://dealscout-api.fly.dev"

# Deploy
/Users/shriranjanpatil/.fly/bin/flyctl deploy
```

This will:
1. Build Next.js app in multi-stage Docker build
2. Deploy optimized production bundle
3. Frontend will be live at `https://dealscout-web.fly.dev`

---

## Step 4: Update Frontend API Configuration

The frontend needs to know the backend URL. The `.env.local` or `next.config.js` should be configured.

Frontend API calls should use the `NEXT_PUBLIC_API_URL` environment variable.

Check that `frontend/app/` pages are using environment variables correctly for API calls.

---

## Deployment Checklist

- [ ] Run `flyctl auth login` to authenticate
- [ ] Backend fly.toml configured correctly
- [ ] Backend secrets set (OPENROUTER_API_KEY, MONGODB_URI)
- [ ] Backend deployed: `flyctl deploy` from root directory
- [ ] Frontend fly.toml configured correctly
- [ ] Frontend secrets set (NEXT_PUBLIC_API_URL)
- [ ] Frontend deployed: `flyctl deploy` from frontend directory
- [ ] Test backend at https://dealscout-api.fly.dev
- [ ] Test frontend at https://dealscout-web.fly.dev

---

## Monitoring Deployments

### Check Backend Status
```bash
/Users/shriranjanpatil/.fly/bin/flyctl status -a dealscout-api
/Users/shriranjanpatil/.fly/bin/flyctl logs -a dealscout-api
```

### Check Frontend Status
```bash
/Users/shriranjanpatil/.fly/bin/flyctl status -a dealscout-web
/Users/shriranjanpatil/.fly/bin/flyctl logs -a dealscout-web
```

---

## Important Notes

1. **MongoDB**: Currently configured for localhost. For production, use MongoDB Atlas:
   - Create a free cluster at https://www.mongodb.com/cloud/atlas
   - Update `MONGODB_URI` to your Atlas connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`

2. **Free Tier Limits**:
   - 3 shared-cpu-1x 256MB VMs
   - 3GB persistent storage
   - Generous free bandwidth
   - After free trial, $5/month minimum

3. **Environment Variables**:
   - Backend: `OPENROUTER_API_KEY`, `MONGODB_URI`, `DATABASE_NAME`
   - Frontend: `NEXT_PUBLIC_API_URL` (must start with `NEXT_PUBLIC_` to be exposed to browser)

4. **Database Seeding**:
   - The release script in `fly.toml` runs `seed_db.py` on every deployment
   - This populates sample products (30 total: 10 mountain bikes, 10 MacBooks, 10 other electronics)

---

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash

FLY="/Users/shriranjanpatil/.fly/bin/flyctl"

echo "🚀 Deploying DealScout to Fly.io..."

# Deploy Backend
echo "📦 Deploying backend..."
cd /Users/shriranjanpatil/Data/VS_Code/HackNYU
$FLY deploy -a dealscout-api

# Deploy Frontend
echo "🎨 Deploying frontend..."
cd /Users/shriranjanpatil/Data/VS_Code/HackNYU/frontend
$FLY deploy -a dealscout-web

echo "✅ Deployment complete!"
echo "Backend: https://dealscout-api.fly.dev"
echo "Frontend: https://dealscout-web.fly.dev"
```

Run with: `bash deploy.sh`

---

## Troubleshooting

### Port Issues
If you get port errors, the default ports (8000 for backend, 3000 for frontend) should work fine on Fly.io.

### MongoDB Connection
If database seeding fails, ensure:
1. `MONGODB_URI` is set correctly
2. IP whitelist is configured (for MongoDB Atlas, whitelist 0.0.0.0/0)
3. Database credentials are correct

### API URL Issues
Frontend can't find backend:
- Ensure `NEXT_PUBLIC_API_URL` is set to `https://dealscout-api.fly.dev`
- Check that frontend pages use this environment variable
- Look for hardcoded `localhost` URLs and replace with environment variable

### Deployment Fails
- Check logs: `flyctl logs -a app-name`
- Verify Dockerfile syntax
- Ensure all dependencies are in requirements.txt or package.json
- Check that PORT environment variable matches (8000 for backend, 3000 for frontend)

---

## Live URLs (After Deployment)

- **Backend API**: https://dealscout-api.fly.dev
- **Frontend Web**: https://dealscout-web.fly.dev
- **API Health Check**: https://dealscout-api.fly.dev/
- **Search Products**: https://dealscout-api.fly.dev/search
- **Negotiate**: https://dealscout-api.fly.dev/negotiate

---

## Free Tier Resources

- **Storage**: Use MongoDB Atlas free tier (512MB) or upgrade Fly Postgres
- **Bandwidth**: Up to 160GB/month (shared)
- **Compute**: 3 shared-cpu-1x 256MB VMs
- **Cost**: Free for 3 months, then $5/month minimum (can be lower with spot instances)

---

## Next Steps After Deployment

1. Test the live application at https://dealscout-web.fly.dev
2. Perform demo:
   - Search for "MacBook"
   - Select a product
   - Set budget
   - Watch negotiation stream
3. Share live URLs on DevPost
4. Monitor logs for any issues

Good luck with your submission!
