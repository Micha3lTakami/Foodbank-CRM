const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Health check
export async function checkApiHealth() {
  return apiCall('/health');
}

// Analyze inventory - sends Firebase data from frontend
export async function analyzeInventory(inventory, analytics) {
  return apiCall('/analyze-inventory', {
    method: 'POST',
    body: JSON.stringify({ inventory, analytics })
  });
}

// Generate supplier outreach emails - sends Firebase data from frontend
export async function generateEmails(category, daysOfSupply, inventory, suppliers, crisisContext = null) {
  return apiCall('/generate-emails', {
    method: 'POST',
    body: JSON.stringify({ category, daysOfSupply, inventory, suppliers, crisisContext })
  });
}

// Detect crisis - sends analytics from frontend
export async function detectCrisis(analytics = null, scenario = null) {
  return apiCall('/detect-crisis', {
    method: 'POST',
    body: JSON.stringify({ analytics, scenario })
  });
}

// Full workflow: analyze + detect crisis + generate emails
export async function runFullWorkflow(scenario = null) {
  return apiCall('/full-workflow', {
    method: 'POST',
    body: JSON.stringify({ scenario })
  });
}

