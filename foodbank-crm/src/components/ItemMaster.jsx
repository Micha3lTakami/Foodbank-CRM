import { useState, useEffect } from 'react';
import { db, ref, onValue, update } from '../firebase';

export default function ItemMaster() {
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const inventoryRef = ref(db, 'inventory');
    
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      setInventory(snapshot.val() || {});
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = (itemId, item) => {
    setEditingItem({
      itemId,
      ...item
    });
    setSuccessMessage(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const itemRef = ref(db, `inventory/${editingItem.itemId}`);
      
      // Prepare updated data
      const updates = {
        quantity: parseFloat(editingItem.quantity) || 0,
        name: editingItem.name,
        unitType: editingItem.unitType,
        bestByDate: editingItem.bestByDate,
        receiptDate: editingItem.receiptDate,
        status: editingItem.status || 'available'
      };

      // Handle category field (support both foodCategory and category)
      const categoryValue = editingItem.foodCategory || editingItem.category;
      if (categoryValue) {
        updates.foodCategory = categoryValue;
        // Also set category for backward compatibility
        updates.category = categoryValue;
      }

      // Only update fields that exist in original item
      Object.keys(editingItem).forEach(key => {
        if (editingItem[key] !== undefined && key !== 'itemId' && key !== 'category' && key !== 'foodCategory') {
          updates[key] = editingItem[key];
        }
      });

      await update(itemRef, updates);
      
      setSuccessMessage(`✅ Successfully updated ${editingItem.name}!`);
      setEditingItem(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setSuccessMessage(null);
  };

  const handleInputChange = (field, value) => {
    setEditingItem({
      ...editingItem,
      [field]: value
    });
  };

  const handleDelete = async (itemId, itemName) => {
    if (!confirm(`Are you sure you want to delete ${itemName}?`)) {
      return;
    }

    try {
      const itemRef = ref(db, `inventory/${itemId}`);
      await update(itemRef, { status: 'deleted' }); // Soft delete
      setSuccessMessage(`✅ ${itemName} marked as deleted`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + error.message);
    }
  };

  // Get unique categories (support both 'category' and 'foodCategory')
  const categories = ['all', ...new Set(
    Object.values(inventory)
      .filter(item => item && item.status !== 'deleted')
      .map(item => item.foodCategory || item.category)
      .filter(cat => cat) // Remove undefined/null
  )];

  // Filter items (support both 'category' and 'foodCategory')
  const filteredItems = Object.entries(inventory)
    .filter(([itemId, item]) => {
      if (!item || item.status === 'deleted') return false;
      const itemCategory = item.foodCategory || item.category;
      if (filterCategory !== 'all' && itemCategory !== filterCategory) return false;
      if (searchTerm && !item.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => a[1].name?.localeCompare(b[1].name) || 0);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading inventory...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #4CAF50',
        paddingBottom: '15px'
      }}>
        <h1>📦 Item Master - Inventory Management</h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {Object.keys(inventory).length} total items
        </div>
      </div>

      {successMessage && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #4CAF50'
        }}>
          {successMessage}
        </div>
      )}

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <input
          type="text"
          placeholder="🔍 Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '5px'
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            minWidth: '150px'
          }}
        >
          <option value="all">All Categories</option>
          {categories.filter(cat => cat !== 'all').map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Edit Form Modal */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Edit Item: {editingItem.name}</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Item Name:
                </label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Quantity: *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.quantity || 0}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Unit Type:
                </label>
                <input
                  type="text"
                  value={editingItem.unitType || ''}
                  onChange={(e) => handleInputChange('unitType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Category:
                </label>
                <select
                  value={editingItem.foodCategory || editingItem.category || ''}
                  onChange={(e) => {
                    // Save to both fields for compatibility
                    handleInputChange('foodCategory', e.target.value);
                    handleInputChange('category', e.target.value);
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                >
                  <option value="protein">Protein</option>
                  <option value="grain">Grain</option>
                  <option value="vegetable">Vegetable</option>
                  <option value="fruit">Fruit</option>
                  <option value="dairy">Dairy</option>
                  <option value="prepared">Prepared</option>
                  <option value="other">Other</option>
                  <option value="canned">Canned (Legacy)</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Best By Date:
                </label>
                <input
                  type="date"
                  value={editingItem.bestByDate || ''}
                  onChange={(e) => handleInputChange('bestByDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '16px',
                    backgroundColor: '#757575',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Items List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '15px'
      }}>
        {filteredItems.map(([itemId, item]) => (
          <div
            key={itemId}
            style={{
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{item.name}</h3>
              <div style={{ fontSize: '12px', color: '#666' }}>
                ID: {itemId}
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 8px',
                backgroundColor: getCategoryColor(item.foodCategory || item.category),
                color: 'white',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {item.foodCategory || item.category}
              </div>
            </div>

            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
              <div><strong>Quantity:</strong> {item.quantity} {item.unitType}</div>
              <div><strong>Best By:</strong> {item.bestByDate || 'N/A'}</div>
              {item.receiptDate && (
                <div><strong>Received:</strong> {item.receiptDate}</div>
              )}
              <div><strong>Status:</strong> {item.status || 'available'}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleEdit(itemId, item)}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '14px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(itemId, item.name)}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666'
        }}>
          No items found matching your search criteria.
        </div>
      )}
    </div>
  );
}

function getCategoryColor(category) {
  const colors = {
    protein: '#f44336',
    grain: '#FF9800',
    vegetable: '#4CAF50',
    fruit: '#9C27B0',
    dairy: '#2196F3',
    prepared: '#E91E63',
    other: '#795548',
    canned: '#607D8B'
  };
  return colors[category] || '#757575';
}

