require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { performInventoryAnalysis } = require('./src/inventoryAnalyzer');
const { generateSupplierOutreach } = require('./src/emailGenerator');
const { detectCrisis } = require('./src/crisisDetector');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
let db = null;
try {
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://foodbank-crm-hackathon-default-rtdb.firebaseio.com"
      });
      db = admin.database();
      console.log('✅ Firebase Admin initialized');
    } else {
      console.warn('⚠️  Firebase service account not configured. Using frontend data fetching.');
    }
  } else {
    db = admin.database();
  }
} catch (error) {
  console.warn('⚠️  Firebase Admin initialization failed:', error.message);
  console.warn('   The API will work but needs Firebase data from frontend.');
}

// Helper to get Firebase data
async function getFirebaseData(path) {
  if (!db) {
    // If Firebase Admin not initialized, return null (frontend will send data)
    return null;
  }
  try {
    const snapshot = await db.ref(path).once('value');
    return snapshot.val();
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return null;
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Food Bank CRM API is running' });
});

// Analyze inventory - accepts data from frontend or fetches from Firebase
app.post('/api/analyze-inventory', async (req, res) => {
  try {
    // Try to get data from request body first (sent from frontend)
    let inventory = req.body.inventory;
    let analytics = req.body.analytics;
    
    // If not provided, try to fetch from Firebase
    if (!inventory) {
      inventory = await getFirebaseData('inventory');
    }
    if (!analytics) {
      analytics = await getFirebaseData('analytics');
    }
    
    if (!inventory) {
      return res.status(400).json({ error: 'Inventory data not found. Please send inventory data in request body or configure Firebase Admin.' });
    }
    
    const analysis = performInventoryAnalysis(inventory, analytics);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate supplier outreach emails - accepts data from frontend or fetches from Firebase
app.post('/api/generate-emails', async (req, res) => {
  try {
    const { category, daysOfSupply, crisisContext, inventory, suppliers } = req.body;
    
    if (!category || daysOfSupply === undefined) {
      return res.status(400).json({ error: 'Category and daysOfSupply are required' });
    }
    
    // Try to get data from request body first, then Firebase
    let inventoryData = inventory || await getFirebaseData('inventory');
    let suppliersData = suppliers || await getFirebaseData('suppliers');
    
    if (!inventoryData || !suppliersData) {
      return res.status(400).json({ 
        error: 'Inventory and suppliers data required. Send in request body or configure Firebase Admin.' 
      });
    }
    
    const emails = await generateSupplierOutreach(
      inventoryData,
      suppliersData,
      category,
      daysOfSupply,
      crisisContext || null
    );
    
    res.json({ emails, count: emails.length });
  } catch (error) {
    console.error('Error generating emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Detect crisis
app.post('/api/detect-crisis', async (req, res) => {
  try {
    const { scenario, analytics } = req.body;
    const analyticsData = analytics || await getFirebaseData('analytics');
    
    const crisisAnalysis = await detectCrisis(analyticsData, scenario);
    res.json(crisisAnalysis);
  } catch (error) {
    console.error('Error detecting crisis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Full workflow: analyze + generate emails
app.post('/api/full-workflow', async (req, res) => {
  try {
    const { scenario } = req.body;
    
    // Get all data
    const inventory = await getFirebaseData('inventory');
    const suppliers = await getFirebaseData('suppliers');
    const analytics = await getFirebaseData('analytics');
    
    if (!inventory || !suppliers) {
      return res.status(404).json({ error: 'Required data not found' });
    }
    
    // Analyze inventory
    const analysis = performInventoryAnalysis(inventory, analytics);
    
    // Detect crisis
    const crisisAnalysis = await detectCrisis(analytics, scenario);
    
    // Generate emails for critical categories
    let emails = [];
    if (analysis.criticalCategories.length > 0) {
      const criticalCategory = analysis.criticalCategories[0];
      emails = await generateSupplierOutreach(
        inventory,
        suppliers,
        criticalCategory.category,
        criticalCategory.daysOfSupply,
        crisisAnalysis.is_crisis ? {
          event_type: crisisAnalysis.event_type,
          severity: crisisAnalysis.severity
        } : null
      );
    }
    
    res.json({
      analysis,
      crisis: crisisAnalysis,
      emails,
      emailCount: emails.length
    });
  } catch (error) {
    console.error('Error in full workflow:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Food Bank CRM API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

