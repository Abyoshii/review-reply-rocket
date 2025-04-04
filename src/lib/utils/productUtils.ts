
import axios from "axios";
import { ProductCardResponse, ProductCardInfo } from "@/types/wb";
import { determineCategoryBySubject } from "./categoryUtils";

const WB_CARD_API_URL = "https://card.wb.ru/cards/detail";

// Простой кэш для хранения информации о товарах
const productInfoCache: Record<number, ProductCardInfo> = {};

// Функция для получения информации о товаре по nmId
export const getProductCardInfo = async (nmId: number): Promise<ProductCardInfo | null> => {
  try {
    // Проверяем, есть ли товар в кэше
    if (productInfoCache[nmId]) {
      console.log(`Информация о товаре nmId=${nmId} взята из кэша`);
      return productInfoCache[nmId];
    }

    const cardUrl = `${WB_CARD_API_URL}?appType=1&curr=rub&dest=12345&nm=${nmId}`;
    console.log(`🔍 Запрос данных карточки товара: ${cardUrl}`);
    
    const response = await axios.get<ProductCardResponse>(cardUrl);
    
    // Выводим полный ответ API для анализа
    console.log(`Полный ответ API карточки товара для nmId=${nmId}:`, JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.products && response.data.data.products.length > 0) {
      const product = response.data.data.products[0];
      
      // Формируем URL изображения
      const vol = Math.floor(product.id / 100000);
      const part = Math.floor(product.id / 1000);
      const imageBaseUrl = `https://basket-01.wb.ru/vol${vol}/part${part}/${product.id}/images/c246x328/1.jpg`;
      
      console.log(`Сформирован URL изображения: ${imageBaseUrl}`);
      
      // Определяем категорию товара на основе subjectName
      const category = product.subjectName || product.subject || "";
      
      const productInfo = {
        nmId: product.id,
        name: product.name,
        brand: product.brand || "",
        image: imageBaseUrl,
        category: category,
        productCategory: determineCategoryBySubject(category)
      };
      
      // Сохраняем в кэш
      productInfoCache[nmId] = productInfo;
      
      return productInfo;
    }
    
    console.log(`Не найдены данные товара для nmId=${nmId}`);
    return null;
  } catch (error) {
    console.error(`Ошибка при получении данных карточки товара для nmId=${nmId}:`, error);
    return null;
  }
};

// Функция для очистки кэша при необходимости
export const clearProductInfoCache = () => {
  Object.keys(productInfoCache).forEach(key => {
    delete productInfoCache[Number(key)];
  });
  console.log("Кэш информации о товарах очищен");
};
