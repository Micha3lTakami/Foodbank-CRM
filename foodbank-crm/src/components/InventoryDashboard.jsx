import { useState } from 'react';
import { db, ref, update } from '../firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Snowflake,
  Flame,
  Package,
  Edit
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const getPerishabilityBadge = (tier) => {
  if (!tier) return <Badge variant="secondary">Shelf-stable</Badge>;
  switch (tier) {
    case 'high_48h':
      return <Badge variant="destructive">High (48h)</Badge>;
    case 'medium_7d':
      return <Badge className="bg-orange-500">Medium (7d)</Badge>;
    case 'low_30d':
      return <Badge className="bg-yellow-500">Low (30d)</Badge>;
    default:
      return <Badge variant="secondary">Shelf-stable</Badge>;
  }
};

const getHandlingTypeBadge = (type) => {
  if (!type) return <Badge variant="secondary" className="bg-gray-100 text-gray-900">Non-Perishable</Badge>;
  switch (type) {
    case 'frozen':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-900">
        <Snowflake className="w-3 h-3 mr-1" />
        Frozen
      </Badge>;
    case 'refrigerated':
      return <Badge variant="secondary" className="bg-cyan-100 text-cyan-900">
        Refrigerated
      </Badge>;
    default:
      return <Badge variant="secondary" className="bg-gray-100 text-gray-900">
        Non-Perishable
      </Badge>;
  }
};

const getFundingSourceBadge = (source) => {
  if (!source) return <Badge variant="outline">Unknown</Badge>;
  switch (source) {
    case 'usda_tefap':
      return <Badge className="bg-green-600">USDA TEFAP</Badge>;
    case 'usda_csfp':
      return <Badge className="bg-green-600">USDA CSFP</Badge>;
    case 'private_donation':
      return <Badge variant="outline">Private Donation</Badge>;
    default:
      return <Badge variant="outline">{source}</Badge>;
  }
};

const getEligibilityBadge = (eligibility) => {
  if (!eligibility) return <Badge variant="outline">Unknown</Badge>;
  switch (eligibility) {
    case 'universal':
      return <Badge className="bg-blue-600">Universal</Badge>;
    case 'income_eligible':
      return <Badge className="bg-purple-600">Income Eligible</Badge>;
    case 'seniors_only':
      return <Badge className="bg-orange-600">Seniors Only</Badge>;
    default:
      return <Badge variant="outline">{eligibility}</Badge>;
  }
};

