import { useEffect, useState } from 'react';
import { db, ref, onValue } from './firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { InventoryDashboard } from './components/InventoryDashboard';
import { OutreachDashboard } from './components/OutreachDashboard';
import { Package, Users } from 'lucide-react';
import pantryIQLogo from './Images/pantryIQLogo.svg';

function App() {
  const [inventory, setInventory] = useState({});
  const [suppliers, setSuppliers] = useState({});
  const [distributions, setDistributions] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    // Listen to all database sections with realtime Firebase listeners
    const inventoryRef = ref(db, 'inventory');
    const suppliersRef = ref(db, 'suppliers');
    const distributionsRef = ref(db, 'distributions');
    const analyticsRef = ref(db, 'analytics');

    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === 4) setLoading(false);
    };

    // Realtime listeners - these update automatically when data changes in Firebase
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading database...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={pantryIQLogo} alt="PantryIQ Logo" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PantryIQ</h1>
                <p className="text-sm text-gray-600 mt-0.5">Inventory tracking and supplier outreach</p>
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="outreach" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Outreach
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="inventory" className="mt-0">
            <InventoryDashboard 
              inventory={inventory}
              analytics={analytics}
              distributions={distributions}
            />
          </TabsContent>

          <TabsContent value="outreach" className="mt-0">
            <OutreachDashboard 
              inventory={inventory}
              analytics={analytics}
              suppliers={suppliers}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
