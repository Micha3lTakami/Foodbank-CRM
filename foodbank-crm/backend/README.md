# Food Bank CRM Backend API

Backend API server for AI-powered inventory analysis and supplier email generation.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Required: Anthropic API Key for email generation
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Firebase Admin SDK (if you want backend to fetch directly from Firebase)
# Get service account JSON from Firebase Console > Project Settings > Service Accounts
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Firebase Database URL
FIREBASE_DATABASE_URL=https://foodbank-crm-hackathon-default-rtdb.firebaseio.com

# Server Port (default: 3001)
PORT=3001
```

**Note:** If you don't configure Firebase Admin, the API will work by receiving data from the frontend. This is the recommended approach for development.

### 3. Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key
5. Copy it to your `.env` file

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /api/health
```

### Analyze Inventory
```
POST /api/analyze-inventory
Body: { inventory: {...}, analytics: {...} }
```

### Generate Supplier Emails
```
POST /api/generate-emails
Body: { 
  category: "protein",
  daysOfSupply: 2.7,
  inventory: {...},
  suppliers: {...},
  crisisContext: {...} // optional
}
```

### Detect Crisis
```
POST /api/detect-crisis
Body: { analytics: {...}, scenario: "winterStorm" } // scenario optional
```

### Full Workflow
```
POST /api/full-workflow
Body: { scenario: "winterStorm" } // optional
```

## How It Works

1. **Frontend sends Firebase data** to the backend API
2. **Backend analyzes** inventory and generates AI emails using Claude
3. **Backend returns** results to frontend for display

The backend can also fetch directly from Firebase if you configure Firebase Admin SDK, but sending data from the frontend is simpler and works without additional setup.

## Troubleshooting

**"ANTHROPIC_API_KEY not set"**
- Make sure your `.env` file exists and has the API key
- Restart the server after adding the key

**"Module not found"**
- Run `npm install` in the backend directory

**"Cannot connect to API"**
- Make sure the server is running on port 3001
- Check that CORS is enabled (it should be by default)
- Verify the frontend is pointing to the correct API URL

