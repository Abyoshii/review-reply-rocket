
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
} from "@/types/wb";
import { addAuthHeaders } from "./securityUtils";
import { toast } from "sonner";
import { logObjectStructure } from "./imageUtils";
import { determineCategory, determineProductCategory } from "./utils/categoryUtils";
import { formatTimeAgo } from "./utils/formatUtils";
import { getProductCardInfo, getBulkProductInfo } from "./utils/productUtils";

const WB_API_BASE_URL = "https://marketplace-api.wildberries.ru/api/v3";

export const AutoAssemblyAPI = {
  getNewOrders: async (): Promise<AssemblyOrder[]> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/orders/new`, {
        headers: addAuthHeaders(),
      });
      
      console.log("New orders response:", response.data);
      logObjectStructure(response.data, "Полная структура ответа API заказов");
      
      if (response.data && Array.isArray(response.data.orders)) {
        // Базовое преобразование заказов без информации о товарах
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
        
        // Выделяем все nmId из заказов для массовой загрузки
        const nmIds = orders.filter(order => order.nmId).map(order => order.nmId as number);
        
        console.log(`Извлечено ${nmIds.length} nmId товаров для массовой загрузки`);
        
        // Получаем информацию о всех товарах сразу
        if (nmIds.length > 0) {
          try {
            console.time("BulkProductInfoLoad");
            const productInfoMap = await getBulkProductInfo(nmIds);
            console.timeEnd("BulkProductInfoLoad");
            console.log(`Загружена информация о ${Object.keys(productInfoMap).length} товарах`);
            
            // Дополняем заказы информацией о товарах
            const ordersWithProductInfo = orders.map(order => {
              if (order.nmId && productInfoMap[order.nmId]) {
                const productInfo = productInfoMap[order.nmId];
                return {
                  ...order,
                  productInfo,
                  productName: productInfo.name,
                  category: productInfo.productCategory || determineProductCategory(productInfo.name)
                };
              }
              // Для товаров, которые не удалось загрузить, оставляем базовую информацию
              return {
                ...order,
                productName: order.supplierArticle ? `Товар ${order.supplierArticle}` : "Неизвестный товар",
                category: determineProductCategory(order.productName)
              };
            });
            
            return ordersWithProductInfo;
          } catch (error) {
            console.error("Ошибка при массовой загрузке информации о товарах:", error);
            // В случае ошибки возвращаем заказы с базовой информацией
            return orders.map(order => ({
              ...order,
              productName: order.supplierArticle ? `Товар ${order.supplierArticle}` : "Неизвестный товар",
              category: determineProductCategory(order.productName)
            }));
          }
        } else {
          // Если нет nmId, возвращаем заказы с базовой информацией
          return orders.map(order => ({
            ...order,
            productName: order.supplierArticle ? `Товар ${order.supplierArticle}` : "Неизвестный товар",
            category: determineProductCategory(order.productName)
          }));
        }
      }
      
      toast.error("API вернуло неожиданный формат данных для заказов");
      return [];
    } catch (error) {
      console.error("Error fetching new orders:", error);
      logObjectStructure(error, "Детальная ошибка при получении заказов");
      toast.error("Ошибка при загрузке новых заказов");
      return [];
    }
  },
  
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
  
  printStickers: async (orderIds: number[]): Promise<string | null> => {
    try {
      const response = await axios.post(`${WB_API_BASE_URL}/orders/stickers`, {
        orders: orderIds,
        type: "png",
        width: 58,
        height: 40
      }, {
        headers: addAuthHeaders(),
        responseType: 'blob'
      });
      
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
  
  createSupply: async (name: string): Promise<number | null> => {
    try {
      console.log(`Создание поставки с именем "${name}" с заголовками:`, addAuthHeaders());
      
      const response = await axios.post(`${WB_API_BASE_URL}/supplies`, {
        name
      }, {
        headers: addAuthHeaders()
      });
      
      console.log("Ответ API при создании поставки:", response.data);
      
      if (response.data) {
        const supplyId = response.data.id || 
                        response.data.data?.supplyId || 
                        response.data.data?.id;
        
        if (supplyId) {
          toast.success(`Поставка "${name}" со��дана`);
          return typeof supplyId === 'number' ? supplyId : parseInt(supplyId);
        }
      }
      
      throw new Error("API не вернуло ID поставки");
    } catch (error) {
      console.error("Error creating supply:", error);
      logObjectStructure(error, "Детальная ошибка при создании поставки");
      toast.error("Ошибка при создании поставки");
      return null;
    }
  },
  
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
  
  getSupplies: async (): Promise<Supply[]> => {
    try {
      console.log("Запрос поставок с заголовками:", addAuthHeaders());
      
      const response = await axios.get(`${WB_API_BASE_URL}/supplies`, {
        headers: addAuthHeaders(),
        params: {
          limit: 100 // Обязательный параметр согласно документации
        }
      });
      
      console.log("Supplies response:", response.data);
      logObjectStructure(response.data, "Полная структура ответа API поставок");
      
      // Обработка ответа в зависимости от его формата
      if (Array.isArray(response.data)) {
        // Если API возвращает прямой массив поставок
        console.log("Обрабатываем массив поставок");
        return response.data.map((supply: any) => ({
          id: supply.id,
          supplyId: supply.id,
          name: supply.name || "",
          createdAt: supply.createdAt || "",
          done: supply.done || false,
          scanDt: supply.scanDt,
          closedAt: supply.closedAt,
          status: supply.status || "NEW",
          ordersCount: supply.ordersCount || 0,
          cargoType: supply.cargoType || 0
        }));
      } else if (response.data && typeof response.data === 'object') {
        // Проверяем различные структуры вложенности в ответе
        console.log("Обрабатываем объект с поставками");
        
        if (response.data.data && Array.isArray(response.data.data.supplies)) {
          console.log("Нашли массив поставок в response.data.data.supplies");
          return response.data.data.supplies.map((supply: any) => ({
            id: supply.id,
            supplyId: supply.id,
            name: supply.name || "",
            createdAt: supply.createdAt || "",
            done: supply.done || false,
            scanDt: supply.scanDt,
            closedAt: supply.closedAt,
            status: supply.status || "NEW",
            ordersCount: supply.ordersCount || 0,
            cargoType: supply.cargoType || 0
          }));
        } else if (response.data.supplies && Array.isArray(response.data.supplies)) {
          console.log("Нашли массив поставок в response.data.supplies");
          return response.data.supplies.map((supply: any) => ({
            id: supply.id,
            supplyId: supply.id,
            name: supply.name || "",
            createdAt: supply.createdAt || "",
            done: supply.done || false,
            scanDt: supply.scanDt,
            closedAt: supply.closedAt,
            status: supply.status || "NEW",
            ordersCount: supply.ordersCount || 0,
            cargoType: supply.cargoType || 0
          }));
        } else if (response.data.orders && Array.isArray(response.data.orders)) {
          console.log("Нашли массив поставок в response.data.orders");
          return response.data.orders.map((supply: any) => ({
            id: supply.id,
            supplyId: supply.id,
            name: supply.name || "",
            createdAt: supply.createdAt || "",
            done: supply.done || false,
            scanDt: supply.scanDt,
            closedAt: supply.closedAt,
            status: supply.status || "NEW",
            ordersCount: 0,
            cargoType: supply.cargoType || 0
          }));
        }
      }
      
      // Если не смогли распознать формат, возвращаем пустой массив
      console.warn("Неизвестный формат ответа API поставок:", response.data);
      toast.error("API вернуло неожиданный формат данных для поставок");
      return [];
    } catch (error) {
      console.error("Error fetching supplies:", error);
      console.log("Error response:", error?.response?.data);
      console.log("Error request config:", error?.config);
      logObjectStructure(error, "Детальная ошибка при получении поставок");
      toast.error("Ошибка при загрузке списка поставок");
      return [];
    }
  },
  
  getSupplyDetails: async (supplyId: number): Promise<Supply | null> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/supplies/${supplyId}`, {
        headers: addAuthHeaders()
      });
      
      console.log(`Supply ${supplyId} details:`, response.data);
      
      if (response.data) {
        return {
          id: response.data.id,
          supplyId: response.data.id,
          name: response.data.name || "",
          createdAt: response.data.createdAt || "",
          scanDt: response.data.scanDt,
          closedAt: response.data.closedAt,
          done: response.data.done || false,
          status: response.data.status || "NEW",
          ordersCount: 0,
          cargoType: response.data.cargoType || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching supply ${supplyId}:`, error);
      logObjectStructure(error, "Детальная ошибка при получении информации о поставке");
      toast.error(`Ошибка при загрузке информации о поставке ${supplyId}`);
      return null;
    }
  },
  
  getSupplyOrders: async (supplyId: number): Promise<AssemblyOrder[]> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/supplies/${supplyId}/orders`, {
        headers: addAuthHeaders()
      });
      
      console.log(`Supply ${supplyId} orders response:`, response.data);
      
      // Обрабатываем данные в зависимости от формата ответа
      let orders: any[] = [];
      
      if (Array.isArray(response.data)) {
        // Если API вернул прямой массив заказов
        orders = response.data;
      } else if (response.data && response.data.orders && Array.isArray(response.data.orders)) {
        // Если API вернул объект с массивом заказов
        orders = response.data.orders;
      } else {
        console.warn(`Неожиданный формат ответа для заказов поставки ${supplyId}:`, response.data);
        return [];
      }
      
      // Преобразуем данные в формат AssemblyOrder
      return orders.map((order: any) => ({
        id: order.id,
        orderUid: order.orderUid || order.rid || `Order-${order.id}`,
        createdAt: order.createdAt || new Date().toISOString(),
        ddate: order.ddate || order.createdAt || new Date().toISOString(),
        price: order.price || 0,
        salePrice: order.price || 0,
        supplierArticle: order.article || order.supplierArticle || "",
        productName: order.productName || `Товар ${order.article || order.id}`,
        warehouseId: order.warehouseId || 0,
        cargoType: order.cargoType || 0,
        inSupply: true,
        category: determineProductCategory(order.productName || "")
      }));
    } catch (error) {
      console.error(`Error fetching orders for supply ${supplyId}:`, error);
      logObjectStructure(error, "Детальная ошибка при получении заказов для поставки");
      toast.error(`Ошибка при загрузке заказов для поставки ${supplyId}`);
      return [];
    }
  },
  
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
  
  createCategorizedSupplies: async (orders: AssemblyOrder[]): Promise<{
    success: boolean;
    perfumeCount: number;
    clothingCount: number;
    miscCount: number;
    perfumeSupplyId?: number;
    clothingSupplyId?: number;
    miscSupplyId?: number;
  }> => {
    const perfumeOrders = orders.filter(order => order.category === ProductCategory.PERFUME);
    const clothingOrders = orders.filter(order => order.category === ProductCategory.CLOTHING);
    const miscOrders = orders.filter(order => order.category === ProductCategory.MISC);
    
    const currentDate = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let perfumeSupplyId: number | undefined = undefined;
    let clothingSupplyId: number | undefined = undefined;
    let miscSupplyId: number | undefined = undefined;
    
    try {
      if (perfumeOrders.length > 0) {
        perfumeSupplyId = await AutoAssemblyAPI.createSupply(`Поставка: Парфюмерия – ${currentDate}`);
        
        if (perfumeSupplyId) {
          for (const order of perfumeOrders) {
            await AutoAssemblyAPI.addOrderToSupply(perfumeSupplyId, order.id);
          }
        } else {
          throw new Error("Не удалось создать поставку для парфюмерии");
        }
      }
      
      if (clothingOrders.length > 0) {
        clothingSupplyId = await AutoAssemblyAPI.createSupply(`Поставка: Одежда – ${currentDate}`);
        
        if (clothingSupplyId) {
          for (const order of clothingOrders) {
            await AutoAssemblyAPI.addOrderToSupply(clothingSupplyId, order.id);
          }
        } else {
          throw new Error("Не удалось создать поставку для одежды");
        }
      }
      
      if (miscOrders.length > 0) {
        miscSupplyId = await AutoAssemblyAPI.createSupply(`Поставка: Мелочёвка – ${currentDate}`);
        
        if (miscSupplyId) {
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

export { determineProductCategory, formatTimeAgo };
