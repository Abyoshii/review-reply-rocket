
// Fake API service for Auto Assembly functionality
// This simulates the API calls to the backend

import { toast } from '@/components/ui/use-toast';

// Types
export type ProductCategory = 'perfume' | 'clothing' | 'misc';

export interface Order {
  id: number;
  article: string;
  name: string;
  warehouse: string;
  cargoType: string;
  createdAt: string;
  inSupply?: boolean;
  supplyId?: number;
}

export interface Supply {
  id: number;
  name: string;
  category: ProductCategory;
  createdAt: string;
  ordersCount: number;
  status: 'new' | 'in_delivery' | 'delivered' | 'cancelled';
}

export type StickerType = 'png' | 'svg' | 'zplv' | 'zplh';
export type StickerSize = '58x40' | '40x30';

export interface StickerParams {
  type: StickerType;
  width: number;
  height: number;
  orders: number[];
}

// Mock data
let orders: Order[] = [
  { id: 1001, article: 'WB-12345', name: 'Духи Chanel No.5', warehouse: 'moscow', cargoType: 'regular', createdAt: '2025-04-01T12:30:00Z' },
  { id: 1002, article: 'WB-23456', name: 'Туалетная вода Hugo Boss', warehouse: 'moscow', cargoType: 'regular', createdAt: '2025-04-01T14:20:00Z' },
  { id: 1003, article: 'WB-34567', name: 'Куртка зимняя Columbia', warehouse: 'saint-petersburg', cargoType: 'regular', createdAt: '2025-04-02T09:10:00Z' },
  { id: 1004, article: 'WB-45678', name: 'Джинсы Levis 501', warehouse: 'moscow', cargoType: 'regular', createdAt: '2025-04-02T10:15:00Z' },
  { id: 1005, article: 'WB-56789', name: 'Футболка Nike', warehouse: 'novosibirsk', cargoType: 'regular', createdAt: '2025-04-02T11:45:00Z' },
  { id: 1006, article: 'WB-67890', name: 'Кофемашина Delonghi', warehouse: 'moscow', cargoType: 'oversized', createdAt: '2025-04-03T08:30:00Z' },
  { id: 1007, article: 'WB-78901', name: 'Кухонный комбайн Moulinex', warehouse: 'saint-petersburg', cargoType: 'heavy', createdAt: '2025-04-03T09:20:00Z' },
  { id: 1008, article: 'WB-89012', name: 'Наушники Sony', warehouse: 'moscow', cargoType: 'regular', createdAt: '2025-04-03T14:10:00Z' },
  { id: 1009, article: 'WB-90123', name: 'Парфюмерная вода Dior', warehouse: 'novosibirsk', cargoType: 'regular', createdAt: '2025-04-04T10:05:00Z' },
  { id: 1010, article: 'WB-01234', name: 'Толстовка Adidas', warehouse: 'moscow', cargoType: 'regular', createdAt: '2025-04-04T11:25:00Z' },
];

let supplies: Supply[] = [];
let nextSupplyId = 5001;

// API functions
const getOrders = async (): Promise<Order[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return only orders that are not in a supply
  return orders.filter(order => !order.inSupply);
};

const getSupplies = async (): Promise<Supply[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return supplies;
};

const getSupplyOrders = async (supplyId: number): Promise<Order[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Find orders in this supply
  return orders.filter(order => order.supplyId === supplyId);
};

const createSupply = async (name: string, category: ProductCategory): Promise<Supply> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const newSupply: Supply = {
    id: nextSupplyId++,
    name,
    category,
    createdAt: new Date().toISOString(),
    ordersCount: 0,
    status: 'new'
  };
  
  supplies = [...supplies, newSupply];
  
  return newSupply;
};

const addOrderToSupply = async (supplyId: number, orderId: number): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Find the supply
  const supplyIndex = supplies.findIndex(s => s.id === supplyId);
  if (supplyIndex === -1) {
    throw new Error(`Supply with ID ${supplyId} not found`);
  }
  
  // Find the order
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  // Update order to mark it as in a supply
  orders[orderIndex] = {
    ...orders[orderIndex],
    inSupply: true,
    supplyId
  };
  
  // Update supply order count
  supplies[supplyIndex] = {
    ...supplies[supplyIndex],
    ordersCount: supplies[supplyIndex].ordersCount + 1
  };
};

const updateSupplyStatus = async (supplyId: number, status: Supply['status']): Promise<Supply> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Find the supply
  const supplyIndex = supplies.findIndex(s => s.id === supplyId);
  if (supplyIndex === -1) {
    throw new Error(`Supply with ID ${supplyId} not found`);
  }
  
  // Update supply status
  supplies[supplyIndex] = {
    ...supplies[supplyIndex],
    status
  };
  
  return supplies[supplyIndex];
};

const updateSupplyName = async (supplyId: number, name: string): Promise<Supply> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Find the supply
  const supplyIndex = supplies.findIndex(s => s.id === supplyId);
  if (supplyIndex === -1) {
    throw new Error(`Supply with ID ${supplyId} not found`);
  }
  
  // Update supply name
  supplies[supplyIndex] = {
    ...supplies[supplyIndex],
    name
  };
  
  return supplies[supplyIndex];
};

const deliverSupply = async (supplyId: number): Promise<Supply> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Find the supply
  const supplyIndex = supplies.findIndex(s => s.id === supplyId);
  if (supplyIndex === -1) {
    throw new Error(`Supply with ID ${supplyId} not found`);
  }

  // Check if supply has orders
  if (supplies[supplyIndex].ordersCount <= 0) {
    throw new Error('Нельзя передать в доставку пустую поставку');
  }
  
  // Update supply status to in_delivery
  supplies[supplyIndex] = {
    ...supplies[supplyIndex],
    status: 'in_delivery'
  };
  
  return supplies[supplyIndex];
};

const generateStickers = async (params: StickerParams): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Check if orders exist
  for (const orderId of params.orders) {
    const orderExists = orders.some(o => o.id === orderId);
    if (!orderExists) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
  }

  // In a real app, this would return a file URL or blob
  return `stickers_${params.type}_${new Date().getTime()}.${params.type === 'png' ? 'png' : 'pdf'}`;
};

const deleteSupply = async (supplyId: number): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find the supply
  const supplyIndex = supplies.findIndex(s => s.id === supplyId);
  if (supplyIndex === -1) {
    throw new Error(`Supply with ID ${supplyId} not found`);
  }
  
  // Check if supply has orders
  const hasOrders = orders.some(order => order.supplyId === supplyId);
  if (hasOrders) {
    throw new Error('Нельзя удалить поставку, в которой есть заказы');
  }
  
  // Remove the supply
  supplies = supplies.filter(s => s.id !== supplyId);
  
  // Release all orders from this supply (shouldn't be necessary due to the check above, but just in case)
  orders = orders.map(order => {
    if (order.supplyId === supplyId) {
      const { inSupply, supplyId, ...rest } = order;
      return rest;
    }
    return order;
  });
};

// Export all functions as a single API object
export const autoAssemblyApi = {
  getOrders,
  getSupplies,
  getSupplyOrders,
  createSupply,
  addOrderToSupply,
  updateSupplyStatus,
  updateSupplyName,
  deliverSupply,
  generateStickers,
  deleteSupply
};
