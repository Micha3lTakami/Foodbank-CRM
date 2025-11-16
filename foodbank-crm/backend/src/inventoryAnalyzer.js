// Calculate days of supply by category
function analyzeSupplyGaps(items, analytics = null) {
  // Convert Firebase object to array if needed
  const itemsArray = Array.isArray(items) ? items : Object.values(items || {});
  
  // Filter out deleted items and items without valid data
  const validItems = itemsArray.filter(item => {
    // Support both 'category' and 'foodCategory' field names
    const category = item.foodCategory || item.category;
    return item && 
           item.status !== 'deleted' && 
           category && 
           (item.quantity !== undefined && item.quantity !== null);
  });
  
  // Group by category
  const byCategory = {};
  
  validItems.forEach(item => {
    // Support both 'category' and 'foodCategory' field names
    const category = item.foodCategory || item.category;
    if (!category) return; // Skip items without category
    
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(item);
  });
  
  // Get daily usage rates from analytics or use defaults
  const dailyUsageRates = analytics?.averageDailyDemand || {
    protein: 80,      // Default from new schema
    dairy: 50,
    fruit: 60,
    grain: 90,
    vegetable: 70,
    prepared: 20,
    other: 10,
    // Legacy defaults for backward compatibility
    canned: 25
  };
  
  const supplyGaps = {};
  
  Object.entries(byCategory).forEach(([category, categoryItems]) => {
    // Convert quantities to numbers and sum them
    const totalQuantity = categoryItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      return sum + qty;
    }, 0);
    
    const dailyUsage = dailyUsageRates[category] || 10;
    const daysOfSupply = dailyUsage > 0 ? totalQuantity / dailyUsage : 0;
    
    supplyGaps[category] = {
      daysOfSupply: parseFloat(daysOfSupply.toFixed(1)),
      totalQuantity: parseFloat(totalQuantity.toFixed(1)),
      itemCount: categoryItems.length,
      status: daysOfSupply < 3 ? 'CRITICAL' : daysOfSupply < 5 ? 'LOW' : 'OK'
    };
  });
  
  return supplyGaps;
}

// Find categories below threshold
function getCriticalCategories(supplyGaps, threshold = 3) {
  return Object.entries(supplyGaps)
    .filter(([category, data]) => data.daysOfSupply < threshold)
    .sort((a, b) => a[1].daysOfSupply - b[1].daysOfSupply) // Most urgent first
    .map(([category, data]) => ({
      category,
      daysOfSupply: data.daysOfSupply,
      status: data.status
    }));
}

// Get items expiring soon
function getExpiringItems(items, daysThreshold = 3) {
  const itemsArray = Array.isArray(items) ? items : Object.values(items || {});
  const now = new Date();
  
  return itemsArray
    .filter(item => item && item.status !== 'deleted') // Filter deleted items
    .map(item => {
      const expirationDate = new Date(item.bestByDate || item.perish_date || item.perishDate);
      const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...item,
        daysUntilExpiration
      };
    })
    .filter(item => item.daysUntilExpiration <= daysThreshold && item.daysUntilExpiration > 0)
    .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
}

// Main analysis function - accepts Firebase data
function performInventoryAnalysis(inventory, analytics = null) {
  // Convert Firebase objects to arrays if needed
  const inventoryArray = Array.isArray(inventory) ? inventory : Object.values(inventory || {});
  
  // Filter out deleted items
  const activeInventory = inventoryArray.filter(item => 
    item && item.status !== 'deleted'
  );
  
  // Supply gaps
  const supplyGaps = analyzeSupplyGaps(activeInventory, analytics);
  
  // Critical categories
  const critical = getCriticalCategories(supplyGaps);
  
  // Expiring items
  const expiring = getExpiringItems(activeInventory);
  
  return {
    supplyGaps,
    criticalCategories: critical,
    expiringItems: expiring,
    allInventory: activeInventory
  };
}

module.exports = {
  analyzeSupplyGaps,
  getCriticalCategories,
  getExpiringItems,
  performInventoryAnalysis
};

