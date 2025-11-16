import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Snowflake,
  Flame,
  Package
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
  LineChart,
  Line,
  Legend
} from 'recharts';
import { inventory, analytics, distributions } from '../lib/mockData';
import type { InventoryItem } from '../lib/mockData';

const getPerishabilityBadge = (tier: string) => {
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

const getHandlingTypeBadge = (type: string) => {
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

const getFundingSourceBadge = (source: string) => {
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

const getEligibilityBadge = (eligibility: string) => {
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

const getDaysUntilExpiration = (bestByDate: string): number => {
  const today = new Date('2025-11-16');
  const expiry = new Date(bestByDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getExpirationAlert = (days: number) => {
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
const calculatePriority = (item: InventoryItem): number => {
  const daysUntilExp = getDaysUntilExpiration(item.bestByDate);
  const dailyDemand = analytics.averageDailyDemand[item.category as keyof typeof analytics.averageDailyDemand] || 1;
  const daysOfSupply = item.quantity / dailyDemand;
  
  // Lower score = higher priority (more urgent)
  // Factor in crisis multiplier
  const crisisMultiplier = analytics.currentCrisis.active ? analytics.currentCrisis.projectedDemandIncrease : 1;
  const adjustedDaysOfSupply = daysOfSupply / crisisMultiplier;
  
  // Priority is inverse of days of supply, capped at 100
  return Math.max(0, 100 - (adjustedDaysOfSupply * 10));
};

export function InventoryDashboard() {
  const inventoryItems = Object.values(inventory);
  const distributionRecords = Object.values(distributions);
  
  // Calculate metrics
  const criticalItems = inventoryItems.filter(item => getDaysUntilExpiration(item.bestByDate) <= 3);
  
  // Calculate days of supply by category
  const categorySupply = Object.entries(analytics.averageDailyDemand).map(([category, demand]) => {
    const categoryItems = inventoryItems.filter(i => i.category === category);
    const totalQuantity = categoryItems.reduce((sum, item) => {
      // Normalize to comparable units - use weight or quantity
      return sum + (item.quantity || 0);
    }, 0);
    
    const crisisMultiplier = analytics.currentCrisis.active ? analytics.currentCrisis.projectedDemandIncrease : 1;
    const adjustedDemand = demand * crisisMultiplier;
    const daysOfSupply = totalQuantity / adjustedDemand;
    
    return {
      category: category.charAt(0).toUpperCase() + category.slice(1),
      days: daysOfSupply,
      threshold: 3,
      quantity: totalQuantity,
      demand: adjustedDemand,
    };
  });

  const lowStockCategories = categorySupply.filter(cat => cat.days < cat.threshold);

  // Category distribution
  const totalWeight = inventoryItems.reduce((sum, item) => sum + item.weight, 0);
  const categoryDistribution = Object.keys(analytics.averageDailyDemand).map(category => {
    const categoryWeight = inventoryItems
      .filter(i => i.category === category)
      .reduce((sum, item) => sum + item.weight, 0);
    const percentage = (categoryWeight / totalWeight) * 100;
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
      priority: calculatePriority(item),
      daysUntilExp: getDaysUntilExpiration(item.bestByDate),
      dailyDemand: analytics.averageDailyDemand[item.category as keyof typeof analytics.averageDailyDemand] || 0,
    }))
    .sort((a, b) => b.priority - a.priority);

  // Recent distributions for tracking
  const recentDistributions = distributionRecords
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Crisis Alert */}
      {analytics.currentCrisis.active && (
        <Alert className="border-red-500 bg-red-50 text-red-900 [&>svg]:text-red-600">
          <Flame className="h-5 w-5" />
          <AlertTitle className="text-red-900">Active Crisis: {analytics.currentCrisis.type.replace('_', ' ').toUpperCase()}</AlertTitle>
          <AlertDescription className="text-red-800">
            {analytics.currentCrisis.description}
            <br />
            <span>Duration: {analytics.currentCrisis.startDate} to {analytics.currentCrisis.endDate}</span>
            <br />
            <span>Projected demand increase: {((analytics.currentCrisis.projectedDemandIncrease - 1) * 100).toFixed(0)}% above normal</span>
          </AlertDescription>
        </Alert>
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
                  {(categorySupply.reduce((sum, cat) => sum + cat.days, 0) / categorySupply.length).toFixed(1)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-600">
                    {analytics.currentCrisis.active ? 'Crisis adjusted' : 'Normal demand'}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Days of Supply Remaining</CardTitle>
                <CardDescription>
                  By category - Red line indicates 3-day threshold
                  {analytics.currentCrisis.active && ' (Crisis adjusted)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                        <Badge variant="outline">{item.category}</Badge>
                        {getHandlingTypeBadge(item.handlingType)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-gray-600">
                        <span>Stock: {item.quantity} {item.unitType}</span>
                        <span>•</span>
                        <span>Demand: {item.dailyDemand.toFixed(1)} {item.unitType}/day</span>
                        <span>•</span>
                        <span>Max/family: {item.familyMax}</span>
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
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((item) => (
                      <tr key={item.itemId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{item.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{item.category}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-900">{item.quantity} {item.unitType}</td>
                        <td className="py-3 px-4">{getHandlingTypeBadge(item.handlingType)}</td>
                        <td className="py-3 px-4">{getExpirationAlert(getDaysUntilExpiration(item.bestByDate))}</td>
                        <td className="py-3 px-4">{getFundingSourceBadge(item.fundingSource)}</td>
                        <td className="py-3 px-4">{getEligibilityBadge(item.recipientEligibility)}</td>
                        <td className="py-3 px-4 text-gray-900">{item.familyMax}</td>
                        <td className="py-3 px-4 text-gray-600">{item.lotNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Distributions</CardTitle>
              <CardDescription>Latest family distributions and pickup history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDistributions.map((dist) => (
                  <div key={dist.distributionId} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-gray-900">{dist.recipientName}</div>
                        <div className="text-gray-600">
                          Household size: {dist.householdSize} • {dist.distributionMethod.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900">
                          {new Date(dist.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-gray-600">
                          {new Date(dist.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-gray-600">Items distributed:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {dist.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-gray-900">
                            <span>{item.itemName}</span>
                            <span>{item.quantityTaken} {item.unitType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {dist.eligibilityVerified && (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge variant="outline">{dist.distributionMethod.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
