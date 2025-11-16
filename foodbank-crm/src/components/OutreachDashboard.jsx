import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  Mail, 
  TrendingUp, 
  Clock, 
  Flame,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

const getSegmentBadge = (lastContactDate) => {
  if (!lastContactDate) return <Badge variant="secondary" className="flex items-center gap-1">
    <Clock className="w-3 h-3" />
    Cold Lead
  </Badge>;
  
  const today = new Date();
  const lastContact = new Date(lastContactDate);
  const daysSinceContact = Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceContact <= 30) {
    return <Badge className="bg-red-500 flex items-center gap-1">
      <Flame className="w-3 h-3" />
      Hot Lead
    </Badge>;
  } else if (daysSinceContact <= 90) {
    return <Badge className="bg-orange-500 flex items-center gap-1">
      <TrendingUp className="w-3 h-3" />
      Warm Lead
    </Badge>;
  } else {
    return <Badge variant="secondary" className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      Cold Lead
    </Badge>;
  }
};

const getSupplierSegment = (lastContactDate) => {
  if (!lastContactDate) return 'Cold';
  
  const today = new Date();
  const lastContact = new Date(lastContactDate);
  const daysSinceContact = Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceContact <= 30) return 'Hot';
  if (daysSinceContact <= 90) return 'Warm';
  return 'Cold';
};

const getSupplierTypeBadge = (type) => {
  if (!type) return <Badge variant="secondary" className="bg-gray-100 text-gray-900">Unknown</Badge>;
  
  const typeMap = {
    farm: { label: 'Farm', color: 'bg-green-100 text-green-900' },
    grocery_chain: { label: 'Grocery Chain', color: 'bg-blue-100 text-blue-900' },
    local_butcher: { label: 'Local Butcher', color: 'bg-red-100 text-red-900' },
    manufacturer: { label: 'Manufacturer', color: 'bg-purple-100 text-purple-900' },
    restaurant: { label: 'Restaurant', color: 'bg-orange-100 text-orange-900' },
  };
  
  const typeInfo = typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-900' };
  return <Badge variant="secondary" className={typeInfo.color}>{typeInfo.label}</Badge>;
};

