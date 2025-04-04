
import axios from "axios";
import { ProductCardInfo, ProductCategory } from "@/types/wb";
import { determineCategoryBySubject } from "./categoryUtils";
import { toast } from "sonner";
import { getApiToken, addAuthHeaders } from "../securityUtils";

// API URL для получения информации о товаре
const WB_CARD_API_URL = "https://content-api.wildberries.ru/content/v2/get/cards/list";

// Кэш для хранения информации о товарах
const productInfoCache: Record<number, ProductCardInfo> = {};

// Функция для получения информации о товаре по nmId
export const getProductCardInfo = async (nmId: number): Promise<ProductCardInfo | null> => {
  try {
    // Начинаем отслеживание времени запроса для измерения производительности
    const startTime = performance.now();
    
    // 1. Проверяем кэш
    if (productInfoCache[nmId]) {
      console.log(`Информация о товаре nmId=${nmId} взята из кэша:`, productInfoCache[nmId]);
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
    
    // Выводим детали запроса
    console.log(`🔍 Запрос данных карточки товара через POST API для nmId=${nmId}:`);
    console.log(`URL: ${WB_CARD_API_URL}`);
    console.log(`Тело запроса:`, JSON.stringify(requestBody, null, 2));
    
    // Формируем заголовки запроса с токеном авторизации, передаем URL для проверки совместимости
    const headers = addAuthHeaders({}, WB_CARD_API_URL);
    
    // Выполняем запрос с заголовками авторизации
    const response = await axios.post(WB_CARD_API_URL, requestBody, { headers });
    
    // Вычисляем время выполнения запроса
    const requestTime = Math.round(performance.now() - startTime);
    console.log(`✓ Ответ получен за ${requestTime}мс для nmId=${nmId}`);
    
    // 3. Вывод полного ответа для отладки
    console.log(`📦 Полный ответ API карточки товара для nmId=${nmId}:`);
    console.log(JSON.stringify(response.data, null, 2));
    
    // 4. Проверяем наличие карточек в ответе
    const cards = response.data.cards;
    if (!cards || cards.length === 0) {
      console.warn(`⚠️ [WARN] Не найдены данные товара для nmId=${nmId}. API вернул пустой результат.`);
      // Добавим уведомление пользователю о проблеме
      toast.warning(`Товар ${nmId} не найден в каталоге WB`, {
        description: "Проверьте правильность номенклатуры или доступность API"
      });
      return null;
    }
    
    const product = cards[0];
    console.log(`📋 Найдена карточка товара для nmId=${nmId}:`, product.title || "Без названия");
    
    // 5. Проверка обязательного поля "title"
    if (!product.title) {
      console.warn(`⚠️ [WARN] У товара nmId=${nmId} отсутствует поле title (наименование).`);
      toast.warning(`Ошибка данных товара ${nmId}`, {
        description: "Отсутствует название товара"
      });
      return null;
    }
    
    // 6. Проверка наличия фото и URL изображения
    const hasImages = product.photos && product.photos.length > 0 && product.photos[0].big;
    if (!hasImages) {
      console.warn(`⚠️ [WARN] У товара nmId=${nmId} отсутствуют фотографии или URL фотографии.`);
      toast.warning(`Ошибка данных товара ${nmId}`, {
        description: "Отсутствуют изображения товара"
      });
      return null;
    }
    
    // Выводим информацию о найденном изображении
    console.log(`🖼️ Изображение для nmId=${nmId}:`, product.photos[0].big);
    
    // 7. Проверка обязательного поля "subjectName"
    if (!product.subjectName) {
      console.warn(`⚠️ [WARN] У товара nmId=${nmId} отсутствует поле subjectName (категория).`);
      toast.warning(`Ошибка данных товара ${nmId}`, {
        description: "Отсутствует категория товара"
      });
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
    
    console.log(`✅ Успешно сформирована информация о товаре nmId=${nmId}:`, productInfo);
    
    // 9. Сохраняем корректную карточку в кэш
    productInfoCache[nmId] = productInfo;
    
    return productInfo;
  } catch (error) {
    console.error(`❌ Ошибка при получении данных карточки товара для nmId=${nmId}:`, error);
    
    // Выводим детальную информацию об ошибке для диагностики
    if (axios.isAxiosError(error)) {
      console.error(`Статус ошибки: ${error.response?.status}`);
      console.error(`Данные ошибки:`, error.response?.data);
      
      // Специальная обработка для ошибки 401
      if (error.response?.status === 401) {
        console.error(`❌ Ошибка авторизации (401) при запросе данных товара. Проверьте токен!`);
        toast.error(`Ошибка авторизации при получении данных товара ${nmId}`, {
          description: `Возможно, токен устарел или неверной категории (требуется Контент API)`,
          important: true
        });
      } else {
        // Уведомляем пользователя о проблеме с API
        toast.error(`Ошибка получения данных товара ${nmId}`, {
          description: `${error.message} (${error.response?.status || "неизвестный статус"})`
        });
      }
    }
    
    return null;
  }
};

// Функция для очистки кэша при необходимости
export const clearProductInfoCache = () => {
  const cacheSize = Object.keys(productInfoCache).length;
  Object.keys(productInfoCache).forEach(key => {
    delete productInfoCache[Number(key)];
  });
  console.log(`🧹 Кэш информации о товарах очищен (удалено ${cacheSize} записей)`);
  toast.success(`Кэш товаров очищен`, {
    description: `Удалено ${cacheSize} записей из кэша`
  });
};
