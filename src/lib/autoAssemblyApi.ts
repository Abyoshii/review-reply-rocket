
import axios from "axios";
import { 
  AssemblyOrder, 
  CreateSupplyRequest, 
  CreateSupplyResponse,
  GetSuppliesResponse,
  GetOrdersResponse,
  AddOrderToSupplyResponse,
  ProductCategory
} from "@/types/wb";
import { addAuthHeaders } from "./securityUtils";
import { toast } from "sonner";

const WB_API_BASE_URL = "https://feedbacks-api.wildberries.ru/api/v3";

// Ключевые слова для определения категории товара
const PERFUME_KEYWORDS = [
  "духи", "туалетная вода", "парфюмерная вода", "аромат", 
  "eau de parfum", "eau de toilette", "edp", "edt", "парфюм"
];

const CLOTHING_KEYWORDS = [
  "куртка", "брюки", "спортивные", "платье", "футболка", "джинсы", 
  "шорты", "юбка", "бейсболка", "толстовка", "жилет", "рубашка", 
  "свитер", "пальто", "худи", "джемпер", "костюм", "кофта", "майка"
];

// Функция для определения категории товара по названию
export const determineProductCategory = (productName: string): ProductCategory => {
  if (!productName) return ProductCategory.MISC;
  
  const nameLower = productName.toLowerCase();
  
  // Проверяем по ключевым словам для парфюмерии
  if (PERFUME_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return ProductCategory.PERFUME;
  }
  
  // Проверяем по ключевым словам для одежды
  if (CLOTHING_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return ProductCategory.CLOTHING;
  }
  
  // По умолчанию - мелочёвка
  return ProductCategory.MISC;
};

