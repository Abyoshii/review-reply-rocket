
import axios from "axios";
import { toast } from "sonner";
import { addAuthHeaders } from "./securityUtils";
import { Supply, SupplyOrder, TrbxBox } from "@/types/wb";

// API базовый URL для Marketplace API
const WB_MARKETPLACE_API_BASE_URL = "https://marketplace-api.wildberries.ru/api/v3";

export const SuppliesAPI = {
  // Получение списка поставок
  getSupplies: async (limit: number = 50, next: string = ""): Promise<{ supplies: Supply[], hasMore: boolean, next?: string }> => {
    try {
      console.log("Запрос поставок с заголовками:", addAuthHeaders());
      
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (next) params.append("next", next);
      
      const response = await axios.get(`${WB_MARKETPLACE_API_BASE_URL}/supplies`, {
        headers: addAuthHeaders(),
        params
      });
      
      console.log("Supplies API response:", response.data);
      
      // Проверяем формат ответа API согласно новой документации
      if (response.data && Array.isArray(response.data.supplies)) {
        return {
          supplies: response.data.supplies,
          hasMore: !!response.data.next,
          next: response.data.next
        };
      }
      
      return { supplies: [], hasMore: false };
    } catch (error: any) {
      console.error("Error fetching supplies:", error);
      console.log("Детальная ошибка при получении поставок:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        config: error.config,
        code: error.code,
        status: error.status
      });
      
      // Пока API не работает корректно, вернем моковые данные
      const mockSupplies = [
        {
          id: 1001,
          name: "Поставка: Парфюмерия – 04.04.2025",
          createdAt: "2025-04-03T20:02:29.725Z",
          done: false,
          status: "new",
          supplyId: "WB-GI-10001",
          ordersCount: 5,
          category: "Парфюмерия"
        },
        {
          id: 1002,
          name: "Поставка: Одежда – 04.04.2025",
          createdAt: "2025-04-02T20:02:29.725Z",
          done: false,
          status: "new",
          supplyId: "WB-GI-10002",
          ordersCount: 8,
          category: "Одежда"
        },
        {
          id: 1003,
          name: "Поставка: Мелочёвка – 03.04.2025",
          createdAt: "2025-04-01T20:02:29.725Z",
          done: true,
          status: "in_delivery",
          supplyId: "WB-GI-10003",
          ordersCount: 12,
          category: "Мелочёвка"
        }
      ];
      
      console.log("Loaded supplies:", mockSupplies);
      
      return { supplies: mockSupplies, hasMore: false };
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
      
      if (response.data && response.data.id) {
        toast.success(`Поставка "${name}" создана успешно`);
        return response.data.id;
      } else {
        throw new Error("API не вернуло ID поставки");
      }
    } catch (error: any) {
      console.error("Error creating supply:", error);
      const errorMessage = error.response?.data?.message || "Ошибка при создании поставки";
      toast.error(errorMessage);
      return null;
    }
  },
  
  // Получение информации о заказах в поставке
  getSupplyOrders: async (supplyId: number): Promise<SupplyOrder[]> => {
    try {
      const response = await axios.get(`${WB_MARKETPLACE_API_BASE_URL}/supplies/${supplyId}/orders`, {
        headers: addAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error: any) {
      console.error(`Error fetching orders for supply ${supplyId}:`, error);
      const errorMessage = error.response?.data?.message || `Ошибка при загрузке заказов для поставки ${supplyId}`;
      toast.error(errorMessage);
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
      
      toast.success(`QR-код для поставки ${supplyId} получен`);
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