const getDaysUntilExpiration = (bestByDate) => {
  if (!bestByDate) return 999;
  const today = new Date();
  const expiry = new Date(bestByDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Calculate days of supply by category
const calculateCategorySupply = (inventory, analytics) => {
  const inventoryItems = Object.values(inventory || {});
  
  return Object.entries(analytics?.averageDailyDemand || {}).map(([category, demand]) => {
    const categoryItems = inventoryItems.filter(i => (i.foodCategory || i.category) === category);
    const totalQuantity = categoryItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    
    const crisisMultiplier = analytics?.currentCrisis?.active ? Number(analytics.currentCrisis.projectedDemandIncrease) : 1;
    const adjustedDemand = Number(demand) * crisisMultiplier;
    const daysOfSupply = totalQuantity / adjustedDemand;
    const gapPercentage = Math.max(0, ((3 - daysOfSupply) / 3) * 100);
    
    let status = 'good';
    if (daysOfSupply < 3) status = 'critical';
    else if (daysOfSupply < 5) status = 'warning';
    
    return {
      category,
      currentStock: `${Number(totalQuantity).toFixed(0)} units`,
      daysRemaining: Number(daysOfSupply) || 0,
      status,
      gapPercentage: Math.min(100, Number(gapPercentage) || 0),
      demand: Number(adjustedDemand) || 0,
    };
  });
};

const generateEmail = (supplier, categorySupply, analytics) => {
  const greetingTemplates = [
    `Hi ${supplier.name} team,`,
    `Hello ${supplier.name},`,
    `Dear friends at ${supplier.name},`,
  ];
  
  const greeting = greetingTemplates[Math.floor(Math.random() * greetingTemplates.length)];
  const segment = getSupplierSegment(supplier.lastContactDate);
  
  const contextMap = {
    'Hot': `Thank you for your recent support! Your latest donation on ${supplier.donationHistory?.[0]?.date || 'recently'} made a real difference.`,
    'Warm': `We hope you're doing well! We've always appreciated your support, with ${supplier.donationHistory?.length || 0} generous donations over time.`,
    'Cold': `We hope this message finds you well. We're reaching out during a critical time for our food bank.`
  };

  // Find most critical category that matches supplier's preferences
  const criticalCategories = categorySupply
    .filter(c => c.status === 'critical')
    .sort((a, b) => b.gapPercentage - a.gapPercentage);
  
  const matchingCategory = criticalCategories.find(c => 
    supplier.preferredCategories?.includes(c.category)
  );
  
  const targetCategory = matchingCategory || criticalCategories[0] || categorySupply[0];
  const categoryName = targetCategory ? (targetCategory.category.charAt(0).toUpperCase() + targetCategory.category.slice(1)) : 'Food Items';

  const urgencyMap = {
    'critical': 'URGENT',
    'warning': 'Important',
    'good': 'General'
  };
  const urgency = targetCategory ? urgencyMap[targetCategory.status] : 'General';

  // Crisis context
  const demandIncrease = analytics?.currentCrisis?.active 
    ? (((Number(analytics.currentCrisis.projectedDemandIncrease) || 1) - 1) * 100).toFixed(0)
    : '0';
  const crisisContext = analytics?.currentCrisis?.active 
    ? `\n\n🚨 CRISIS SITUATION 🚨\nWe're currently responding to a ${analytics.currentCrisis.type?.replace('_', ' ')}. ${analytics.currentCrisis.description}\n\nThis crisis has increased our demand by ${demandIncrease}%, making your support more critical than ever.`
    : '';

  return `${greeting}

${contextMap[segment]}
${crisisContext}

${urgency === 'URGENT' ? '🚨 URGENT NEED 🚨' : urgency === 'Important' ? '⚠️ Important Notice' : ''}

${targetCategory ? `We're currently running critically low on ${categoryName} items - we only have ${targetCategory.daysRemaining.toFixed(1)} days of supply remaining, which is ${targetCategory.gapPercentage.toFixed(0)}% below our target levels.

Current demand: ${targetCategory.demand.toFixed(1)} units per day
Available stock: ${targetCategory.currentStock}` : 'We\'re currently experiencing critical supply shortages and need your support.'}

Based on your specialization in ${supplier.preferredCategories?.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') || 'food donations'} and your strong response rate of ${((Number(supplier.responseRate) || 0) * 100).toFixed(0)}%, we're hoping you can help with:
${targetCategory && supplier.preferredCategories?.includes(targetCategory.category) ? `• ${categoryName} items (your specialty - any amount would help!)` : targetCategory ? `• ${categoryName} items` : '• Food items'}
• Other donations from your available inventory

Your Impact: We're serving 150+ families daily, and this shortage directly affects their nutritional balance. Your past ${supplier.donationHistory?.length || 0} donations have been instrumental in our mission.

Could you reply with your availability or any items you might be able to contribute? Even small amounts make a huge difference.

Thank you for being such an important partner in fighting hunger.

Warm regards,
FoodBank Management Team

P.S. You can simply reply to this email with your availability or call us at (555) 123-4567.`;
};

export function OutreachDashboard({ inventory, analytics, suppliers: suppliersData }) {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const suppliersList = Object.values(suppliersData || {});
  const categorySupply = calculateCategorySupply(inventory, analytics);
  const inventoryItems = Object.values(inventory || {});

  const handleGenerateEmail = (supplier) => {
    setSelectedSupplier(supplier);
    const email = generateEmail(supplier, categorySupply, analytics);
    setGeneratedEmail(email);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hotLeads = suppliersList.filter(s => getSupplierSegment(s.lastContactDate) === 'Hot');
  const warmLeads = suppliersList.filter(s => getSupplierSegment(s.lastContactDate) === 'Warm');
  const coldLeads = suppliersList.filter(s => getSupplierSegment(s.lastContactDate) === 'Cold');
  const criticalInventory = categorySupply.filter(i => i.status === 'critical');
  
  // Expiration risk items
  const expirationRiskItems = inventoryItems
    .map(item => ({
      ...item,
      daysUntilExp: getDaysUntilExpiration(item.bestByDate),
    }))
    .filter(item => item.daysUntilExp <= 3)
    .sort((a, b) => a.daysUntilExp - b.daysUntilExp);

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
                {analytics.currentCrisis.description} - Prioritize outreach to Hot and Warm leads immediately.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Critical Categories</CardDescription>
            <CardTitle className="text-red-600">{criticalInventory.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {criticalInventory.slice(0, 3).map((item) => (
                <div key={item.category} className="flex items-center justify-between text-gray-600">
                  <span>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                  <Badge variant="destructive" className="text-xs">{item.daysRemaining.toFixed(1)}d</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Hot Leads</CardDescription>
            <CardTitle className="text-gray-900">{hotLeads.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              <span className="text-gray-600">Ready for immediate contact</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Warm Leads</CardDescription>
            <CardTitle className="text-gray-900">{warmLeads.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">Good for general campaigns</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expiration Risks</CardDescription>
            <CardTitle className="text-orange-600">{expirationRiskItems.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">Items expiring within 72h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiration Risk Items */}
      {expirationRiskItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expiration Risk Items</CardTitle>
            <CardDescription>Items requiring immediate distribution - consider emergency outreach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expirationRiskItems.slice(0, 5).map((item) => (
                <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${item.daysUntilExp <= 1 ? 'text-red-600' : 'text-orange-600'}`} />
                    <div>
                      <div className="text-gray-900">{item.name}</div>
                      <div className="text-gray-600">
                        {item.foodCategory || item.category} • {item.quantity} {item.unitType} • {item.handlingType || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={item.daysUntilExp <= 1 ? 'destructive' : 'default'} className={item.daysUntilExp <= 1 ? '' : 'bg-orange-500'}>
                    {item.daysUntilExp} day{item.daysUntilExp !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Relations Management */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Database</CardTitle>
          <CardDescription>Segmented by donation recency and engagement level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Hot Leads */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-red-600" />
                <h3 className="text-gray-900">Hot Leads (Contacted in last 30 days)</h3>
                <Badge className="bg-red-500">{hotLeads.length}</Badge>
              </div>
              <div className="space-y-3">
                {hotLeads.map((supplier) => (
                  <div key={supplier.supplierId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-gray-900">{supplier.name}</span>
                          {getSegmentBadge(supplier.lastContactDate)}
                          {getSupplierTypeBadge(supplier.type)}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-600 mb-2">
                          <div>Last contact: {supplier.lastContactDate || 'Never'}</div>
                          <div>Total donations: {supplier.donationHistory?.length || 0}</div>
                          <div>Response rate: {((Number(supplier.responseRate) || 0) * 100).toFixed(0)}%</div>
                          <div>Categories: {supplier.preferredCategories?.join(', ') || 'N/A'}</div>
                        </div>
                        {supplier.donationHistory?.[0] && (
                          <div className="text-gray-600">
                            Latest donation: {supplier.donationHistory[0].quantity} {supplier.donationHistory[0].unit} on {supplier.donationHistory[0].date}
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleGenerateEmail(supplier)}
                        className="ml-4"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Email
                      </Button>
                    </div>
                  </div>
                ))}
                {hotLeads.length === 0 && (
                  <div className="text-center text-gray-500 py-4">No hot leads</div>
                )}
              </div>
            </div>

            {/* Warm Leads */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <h3 className="text-gray-900">Warm Leads (Contacted in last 90 days)</h3>
                <Badge className="bg-orange-500">{warmLeads.length}</Badge>
              </div>
              <div className="space-y-3">
                {warmLeads.map((supplier) => (
                  <div key={supplier.supplierId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-gray-900">{supplier.name}</span>
                          {getSegmentBadge(supplier.lastContactDate)}
                          {getSupplierTypeBadge(supplier.type)}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-600 mb-2">
                          <div>Last contact: {supplier.lastContactDate || 'Never'}</div>
                          <div>Total donations: {supplier.donationHistory?.length || 0}</div>
                          <div>Response rate: {((Number(supplier.responseRate) || 0) * 100).toFixed(0)}%</div>
                          <div>Categories: {supplier.preferredCategories?.join(', ') || 'N/A'}</div>
                        </div>
                        {supplier.donationHistory?.[0] && (
                          <div className="text-gray-600">
                            Latest donation: {supplier.donationHistory[0].quantity} {supplier.donationHistory[0].unit} on {supplier.donationHistory[0].date}
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleGenerateEmail(supplier)}
                        variant="outline"
                        className="ml-4"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Email
                      </Button>
                    </div>
                  </div>
                ))}
                {warmLeads.length === 0 && (
                  <div className="text-center text-gray-500 py-4">No warm leads</div>
                )}
              </div>
            </div>

            {/* Cold Leads */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="text-gray-900">Cold Leads (No recent activity - use during major crises only)</h3>
                <Badge variant="secondary">{coldLeads.length}</Badge>
              </div>
              <div className="space-y-3">
                {coldLeads.map((supplier) => (
                  <div key={supplier.supplierId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-gray-900">{supplier.name}</span>
                          {getSegmentBadge(supplier.lastContactDate)}
                          {getSupplierTypeBadge(supplier.type)}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-600 mb-2">
                          <div>Last contact: {supplier.lastContactDate || 'Never'}</div>
                          <div>Total donations: {supplier.donationHistory?.length || 0}</div>
                          <div>Response rate: {((Number(supplier.responseRate) || 0) * 100).toFixed(0)}%</div>
                          <div>Categories: {supplier.preferredCategories?.join(', ') || 'N/A'}</div>
                        </div>
                        {supplier.donationHistory?.[0] && (
                          <div className="text-gray-600">
                            Latest donation: {supplier.donationHistory[0].quantity} {supplier.donationHistory[0].unit} on {supplier.donationHistory[0].date}
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleGenerateEmail(supplier)}
                        variant="outline"
                        className="ml-4"
                        disabled={!analytics?.currentCrisis?.active}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Email
                      </Button>
                    </div>
                  </div>
                ))}
                {coldLeads.length === 0 && (
                  <div className="text-center text-gray-500 py-4">No cold leads</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Email */}
      {selectedSupplier && generatedEmail && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI-Generated Personalized Outreach Email
                </CardTitle>
                <CardDescription>
                  For {selectedSupplier.name} ({selectedSupplier.type}) • {selectedSupplier.email}
                  <br />
                  Response Rate: {((Number(selectedSupplier.responseRate) || 0) * 100).toFixed(0)}% • 
                  {' '}{selectedSupplier.donationHistory?.length || 0} past donations • 
                  {' '}Specializes in {selectedSupplier.preferredCategories?.join(', ') || 'various categories'}
                </CardDescription>
              </div>
              <Button 
                onClick={handleCopy}
                variant="outline"
                className="bg-white"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Email
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border">
              <div className="mb-4 pb-4 border-b">
                <div className="text-gray-600 mb-1">To: {selectedSupplier.email}</div>
                <div className="text-gray-900">
                  Subject: {analytics?.currentCrisis?.active ? `URGENT - Crisis Response Needed` : `Request for Support`} - Help Needed for Critical Supply Shortage
                </div>
              </div>
              <Textarea 
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
                className="min-h-[500px] font-mono bg-gray-50 border-0"
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">
                  This email references their {selectedSupplier.donationHistory?.length || 0} donation history, highlights urgent category needs, and includes crisis context.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">
                  Personalized based on {(Number(selectedSupplier.responseRate) || 0) >= 0.7 ? 'strong' : 'moderate'} {((Number(selectedSupplier.responseRate) || 0) * 100).toFixed(0)}% response rate and {selectedSupplier.type} supplier type.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

