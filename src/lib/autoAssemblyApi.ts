import axios from "axios";
import { 
  AssemblyOrder, 
  CreateSupplyRequest, 
  CreateSupplyResponse,
  GetSuppliesResponse,
  GetOrdersResponse,
  AddOrderToSupplyResponse,
  ProductCategory,
  Supply,
  ProductCardResponse,
  ProductCardInfo
} from "@/types/wb";
import { addAuthHeaders } from "./securityUtils";
import { toast } from "sonner";
import { logObjectStructure } from "./imageUtils";

// Обновленный базовый URL для Marketplace API
const WB_API_BASE_URL = "https://marketplace-api.wildberries.ru/api/v3";
// URL для API карточек товаров
const WB_CARD_API_URL = "https://card.wb.ru/cards/detail";

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

// Функция для получения информации о товаре по nmId
export const getProductCardInfo = async (nmId: number): Promise<ProductCardInfo | null> => {
  try {
    const cardUrl = `${WB_CARD_API_URL}?appType=1&curr=rub&dest=12345&nm=${nmId}`;
    console.log(`🔍 Запрос данных карточки товара: ${cardUrl}`);
    
    const response = await axios.get<ProductCardResponse>(cardUrl);
    
    console.log(`Ответ API карточки товара для nmId=${nmId}:`, response.data);
    
    if (response.data && response.data.data && response.data.data.products && response.data.data.products.length > 0) {
      const product = response.data.data.products[0];
      
      // Формируем URL изображения согласно запросу
      // https://basket-01.wb.ru/vol{nmId // 100000}/part{nmId // 1000}/{nmId}/images/c246x328/1.jpg
      const vol = Math.floor(product.id / 100000);
      const part = Math.floor(product.id / 1000);
      const imageBaseUrl = `https://basket-01.wb.ru/vol${vol}/part${part}/${product.id}/images/c246x328/1.jpg`;
      
      console.log(`Сформирован URL изображения: ${imageBaseUrl}`);
      
      return {
        nmId: product.id,
        name: product.name,
        brand: product.brand || "",
        image: imageBaseUrl,
        category: product.subjectName || product.subject || ""
      };
    }
    
    console.log(`Не найдены данные товара для nmId=${nmId}`);
    return null;
  } catch (error) {
    console.error(`Ошибка при получении данных карточки товара для nmId=${nmId}:`, error);
    return null;
  }
};

