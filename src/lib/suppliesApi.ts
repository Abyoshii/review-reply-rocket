
import axios from "axios";
import { toast } from "sonner";
import { addAuthHeaders } from "./securityUtils";
import { Supply, SupplyOrder } from "@/types/wb";

// API базовый URL для Marketplace API
const WB_MARKETPLACE_API_BASE_URL = "https://marketplace-api.wildberries.ru/api/v3";

export const SuppliesAPI = {
  // Получение списка поставок
  getSupplies: async (): Promise<{ supplies: Supply[], hasMore: boolean, next?: string }> => {
    try {
      console.log("Запрос поставок");
      
      const headers = addAuthHeaders();
      console.log("Используемые заголовки:", headers);
      
      const response = await axios.get(`${WB_MARKETPLACE_API_BASE_URL}/supplies`, {
        headers
        // Удален параметр limit, так как API не поддерживает этот параметр
      });
      
      console.log("Supplies API raw response:", response.data);
      
      // Обработка ответа в соответствии с документацией API
      if (Array.isArray(response.data)) {
        console.log("Detected array format for supplies data");
        const suppliesData = response.data.map((supply: any) => ({
          id: supply.id,
          supplyId: supply.id,
          name: supply.name || "",
          createdAt: supply.createdAt || "",
          done: supply.done || false,
          scanDt: supply.scanDt,
          closedAt: supply.closedAt,
          status: supply.isDraft ? "draft" : "sent",
          ordersCount: 0, // Будет обновлено при необходимости
          cargoType: supply.cargoType || 0
        }));
        
        console.log(`Processed ${suppliesData.length} supplies from array format`);
        return {
          supplies: suppliesData,
          hasMore: false,
          next: undefined
        };
      } else if (response.data && response.data.supplies) {
        // Формат с полем supplies
        console.log("Detected object with supplies format");
        const suppliesData = Array.isArray(response.data.supplies) ? response.data.supplies : [];
        return {
          supplies: suppliesData.map((supply: any) => ({
            id: supply.id,
            supplyId: supply.id, 
            name: supply.name || "",
            createdAt: supply.createdAt || "",
            done: !supply.isDraft,
            scanDt: supply.scanDt,
            closedAt: supply.closedAt,
            status: supply.isDraft ? "draft" : "sent",
            ordersCount: 0,
            cargoType: supply.cargoType || 0
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
      console.log("Error response data:", error.response?.data);
      console.log("Error request config:", {
        url: error.config?.url,
        headers: error.config?.headers,
        params: error.config?.params
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast.error(`Ошибка получения поставок: ${errorMessage}`);
      return { supplies: [], hasMore: false };
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
          done: !response.data.isDraft,
          status: response.data.isDraft ? "draft" : "sent",
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
      
      // Согласно документации, API возвращает массив orderId
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
  
  // Создание поставки
  createSupply: async (name: string): Promise<number | null> => {
    try {
      const response = await axios.post(`${WB_MARKETPLACE_API_BASE_URL}/supplies`, 
        { name }, 
        { headers: addAuthHeaders() }
      );
      
      if (response.data && response.data.id) {
        toast.success(`Поставка "${name}" создана`);
        return response.data.id;
      }
      
      throw new Error("API не вернуло ID поставки");
    } catch (error: any) {
      console.error("Error creating supply:", error);
      const errorMessage = error.response?.data?.message || "Ошибка при создании поставки";
      toast.error(errorMessage);
      return null;
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
  }
};