const getDaysUntilExpiration = (bestByDate) => {
  if (!bestByDate) return 999;
  const today = new Date();
  const expiry = new Date(bestByDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getExpirationAlert = (days) => {
  if (days <= 1) {
    return <Badge variant="destructive" className="flex items-center gap-1 w-fit">
      <AlertCircle className="w-3 h-3" />
      {days}d
    </Badge>;
  } else if (days <= 3) {
    return <Badge className="bg-orange-500 flex items-center gap-1 w-fit">
      <Clock className="w-3 h-3" />
      {days}d
    </Badge>;
  } else if (days <= 7) {
    return <Badge className="bg-yellow-500 flex items-center gap-1 w-fit">
      {days}d
    </Badge>;
  }
  return <Badge variant="secondary">{days}d</Badge>;
};

// Calculate priority score: (days until expiration × demand rate)
const calculatePriority = (item, analytics) => {
  const daysUntilExp = getDaysUntilExpiration(item.bestByDate);
  const category = item.foodCategory || item.category || 'canned';
  const dailyDemand = Number(analytics?.averageDailyDemand?.[category]) || 1;
  const daysOfSupply = (Number(item.quantity) || 0) / dailyDemand;
  
  // Lower score = higher priority (more urgent)
  // Factor in crisis multiplier
  const crisisMultiplier = analytics?.currentCrisis?.active ? Number(analytics.currentCrisis.projectedDemandIncrease) : 1;
  const adjustedDaysOfSupply = daysOfSupply / crisisMultiplier;
  
  // Priority is inverse of days of supply, capped at 100
  return Math.max(0, 100 - (adjustedDaysOfSupply * 10));
};

export function InventoryDashboard({ inventory, analytics, distributions }) {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  
  const inventoryItems = Object.values(inventory || {});
  const distributionRecords = Object.values(distributions || {});
  
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
      quantity: item.quantity || 0,
      unitType: item.unitType || '',
      bestByDate: item.bestByDate || '',
      category: item.foodCategory || item.category || '',
      handlingType: item.handlingType || '',
      fundingSource: item.fundingSource || '',
      recipientEligibility: item.recipientEligibility || '',
      familyMax: item.familyMax || 0,
      lotNumber: item.lotNumber || '',
      weight: item.weight || 0,
    });
  };
  
  const handleSave = async () => {
    if (!editingItem) return;
    
    setSaving(true);
    try {
      const itemRef = ref(db, `inventory/${editingItem.itemId}`);
      await update(itemRef, {
        name: editForm.name,
        quantity: parseFloat(editForm.quantity) || 0,
        unitType: editForm.unitType,
        bestByDate: editForm.bestByDate,
        foodCategory: editForm.category,
        category: editForm.category,
        handlingType: editForm.handlingType,
        fundingSource: editForm.fundingSource,
        recipientEligibility: editForm.recipientEligibility,
        familyMax: parseFloat(editForm.familyMax) || 0,
        lotNumber: editForm.lotNumber,
        weight: parseFloat(editForm.weight) || 0,
      });
      // Dialog will close automatically via onOpenChange
      setEditingItem(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Calculate metrics
  const criticalItems = inventoryItems.filter(item => getDaysUntilExpiration(item.bestByDate) <= 3);
  
  // Calculate days of supply by category
  const categorySupply = Object.entries(analytics?.averageDailyDemand || {}).map(([category, demand]) => {
    const categoryItems = inventoryItems.filter(i => (i.foodCategory || i.category) === category);
    const totalQuantity = categoryItems.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0);
    }, 0);
    
    const crisisMultiplier = analytics?.currentCrisis?.active ? analytics.currentCrisis.projectedDemandIncrease : 1;
    const adjustedDemand = Number(demand) * Number(crisisMultiplier);
    const daysOfSupply = totalQuantity / adjustedDemand;
    
    return {
      category: category.charAt(0).toUpperCase() + category.slice(1),
      days: Number(daysOfSupply) || 0,
      threshold: 3,
      quantity: Number(totalQuantity) || 0,
      demand: Number(adjustedDemand) || 0,
    };
  });

  const lowStockCategories = categorySupply.filter(cat => cat.days < cat.threshold);

  // Category distribution
  const totalWeight = inventoryItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const categoryDistribution = Object.keys(analytics?.averageDailyDemand || {}).map(category => {
    const categoryWeight = inventoryItems
      .filter(i => (i.foodCategory || i.category) === category)
      .reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    const percentage = totalWeight > 0 ? (categoryWeight / totalWeight) * 100 : 0;
    return {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: parseFloat(percentage.toFixed(1)),
      color: {
        protein: '#ef4444',
        grain: '#f59e0b',
        fruit: '#10b981',
        dairy: '#3b82f6',
        vegetable: '#22c55e',
        canned: '#8b5cf6',
      }[category] || '#6b7280',
    };
  });

  const imbalanced = categoryDistribution.some(cat => cat.value < 15);

  // Top priority items
  const priorityItems = inventoryItems
    .map(item => ({
      ...item,
      priority: calculatePriority(item, analytics),
      daysUntilExp: getDaysUntilExpiration(item.bestByDate),
      dailyDemand: Number(analytics?.averageDailyDemand?.[item.foodCategory || item.category]) || 0,
    }))
    .sort((a, b) => b.priority - a.priority);

  // Recent distributions for tracking
  const recentDistributions = distributionRecords
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // All distributions sorted by date (most recent first)
  const allDistributions = distributionRecords
    .filter(dist => dist.timestamp) // Only show distributions with timestamps
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Format timestamp to 11-30 format (hour-minute)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}-${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Crisis Alert */}
      {analytics?.currentCrisis?.active && (
        <div className="border border-red-500 bg-red-50 text-red-900 rounded-lg px-4 py-3">
          <div className="flex items-start gap-3">
            <Flame className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-900 mb-1">
                Active Crisis: {analytics.currentCrisis.type?.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-sm text-red-800">
                {analytics.currentCrisis.description}
                <br />
                <span>Duration: {analytics.currentCrisis.startDate} to {analytics.currentCrisis.endDate}</span>
                <br />
                <span>Projected demand increase: {((analytics.currentCrisis.projectedDemandIncrease - 1) * 100).toFixed(0)}% above normal</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Alerts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {criticalItems.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Expiration Warning</AlertTitle>
            <AlertDescription>
              {criticalItems.length} item(s) expiring within 72 hours
            </AlertDescription>
          </Alert>
        )}

        {lowStockCategories.length > 0 && (
          <Alert className="border-orange-500 text-orange-900 [&>svg]:text-orange-600">
            <TrendingDown className="h-4 w-4" />
            <AlertTitle>Low Stock Alert</AlertTitle>
            <AlertDescription>
              {lowStockCategories.length} category below 3-day supply threshold
            </AlertDescription>
          </Alert>
        )}

        {imbalanced && (
          <Alert className="border-yellow-500 text-yellow-900 [&>svg]:text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Balance Alert</AlertTitle>
            <AlertDescription>
              Inventory nutritionally imbalanced - some categories below 15%
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Full Inventory</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Analytics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Items</CardDescription>
                <CardTitle className="text-gray-900">{inventoryItems.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">
                    {inventoryItems.filter(i => i.status === 'available').length} available
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Expiring Soon</CardDescription>
                <CardTitle className="text-red-600">{criticalItems.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="text-gray-600">Within 3 days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg Supply Days</CardDescription>
                <CardTitle className="text-gray-900">
                  {categorySupply.length > 0 ? (categorySupply.reduce((sum, cat) => sum + cat.days, 0) / categorySupply.length).toFixed(1) : '0'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-600">
                    {analytics?.currentCrisis?.active ? 'Crisis adjusted' : 'Normal demand'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>High Priority Items</CardDescription>
                <CardTitle className="text-gray-900">
                  {priorityItems.filter(i => i.priority > 80).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-gray-600">Urgent action needed</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution by Weight</CardTitle>
                <CardDescription>Current inventory breakdown by nutritional category</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Days of Supply Remaining</CardTitle>
                <CardDescription>
                  By category - Red line indicates 3-day threshold
                  {analytics?.currentCrisis?.active && ' (Crisis adjusted)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categorySupply.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categorySupply}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="days" fill="#3b82f6" />
                      <Bar dataKey="threshold" fill="#ef4444" fillOpacity={0.3} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Priority Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Needed Items</CardTitle>
              <CardDescription>Based on supply gaps and distribution priority</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priorityItems.slice(0, 5).map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900">{item.name}</span>
                        <Badge variant="outline">{item.foodCategory || item.category}</Badge>
                        {getHandlingTypeBadge(item.handlingType)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-gray-600">
                        <span>Stock: {item.quantity} {item.unitType}</span>
                        <span>•</span>
                        <span>Demand: {item.dailyDemand.toFixed(1)} {item.unitType}/day</span>
                        {item.familyMax && (
                          <>
                            <span>•</span>
                            <span>Max/family: {item.familyMax}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getExpirationAlert(item.daysUntilExp)}
                      <div className="text-right">
                        <div className="text-gray-900">Priority: {item.priority.toFixed(0)}</div>
                        <Progress value={item.priority} className="w-20 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
                {priorityItems.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No items available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supply Details by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Supply Analysis</CardTitle>
              <CardDescription>Category-level supply and demand metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySupply.map((cat) => (
                  <div key={cat.category} className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900">{cat.category}</span>
                        {cat.days < 3 && <Badge variant="destructive">Critical</Badge>}
                        {cat.days >= 3 && cat.days < 5 && <Badge className="bg-orange-500">Warning</Badge>}
                        {cat.days >= 5 && <Badge className="bg-green-500">Good</Badge>}
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900">{cat.quantity.toFixed(0)} units in stock</div>
                        <div className="text-gray-600">{cat.days.toFixed(1)} days supply</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-gray-600">
                      <div>Daily demand: {cat.demand.toFixed(1)} units/day</div>
                      <div>Threshold: {cat.threshold} days minimum</div>
                    </div>
                    <Progress 
                      value={Math.min(100, (cat.days / 7) * 100)} 
                      className={cat.days < 3 ? '[&>div]:bg-red-500' : cat.days < 5 ? '[&>div]:bg-orange-500' : '[&>div]:bg-green-500'}
                    />
                  </div>
                ))}
                {categorySupply.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No category data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Inventory</CardTitle>
              <CardDescription>All items with full classification and compliance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-900">Item</th>
                      <th className="text-left py-3 px-4 text-gray-900">Category</th>
                      <th className="text-left py-3 px-4 text-gray-900">Quantity</th>
                      <th className="text-left py-3 px-4 text-gray-900">Handling</th>
                      <th className="text-left py-3 px-4 text-gray-900">Expires In</th>
                      <th className="text-left py-3 px-4 text-gray-900">Funding</th>
                      <th className="text-left py-3 px-4 text-gray-900">Eligibility</th>
                      <th className="text-left py-3 px-4 text-gray-900">Max/Family</th>
                      <th className="text-left py-3 px-4 text-gray-900">Lot#</th>
                      <th className="text-left py-3 px-4 text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((item) => (
                      <tr key={item.itemId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{item.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{item.foodCategory || item.category}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-900">{item.quantity} {item.unitType}</td>
                        <td className="py-3 px-4">{getHandlingTypeBadge(item.handlingType)}</td>
                        <td className="py-3 px-4">{getExpirationAlert(getDaysUntilExpiration(item.bestByDate))}</td>
                        <td className="py-3 px-4">{getFundingSourceBadge(item.fundingSource)}</td>
                        <td className="py-3 px-4">{getEligibilityBadge(item.recipientEligibility)}</td>
                        <td className="py-3 px-4 text-gray-900">{item.familyMax || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{item.lotNumber || '-'}</td>
                        <td className="py-3 px-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {inventoryItems.length === 0 && (
                      <tr>
                        <td colSpan="10" className="py-8 text-center text-gray-500">No inventory items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Distributions</CardTitle>
              <CardDescription>Complete distribution history from the database</CardDescription>
            </CardHeader>
            <CardContent>
              {allDistributions.length > 0 ? (
                <div className="space-y-4">
                  {allDistributions.map((dist) => (
                    <div key={dist.distributionId} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-gray-900 font-medium">{dist.recipientName}</span>
                            {dist.eligibilityVerified && (
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {dist.distributionMethod?.replace('_', ' ') || 'N/A'}
                            </Badge>
                          </div>
                          <div className="text-gray-600">
                            Household size: {dist.householdSize || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-900 font-medium text-lg">
                            {formatTimestamp(dist.timestamp)}
                          </div>
                          <div className="text-gray-600 text-sm">
                            {new Date(dist.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {dist.items && dist.items.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <div className="text-gray-600 text-sm font-medium">Items distributed:</div>
                          <div className="grid grid-cols-2 gap-2">
                            {dist.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-gray-900">
                                <span className="text-sm">{item.itemName || item.name || 'Item'}</span>
                                <span className="text-sm font-medium">
                                  {item.quantityTaken || item.quantity || 0} {item.unitType || item.unit || ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No distributions found in the database
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Dialog - Single dialog for all items */}
      <Dialog open={!!editingItem} onOpenChange={(open) => {
        if (!open) {
          setEditingItem(null);
          setEditForm({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the item details. Changes will be saved to Firebase in realtime.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={editForm.quantity || 0}
                  onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitType">Unit Type</Label>
                <Input
                  id="unitType"
                  value={editForm.unitType || ''}
                  onChange={(e) => setEditForm({...editForm, unitType: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  value={editForm.weight || 0}
                  onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bestByDate">Best By Date</Label>
                <Input
                  id="bestByDate"
                  type="date"
                  value={editForm.bestByDate || ''}
                  onChange={(e) => setEditForm({...editForm, bestByDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handlingType">Handling Type</Label>
                <Input
                  id="handlingType"
                  value={editForm.handlingType || ''}
                  onChange={(e) => setEditForm({...editForm, handlingType: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fundingSource">Funding Source</Label>
                <Input
                  id="fundingSource"
                  value={editForm.fundingSource || ''}
                  onChange={(e) => setEditForm({...editForm, fundingSource: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEligibility">Recipient Eligibility</Label>
                <Input
                  id="recipientEligibility"
                  value={editForm.recipientEligibility || ''}
                  onChange={(e) => setEditForm({...editForm, recipientEligibility: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="familyMax">Max Per Family</Label>
                <Input
                  id="familyMax"
                  type="number"
                  value={editForm.familyMax || 0}
                  onChange={(e) => setEditForm({...editForm, familyMax: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lotNumber">Lot Number</Label>
                <Input
                  id="lotNumber"
                  value={editForm.lotNumber || ''}
                  onChange={(e) => setEditForm({...editForm, lotNumber: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingItem(null);
                setEditForm({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

