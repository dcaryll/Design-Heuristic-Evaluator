# 🚀 Cloud Deployment Options for Design Evaluator

## Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

### Frontend Deployment (Vercel - Free)
1. Push your code to GitHub
2. Go to https://vercel.com
3. Connect your GitHub repo
4. Deploy with these settings:
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

### Backend Deployment (Railway - Free Tier)
1. Go to https://railway.app
2. Deploy from GitHub
3. Add environment variables:
   - `OPENAI_API_KEY=your_api_key`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Update API URL
After backend deploys, update `frontend/src/components/ImageUpload.tsx`:
```typescript
const API_BASE_URL = 'https://your-railway-app.railway.app';
```

---

## Option 2: Netlify (Frontend) + Render (Backend)

### Frontend (Netlify)
1. Drag & drop your `frontend/build` folder to https://app.netlify.com/drop
2. Or connect via GitHub for automatic deployments

### Backend (Render) 
1. Go to https://render.com
2. Create new Web Service from GitHub
3. Settings:
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## Option 3: Heroku (Full Stack)

### Prepare for Deployment
1. Create `Procfile` in root:
   ```
   web: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. Create `requirements.txt` in root (copy from backend/)

3. Add `package.json` build scripts:
   ```json
   {
     "scripts": {
       "build": "cd frontend && npm install && npm run build",
       "start": "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT"
     }
   }
   ```

### Deploy
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `heroku config:set OPENAI_API_KEY=your_key`
4. `git push heroku main`

---

## Quick Deploy Script

Run this to prepare for any cloud deployment:

```bash
# Create production build
cd frontend && npm run build

# Create deployment files
echo "web: cd backend && uvicorn main:app --host 0.0.0.0 --port \$PORT" > ../Procfile
cp requirements.txt ../requirements.txt

# Create root package.json
cat > ../package.json << EOF
{
  "name": "design-evaluator",
  "version": "1.0.0",
  "scripts": {
    "build": "cd frontend && npm install && npm run build",
    "start": "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port \$PORT"
  }
}
EOF

echo "✅ Ready for cloud deployment!"
```