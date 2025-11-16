// Mock data matching the full schema structure

export interface InventoryItem {
  itemId: string;
  name: string;
  category: string;
  quantity: number;
  unitType: string;
  bestByDate: string;
  perishabilityTier: string;
  handlingType: string;
  fundingSource: string;
  donorId?: string;
  supplierId?: string;
  receiptDate: string;
  status: string;
  recipientEligibility: string;
  familyMax: number;
  weight: number;
  lotNumber?: string;
}

export interface DistributionItem {
  itemId: string;
  itemName: string;
  quantityTaken: number;
  unitType: string;
}

export interface Distribution {
  distributionId: string;
  timestamp: string;
  recipientName: string;
  householdSize: number;
  distributionMethod: string;
  eligibilityVerified: boolean;
  items: DistributionItem[];
}

export interface DonationRecord {
  date: string;
  items: string[];
  quantity: number;
  unit: string;
}

export interface Supplier {
  supplierId: string;
  name: string;
  type: string;
  email: string;
  preferredCategories: string[];
  lastContactDate: string;
  responseRate: number;
  donationHistory: DonationRecord[];
}

export interface CurrentCrisis {
  active: boolean;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  projectedDemandIncrease: number;
}

export interface Analytics {
  averageDailyDemand: {
    canned: number;
    dairy: number;
    fruit: number;
    grain: number;
    protein: number;
    vegetable: number;
  };
  currentCrisis: CurrentCrisis;
}

export const analytics: Analytics = {
  averageDailyDemand: {
    protein: 45.2,
    dairy: 28.5,
    fruit: 35.8,
    vegetable: 42.3,
    grain: 38.7,
    canned: 52.4,
  },
  currentCrisis: {
    active: true,
    type: 'winter_storm',
    description: 'Severe winter storm has disrupted supply chains and increased demand by 150%',
    startDate: '2025-11-14',
    endDate: '2025-11-19',
    projectedDemandIncrease: 2.5,
  },
};