// Функция для форматирования времени в человекочитаемый вид
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} ${getDaysText(days)}`;
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  if (hours > 0) return `${hours} ${getHoursText(hours)}`;
  if (minutes > 0) return `${minutes} ${getMinutesText(minutes)}`;
  
  return 'только что';
};

// Вспомогательные функции для склонения слов
const getDaysText = (days: number): string => {
  if (days >= 5 && days <= 20) return 'дней';
  const remainder = days % 10;
  if (remainder === 1) return 'день';
  if (remainder >= 2 && remainder <= 4) return 'дня';
  return 'дней';
};

const getHoursText = (hours: number): string => {
  if (hours >= 5 && hours <= 20) return 'часов';
  const remainder = hours % 10;
  if (remainder === 1) return 'час';
  if (remainder >= 2 && remainder <= 4) return 'часа';
  return 'часов';
};

const getMinutesText = (minutes: number): string => {
  if (minutes >= 5 && minutes <= 20) return 'минут';
  const remainder = minutes % 10;
  if (remainder === 1) return 'минута';
  if (remainder >= 2 && remainder <= 4) return 'минуты';
  return 'минут';
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
      logObjectStructure(response.data, "Полная структура ответа API заказов");
      
      // Проверяем ответ API с учетом новой структуры ответа
      if (response.data && Array.isArray(response.data.orders)) {
        const orders = response.data.orders.map((order: any) => ({
          id: order.id,
          orderUid: order.orderUid || `WB-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: order.createdAt || new Date().toISOString(),
          ddate: order.ddate || new Date(Date.now() + 86400000 * 3).toISOString(),
          price: order.price || 0,
          salePrice: order.salePrice || 0,
          supplierArticle: order.article || "",
          productName: "Загрузка...",
          warehouseId: order.warehouseId,
          cargoType: order.cargoType || 0,
          inSupply: order.inSupply || false,
          nmId: order.nmId || null
        }));
        
        // Получаем информацию о товарах для каждого заказа
        const ordersWithProductInfo = await Promise.all(
          orders.map(async (order: AssemblyOrder) => {
            if (order.nmId) {
              try {
                const productInfo = await getProductCardInfo(order.nmId);
                if (productInfo) {
                  return {
                    ...order,
                    productInfo,
                    productName: productInfo.name,
                    category: determineProductCategory(productInfo.name)
                  };
                }
              } catch (error) {
                console.error(`Error fetching product info for nmId=${order.nmId}:`, error);
              }
            }
            // Если не удалось получить информацию о товаре
            return {
              ...order,
              productName: order.supplierArticle ? `Товар ${order.supplierArticle}` : "Неизвестный товар",
              category: determineProductCategory(order.productName)
            };
          })
        );
        
        return ordersWithProductInfo;
      }
      
      // Если API не вернуло данные или вернуло в неожиданном формате, используем тестовыми данными
      console.log("API returned unexpected format, using mock data");
      
      const mockOrders: AssemblyOrder[] = [
        {
          id: 3194125865,
          orderUid: "WB-GI-1122334455",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 3).toISOString(),
          price: 38000,
          salePrice: 35300,
          supplierArticle: "UI-girodдез-1",
          productName: "Товар UI-girodдез-1",
          warehouseId: 1,
          cargoType: 1,
          inSupply: false,
          nmId: 320314850
        },
        {
          id: 3194123163,
          orderUid: "WB-GI-1122334456",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 2).toISOString(),
          price: 245000,
          salePrice: 230300,
          supplierArticle: "UI-AmberMystery",
          productName: "Товар UI-AmberMystery",
          warehouseId: 2,
          cargoType: 1,
          inSupply: false,
          nmId: 320314851
        }
      ];
      
      // Определяем категорию для каждого товара
      return mockOrders.map(order => ({
        ...order,
        category: determineProductCategory(order.productName)
      }));
    } catch (error) {
      console.error("Error fetching new orders:", error);
      logObjectStructure(error, "Детальная ошибка при получении заказов");
      toast.error("Ошибка при загрузке новых заказов");
      
      // В случае ошибки возвращаем тестовые данные
      const mockOrders: AssemblyOrder[] = [
        {
          id: 3194125865,
          orderUid: "WB-GI-1122334455",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 3).toISOString(),
          price: 38000,
          salePrice: 35300,
          supplierArticle: "UI-girodдез-1",
          productName: "Товар UI-girodдез-1",
          warehouseId: 1,
          cargoType: 1,
          inSupply: false,
          nmId: 320314850
        },
        {
          id: 3194123163,
          orderUid: "WB-GI-1122334456",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          ddate: new Date(Date.now() + 86400000 * 2).toISOString(),
          price: 245000,
          salePrice: 230300,
          supplierArticle: "UI-AmberMystery",
          productName: "Товар UI-AmberMystery",
          warehouseId: 2,
          cargoType: 1,
          inSupply: false,
          nmId: 320314851
        }
      ];
      
      return mockOrders.map(order => ({
        ...order,
        category: determineProductCategory(order.productName)
      }));
    }
  },
  
  // Отмена заказа
  cancelOrder: async (orderId: number): Promise<boolean> => {
    try {
      // Используем правильный URL для отмены заказа
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
        orders: orderIds, // Обновлено согласно документации API
        type: "png",
        width: 58,
        height: 40
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
      console.log("Запрос поставок с заголовками:", addAuthHeaders());
      
      const response = await axios.get<GetSuppliesResponse>(`${WB_API_BASE_URL}/supplies`, {
        headers: addAuthHeaders()
      });
      
      console.log("Supplies response:", response.data);
      logObjectStructure(response.data, "Полная структура ответа API поставок");
      
      if (response.data && response.data.data && Array.isArray(response.data.data.supplies)) {
        return response.data.data.supplies;
      }
      
      // В случае неожиданной структуры ответа возвращаем тестовые данные
      console.log("API returned unexpected supplies format, using mock data");
      
      return [
        {
          id: 1001,
          name: "Поставка: Парфюмерия – 04.04.2025",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          done: false,
          status: "new",
          supplyId: "WB-GI-10001",
          ordersCount: 5,
          category: ProductCategory.PERFUME
        },
        {
          id: 1002,
          name: "Поставка: Одежда – 04.04.2025",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          done: false,
          status: "new",
          supplyId: "WB-GI-10002",
          ordersCount: 8,
          category: ProductCategory.CLOTHING
        },
        {
          id: 1003,
          name: "Поставка: Мелочёвка – 03.04.2025",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          done: true,
          status: "in_delivery",
          supplyId: "WB-GI-10003",
          ordersCount: 12,
          category: ProductCategory.MISC
        }
      ];
    } catch (error) {
      console.error("Error fetching supplies:", error);
      logObjectStructure(error, "Детальная ошибка при получении поставок");
      toast.error("Ошибка при загрузке списка поставок");
      
      // В случае ошибки возвращаем тестовые данные
      return [
        {
          id: 1001,
          name: "Поставка: Парфюмерия – 04.04.2025",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          done: false,
          status: "new",
          supplyId: "WB-GI-10001",
          ordersCount: 5,
          category: ProductCategory.PERFUME
        },
        {
          id: 1002,
          name: "Поставка: Одежда – 04.04.2025",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          done: false,
          status: "new",
          supplyId: "WB-GI-10002",
          ordersCount: 8,
          category: ProductCategory.CLOTHING
        },
        {
          id: 1003,
          name: "Поставка: Мелочёвка – 03.04.2025",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          done: true,
          status: "in_delivery",
          supplyId: "WB-GI-10003",
          ordersCount: 12,
          category: ProductCategory.MISC
        }
      ];
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
      logObjectStructure(error, "Детальная ошибка при получении информации о поставке");
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
      logObjectStructure(error, "Дета��ьная ошибка при получении заказов для поставки");
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
      logObjectStructure(error, "Детальная ошибка при удалении поставки");
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
      logObjectStructure(error, "Детальная ошибка при передаче поставки в доставку");
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
      logObjectStructure(error, "Детальная ошибка при получении QR-кода для поставки");
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
      logObjectStructure(error, "Детальная ошибка при создании поставок по категориям");
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
