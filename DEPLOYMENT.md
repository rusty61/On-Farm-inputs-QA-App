# Deployment Guide: Infield Spray Record Application

This guide provides step-by-step instructions to deploy the Infield Spray Record application to production.

## Prerequisites Checklist

- [ ] Supabase account created
- [ ] Supabase project provisioned
- [ ] Database schema migrated
- [ ] GitHub account with repository access
- [ ] Vercel account (for frontend)
- [ ] Render account (for backend)

## Current Status

✅ **Database Schema**: Deployed and configured with Row Level Security
✅ **Backend CORS**: Configured for production domains
✅ **Frontend Build**: Optimized for production deployment
✅ **Environment Templates**: Created for all components

---

## Step 1: Supabase Configuration

### 1.1 Verify Database Schema

The database schema has been created with the following tables:
- `owners` - Organization/owner records
- `profiles` - User profiles linked to auth.users
- `farms` - Farm properties
- `paddocks` - Field/paddock records with GPS
- `mixes` - Chemical tank mix recipes
- `mix_items` - Individual chemicals in mixes
- `applications` - Spray application records
- `application_paddocks` - Paddock-level GPS captures
- `blynk_stations` - Weather station configuration

### 1.2 Collect Credentials

Navigate to your Supabase project dashboard:

1. **Project URL**
   - Settings → API → Project URL
   - Example: `https://xxxxx.supabase.co`

2. **API Keys**
   - Settings → API → Project API keys
   - `anon public` - For frontend (safe to expose)
   - `service_role` - For backend (keep secret!)

3. **JWT Secret**
   - Settings → API → JWT Settings → JWT Secret

4. **Database Connection String**
   - Settings → Database → Connection string → URI
   - Format: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`

### 1.3 Configure Authentication

1. Go to **Authentication → URL Configuration**
2. Set **Site URL**: Your production frontend URL (will add after Vercel deployment)
3. Go to **Authentication → Providers**
4. Ensure **Email** is enabled
5. For production, enable **Email confirmations** (Settings → Auth)

### 1.4 Enable Database Backups

1. Go to **Settings → Database → Backups**
2. Enable **Point-in-Time Recovery (PITR)** if available
3. Configure backup schedule

---

## Step 2: Deploy Backend to Render

### 2.1 Prepare Repository

Ensure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2.2 Create Render Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub account (if not already connected)
4. Select your repository: `On-Farm-inputs-QA-App`
5. Click **Connect**

### 2.3 Configure Service Settings

**Basic Settings:**
- **Name**: `infield-spray-backend`
- **Region**: Choose closest to your users (e.g., Oregon (US West))
- **Branch**: `main`
- **Root Directory**: Leave empty (uses project root)
- **Environment**: `Docker`
- **Docker Build Context Directory**: Leave empty
- **Dockerfile Path**: `./Dockerfile`

**Instance Type:**
- Start with **Free** tier for testing
- Upgrade to **Starter** ($7/month) for production

### 2.4 Add Environment Variables

Click **Environment** and add these variables:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
FASTAPI_ENV=production
PORT=8000
```

**Optional (for weather integration):**
```bash
BLYNK_BASE_URL=https://blynk.cloud
BLYNK_TOKEN=your-blynk-token
```

### 2.5 Deploy

1. Click **Create Web Service**
2. Wait for the build to complete (5-10 minutes)
3. Monitor the logs for any errors

### 2.6 Verify Backend Deployment

Once deployed, you'll get a URL like: `https://infield-spray-backend.onrender.com`

Test the endpoints:

```bash
# Health check
curl https://infield-spray-backend.onrender.com/healthz

# Should return: {"ok": true}

# API docs
# Visit: https://infield-spray-backend.onrender.com/docs
```

**Note your backend URL** - you'll need it for the frontend deployment.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Vercel Deployment

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Select the `On-Farm-inputs-QA-App` repository

### 3.2 Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 3.3 Add Environment Variables

Click **Environment Variables** and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_BASE_URL=https://infield-spray-backend.onrender.com
```

Make sure to set these for **all environments** (Production, Preview, Development).

### 3.4 Deploy

1. Click **Deploy**
2. Wait for the build (2-3 minutes)
3. Vercel will provide a URL like: `https://your-app.vercel.app`

### 3.5 Verify Frontend Deployment

Visit your Vercel URL and test:
- [ ] Page loads without errors
- [ ] Can navigate to /login
- [ ] Registration form appears
- [ ] Check browser console for errors

---

## Step 4: Update Backend CORS

Now that you have your Vercel URL, update the backend CORS configuration:

### 4.1 Update CORS Origins

Edit `apps/backend/app/main.py` and replace the CORS middleware with your actual domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",  # Replace with your actual URL
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4.2 Redeploy Backend

```bash
git add apps/backend/app/main.py
git commit -m "Update CORS for production domain"
git push origin main
```

Render will automatically redeploy (takes 2-3 minutes).

---

## Step 5: Update Supabase Auth Configuration

### 5.1 Configure Redirect URLs

1. Go to Supabase Dashboard → **Authentication → URL Configuration**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/login
   https://your-app.vercel.app/dashboard
   ```

### 5.2 Test Authentication Flow

1. Visit your Vercel URL
2. Navigate to `/login`
3. Create a test account
4. Verify you can log in and access the dashboard

---

## Step 6: Create Initial Owner and Profile

### 6.1 Manual Database Setup (First User)

The first user needs an owner and profile record. You can do this via Supabase SQL Editor:

```sql
-- Get your user ID from auth.users
SELECT id, email FROM auth.users;

