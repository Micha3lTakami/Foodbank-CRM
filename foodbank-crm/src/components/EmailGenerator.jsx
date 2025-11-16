import { useState } from 'react';
import { generateEmails, detectCrisis } from '../services/api';
import { db, ref, get } from '../firebase';

export default function EmailGenerator({ criticalCategory, inventory, suppliers, analytics }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [crisisContext, setCrisisContext] = useState(null);
  const [checkingCrisis, setCheckingCrisis] = useState(false);

  const handleCheckCrisis = async () => {
    setCheckingCrisis(true);
    try {
      // Get analytics from Firebase if not provided as props
      let analyticsData = analytics;
      if (!analyticsData) {
        const analyticsSnapshot = await get(ref(db, 'analytics'));
        analyticsData = analyticsSnapshot.val();
      }
      
      const crisis = await detectCrisis(analyticsData);
      if (crisis.is_crisis) {
        setCrisisContext({
          event_type: crisis.event_type,
          severity: crisis.severity
        });
      }
    } catch (err) {
      console.error('Crisis check error:', err);
    } finally {
      setCheckingCrisis(false);
    }
  };

  const handleGenerateEmails = async () => {
    if (!criticalCategory) {
      setError('Please analyze inventory first to find critical categories');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Get data from Firebase if not provided as props
      let inventoryData = inventory;
      let suppliersData = suppliers;
      
      if (!inventoryData) {
        const inventorySnapshot = await get(ref(db, 'inventory'));
        inventoryData = inventorySnapshot.val();
      }
      if (!suppliersData) {
        const suppliersSnapshot = await get(ref(db, 'suppliers'));
        suppliersData = suppliersSnapshot.val();
      }
      
      const result = await generateEmails(
        criticalCategory.category,
        criticalCategory.daysOfSupply,
        inventoryData,
        suppliersData,
        crisisContext
      );
      setEmails(result.emails || []);
    } catch (err) {
      setError(err.message);
      console.error('Email generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLeadStatusColor = (status) => {
    if (status === 'hot') return '#c62828';
    if (status === 'warm') return '#f57c00';
    return '#616161';
  };

  return (
    <div style={{ 
      border: '2px solid #2196F3', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>📧 AI Email Generator</h2>

      {criticalCategory ? (
        <div style={{
          padding: '10px',
          backgroundColor: '#e3f2fd',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          <strong>Target Category:</strong> {criticalCategory.category} 
          ({criticalCategory.daysOfSupply} days remaining)
        </div>
      ) : (
        <div style={{
          padding: '10px',
          backgroundColor: '#fff3e0',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          ⚠️ No critical category selected. Run inventory analysis first.
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleCheckCrisis}
          disabled={checkingCrisis}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: checkingCrisis ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {checkingCrisis ? 'Checking...' : '🔍 Check for Crisis'}
        </button>

        {crisisContext && (
          <span style={{
            padding: '5px 10px',
            backgroundColor: '#ffebee',
            borderRadius: '5px',
            marginLeft: '10px'
          }}>
            🚨 Crisis detected: {crisisContext.event_type.replace(/_/g, ' ')} ({crisisContext.severity})
          </span>
        )}
      </div>

      <button 
        onClick={handleGenerateEmails}
        disabled={loading || !criticalCategory}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: criticalCategory ? '#2196F3' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: (loading || !criticalCategory) ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Generating emails...' : '✨ Generate AI Emails'}
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

      {emails.length > 0 && (
        <div>
          <h3>✅ Generated {emails.length} Personalized Email{emails.length !== 1 ? 's' : ''}:</h3>
          {emails.map((email, idx) => (
            <div key={idx} style={{
              border: '1px solid #ddd',
              borderRadius: '5px',
              padding: '15px',
              margin: '15px 0',
              backgroundColor: 'white'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid #eee'
              }}>
                <div>
                  <strong>{email.supplier_name}</strong>
                  <span style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    backgroundColor: getLeadStatusColor(email.lead_status),
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    {email.lead_status.toUpperCase()} LEAD
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {email.supplier_email}
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Subject:</strong> {email.subject}
              </div>
              
              <div style={{
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '5px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.6'
              }}>
                {email.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

