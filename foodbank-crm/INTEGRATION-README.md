# Food Bank CRM - AI Integration Complete! 🎉

This project now integrates the AI-powered supplier outreach system with your React frontend and Firebase database.

## What's Been Added

✅ **Backend API Server** (`/backend`)
- Express server with AI-powered endpoints
- Inventory analysis using Firebase data
- AI email generation with Claude
- Crisis detection

✅ **React Components** (`/src/components`)
- `InventoryAnalysis.jsx` - Analyzes inventory and finds critical shortages
- `EmailGenerator.jsx` - Generates personalized supplier emails

✅ **API Services** (`/src/services`)
- `api.js` - Functions to call the backend API

✅ **Updated App.jsx**
- Integrated AI components into the main UI

## Quick Start

### 1. Install Backend Dependencies

```bash
cd foodbank-crm/backend
npm install
```

### 2. Set Up Backend Environment

Create `foodbank-crm/backend/.env`:

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

Get your API key from: https://console.anthropic.com/

### 3. Start Backend Server

```bash
cd foodbank-crm/backend
npm start
```

The server runs on `http://localhost:3001`

### 4. Start Frontend (in a new terminal)

```bash
cd foodbank-crm
npm run dev
```

### 5. Use the AI Features

1. Open the app in your browser
2. Click **"🔍 Analyze Inventory"** to find critical shortages
3. Click **"✨ Generate AI Emails"** to create personalized supplier outreach
4. Optionally click **"🔍 Check for Crisis"** to detect emergencies

## How It Works

1. **Frontend** reads data from Firebase Realtime Database
2. **Frontend** sends data to **Backend API** for processing
3. **Backend** uses Claude AI to:
   - Analyze inventory supply gaps
   - Generate personalized emails based on supplier history
   - Detect crises from analytics data
4. **Frontend** displays results in the UI

## Project Structure

```
foodbank-crm/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── inventoryAnalyzer.js
│   │   ├── emailGenerator.js
│   │   └── crisisDetector.js
│   ├── server.js           # Express API server
│   └── package.json
├── src/
│   ├── components/
│   │   ├── InventoryAnalysis.jsx
│   │   └── EmailGenerator.jsx
│   ├── services/
│   │   └── api.js          # API client
│   ├── App.jsx             # Main app (updated)
│   └── firebase.js
└── package.json
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/analyze-inventory` - Analyze inventory supply gaps
- `POST /api/generate-emails` - Generate supplier outreach emails
- `POST /api/detect-crisis` - Detect crisis events
- `POST /api/full-workflow` - Run complete workflow

## Features

### Inventory Analysis
- Calculates days of supply by category
- Identifies critical shortages (< 3 days)
- Flags expiring items

### AI Email Generation
- Personalized emails referencing supplier donation history
- Tone adapts to relationship (hot/warm/cold leads)
- Crisis context automatically added when needed
- Specific items requested based on current inventory

### Crisis Detection
- Analyzes analytics data for active crises
- Can use mock news scenarios for testing
- Adjusts email urgency based on crisis severity

## Troubleshooting

**Backend won't start:**
- Make sure you have Node.js installed
- Run `npm install` in the backend directory
- Check that `.env` file exists with `ANTHROPIC_API_KEY`

**Frontend can't connect to API:**
- Make sure backend is running on port 3001
- Check browser console for CORS errors
- Verify `VITE_API_URL` in frontend (defaults to `http://localhost:3001/api`)

**Emails not generating:**
- Verify your Anthropic API key is correct
- Check you have credits in your Anthropic account
- Look at backend console for error messages

## Next Steps

- [ ] Add email sending functionality (SendGrid/Mailgun)
- [ ] Save generated emails to Firebase
- [ ] Track email responses
- [ ] Add more sophisticated crisis detection
- [ ] Create dashboard with analytics

## Demo Flow

1. **Analyze Inventory** → Shows protein at 2.7 days (CRITICAL)
2. **Generate Emails** → Creates personalized emails for protein suppliers
3. **Check Crisis** → Detects winter storm in analytics
4. **Generate Crisis Emails** → Creates urgent emails with crisis context

---

Built with ❤️ for food banks everywhere!

