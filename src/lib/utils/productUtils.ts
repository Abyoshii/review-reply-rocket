
import axios from "axios";
import { ProductCardResponse, ProductCardInfo } from "@/types/wb";

const WB_CARD_API_URL = "https://card.wb.ru/cards/detail";

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
