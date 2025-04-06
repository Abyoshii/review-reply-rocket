
import axios from "axios";
import { 
  AssemblyOrder, 
  CreateSupplyRequest, 
  CreateSupplyResponse,
  GetSuppliesResponse,
  GetOrdersResponse,
  AddOrderToSupplyResponse,
  ProductCategory,
  Supply
} from "@/types/wb";
import { addAuthHeaders } from "./securityUtils";
import { toast } from "sonner";

// API базовый URL для FBS API
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
      
      // Проверяем ответ API
      if (response.data && Array.isArray(response.data)) {
        // Преобразуем данные API в наш формат
        return response.data.map((order: any) => ({
          id: order.id,
          orderUid: order.orderUid || `WB-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: order.createdAt || new Date().toISOString(),
          ddate: order.ddate || new Date(Date.now() + 86400000 * 3).toISOString(),
          price: order.price || 0,
          salePrice: order.salePrice || 0,
          supplierArticle: order.supplierArticle || "",
          productName: order.productName || "Неизвестный товар",
          warehouseId: order.warehouseId || 1,
          cargoType: order.cargoType || 0,
          inSupply: order.inSupply || false,
          category: determineProductCategory(order.productName)
        }));
      }
      
      // Если API не вернуло данные, используем тестовые данные
      // В реальном приложении здесь будет обработка ошибки
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
  
  // Отмена заказа
  cancelOrder: async (orderId: number): Promise<boolean> => {
    try {
      await axios.patch(`${WB_API_BASE_URL}/orders/${orderId}/cancel`, {}, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Заказ ${orderId} отменён`);
      return true;
    } catch (error) {
      console.error(`Error canceling order ${orderId}:`, error);
      toast.error(`Ошибка при отмене заказа ${orderId}`);
      return false;
    }
  },
  
  // Печать стикеров для заказов
  printStickers: async (orderIds: number[]): Promise<string | null> => {
    try {
      const response = await axios.post(`${WB_API_BASE_URL}/orders/stickers`, {
        orderIds,
        type: "png",  // или pdf
        width: 58,    // ширина в мм
        height: 40    // высота в мм
      }, {
        headers: addAuthHeaders(),
        responseType: 'blob'
      });
      
      // Создаем URL для скачивания
      const blob = new Blob([response.data], { type: 'image/png' });
      const downloadUrl = URL.createObjectURL(blob);
      
      toast.success(`Стикеры для ${orderIds.length} заказов готовы`);
      return downloadUrl;
    } catch (error) {
      console.error("Error generating stickers:", error);
      toast.error("Ошибка при создании стикеров");
      return null;
    }
  },
  
  // Создание новой поставки
  createSupply: async (name: string): Promise<number | null> => {
    try {
      const response = await axios.post<CreateSupplyResponse>(`${WB_API_BASE_URL}/supplies`, {
        name
      }, {
        headers: addAuthHeaders()
      });
      
      if (response.data && response.data.data && response.data.data.supplyId) {
        toast.success(`Поставка "${name}" создана`);
        return response.data.data.supplyId;
      } else {
        throw new Error("API не вернуло ID поставки");
      }
    } catch (error) {
      console.error("Error creating supply:", error);
      toast.error("Ошибка при создании поставки");
      return null;
    }
  },
  
  // Добавление заказа в поставку
  addOrderToSupply: async (supplyId: number, orderId: number): Promise<boolean> => {
    try {
      await axios.patch(`${WB_API_BASE_URL}/supplies/${supplyId}/orders/${orderId}`, {}, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Заказ ${orderId} добавлен в поставку ${supplyId}`);
      return true;
    } catch (error) {
      console.error(`Error adding order ${orderId} to supply ${supplyId}:`, error);
      toast.error(`Ошибка при добавлении заказа ${orderId} в поставку`);
      return false;
    }
  },
  
  // Получение списка поставок
  getSupplies: async (): Promise<Supply[]> => {
    try {
      const response = await axios.get<GetSuppliesResponse>(`${WB_API_BASE_URL}/supplies`, {
        headers: addAuthHeaders()
      });
      
      if (response.data && response.data.data && Array.isArray(response.data.data.supplies)) {
        return response.data.data.supplies;
      }
      
      // Если API не вернуло данные, возвращаем пустой массив
      return [];
    } catch (error) {
      console.error("Error fetching supplies:", error);
      toast.error("Ошибка при загрузке списка поставок");
      return [];
    }
  },
  
  // Получение информации о конкретной поставке
  getSupplyDetails: async (supplyId: number): Promise<Supply | null> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/supplies/${supplyId}`, {
        headers: addAuthHeaders()
      });
      
      if (response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching supply ${supplyId}:`, error);
      toast.error(`Ошибка при загрузке информации о поставке ${supplyId}`);
      return null;
    }
  },
  
  // Получение списка заказов в поставке
  getSupplyOrders: async (supplyId: number): Promise<AssemblyOrder[]> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/supplies/${supplyId}/orders`, {
        headers: addAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Преобразуем данные API в наш формат
        return response.data.map((order: any) => ({
          id: order.id,
          orderUid: order.orderUid,
          createdAt: order.createdAt,
          ddate: order.ddate,
          price: order.price,
          salePrice: order.salePrice,
          supplierArticle: order.supplierArticle,
          productName: order.productName,
          warehouseId: order.warehouseId,
          cargoType: order.cargoType,
          inSupply: true,
          category: determineProductCategory(order.productName)
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching orders for supply ${supplyId}:`, error);
      toast.error(`Ошибка при загрузке заказов для поставки ${supplyId}`);
      return [];
    }
  },
  
  // Удаление поставки
  deleteSupply: async (supplyId: number): Promise<boolean> => {
    try {
      await axios.delete(`${WB_API_BASE_URL}/supplies/${supplyId}`, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Поставка ${supplyId} удалена`);
      return true;
    } catch (error) {
      console.error(`Error deleting supply ${supplyId}:`, error);
      toast.error(`Ошибка при удалении поставки ${supplyId}`);
      return false;
    }
  },
  
  // Передача поставки в доставку
  deliverSupply: async (supplyId: number): Promise<boolean> => {
    try {
      await axios.patch(`${WB_API_BASE_URL}/supplies/${supplyId}/deliver`, {}, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Поставка ${supplyId} передана в доставку`);
      return true;
    } catch (error) {
      console.error(`Error delivering supply ${supplyId}:`, error);
      toast.error(`Ошибка при передаче поставки ${supplyId} в доставку`);
      return false;
    }
  },
  
  // Получение QR-кода поставки
  getSupplyBarcode: async (supplyId: number): Promise<string | null> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/supplies/${supplyId}/barcode`, {
        headers: addAuthHeaders(),
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const downloadUrl = URL.createObjectURL(blob);
      
      toast.success(`QR-код для поставки ${supplyId} готов`);
      return downloadUrl;
    } catch (error) {
      console.error(`Error getting barcode for supply ${supplyId}:`, error);
      toast.error(`Ошибка при получении QR-кода для поставки ${supplyId}`);
      return null;
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
