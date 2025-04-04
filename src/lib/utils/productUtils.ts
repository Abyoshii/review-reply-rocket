
import axios from "axios";
import { ProductCardInfo, ProductCategory } from "@/types/wb";
import { determineCategoryBySubject } from "./categoryUtils";

// API URL для получения информации о товаре
const WB_CARD_API_URL = "https://content-api.wildberries.ru/content/v2/get/cards/list";

// Кэш для хранения информации о товарах
const productInfoCache: Record<number, ProductCardInfo> = {};

// Функция для получения информации о товаре по nmId
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
    
    // 3. Вывод полного ответа для отладки (только в разработке)
    console.log("Полный ответ API карточки товара:");
    console.log(JSON.stringify(response.data, null, 2));
    
    // 4. Проверяем наличие карточек в ответе
    const cards = response.data.cards;
    if (!cards || cards.length === 0) {
      console.warn(`[WARN] Не найдены данные товара для nmId=${nmId}`);
      return null;
    }
    
    const product = cards[0];
    
    // 5. Проверка обязательного поля "title"
    if (!product.title) {
      console.warn(`[WARN] У товара nmId=${nmId} отсутствует поле title (наименование).`);
      return null;
    }
    
    // 6. Проверка наличия фото и URL изображения
    if (!product.photos || !product.photos[0]?.big) {
      console.warn(`[WARN] У товара nmId=${nmId} отсутствуют фотографии или URL фотографии.`);
      return null;
    }
    
    // 7. Проверка обязательного поля "subjectName"
    if (!product.subjectName) {
      console.warn(`[WARN] У товара nmId=${nmId} отсутствует поле subjectName (категория).`);
      return null;
    }
    
    // 8. Формирование объекта с информацией о товаре
    const productInfo: ProductCardInfo = {
      nmId: nmId,
      name: product.title,
      brand: product.brand || "",
      image: product.photos[0].big,
      category: product.subjectName,
      productCategory: determineCategoryBySubject(product.subjectName)
    };
    
    // 9. Сохраняем корректную карточку в кэш
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