export const inventory: Record<string, InventoryItem> = {
  inv_001: {
    itemId: 'inv_001',
    name: 'Chicken Breast (Frozen)',
    category: 'protein',
    quantity: 45,
    unitType: 'lbs',
    bestByDate: '2025-11-18',
    perishabilityTier: 'high_48h',
    handlingType: 'frozen',
    fundingSource: 'private_donation',
    supplierId: 'sup_004',
    receiptDate: '2025-11-16',
    status: 'available',
    recipientEligibility: 'universal',
    familyMax: 5,
    weight: 45,
  },
  inv_002: {
    itemId: 'inv_002',
    name: 'White Rice',
    category: 'grain',
    quantity: 280,
    unitType: 'lbs',
    bestByDate: '2026-05-15',
    perishabilityTier: 'shelf_stable',
    handlingType: 'non_perishable',
    fundingSource: 'usda_tefap',
    donorId: 'usda_tefap',
    receiptDate: '2025-10-28',
    status: 'available',
    recipientEligibility: 'income_eligible',
    familyMax: 10,
    weight: 280,
    lotNumber: 'TEFAP-2025-R-1142',
  },
  inv_003: {
    itemId: 'inv_003',
    name: 'Fresh Apples',
    category: 'fruit',
    quantity: 62,
    unitType: 'lbs',
    bestByDate: '2025-11-21',
    perishabilityTier: 'medium_7d',
    handlingType: 'refrigerated',
    fundingSource: 'private_donation',
    supplierId: 'sup_001',
    receiptDate: '2025-11-15',
    status: 'available',
    recipientEligibility: 'universal',
    familyMax: 8,
    weight: 62,
  },
  inv_004: {
    itemId: 'inv_004',
    name: 'Milk (1 Gal)',
    category: 'dairy',
    quantity: 18,
    unitType: 'gallons',
    bestByDate: '2025-11-19',
    perishabilityTier: 'high_48h',
    handlingType: 'refrigerated',
    fundingSource: 'private_donation',
    supplierId: 'sup_001',
    receiptDate: '2025-11-15',
    status: 'available',
    recipientEligibility: 'universal',
    familyMax: 2,
    weight: 18 * 8.6,
  },
  inv_005: {
    itemId: 'inv_005',
    name: 'Canned Black Beans',
    category: 'canned',
    quantity: 340,
    unitType: 'cans',
    bestByDate: '2026-11-15',
    perishabilityTier: 'shelf_stable',
    handlingType: 'non_perishable',
    fundingSource: 'usda_csfp',
    donorId: 'usda_csfp',
    receiptDate: '2025-11-01',
    status: 'available',
    recipientEligibility: 'seniors_only',
    familyMax: 6,
    weight: 340 * 1,
    lotNumber: 'CSFP-2025-B-0892',
  },
  inv_006: {
    itemId: 'inv_006',
    name: 'Ground Beef (Fresh)',
    category: 'protein',
    quantity: 12,
    unitType: 'lbs',
    bestByDate: '2025-11-17',
    perishabilityTier: 'high_48h',
    handlingType: 'refrigerated',
    fundingSource: 'private_donation',
    supplierId: 'sup_004',
    receiptDate: '2025-11-16',
    status: 'available',
    recipientEligibility: 'universal',
    familyMax: 3,
    weight: 12,
  },
  inv_007: {
    itemId: 'inv_007',
    name: 'Carrots',
    category: 'vegetable',
    quantity: 85,
    unitType: 'lbs',
    bestByDate: '2025-11-22',
    perishabilityTier: 'medium_7d',
    handlingType: 'refrigerated',
    fundingSource: 'private_donation',
    supplierId: 'sup_005',
    receiptDate: '2025-11-14',
    status: 'available',
    recipientEligibility: 'universal',
    familyMax: 5,
    weight: 85,
  },
  inv_008: {
    itemId: 'inv_008',
    name: 'Pasta (Penne)',
    category: 'grain',
    quantity: 195,
    unitType: 'boxes',
    bestByDate: '2026-08-20',
    perishabilityTier: 'shelf_stable',
    handlingType: 'non_perishable',
    fundingSource: 'private_donation',
    supplierId: 'sup_002',
    receiptDate: '2025-11-10',
    status: 'available',
    recipientEligibility: 'universal',
    familyMax: 4,
    weight: 195,
  },
  inv_009: {
    itemId: 'inv_009',
    name: 'Canned Corn',
    category: 'canned',
    quantity: 220,
    unitType: 'cans',
    bestByDate: '2026-06-30',
    perishabilityTier: 'shelf_stable',
    handlingType: 'non_perishable',
    fundingSource: 'private_donation',
    supplierId: 'sup_002',
    receiptDate: '2025-11-12',
    status: 'available',
    recipientEligibility: 'universal',
    familyMax: 4,
    weight: 220,
  },
  inv_010: {
    itemId: 'inv_010',
    name: 'Fresh Broccoli',
    category: 'vegetable',
    quantity: 38,
    unitType: 'lbs',
    bestByDate: '2025-11-20',
    perishabilityTier: 'medium_7d',
    handlingType: 'refrigerated',
    fundingSource: 'private_donation',
    supplierId: 'sup_005',
    receiptDate: '2025-11-15',
    status: 'available',
    recipientEligibility: 'universal',
    familyMax: 3,
    weight: 38,
  },
};

