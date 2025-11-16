import { useState } from 'react';
import { analyzeInventory } from '../services/api';
import { db, ref, get } from '../firebase';

export default function InventoryAnalysis({ onCriticalCategorySelected, inventory, analytics }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get fresh data from Firebase if not provided as props
      let inventoryData = inventory;
      let analyticsData = analytics;
      
      if (!inventoryData) {
        const inventorySnapshot = await get(ref(db, 'inventory'));
        inventoryData = inventorySnapshot.val();
      }
      if (!analyticsData) {
        const analyticsSnapshot = await get(ref(db, 'analytics'));
        analyticsData = analyticsSnapshot.val();
      }
      
      const result = await analyzeInventory(inventoryData, analyticsData);
      setAnalysis(result);
      
      // If there's a critical category, notify parent
      if (result.criticalCategories?.length > 0 && onCriticalCategorySelected) {
        onCriticalCategorySelected(result.criticalCategories[0]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusEmoji = (status) => {
    if (status === 'CRITICAL') return '🔴';
    if (status === 'LOW') return '🟡';
    return '🟢';
  };

  return (
    <div style={{ 
      border: '2px solid #4CAF50', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>📊 AI Inventory Analysis</h2>
      
      <button 
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Analyzing...' : '🔍 Analyze Inventory'}
      </button>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '5px',
          marginBottom: '10px'
        }}>
          ❌ Error: {error}
        </div>
      )}

      {analysis && (
        <div>
          <h3>Days of Supply by Category:</h3>
          <div style={{ marginBottom: '20px' }}>
            {Object.entries(analysis.supplyGaps || {}).map(([category, data]) => (
              <div key={category} style={{
                padding: '10px',
                margin: '5px 0',
                backgroundColor: data.status === 'CRITICAL' ? '#ffebee' : 
                                data.status === 'LOW' ? '#fff3e0' : '#e8f5e9',
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  {getStatusEmoji(data.status)} <strong>{category}</strong>
                </span>
                <span>
                  {data.daysOfSupply} days ({data.totalQuantity} {data.itemCount > 1 ? 'items' : 'item'}) - {data.status}
                </span>
              </div>
            ))}
          </div>

          {analysis.criticalCategories?.length > 0 && (
            <div style={{
              padding: '15px',
              backgroundColor: '#ffebee',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h3>⚠️ CRITICAL CATEGORIES (&lt; 3 days):</h3>
              {analysis.criticalCategories.map(cat => (
                <div key={cat.category} style={{ margin: '5px 0' }}>
                  ❗ <strong>{cat.category}</strong>: {cat.daysOfSupply} days remaining
                </div>
              ))}
            </div>
          )}

          {analysis.expiringItems?.length > 0 && (
            <div style={{
              padding: '15px',
              backgroundColor: '#fff3e0',
              borderRadius: '5px'
            }}>
              <h3>⏰ ITEMS EXPIRING SOON (&lt; 3 days):</h3>
              {analysis.expiringItems.map((item, idx) => (
                <div key={idx} style={{ margin: '5px 0' }}>
                  📦 {item.name || item.item_name}: expires in {item.daysUntilExpiration} day{item.daysUntilExpiration === 1 ? '' : 's'}
                </div>
              ))}
            </div>
          )}

          {analysis.criticalCategories?.length === 0 && (
            <div style={{
              padding: '15px',
              backgroundColor: '#e8f5e9',
              borderRadius: '5px'
            }}>
              ✅ No critical categories - all supplies above 3-day threshold
            </div>
          )}
        </div>
      )}
    </div>
  );
}

