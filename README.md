# 🎨 AI Design Evaluator

An AI-powered tool for comprehensive UX design evaluation using **Nielsen's 10 usability heuristics** + **modern design system principles** inspired by industry-leading design systems like Red Hat's.

![Design Evaluator Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Design+Evaluator+Demo)

## ✨ Features

### 🔬 **Comprehensive 16-Point Evaluation**
- **Nielsen's Classic Heuristics**: Visibility, User Control, Consistency, Error Prevention, etc.
- **Design System Principles**: Color & Accessibility, Typography Hierarchy, Design Tokens, Brand Expression, Responsive Design, Interaction Feedback

### 🤖 **AI-Powered Analysis**
- **Computer Vision**: Upload design images for instant analysis
- **Detailed Reasoning**: Get specific explanations for each heuristic score
- **Comparison Mode**: Compare two design alternatives with detailed breakdowns
- **Actionable Recommendations**: Receive specific suggestions for improvement

### 🎯 **Professional Features**
- Modern React + TypeScript frontend
- FastAPI Python backend with OpenAI GPT-4o integration
- Responsive design with Tailwind CSS
- Real-time analysis with progress feedback

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/design-evaluator.git
   cd design-evaluator
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Variables**
   ```bash
   cp env_example.txt .env
   # Edit .env and add your OpenAI API key
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

5. **Run the Application**
   ```bash
   # Terminal 1: Backend
   cd backend && source venv/bin/activate && uvicorn main:app --reload

   # Terminal 2: Frontend  
   cd frontend && npm start
   ```

   Visit http://localhost:3000

## 🌐 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) ⭐ Recommended

#### **Deploy Backend to Railway**
1. Push your code to GitHub
2. Go to [Railway](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Railway will auto-detect the Python app
5. Add environment variable: `OPENAI_API_KEY=your_key`
6. Deploy! You'll get a URL like `https://your-app.railway.app`

#### **Deploy Frontend to Vercel**
1. Go to [Vercel](https://vercel.com) and import your GitHub project
2. Vercel will auto-detect the React app
3. Add environment variable: `REACT_APP_API_URL=https://your-app.railway.app`
4. Deploy! You'll get a URL like `https://your-app.vercel.app`

### Option 2: Netlify + Render

#### **Frontend (Netlify)**
1. Build the frontend: `cd frontend && npm run build`
2. Drag & drop the `frontend/build` folder to [Netlify Drop](https://app.netlify.com/drop)
3. For auto-deployment, connect your GitHub repo to Netlify

#### **Backend (Render)**
1. Go to [Render](https://render.com) → New Web Service
2. Connect your GitHub repository
3. Use these settings:
   - **Environment**: Python
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `OPENAI_API_KEY`

### Option 3: Heroku (Full Stack)
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Create Heroku app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set OPENAI_API_KEY=your_key`
4. Deploy: `git push heroku main`

## 🔧 Configuration

### Environment Variables

**Backend (.env file):**
```env
OPENAI_API_KEY=your_openai_api_key
```

**Frontend (Vercel/Netlify dashboard):**
```env
REACT_APP_API_URL=https://your-backend-url.com
```

### API Configuration

The app uses OpenAI's GPT-4o model for design analysis. You need an OpenAI API key:
1. Sign up at [OpenAI](https://platform.openai.com)
2. Generate an API key
3. Add it to your deployment environment variables

## 📊 Evaluation Framework

### Nielsen's Usability Heuristics
1. **Visibility of System Status** - Clear feedback and system state
2. **Match Between System and Real World** - Familiar language and conventions
3. **User Control and Freedom** - Easy navigation and undo functionality
4. **Consistency and Standards** - Platform conventions and internal consistency
5. **Error Prevention** - Preventing problems before they occur
6. **Recognition Rather Than Recall** - Visible elements vs. memorization
7. **Flexibility and Efficiency** - Shortcuts for experienced users
8. **Aesthetic and Minimalist Design** - Focus on essential content
9. **Help Users Recognize and Recover from Errors** - Clear error messages
10. **Help and Documentation** - Accessible help when needed

### Modern Design System Heuristics
11. **Color & Accessibility** - WCAG compliance and semantic color usage
12. **Typography & Hierarchy** - Clear information hierarchy and readability
13. **Design System Consistency** - Systematic design tokens and patterns
14. **Brand Voice & Expression** - Authentic brand communication
15. **Responsive & Adaptable** - Cross-device usability
16. **Interaction & Feedback** - Clear visual states and micro-interactions

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Python 3.8+, FastAPI, OpenAI API
- **AI Model**: GPT-4o with vision capabilities
- **Deployment**: Vercel, Railway, Netlify, Render, Heroku

## 📱 Usage

1. **Single Design Analysis**: Upload an image → Get comprehensive 16-point evaluation
2. **Design Comparison**: Upload two designs → See side-by-side analysis with winner determination
3. **Detailed Insights**: Expand each heuristic to see specific reasoning and recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Create an issue for bug reports or feature requests
- 💬 Discussions for general questions and ideas
- 📖 Check the [deployment guide](deploy_guide.md) for detailed setup instructions

---

**Built with ❤️ for the design community**