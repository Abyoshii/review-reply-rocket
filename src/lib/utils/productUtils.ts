
import axios from "axios";
import { ProductCardResponse, ProductCardInfo } from "@/types/wb";
import { determineCategoryBySubject } from "./categoryUtils";

// API URL для получения информации о товаре
const WB_CARD_API_URL = "https://content-api.wildberries.ru/content/v2/get/cards/list";

// Кэш для хранения информации о товарах
const productInfoCache: Record<number, ProductCardInfo> = {};

// Функция для получения информации о товаре по nmId без использования "заглушек"
export const getProductCardInfo = async (nmId: number): Promise<ProductCardInfo | null> => {
  try {
    // 1. Проверяем кэш
    if (productInfoCache[nmId]) {
      console.log(`Информация о товаре nmId=${nmId} взята из кэша`);
      return productInfoCache[nmId];
    }

    // 2. Формируем запрос к API
    const requestBody = {
      settings: {
        cursor: { limit: 1 },
        filter: {
          textSearch: String(nmId),
          withPhoto: -1
        }
      }
    };
    
    console.log(`🔍 Запрос данных карточки товара через POST API для nmId=${nmId}`);
    const response = await axios.post(WB_CARD_API_URL, requestBody);
    
    // 3. Проверяем наличие данных в ответе
    if (!response.data?.cards?.length) {
      console.warn(`Не найдена карточка товара для nmId=${nmId} в ответе API`);
      return null;
    }

    const product = response.data.cards[0];
    
    // 4. Проверяем обязательные поля
    if (!product.title) {
      console.warn(`У товара nmId=${nmId} отсутствует поле title (название)`);
      return null;
    }
    
    // 5. Проверяем наличие изображения
    let imageUrl = '';
    if (product.photos?.length && product.photos[0]?.big) {
      imageUrl = product.photos[0].big;
      console.log(`Получен URL изображения для nmId=${nmId}: ${imageUrl}`);
    } else {
      console.warn(`У товара nmId=${nmId} отсутствуют фотографии`);
      return null;
    }
    
    // 6. Проверяем категорию
    if (!product.subjectName) {
      console.warn(`У товара nmId=${nmId} отсутствует subjectName (категория)`);
      return null;
    }
    
    // 7. Формируем результат без использования заглушек
    const productInfo: ProductCardInfo = {
      nmId: nmId,
      name: product.title,
      brand: product.brand || "",
      image: imageUrl,
      category: product.subjectName,
      productCategory: determineCategoryBySubject(product.subjectName)
    };
    
    // 8. Сохраняем в кэш только корректные данные
    productInfoCache[nmId] = productInfo;
    
    return productInfo;
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
