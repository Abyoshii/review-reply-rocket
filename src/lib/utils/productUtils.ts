
import axios from "axios";
import { ProductCardResponse, ProductCardInfo } from "@/types/wb";
import { determineCategoryBySubject } from "./categoryUtils";

// Новый API URL для получения информации о товаре
const WB_CARD_API_URL = "https://content-api.wildberries.ru/content/v2/get/cards/list";

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

    // Формируем тело запроса согласно новому API
    const requestBody = {
      settings: {
        cursor: {
          limit: 1
        },
        filter: {
          textSearch: String(nmId)
        }
      }
    };
    
    console.log(`🔍 Запрос данных карточки товара через POST API для nmId=${nmId}`);
    
    // Отправляем POST запрос на новый API
    const response = await axios.post(WB_CARD_API_URL, requestBody);
    
    // Выводим полный ответ API для анализа
    console.log(`Полный ответ API карточки товара для nmId=${nmId}:`, JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.cards && response.data.data.cards.length > 0) {
      const product = response.data.data.cards[0];
      
      // Получаем URL изображения из первой фотографии, если она есть
      let imageUrl = '';
      if (product.photos && product.photos.length > 0 && product.photos[0].big) {
        imageUrl = product.photos[0].big;
        console.log(`Получен URL изображения: ${imageUrl}`);
      }
      
      // Определяем категорию товара на основе subjectName
      const category = product.subjectName || "";
      
      const productInfo = {
        nmId: nmId,
        name: product.title || `Товар ${nmId}`,
        brand: product.brand || "",
        image: imageUrl,
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
