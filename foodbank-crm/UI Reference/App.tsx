import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { InventoryDashboard } from './components/InventoryDashboard';
import { OutreachDashboard } from './components/OutreachDashboard';
import { Package, Users } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-gray-900">FoodBank Management System</h1>
          <p className="text-gray-600 mt-1">Inventory tracking and supplier outreach</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="outreach" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Outreach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-0">
            <InventoryDashboard />
          </TabsContent>

          <TabsContent value="outreach" className="mt-0">
            <OutreachDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