export const suppliers: Record<string, Supplier> = {
  sup_001: {
    supplierId: 'sup_001',
    name: 'Local Farms Co-op',
    type: 'farm',
    email: 'contact@localfarms.org',
    preferredCategories: ['fruit', 'vegetable', 'dairy'],
    lastContactDate: '2025-11-11',
    responseRate: 0.92,
    donationHistory: [
      { date: '2025-11-15', items: ['Fresh Apples', 'Milk (1 Gal)'], quantity: 80, unit: 'mixed' },
      { date: '2025-11-01', items: ['Carrots', 'Lettuce'], quantity: 120, unit: 'lbs' },
      { date: '2025-10-18', items: ['Dairy Products'], quantity: 45, unit: 'gallons' },
      { date: '2025-10-05', items: ['Seasonal Produce'], quantity: 200, unit: 'lbs' },
    ],
  },
  sup_002: {
    supplierId: 'sup_002',
    name: 'Metro Grocery Chain',
    type: 'grocery_chain',
    email: 'donations@metrogrocery.com',
    preferredCategories: ['grain', 'canned', 'protein'],
    lastContactDate: '2025-11-04',
    responseRate: 0.78,
    donationHistory: [
      { date: '2025-11-12', items: ['Canned Corn'], quantity: 220, unit: 'cans' },
      { date: '2025-11-10', items: ['Pasta (Penne)'], quantity: 195, unit: 'boxes' },
      { date: '2025-10-22', items: ['Mixed Canned Goods'], quantity: 340, unit: 'cans' },
      { date: '2025-10-08', items: ['Bread Products'], quantity: 85, unit: 'loaves' },
    ],
  },
  sup_003: {
    supplierId: 'sup_003',
    name: 'Sunrise Bakery',
    type: 'manufacturer',
    email: 'info@sunrisebakery.com',
    preferredCategories: ['grain'],
    lastContactDate: '2025-10-02',
    responseRate: 0.65,
    donationHistory: [
      { date: '2025-10-02', items: ['Bread', 'Rolls'], quantity: 150, unit: 'units' },
      { date: '2025-08-15', items: ['Bagels'], quantity: 200, unit: 'units' },
      { date: '2025-07-10', items: ['Pastries'], quantity: 80, unit: 'units' },
    ],
  },
  sup_004: {
    supplierId: 'sup_004',
    name: 'Valley Meat Processors',
    type: 'local_butcher',
    email: 'outreach@valleymeat.com',
    preferredCategories: ['protein'],
    lastContactDate: '2025-09-08',
    responseRate: 0.71,
    donationHistory: [
      { date: '2025-11-16', items: ['Chicken Breast (Frozen)', 'Ground Beef (Fresh)'], quantity: 57, unit: 'lbs' },
      { date: '2025-09-08', items: ['Pork Chops'], quantity: 45, unit: 'lbs' },
      { date: '2025-07-22', items: ['Ground Turkey'], quantity: 38, unit: 'lbs' },
    ],
  },
  sup_005: {
    supplierId: 'sup_005',
    name: 'Green Gardens Produce',
    type: 'farm',
    email: 'donate@greengardens.org',
    preferredCategories: ['fruit', 'vegetable'],
    lastContactDate: '2025-11-08',
    responseRate: 0.88,
    donationHistory: [
      { date: '2025-11-15', items: ['Fresh Broccoli'], quantity: 38, unit: 'lbs' },
      { date: '2025-11-14', items: ['Carrots'], quantity: 85, unit: 'lbs' },
      { date: '2025-10-28', items: ['Tomatoes', 'Peppers'], quantity: 110, unit: 'lbs' },
      { date: '2025-10-12', items: ['Mixed Greens'], quantity: 65, unit: 'lbs' },
      { date: '2025-09-25', items: ['Seasonal Vegetables'], quantity: 145, unit: 'lbs' },
    ],
  },
  sup_006: {
    supplierId: 'sup_006',
    name: 'Wholesale Foods Inc',
    type: 'grocery_chain',
    email: 'community@wholesalefoods.com',
    preferredCategories: ['grain', 'canned', 'protein'],
    lastContactDate: '2025-05-18',
    responseRate: 0.42,
    donationHistory: [
      { date: '2025-05-18', items: ['Canned Soup'], quantity: 120, unit: 'cans' },
      { date: '2025-02-10', items: ['Rice'], quantity: 200, unit: 'lbs' },
      { date: '2024-11-15', items: ['Pasta'], quantity: 85, unit: 'boxes' },
    ],
  },
};

