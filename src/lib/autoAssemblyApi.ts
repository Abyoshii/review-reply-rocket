
import axios from "axios";
import { AssemblyOrder, ProductCategory, Supply } from "@/types/wb";

// Define API functions
export const AutoAssemblyAPI = {
  getNewOrders: async (): Promise<AssemblyOrder[]> => {
    try {
      // Fake API call for now
      // In production, this would be a real API call
      // const response = await axios.get('/api/v3/orders/new');
      
      // For demo, generate random orders
      const orders = Array.from({ length: 20 }, (_, i) => {
        const name = productNames[Math.floor(Math.random() * productNames.length)];
        const category = determineProductCategory(name);
        
        return {
          id: 100000 + i,
          orderUid: `WB-${1000000 + i}`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          ddate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          productName: name,
          supplierArticle: `ART-${10000 + i}`,
          warehouseId: Math.random() > 0.5 ? 1 : 2,
          cargoType: Math.floor(Math.random() * 3),
          price: Math.round(Math.random() * 10000) / 100 + 500,
          salePrice: Math.round(Math.random() * 10000) / 100 + 100,
          category,
          inSupply: Math.random() > 0.8
        };
      });
      
      return orders;
    } catch (error) {
      console.error("Error fetching new orders:", error);
      throw error;
    }
  },
  
  getSupplies: async (): Promise<Supply[]> => {
    try {
      // Fake API call
      // In production, we'd use: const response = await axios.get('/api/v3/supplies');
      
      // Generate random supplies for demo
      const supplies = Array.from({ length: 5 }, (_, i) => {
        const type = i % 3;
        let category: ProductCategory;
        
        switch (type) {
          case 0:
            category = ProductCategory.PERFUME;
            break;
          case 1:
            category = ProductCategory.CLOTHING;
            break;
          default:
            category = ProductCategory.MISC;
        }
        
        return {
          id: 20000 + i,
          name: `Поставка: ${category} - ${new Date().toLocaleDateString('ru-RU')}`,
          category,
          createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
          ordersCount: Math.floor(Math.random() * 10) + 1,
          status: i === 0 ? 'in_delivery' : (i === 4 ? 'delivered' : 'new')
        };
      });
      
      return supplies;
    } catch (error) {
      console.error("Error fetching supplies:", error);
      throw error;
    }
  },
  
  createCategorizedSupplies: async (orders: AssemblyOrder[]) => {
    try {
      // In a real app, this would make actual API calls to create supplies
      // For demo purposes, we'll simulate this
      
      // Group orders by category
      const perfumeOrders = orders.filter(o => o.category === ProductCategory.PERFUME && !o.inSupply);
      const clothingOrders = orders.filter(o => o.category === ProductCategory.CLOTHING && !o.inSupply);
      const miscOrders = orders.filter(o => o.category === ProductCategory.MISC && !o.inSupply);
      
      // Create supply for each group that has orders
      const result = {
        success: true,
        perfumeCount: perfumeOrders.length,
        clothingCount: clothingOrders.length,
        miscCount: miscOrders.length,
        perfumeSupplyId: perfumeOrders.length > 0 ? 30001 : undefined,
        clothingSupplyId: clothingOrders.length > 0 ? 30002 : undefined,
        miscSupplyId: miscOrders.length > 0 ? 30003 : undefined
      };
      
      // Wait for "API call" to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return result;
    } catch (error) {
      console.error("Error creating categorized supplies:", error);
      throw error;
    }
  }
};

export const determineProductCategory = (productName: string): ProductCategory => {
  const nameLower = productName.toLowerCase();
  
  // Check for perfume keywords
  if (
    nameLower.includes("духи") || 
    nameLower.includes("туалетная вода") || 
    nameLower.includes("парфюмерная вода") || 
    nameLower.includes("аромат") || 
    nameLower.includes("eau de parfum") || 
    nameLower.includes("eau de toilette")
  ) {
    return ProductCategory.PERFUME;
  }
  
  // Check for clothing keywords
  if (
    nameLower.includes("куртка") || 
    nameLower.includes("брюки") || 
    nameLower.includes("спортивные") || 
    nameLower.includes("платье") || 
    nameLower.includes("футболка") || 
    nameLower.includes("джинсы") || 
    nameLower.includes("шорты") || 
    nameLower.includes("юбка") || 
    nameLower.includes("бейсболка") || 
    nameLower.includes("толстовка") || 
    nameLower.includes("жилет")
  ) {
    return ProductCategory.CLOTHING;
  }
  
  // Default to miscellaneous
  return ProductCategory.MISC;
};

// Sample product names for demo
const productNames = [
  "Мужская футболка с коротким рукавом",
  "Духи женские 50мл Chanel №5",
  "Беспроводные наушники TWS Pro",
  "Джинсы зауженные синие",
  "Парфюмерная вода Blue De Chanel 100ml",
  "Смартфон Samsung Galaxy S21",
  "Кроссовки Nike Air Max",
  "Eau De Toilette Dior Sauvage 100ml",
  "Зарядное устройство Type-C",
  "Куртка зимняя с капюшоном",
  "Аромат Le Male Jean Paul Gaultier",
  "Фитнес браслет Mi Band 6",
  "Толстовка с капюшоном черная",
  "Платье коктейльное",
  "Туалетная вода Hugo Boss",
  "Чехол для iPhone 13 Pro",
  "Спортивные брюки Adidas",
  "Бейсболка New Era",
  "Аромат Versace Eros 100ml",
  "Наручные часы Casio"
];
