# Quick Publish Guide

This application is now **ready to publish**. Follow these quick steps to deploy.

## What's Ready

✅ **Database Schema** - Deployed to Supabase with 9 tables and Row Level Security
✅ **Backend API** - FastAPI with CORS configured for production
✅ **Frontend Build** - Next.js optimized and tested
✅ **Environment Templates** - Example files for all components
✅ **Documentation** - Complete README, INSTALL, and DEPLOYMENT guides

## 🚀 Quick Deploy (15 minutes)

### Step 1: Deploy Backend to Render (5 min)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect GitHub: `On-Farm-inputs-QA-App`
3. Settings:
   - Environment: **Docker**
   - Dockerfile: `./Dockerfile`
4. Add environment variables (from Supabase dashboard):
   ```
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   SUPABASE_JWT_SECRET=your_secret
   DATABASE_URL=your_postgres_url
   PORT=8000
   ```
5. Click **Create Web Service**
6. **Note your backend URL** (e.g., `https://app-name.onrender.com`)

### Step 2: Deploy Frontend to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) → Add New → Project
2. Import: `On-Farm-inputs-QA-App`
3. Settings:
   - Framework: **Next.js**
   - Root Directory: `frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
   ```
5. Click **Deploy**
6. **Note your frontend URL** (e.g., `https://app-name.vercel.app`)

### Step 3: Update CORS (2 min)

1. Edit `apps/backend/app/main.py`
2. Replace in CORS middleware:
   ```python
   allow_origins=[
       "http://localhost:3000",
       "https://your-app.vercel.app",  # Your actual URL
   ]
   ```
3. Commit and push (Render auto-redeploys)

### Step 4: Configure Supabase Auth (2 min)

1. Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**: `https://your-app.vercel.app/**`

### Step 5: Create First User (1 min)

1. Visit your frontend URL
2. Navigate to `/login`
3. Click Sign Up
4. Create account

Then in Supabase SQL Editor, create owner and profile:

```sql
-- Get your user ID
SELECT id, email FROM auth.users;

-- Create owner
INSERT INTO owners (owner_name) VALUES ('Your Organization') RETURNING owner_id;

-- Link user to owner (replace IDs)
INSERT INTO profiles (user_id, owner_id, full_name, role)
VALUES ('user-uuid', 'owner-uuid', 'Your Name', 'admin');
```

## ✅ You're Live!

Visit your Vercel URL and start using the application:
- Create farms and paddocks
- Build chemical mixes
- Record spray applications
- Generate audit PDFs

## 📚 Detailed Documentation

For comprehensive instructions, see:
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Full deployment guide with troubleshooting
- **[INSTALL.md](INSTALL.md)** - Local development setup
- **[README.md](README.md)** - Project overview and features

## 🆘 Quick Troubleshooting

**Backend not starting?**
- Check Render logs for errors
- Verify all environment variables are set
- Ensure DATABASE_URL format is correct

**Frontend can't connect?**
- Verify NEXT_PUBLIC_API_BASE_URL matches backend URL
- Check backend CORS includes frontend domain
- Test backend /healthz endpoint

**Can't login?**
- Check Supabase Site URL matches frontend
- Ensure user has profile record with owner_id
- Verify RLS policies in database

**Need help?** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting.

---

**Repository**: https://github.com/rusty61/On-Farm-inputs-QA-App

Happy deploying! 🎉
