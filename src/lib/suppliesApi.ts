import axios from "axios";
import { toast } from "sonner";
import { addAuthHeaders } from "./securityUtils";
import { Supply, SupplyOrder, TrbxBox, ProductCategory } from "@/types/wb";

// API базовый URL для Marketplace API
const WB_MARKETPLACE_API_BASE_URL = "https://marketplace-api.wildberries.ru/api/v3";

export const SuppliesAPI = {
  // Получение списка поставок
  getSupplies: async (limit: number = 50, next: string = ""): Promise<{ supplies: Supply[], hasMore: boolean, next?: string }> => {
    try {
      console.log("Запрос поставок");
      
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (next) params.append("next", next);
      
      const response = await axios.get(`${WB_MARKETPLACE_API_BASE_URL}/supplies`, {
        headers: addAuthHeaders(),
        params
      });
      
      console.log("Supplies API raw response:", response.data);
      
      // Обработка ответа в соответствии с документацией API
      // Согласно документации, API возвращает массив объектов поставок
      if (Array.isArray(response.data)) {
        console.log("Detected array format for supplies data");
        const suppliesData = response.data.map((supply: any) => ({
          id: supply.id,
          supplyId: supply.id,
          name: supply.name || "",
          createdAt: supply.createdAt || "",
          done: supply.done || false,
          status: supply.status || "NEW",
          ordersCount: 0 // Будет обновлено при необходимости
        }));
        
        console.log(`Processed ${suppliesData.length} supplies from array format`);
        return {
          supplies: suppliesData,
          hasMore: false,
          next: undefined
        };
      } else if (response.data && response.data.orders) {
        // Альтернативный формат с полем orders
        console.log("Detected object with orders format");
        const suppliesData = Array.isArray(response.data.orders) ? response.data.orders : [];
        return {
          supplies: suppliesData.map((supply: any) => ({
            id: supply.id,
            supplyId: supply.id, 
            name: supply.name || "",
            createdAt: supply.createdAt || "",
            done: supply.done || false,
            status: supply.status || "NEW",
            ordersCount: 0
          })),
          hasMore: !!response.data.next,
          next: response.data.next
        };
      } else {
        // Если формат не соответствует ожидаемым, логируем и возвращаем пустой массив
        console.log("Unknown response format for supplies:", response.data);
        toast.error("Неизвестный формат ответа API поставок");
        return { supplies: [], hasMore: false };
      }
    } catch (error: any) {
      console.error("Error fetching supplies:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast.error(`Ошибка получения поставок: ${errorMessage}`);
      return { supplies: [], hasMore: false };
    }
  },
  
  // Создание новой поставки
  createSupply: async (name: string): Promise<number | null> => {
    try {
      const response = await axios.post(`${WB_MARKETPLACE_API_BASE_URL}/supplies`, {
        name
      }, {
        headers: addAuthHeaders()
      });
      
      console.log("Create supply response:", response.data);
      
      // В документации указано, что ответ содержит id поставки
      if (response.data && response.data.id) {
        toast.success(`Поставка "${name}" создана успешно`);
        return typeof response.data.id === 'number' ? 
          response.data.id : 
          parseInt(response.data.id, 10);
      } else {
        throw new Error("API не вернуло ID поставки");
      }
    } catch (error: any) {
      console.error("Error creating supply:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast.error(`Ошибка при создании поставки: ${errorMessage}`);
      return null;
    }
  },
  
  // Получение информации о поставке
  getSupplyDetails: async (supplyId: number): Promise<Supply | null> => {
    try {
      const response = await axios.get(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}`, {
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
          cargoType: response.data.cargoType
        };
      }
      
      return null;
    } catch (error: any) {
      console.error(`Error fetching supply ${supplyId} details:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast.error(`Ошибка при получении информации о поставке: ${errorMessage}`);
      return null;
    }
  },
  
  // Получение информации о заказах в поставке
  getSupplyOrders: async (supplyId: number): Promise<SupplyOrder[]> => {
    try {
      const response = await axios.get(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/orders`, {
        headers: addAuthHeaders()
      });
      
      console.log(`Supply ${supplyId} orders:`, response.data);
      
      // Согласно документации, API возвращает объект с массивом orders
      if (response.data && Array.isArray(response.data)) {
        // Прямой массив заказов
        return response.data.map((order: any) => ({
          id: order.id || 0,
          supplierArticle: order.article || order.supplierArticle || "",
          nmId: order.nmId || 0,
          chrtId: order.chrtId || "",
          barcode: order.skus?.[0] || "",
          quantity: 1,
          rid: order.rid || "",
          price: order.price || 0,
          salePrice: order.price || 0,
          convertedPrice: order.convertedPrice || 0,
          convertedSalePrice: order.convertedPrice || 0,
          isSupply: true,
          isReturn: false,
          cargoType: order.cargoType || 0
        }));
      } else if (response.data && response.data.orders && Array.isArray(response.data.orders)) {
        // Вложенный массив orders
        return response.data.orders.map((order: any) => ({
          id: order.id || 0,
          supplierArticle: order.article || order.supplierArticle || "",
          nmId: order.nmId || 0,
          chrtId: order.chrtId || "",
          barcode: order.skus?.[0] || "",
          quantity: 1,
          rid: order.rid || "",
          price: order.price || 0,
          salePrice: order.price || 0,
          convertedPrice: order.convertedPrice || 0,
          convertedSalePrice: order.convertedPrice || 0,
          isSupply: true,
          isReturn: false,
          cargoType: order.cargoType || 0
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error(`Error fetching orders for supply ${supplyId}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast.error(`Ошибка при загрузке заказов для поставки: ${errorMessage}`);
      return [];
    }
  },
  
  // Добавление заказа в поставку
  addOrderToSupply: async (supplyId: number, orderId: number): Promise<boolean> => {
    try {
      await axios.patch(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/orders/${orderId}`, {}, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Заказ ${orderId} добавлен в поставку ${supplyId}`);
      return true;
    } catch (error: any) {
      console.error(`Error adding order ${orderId} to supply ${supplyId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при добавлении заказа ${orderId} в поставку ${supplyId}`;
      toast.error(errorMessage);
      return false;
    }
  },
  
  // Удаление поставки
  deleteSupply: async (supplyId: number): Promise<boolean> => {
    try {
      await axios.delete(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}`, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Поставка ${supplyId} удалена`);
      return true;
    } catch (error: any) {
      console.error(`Error deleting supply ${supplyId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при удалении поставки ${supplyId}`;
      toast.error(errorMessage);
      return false;
    }
  },
  
  // Передача поставки в доставку
  deliverSupply: async (supplyId: number): Promise<boolean> => {
    try {
      await axios.patch(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/deliver`, {}, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Поставка ${supplyId} передана в доставку`);
      return true;
    } catch (error: any) {
      console.error(`Error delivering supply ${supplyId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при передаче поставки ${supplyId} в доставку`;
      toast.error(errorMessage);
      return false;
    }
  },
  
  // Получение QR-кода поставки
  getSupplyBarcode: async (supplyId: number): Promise<string | null> => {
    try {
      const response = await axios.get(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/barcode`, {
        headers: addAuthHeaders(),
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const downloadUrl = URL.createObjectURL(blob);
      
      toast.success(`QR-код для поставки ${supplyId} пол��чен`);
      return downloadUrl;
    } catch (error: any) {
      console.error(`Error getting barcode for supply ${supplyId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при получении QR-кода для поставки ${supplyId}`;
      toast.error(errorMessage);
      return null;
    }
  },
  
  // === Методы для работы с коробами === //
  
  // Получение списка коробов в поставке
  getTrbxBoxes: async (supplyId: number): Promise<TrbxBox[]> => {
    try {
      const response = await axios.get(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/trbx`, {
        headers: addAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error: any) {
      console.error(`Error fetching boxes for supply ${supplyId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при загрузке коробов для поставки ${supplyId}`;
      toast.error(errorMessage);
      return [];
    }
  },
  
  // Создание новых коробов
  createTrbxBoxes: async (supplyId: number, amount: number): Promise<boolean> => {
    try {
      const response = await axios.post(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/trbx`, {
        amount
      }, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Создано ${amount} ${amount === 1 ? 'короб' : amount < 5 ? 'короба' : 'коробов'}`);
      return true;
    } catch (error: any) {
      console.error(`Error creating boxes for supply ${supplyId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при создании коробов для поставки ${supplyId}`;
      toast.error(errorMessage);
      return false;
    }
  },
  
  // Добавление заказов в короб
  addOrdersToTrbxBox: async (supplyId: number, trbxId: string, orderIds: number[]): Promise<boolean> => {
    try {
      await axios.patch(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/trbx/${trbxId}`, {
        orderIds
      }, {
        headers: addAuthHeaders()
      });
      
      toast.success(`${orderIds.length} ${orderIds.length === 1 ? 'заказ добавлен' : 'заказов добавлено'} в короб ${trbxId}`);
      return true;
    } catch (error: any) {
      console.error(`Error adding orders to box ${trbxId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при добавлении заказов в короб ${trbxId}`;
      toast.error(errorMessage);
      return false;
    }
  },
  
  // Удаление короба
  deleteTrbxBox: async (supplyId: number, trbxId: string): Promise<boolean> => {
    try {
      await axios.delete(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/trbx/${trbxId}`, {
        headers: addAuthHeaders()
      });
      
      toast.success(`Короб ${trbxId} удален`);
      return true;
    } catch (error: any) {
      console.error(`Error deleting box ${trbxId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при удалении короба ${trbxId}`;
      toast.error(errorMessage);
      return false;
    }
  },
  
  // Получение стикеров для коробов
  getTrbxStickers: async (supplyId: number, trbxIds: string[]): Promise<string | null> => {
    try {
      const response = await axios.post(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/trbx/stickers`, {
        type: "png",
        trbxIds
      }, {
        headers: addAuthHeaders(),
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const downloadUrl = URL.createObjectURL(blob);
      
      toast.success(`Стикеры для ${trbxIds.length} коробов получены`);
      return downloadUrl;
    } catch (error: any) {
      console.error(`Error getting stickers for boxes:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при получении стикеров для коробов`;
      toast.error(errorMessage);
      return null;
    }
  }
};
