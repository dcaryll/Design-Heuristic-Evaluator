# 🚀 Step-by-Step Deployment Guide

Your AI Design Evaluator is ready for GitHub deployment! Follow these steps:

## 📋 Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository Details**:
   - **Repository name**: `design-evaluator` (or your preferred name)
   - **Description**: `AI-powered UX design evaluation with Nielsen's heuristics + modern design system principles`
   - **Visibility**: Public (recommended for easier deployment)
   - **Initialize**: ✅ Skip initialization (we already have files)

3. **Click "Create repository"**

## 📤 Step 2: Push Your Code

After creating the GitHub repository, run these commands:

```bash
# Add GitHub as remote origin (replace with your actual GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/design-evaluator.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/johndoe/design-evaluator.git
git push -u origin main
```

## 🌐 Step 3: Deploy to Cloud Platforms

### Option A: Vercel (Frontend) + Railway (Backend) ⭐

#### **Deploy Backend to Railway**
1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select your `design-evaluator` repository
4. Railway auto-detects the Python app
5. **Add Environment Variable**:
   - Variable: `OPENAI_API_KEY`
   - Value: `your_openai_api_key`
6. Click "Deploy"
7. **Copy the URL** (e.g., `https://your-app.railway.app`)

#### **Deploy Frontend to Vercel**
1. Go to https://vercel.com
2. Click "New Project" → Import your GitHub repository
3. **Framework Preset**: Create React App (auto-detected)
4. **Root Directory**: `frontend`
5. **Add Environment Variable**:
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-app.railway.app` (from Railway)
6. Click "Deploy"
7. **Your app is live!** 🎉

### Option B: Alternative Platforms

#### **Netlify (Frontend)**
1. Go to https://app.netlify.com/drop
2. Drag & drop your `frontend/build` folder
3. For automatic deployments: Connect your GitHub repo

#### **Render (Backend)**
1. Go to https://render.com → "New Web Service"
2. Connect your GitHub repository
3. **Build Command**: `cd backend && pip install -r requirements.txt`
4. **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `OPENAI_API_KEY`

## ✅ Step 4: Test Your Deployment

1. **Visit your frontend URL** (from Vercel/Netlify)
2. **Upload a design image** to test the analysis
3. **Try comparison mode** with two different designs
4. **Verify all 16 heuristics** are working properly

## 🔧 Troubleshooting

### Common Issues:

**"API calls failing"**
- ✅ Check that `REACT_APP_API_URL` points to your backend URL
- ✅ Verify `OPENAI_API_KEY` is set in backend environment

**"Build failures"**
- ✅ Ensure `package.json` exists in repository root
- ✅ Check that `requirements.txt` is in the `backend/` directory

**"CORS errors"**
- ✅ Backend CORS is already configured for all origins
- ✅ Verify API URLs don't have trailing slashes

## 📱 Sharing Your App

Once deployed, you can share your Design Evaluator with:

- **Co-workers**: Send them the Vercel/Netlify URL
- **Clients**: Professional deployment with custom domain
- **Community**: Share on design communities and social media

## 🎯 Next Steps

After deployment, consider:

1. **Custom Domain**: Add your own domain in Vercel/Netlify settings
2. **Analytics**: Add Google Analytics with `REACT_APP_GA_TRACKING_ID`
3. **Monitoring**: Set up error tracking with Sentry
4. **Branding**: Customize the UI with your brand colors
5. **Extended Heuristics**: Add more design system frameworks

---

**🎉 Ready to deploy? Start with Step 1 above!**