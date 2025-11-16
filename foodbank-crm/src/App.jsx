import { useEffect, useState } from 'react';
import { db, ref, onValue } from './firebase';

function App() {
  const [inventory, setInventory] = useState({});
  const [suppliers, setSuppliers] = useState({});
  const [distributions, setDistributions] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to all database sections
    const inventoryRef = ref(db, 'inventory');
    const suppliersRef = ref(db, 'suppliers');
    const distributionsRef = ref(db, 'distributions');
    const analyticsRef = ref(db, 'analytics');

    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === 4) setLoading(false);
    };

    onValue(inventoryRef, (snapshot) => {
      setInventory(snapshot.val() || {});
      checkAllLoaded();
    });

    onValue(suppliersRef, (snapshot) => {
      setSuppliers(snapshot.val() || {});
      checkAllLoaded();
    });

    onValue(distributionsRef, (snapshot) => {
      setDistributions(snapshot.val() || {});
      checkAllLoaded();
    });

    onValue(analyticsRef, (snapshot) => {
      setAnalytics(snapshot.val());
      checkAllLoaded();
    });
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading database...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🥫 Food Bank CRM - Database Test</h1>
      
      {/* Inventory Section */}
      <section style={{ marginBottom: '30px', border: '2px solid #4CAF50', padding: '15px', borderRadius: '8px' }}>
        <h2>📦 Inventory ({Object.keys(inventory).length} items)</h2>
        {Object.values(inventory).slice(0, 3).map(item => (
          <div key={item.itemId} style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '10px', 
            margin: '10px 0',
            borderRadius: '5px'
          }}>
            <strong>{item.name}</strong> - {item.quantity} {item.unitType}
            <br />
            <small>Category: {item.category} | Best By: {item.bestByDate} | Funding: {item.fundingSource}</small>
          </div>
        ))}
        <p><em>Showing 3 of {Object.keys(inventory).length} items</em></p>
      </section>

      {/* Suppliers Section */}
      <section style={{ marginBottom: '30px', border: '2px solid #2196F3', padding: '15px', borderRadius: '8px' }}>
        <h2>🏪 Suppliers ({Object.keys(suppliers).length} suppliers)</h2>
        {Object.values(suppliers).slice(0, 3).map(supplier => (
          <div key={supplier.supplierId} style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '10px', 
            margin: '10px 0',
            borderRadius: '5px'
          }}>
            <strong>{supplier.name}</strong> ({supplier.type})
            <br />
            <small>Email: {supplier.email} | Response Rate: {(supplier.responseRate * 100).toFixed(0)}%</small>
            <br />
            <small>Last Contact: {supplier.lastContactDate} | Donations: {supplier.donationHistory.length}</small>
          </div>
        ))}
        <p><em>Showing 3 of {Object.keys(suppliers).length} suppliers</em></p>
      </section>

      {/* Distributions Section */}
      <section style={{ marginBottom: '30px', border: '2px solid #FF9800', padding: '15px', borderRadius: '8px' }}>
        <h2>📤 Distributions ({Object.keys(distributions).length} events)</h2>
        {Object.values(distributions).slice(0, 3).map(dist => (
          <div key={dist.distributionId} style={{ 
            backgroundColor: '#fff3e0', 
            padding: '10px', 
            margin: '10px 0',
            borderRadius: '5px'
          }}>
            <strong>{dist.recipientName}</strong> (Household: {dist.householdSize})
            <br />
            <small>Method: {dist.distributionMethod} | Verified: {dist.eligibilityVerified ? '✅' : '❌'}</small>
            <br />
            <small>Items taken: {dist.items.length} | Time: {new Date(dist.timestamp).toLocaleString()}</small>
          </div>
        ))}
        <p><em>Showing 3 of {Object.keys(distributions).length} distribution events</em></p>
      </section>

      {/* Analytics Section */}
      <section style={{ marginBottom: '30px', border: '2px solid #9C27B0', padding: '15px', borderRadius: '8px' }}>
        <h2>📊 Analytics & Crisis Info</h2>
        <div style={{ backgroundColor: '#f3e5f5', padding: '10px', borderRadius: '5px' }}>
          <h3>Average Daily Demand:</h3>
          <ul>
            {analytics?.averageDailyDemand && Object.entries(analytics.averageDailyDemand).map(([category, demand]) => (
              <li key={category}><strong>{category}:</strong> {demand} units/day</li>
            ))}
          </ul>
          
          <h3>Current Crisis:</h3>
          {analytics?.currentCrisis?.active ? (
            <div style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
              <strong>⚠️ ACTIVE: {analytics.currentCrisis.type}</strong>
              <br />
              {analytics.currentCrisis.description}
              <br />
              <small>Period: {analytics.currentCrisis.startDate} to {analytics.currentCrisis.endDate}</small>
              <br />
              <small>Projected Demand Increase: {analytics.currentCrisis.projectedDemandIncrease}x</small>
            </div>
          ) : (
            <p>No active crisis</p>
          )}
        </div>
      </section>

      {/* Summary */}
      <section style={{ backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '8px' }}>
        <h2>✅ Database Connection Test: SUCCESS</h2>
        <p>All sections loaded correctly:</p>
        <ul>
          <li>✅ Inventory: {Object.keys(inventory).length} items</li>
          <li>✅ Suppliers: {Object.keys(suppliers).length} suppliers</li>
          <li>✅ Distributions: {Object.keys(distributions).length} events</li>
          <li>✅ Analytics: {analytics ? 'Loaded' : 'Missing'}</li>
        </ul>
      </section>
    </div>
  );
}

export default App;