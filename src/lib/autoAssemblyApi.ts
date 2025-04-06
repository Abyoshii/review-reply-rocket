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
import { getProductCardInfo } from "./utils/productUtils";

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
                    category: productInfo.productCategory || determineProductCategory(productInfo.name)
                  };
                }
              } catch (error) {
                console.error(`Error fetching product info for nmId=${order.nmId}:`, error);
              }
            }
            return {
              ...order,
              productName: order.supplierArticle ? `Товар ${order.supplierArticle}` : "Неизвестный товар",
              category: determineProductCategory(order.productName)
            };
          })
        );
        
        return ordersWithProductInfo;
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
      
      const response = await axios.post<CreateSupplyResponse>(`${WB_API_BASE_URL}/supplies`, {
        name
      }, {
        headers: addAuthHeaders()
      });
      
      console.log("Ответ API при создании поставки:", response.data);
      
      if (response.data && response.data.data && response.data.data.supplyId) {
        toast.success(`Поставка "${name}" создана`);
        return response.data.data.supplyId;
      } else {
        throw new Error("API не вернуло ID поставки");
      }
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
      
      const response = await axios.get<GetSuppliesResponse>(`${WB_API_BASE_URL}/supplies`, {
        headers: addAuthHeaders()
      });
      
      console.log("Supplies response:", response.data);
      logObjectStructure(response.data, "Полная структура ответа API поставок");
      
      if (response.data && response.data.data && Array.isArray(response.data.data.supplies)) {
        return response.data.data.supplies;
      }
      
      toast.error("API вернуло неожиданный формат данных для поставок");
      return [];
    } catch (error) {
      console.error("Error fetching supplies:", error);
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
  
  getSupplyOrders: async (supplyId: number): Promise<AssemblyOrder[]> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/supplies/${supplyId}/orders`, {
        headers: addAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data)) {
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
