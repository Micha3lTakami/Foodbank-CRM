require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Calculate lead status based on last contact
function calculateLeadStatus(supplier) {
  const now = new Date();
  const lastContact = new Date(supplier.lastContactDate || supplier.last_contact_date);
  const daysSinceContact = Math.ceil((now - lastContact) / (1000 * 60 * 60 * 24));
  
  if (daysSinceContact <= 30) return 'hot';
  if (daysSinceContact <= 90) return 'warm';
  return 'cold';
}

// Get suppliers for a specific category
function getSuppliersForCategory(suppliers, category) {
  const suppliersArray = Array.isArray(suppliers) ? suppliers : Object.values(suppliers || {});
  
  return suppliersArray
    .filter(s => {
      const preferredCategories = s.preferredCategories || s.preferred_donation_categories || [];
      // Also check if supplier has any preferred categories (for broader matching)
      return preferredCategories.includes(category) || preferredCategories.length === 0;
    })
    .map(s => ({
      ...s,
      leadStatus: calculateLeadStatus(s)
    }))
    .sort((a, b) => {
      // Sort by lead status (hot > warm > cold)
      const statusOrder = { hot: 0, warm: 1, cold: 2 };
      return statusOrder[a.leadStatus] - statusOrder[b.leadStatus];
    });
}

// Generate email using Claude
async function generateEmailWithClaude(context) {
  const {
    supplierName,
    donationHistory,
    criticalNeed,
    crisisContext,
    leadStatus
  } = context;
  
  // Get most recent donation
  const lastDonation = donationHistory && donationHistory.length > 0 
    ? donationHistory[0] 
    : null;
  
  // Build prompt
  let prompt = `You are writing a personalized outreach email from a food bank to a supplier. Be warm, appreciative, and clear about the need.

SUPPLIER INFORMATION:
- Name: ${supplierName}
- Relationship: ${leadStatus} lead (${leadStatus === 'hot' ? 'donated recently' : leadStatus === 'warm' ? 'donated in last 90 days' : 'not donated recently'})
${lastDonation ? `- Last donation: ${lastDonation.quantity} ${lastDonation.unit} of ${lastDonation.items?.join(', ') || lastDonation.itemName || 'items'} on ${lastDonation.date}` : '- No recent donation history'}

CURRENT NEED:
- Category: ${criticalNeed.category}
- Days of supply remaining: ${criticalNeed.daysOfSupply}
- Status: CRITICAL (below 3-day threshold)
- Specific items we need: ${criticalNeed.specificItems.join(', ')}

${crisisContext ? `CRISIS CONTEXT:
- Event: ${crisisContext.event_type.replace(/_/g, ' ')}
- Severity: ${crisisContext.severity}
- Impact: We're expecting 2-3x normal demand due to this ${crisisContext.event_type.replace(/_/g, ' ')}
- Urgency: NEXT 48-72 HOURS` : ''}

EMAIL REQUIREMENTS:
1. Subject line should be clear and ${crisisContext ? 'urgent' : 'action-oriented'}
2. ${lastDonation ? 'Start by warmly thanking them for their past donation and reference it specifically' : 'Start with a warm greeting'}
3. Explain the current shortage clearly (${criticalNeed.daysOfSupply} days of ${criticalNeed.category} remaining)
4. ${crisisContext ? 'Emphasize the crisis urgency and community impact' : 'Keep tone professional but not overly urgent'}
5. List 3-4 specific items we need in the ${criticalNeed.category} category
6. Clear call-to-action (reply to confirm or call)
7. Keep under 200 words
8. End with gratitude
9. Sign off as "South Bend Community Food Bank Team"

CRITICAL: Return response in this EXACT format:
SUBJECT: [write subject line here]

BODY:
[write email body here]`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: prompt
      }]
    });
    
    // Parse response
    const rawEmail = message.content[0].text;
    const lines = rawEmail.split('\n');
    
    let subject = '';
    let bodyStartIndex = 0;
    
    // Find subject line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('SUBJECT:')) {
        subject = lines[i].replace('SUBJECT:', '').trim();
        bodyStartIndex = i + 1;
        break;
      }
    }
    
    // Find body (skip empty lines and "BODY:" label)
    while (bodyStartIndex < lines.length && 
           (lines[bodyStartIndex].trim() === '' || 
            lines[bodyStartIndex].trim() === 'BODY:')) {
      bodyStartIndex++;
    }
    
    const body = lines.slice(bodyStartIndex).join('\n').trim();
    
    return {
      subject: subject || '[Subject missing]',
      body: body || '[Body missing]'
    };
    
  } catch (error) {
    console.error('❌ Error generating email:', error.message);
    return {
      subject: 'Error generating email',
      body: 'Please check your API key and try again'
    };
  }
}

// Generate outreach campaign - accepts Firebase data
async function generateSupplierOutreach(inventory, suppliers, criticalCategory, daysOfSupply, crisisContext = null) {
  // Convert Firebase objects to arrays if needed
  const inventoryArray = Array.isArray(inventory) ? inventory : Object.values(inventory || {});
  const suppliersArray = Array.isArray(suppliers) ? suppliers : Object.values(suppliers || {});
  
  // Get suppliers for this category
  const relevantSuppliers = getSuppliersForCategory(suppliersArray, criticalCategory);
  
  if (relevantSuppliers.length === 0) {
    return [];
  }
  
  // Get specific items in this category (support both 'category' and 'foodCategory')
  const categoryItems = inventoryArray
    .filter(item => {
      const itemCategory = item.foodCategory || item.category;
      return itemCategory === criticalCategory;
    })
    .map(item => item.name || item.item_name || 'item');
  
  // Generate emails for top 5 suppliers
  const emailPromises = relevantSuppliers.slice(0, 5).map(async (supplier) => {
    const donationHistory = supplier.donationHistory || supplier.donation_history || [];
    
    const email = await generateEmailWithClaude({
      supplierName: supplier.name || supplier.supplier_name,
      donationHistory: donationHistory,
      criticalNeed: {
        category: criticalCategory,
        daysOfSupply: daysOfSupply,
        specificItems: categoryItems.length > 0 ? categoryItems : [criticalCategory]
      },
      crisisContext: crisisContext,
      leadStatus: supplier.leadStatus
    });
    
    return {
      supplier_id: supplier.supplierId || supplier.supplier_id,
      supplier_name: supplier.name || supplier.supplier_name,
      supplier_email: supplier.email || supplier.contact_email,
      lead_status: supplier.leadStatus,
      ...email
    };
  });
  
  const emails = await Promise.all(emailPromises);
  
  return emails;
}

module.exports = {
  generateEmailWithClaude,
  generateSupplierOutreach,
  getSuppliersForCategory,
  calculateLeadStatus
};