// API для работы с автосборкой
export const AutoAssemblyAPI = {
  // Получение списка заказов для сборки
  getNewOrders: async (): Promise<AssemblyOrder[]> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/orders/new`, {
        headers: addAuthHeaders(),
      });
      
      console.log("New orders response:", response.data);
      
      // В реальном приложении здесь будут данные с API
      // Для демонстрации используем тестовые данные
      const mockOrders: AssemblyOrder[] = [
        {
          id: 5632423,
          orderUid: "WB-GI-1122334455",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 3).toISOString(),
          price: 1290.50,
          salePrice: 990.00,
          supplierArticle: "ABC123",
          productName: "Футболка белая с принтом",
          warehouseId: 1,
          cargoType: 0,
          inSupply: false
        },
        {
          id: 5632424,
          orderUid: "WB-GI-1122334456",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 2).toISOString(),
          price: 2490.00,
          salePrice: 1990.00,
          supplierArticle: "DEF456",
          productName: "Джинсы классические",
          warehouseId: 2,
          cargoType: 1,
          inSupply: false
        },
        {
          id: 5632425,
          orderUid: "WB-GI-1122334457",
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 4).toISOString(),
          price: 4990.00,
          salePrice: 3990.00,
          supplierArticle: "GHI789",
          productName: "Куртка демисезонная",
          warehouseId: 1,
          cargoType: 2,
          inSupply: false
        },
        {
          id: 5632426,
          orderUid: "WB-GI-1122334458",
          createdAt: new Date(Date.now() - 14400000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 2).toISOString(),
          price: 1590.00,
          salePrice: 1290.00,
          supplierArticle: "JKL012",
          productName: "Парфюмерная вода женская Fleur 50мл",
          warehouseId: 1,
          cargoType: 0,
          inSupply: false
        },
        {
          id: 5632427,
          orderUid: "WB-GI-1122334459",
          createdAt: new Date(Date.now() - 18000000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 3).toISOString(),
          price: 2990.00,
          salePrice: 2490.00,
          supplierArticle: "MNO345",
          productName: "Аромат для дома Vanilla",
          warehouseId: 2,
          cargoType: 0,
          inSupply: false
        },
        {
          id: 5632428,
          orderUid: "WB-GI-1122334460",
          createdAt: new Date(Date.now() - 21600000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 4).toISOString(),
          price: 890.00,
          salePrice: 790.00,
          supplierArticle: "PQR678",
          productName: "Чехол для смартфона",
          warehouseId: 1,
          cargoType: 0,
          inSupply: false
        }
      ];
      
      // Определяем категорию для каждого товара
      return mockOrders.map(order => ({
        ...order,
        category: determineProductCategory(order.productName)
      }));
    } catch (error) {
      console.error("Error fetching new orders:", error);
      toast.error("Ошибка при загрузке новых заказов");
      return [];
    }
  },
  
  // Создание новой поставки
  createSupply: async (name: string): Promise<number | null> => {
    try {
      console.log(`Creating supply with name: ${name}`);
      
      // В реальном приложении здесь будет API-запрос
      // Для демонстрации возвращаем случайный ID
      const supplyId = Math.floor(Math.random() * 1000000);
      
      return supplyId;
    } catch (error) {
      console.error("Error creating supply:", error);
      toast.error("Ошибка при создании поставки");
      return null;
    }
  },
  
  // Добавление заказа в поставку
  addOrderToSupply: async (supplyId: number, orderId: number): Promise<boolean> => {
    try {
      console.log(`Adding order ${orderId} to supply ${supplyId}`);
      
      // В реальном приложении здесь будет API-запрос
      // Для демонстрации просто возвращаем успех
      return true;
    } catch (error) {
      console.error(`Error adding order ${orderId} to supply ${supplyId}:`, error);
      return false;
    }
  },
  
  // Получение списка поставок
  getSupplies: async (): Promise<Supply[]> => {
    try {
      // В реальном приложении здесь будет API-запрос
      // Для демонстрации используем тестовые данные
      return [];
    } catch (error) {
      console.error("Error fetching supplies:", error);
      toast.error("Ошибка при загрузке списка поставок");
      return [];
    }
  },
  
  // Формирование поставок по категориям товаров
  createCategorizedSupplies: async (orders: AssemblyOrder[]): Promise<{
    success: boolean;
    perfumeCount: number;
    clothingCount: number;
    miscCount: number;
    perfumeSupplyId?: number;
    clothingSupplyId?: number;
    miscSupplyId?: number;
  }> => {
    // Группируем заказы по категориям
    const perfumeOrders = orders.filter(order => order.category === ProductCategory.PERFUME);
    const clothingOrders = orders.filter(order => order.category === ProductCategory.CLOTHING);
    const miscOrders = orders.filter(order => order.category === ProductCategory.MISC);
    
    const currentDate = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let perfumeSupplyId: number | undefined = undefined;
    let clothingSupplyId: number | undefined = undefined;
    let miscSupplyId: number | undefined = undefined;
    
    try {
      // Создаем поставку для парфюмерии, если есть товары
      if (perfumeOrders.length > 0) {
        perfumeSupplyId = await AutoAssemblyAPI.createSupply(`Поставка: Парфюмерия – ${currentDate}`);
        
        if (perfumeSupplyId) {
          // Добавляем товары в поставку
          for (const order of perfumeOrders) {
            await AutoAssemblyAPI.addOrderToSupply(perfumeSupplyId, order.id);
          }
        } else {
          throw new Error("Не удалось создать поставку для парфюмерии");
        }
      }
      
      // Создаем поставку для одежды, если есть товары
      if (clothingOrders.length > 0) {
        clothingSupplyId = await AutoAssemblyAPI.createSupply(`Поставка: Одежда – ${currentDate}`);
        
        if (clothingSupplyId) {
          // Добавляем товары в поставку
          for (const order of clothingOrders) {
            await AutoAssemblyAPI.addOrderToSupply(clothingSupplyId, order.id);
          }
        } else {
          throw new Error("Не удалось создать поставку для одежды");
        }
      }
      
      // Создаем поставку для мелочёвки, если есть товары
      if (miscOrders.length > 0) {
        miscSupplyId = await AutoAssemblyAPI.createSupply(`Поставка: Мелочёвка – ${currentDate}`);
        
        if (miscSupplyId) {
          // Добавляем товары в поставку
          for (const order of miscOrders) {
            await AutoAssemblyAPI.addOrderToSupply(miscSupplyId, order.id);
          }
        } else {
          throw new Error("Не удалось создать поставку для мелочёвки");
        }
      }
      
      return {
        success: true,
        perfumeCount: perfumeOrders.length,
        clothingCount: clothingOrders.length,
        miscCount: miscOrders.length,
        perfumeSupplyId,
        clothingSupplyId,
        miscSupplyId
      };
      
    } catch (error) {
      console.error("Error creating categorized supplies:", error);
      toast.error("Ошибка при создании поставок по категориям");
      
      return {
        success: false,
        perfumeCount: perfumeOrders.length,
        clothingCount: clothingOrders.length,
        miscCount: miscOrders.length
      };
    }
  }
};