-- Create an owner
INSERT INTO owners (owner_name)
VALUES ('Your Organization Name')
RETURNING owner_id;

-- Create a profile linking user to owner
-- Replace <user_id> with your auth.users id
-- Replace <owner_id> with the returned owner_id
INSERT INTO profiles (user_id, owner_id, full_name, role)
VALUES (
  '<user_id>',
  '<owner_id>',
  'Your Full Name',
  'admin'
);
```

### 6.2 Automated Profile Creation (Optional)

For production, you may want to add a database trigger or edge function to auto-create profiles on signup.

---

## Step 7: Post-Deployment Verification

### 7.1 Full System Test

Go through the complete workflow:

1. **Registration & Login**
   - [ ] Create a new account
   - [ ] Receive confirmation email (if enabled)
   - [ ] Log in successfully

2. **Owner/Farm/Paddock Setup**
   - [ ] Create an owner record
   - [ ] Create a farm
   - [ ] Create paddocks with GPS coordinates

3. **Mix Builder**
   - [ ] Create a chemical mix
   - [ ] Add mix items
   - [ ] Save mix

4. **Application Recording**
   - [ ] Create a new application
   - [ ] Select paddocks
   - [ ] Capture GPS coordinates
   - [ ] Fetch weather data (if Blynk configured)
   - [ ] Finalize application

5. **PDF Export**
   - [ ] Generate PDF from application
   - [ ] Verify QR code and watermark
   - [ ] Download PDF

### 7.2 Performance Check

- [ ] Frontend loads in < 3 seconds
- [ ] API responses < 500ms
- [ ] PDF generation completes in < 10 seconds
- [ ] No console errors in browser

### 7.3 Security Verification

- [ ] Cannot access other users' data
- [ ] RLS policies enforced
- [ ] HTTPS enabled on all URLs
- [ ] Service role key not exposed in frontend
- [ ] API requires authentication

---

## Step 8: Custom Domain (Optional)

### 8.1 Frontend Custom Domain

In Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `spray.yourdomain.com`)
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate provisioning (automatic)

### 8.2 Backend Custom Domain

In Render:
1. Go to Service → Settings → Custom Domain
2. Add your backend domain (e.g., `api.yourdomain.com`)
3. Configure DNS CNAME record
4. Update frontend `NEXT_PUBLIC_API_BASE_URL` in Vercel

### 8.3 Update CORS for Custom Domain

Update `apps/backend/app/main.py`:
```python
allow_origins=[
    "http://localhost:3000",
    "https://spray.yourdomain.com",
]
```

---

## Monitoring and Maintenance

### Backend Logs

**Render Dashboard:**
- Service → Logs tab
- Real-time log streaming
- Search and filter capabilities

### Frontend Logs

**Vercel Dashboard:**
- Project → Deployments → [Deployment] → Logs
- Runtime logs available for serverless functions

### Database Monitoring

**Supabase Dashboard:**
- Reports → Database
- Query performance
- Active connections
- Storage usage

### Recommended Monitoring

Consider setting up:
- **Uptime monitoring**: Use UptimeRobot or similar
- **Error tracking**: Sentry for frontend/backend
- **Analytics**: PostHog or similar for user behavior

---

## Troubleshooting

### Backend Not Starting

**Check Render logs** for:
- Missing environment variables
- Database connection errors
- Python dependency issues

**Common fixes:**
```bash
# Verify environment variables in Render dashboard
# Ensure DATABASE_URL format is correct
# Check Supabase project status
```

### Frontend Can't Connect to Backend

**Check:**
- [ ] `NEXT_PUBLIC_API_BASE_URL` is correct
- [ ] Backend CORS includes frontend domain
- [ ] Backend is running (check /healthz endpoint)
- [ ] Browser console for CORS errors

### Authentication Not Working

**Check:**
- [ ] Supabase Site URL matches frontend URL
- [ ] Redirect URLs include all necessary paths
- [ ] JWT secret matches between Supabase and backend
- [ ] Browser cookies enabled

### RLS Permission Denied

**Check:**
- [ ] User has profile record with owner_id
- [ ] Owner record exists
- [ ] RLS policies match data ownership structure
- [ ] Test queries in Supabase SQL Editor with auth context

---

## Rollback Procedure

If deployment fails:

### Backend Rollback

In Render:
1. Go to Service → Events
2. Find previous successful deployment
3. Click **Rollback to this deploy**

### Frontend Rollback

In Vercel:
1. Go to Project → Deployments
2. Find previous successful deployment
3. Click ⋯ → **Promote to Production**

### Database Rollback

Supabase provides point-in-time recovery:
1. Settings → Database → Backups
2. Choose restore point
3. Follow restore procedure

---

## Success Checklist

- [ ] Backend deployed and accessible at /healthz
- [ ] Frontend deployed and loads correctly
- [ ] Database schema applied with RLS
- [ ] Authentication working (signup/login)
- [ ] Can create owner, farms, paddocks
- [ ] Can create mixes and applications
- [ ] GPS capture working (requires HTTPS)
- [ ] PDF generation working
- [ ] Weather integration (if configured)
- [ ] CORS configured for production domain
- [ ] SSL/HTTPS enabled on all services
- [ ] Database backups enabled
- [ ] Custom domains configured (if using)

---

## Support Resources

- **Application Docs**: [README.md](README.md) and [INSTALL.md](INSTALL.md)
- **Design Brief**: [docs/DesignBrief.md](docs/DesignBrief.md)
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Frontend URL**: _______________
**Backend URL**: _______________
**Database**: _______________