export const distributions: Record<string, Distribution> = {
  dist_001: {
    distributionId: 'dist_001',
    timestamp: '2025-11-16T10:30:00Z',
    recipientName: 'Johnson Family',
    householdSize: 4,
    distributionMethod: 'client_choice',
    eligibilityVerified: true,
    items: [
      { itemId: 'inv_002', itemName: 'White Rice', quantityTaken: 5, unitType: 'lbs' },
      { itemId: 'inv_003', itemName: 'Fresh Apples', quantityTaken: 6, unitType: 'lbs' },
      { itemId: 'inv_004', itemName: 'Milk (1 Gal)', quantityTaken: 2, unitType: 'gallons' },
      { itemId: 'inv_005', itemName: 'Canned Black Beans', quantityTaken: 4, unitType: 'cans' },
    ],
  },
  dist_002: {
    distributionId: 'dist_002',
    timestamp: '2025-11-16T11:15:00Z',
    recipientName: 'Martinez Family',
    householdSize: 6,
    distributionMethod: 'pre_packed',
    eligibilityVerified: true,
    items: [
      { itemId: 'inv_001', itemName: 'Chicken Breast (Frozen)', quantityTaken: 5, unitType: 'lbs' },
      { itemId: 'inv_007', itemName: 'Carrots', quantityTaken: 5, unitType: 'lbs' },
      { itemId: 'inv_008', itemName: 'Pasta (Penne)', quantityTaken: 3, unitType: 'boxes' },
      { itemId: 'inv_009', itemName: 'Canned Corn', quantityTaken: 6, unitType: 'cans' },
    ],
  },
  dist_003: {
    distributionId: 'dist_003',
    timestamp: '2025-11-16T14:45:00Z',
    recipientName: 'Chen Family',
    householdSize: 3,
    distributionMethod: 'client_choice',
    eligibilityVerified: true,
    items: [
      { itemId: 'inv_006', itemName: 'Ground Beef (Fresh)', quantityTaken: 3, unitType: 'lbs' },
      { itemId: 'inv_010', itemName: 'Fresh Broccoli', quantityTaken: 3, unitType: 'lbs' },
      { itemId: 'inv_002', itemName: 'White Rice', quantityTaken: 8, unitType: 'lbs' },
    ],
  },
  dist_004: {
    distributionId: 'dist_004',
    timestamp: '2025-11-15T09:20:00Z',
    recipientName: 'Williams Senior',
    householdSize: 1,
    distributionMethod: 'home_delivery',
    eligibilityVerified: true,
    items: [
      { itemId: 'inv_005', itemName: 'Canned Black Beans', quantityTaken: 6, unitType: 'cans' },
      { itemId: 'inv_003', itemName: 'Fresh Apples', quantityTaken: 4, unitType: 'lbs' },
      { itemId: 'inv_004', itemName: 'Milk (1 Gal)', quantityTaken: 1, unitType: 'gallons' },
    ],
  },
  dist_005: {
    distributionId: 'dist_005',
    timestamp: '2025-11-15T13:00:00Z',
    recipientName: 'Brown Family',
    householdSize: 5,
    distributionMethod: 'client_choice',
    eligibilityVerified: true,
    items: [
      { itemId: 'inv_001', itemName: 'Chicken Breast (Frozen)', quantityTaken: 5, unitType: 'lbs' },
      { itemId: 'inv_007', itemName: 'Carrots', quantityTaken: 5, unitType: 'lbs' },
      { itemId: 'inv_008', itemName: 'Pasta (Penne)', quantityTaken: 4, unitType: 'boxes' },
      { itemId: 'inv_009', itemName: 'Canned Corn', quantityTaken: 4, unitType: 'cans' },
      { itemId: 'inv_003', itemName: 'Fresh Apples', quantityTaken: 8, unitType: 'lbs' },
    ],
  },
};
