
import axios from "axios";
import { ProductCardInfo, ProductCategory } from "@/types/wb";
import { determineProductCategory } from "./categoryUtils";
import { toast } from "sonner";
import { getApiToken } from "../securityUtils";

// API URL для получения информации о товаре
const WB_CARD_API_URL = "https://content-api.wildberries.ru/content/v2/get/cards/list";

// Улучшенный кэш для хранения информации о товарах
interface ProductCacheEntry {
  info: ProductCardInfo;
  loadedAt: number;
  failed?: boolean;
  failReason?: string;
  retryAt?: number;
  inSupply?: boolean; // Флаг для товаров, перемещенных в поставки
}

// Кэш для хранения информации о товарах
const productInfoCache: Record<number, ProductCacheEntry> = {};

// Интервал в мс, после которого разрешено повторить запрос для неудачных карточек
const RETRY_INTERVAL = 5000; // 5 секунд

// Функция для получения информации о товаре по nmId
export const getProductCardInfo = async (nmId: number): Promise<ProductCardInfo | null> => {
  try {
    // Начинаем отслеживание времени запроса для измерения производительности
    const startTime = performance.now();
    
    // 1. Проверяем кэш на успешно загруженные товары
    if (productInfoCache[nmId] && !productInfoCache[nmId].failed) {
      console.log(`Информация о товаре nmId=${nmId} взята из кэша:`, productInfoCache[nmId].info);
      return productInfoCache[nmId].info;
    }
    
    // 2. Проверяем, не является ли запись в кэше неудачной загрузкой, требующей ожидания
    const currentTime = Date.now();
    if (productInfoCache[nmId] && productInfoCache[nmId].failed && productInfoCache[nmId].retryAt) {
      if (currentTime < productInfoCache[nmId].retryAt) {
        console.log(`Пропуск запроса для nmId=${nmId}: слишком рано для повторной попытки (до ${new Date(productInfoCache[nmId].retryAt!).toLocaleTimeString()})`);
        return null; // Еще не время для повторной попытки
      } else {
        console.log(`Повторная попытка загрузки для nmId=${nmId} после неудачи: ${productInfoCache[nmId].failReason}`);
      }
    }

    // 3. Формируем запрос к API
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
    
    // Получаем единый токен для всех API
    const token = getApiToken();
    
    // Формируем заголовки запроса с единым токеном
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log(`🔑 Используется единый токен API`);
    console.log(`🔑 Заголовок Authorization: Bearer ${token.substring(0, 20)}...`);
    
    // Выполняем запрос с заданными заголовками авторизации
    const response = await axios.post(WB_CARD_API_URL, requestBody, { headers });
    
    // Вычисляем время выполнения запроса
    const requestTime = Math.round(performance.now() - startTime);
    console.log(`✓ Ответ получен за ${requestTime}мс для nmId=${nmId}`);
    
    // 4. Вывод полного ответа для отладки
    console.log(`📦 Полный ответ API карточки товара для nmId=${nmId}:`);
    console.log(JSON.stringify(response.data, null, 2));
    
    // 5. Проверяем наличие карточек в ответе
    const cards = response.data.cards;
    if (!cards || cards.length === 0) {
      console.warn(`⚠️ [WARN] Не найдены данные товара для nmId=${nmId}. API вернул пустой результат.`);
      // Добавим уведомление пользователю о проблеме
      toast.warning(`Товар ${nmId} не найден в каталоге WB`, {
        description: "Данные не загружены, возможно проблемы с API"
      });
      
      // Сохраняем в кэше информацию о неудачной попытке
      productInfoCache[nmId] = {
        info: null as any,
        loadedAt: currentTime,
        failed: true,
        failReason: "Товар не найден в каталоге",
        retryAt: currentTime + RETRY_INTERVAL
      };
      
      return null;
    }
    
    const product = cards[0];
    console.log(`📋 Найдена карточка товара для nmId=${nmId}:`, product.title || "Без названия");
    
    // 6. Проверка обязательного поля "title"
    if (!product.title) {
      console.warn(`⚠️ [WARN] У товара nmId=${nmId} отсутствует поле title (наименование).`);
      toast.warning(`Ошибка данных товара ${nmId}`, {
        description: "Отсутствует название товара, данные не загружены"
      });
      
      // Сохраняем в кэше информацию о неудачной попытке
      productInfoCache[nmId] = {
        info: null as any,
        loadedAt: currentTime,
        failed: true,
        failReason: "Отсутствует название товара",
        retryAt: currentTime + RETRY_INTERVAL
      };
      
      return null;
    }
    
    // 7. Проверка наличия фото и URL изображения
    const hasImages = product.photos && product.photos.length > 0 && product.photos[0].big;
    if (!hasImages) {
      console.warn(`⚠️ [WARN] У товара nmId=${nmId} отсутствуют фотографии или URL фотографии.`);
      // Создаем информацию о карточке даже без изображения
      const productInfo: ProductCardInfo = {
        nmId: nmId,
        name: product.title,
        brand: product.brand || "Бренд не указан",
        image: "", // Пустая ссылка на изображение
        category: product.subjectName || "Категория не указана",
        productCategory: product.subjectName ? determineProductCategory(product.subjectName) : ProductCategory.MISC
      };
      
      // Сохраняем в кэше успешную загрузку, даже без изображения
      productInfoCache[nmId] = {
        info: productInfo,
        loadedAt: currentTime,
        failed: false
      };
      
      return productInfo;
    }
    
    // Выводим информацию о найденном изображении
    console.log(`🖼️ Изображение для nmId=${nmId}:`, product.photos[0].big);
    
    // 8. Проверка обязательного поля "subjectName" - теперь необязательно
    const subjectName = product.subjectName || "Категория не указана";
    
    // 9. Формирование объекта с информацией о товаре
    const productInfo: ProductCardInfo = {
      nmId: nmId,
      name: product.title,
      brand: product.brand || "Бренд не указан",
      image: product.photos[0].big,
      category: subjectName,
      productCategory: determineProductCategory(subjectName)
    };
    
    console.log(`✅ Успешно сформирована информация о товаре nmId=${nmId}:`, productInfo);
    
    // 10. Сохраняем успешно загруженную карточку в кэш
    productInfoCache[nmId] = {
      info: productInfo,
      loadedAt: currentTime,
      failed: false
    };
    
    return productInfo;
  } catch (error) {
    console.error(`❌ Ошибка при получении данных карточки товара для nmId=${nmId}:`, error);
    
    // Текущее время для расчета интервала повторной попытки
    const currentTime = Date.now();
    let retryDelay = RETRY_INTERVAL; // Стандартная задержка для повторной попытки
    
    // Выводим детальную информацию об ошибке для диагностики
    if (axios.isAxiosError(error)) {
      console.error(`Статус ошибки: ${error.response?.status}`);
      console.error(`Данные ошибки:`, error.response?.data);
      
      // Специальная обработка для ошибки 429 (Too Many Requests)
      if (error.response?.status === 429) {
        console.error(`❌ Превышен лимит запросов (429) при запросе данных товара. Установлена увеличенная задержка!`);
        toast.error(`Превышен лимит запросов API для товара ${nmId}`, {
          description: `Повторный запрос будет выполнен через некоторое время`,
          important: true
        });
        
        // Увеличиваем задержку для повторной попытки при ошибке 429
        retryDelay = 10000; // 10 секунд для ошибки 429
      } 
      // Специальная обработка для ошибки 401
      else if (error.response?.status === 401) {
        console.error(`❌ Ошибка авторизации (401) при запросе данных товара. Проверьте токен API!`);
        toast.error(`Ошибка авторизации при получении данных товара ${nmId}`, {
          description: `Проверка токена отключена, ошибка связана с API`
        });
        
        // Устанавливаем задержку для повторной попытки
        retryDelay = 5000; // 5 секунд для ошибки 401
      } else {
        // Уведомляем пользователя о проблеме с API
        toast.error(`Ошибка получения данных товара ${nmId}`, {
          description: `Данные не загружены: ${error.message} (${error.response?.status || "неизвестный статус"})`
        });
      }
    }
    
    // Сохраняем в кэш информацию о неудачной попытке
    productInfoCache[nmId] = {
      info: null as any,
      loadedAt: currentTime,
      failed: true,
      failReason: axios.isAxiosError(error) 
        ? `Ошибка ${error.response?.status || "сети"}: ${error.message}`
        : `Неизвестная ошибка: ${error instanceof Error ? error.message : String(error)}`,
      retryAt: retryDelay > 0 ? currentTime + retryDelay : undefined
    };
    
    return null;
  }
};

// Функция для получения информации о нескольких товарах через массовый запрос
export const getBulkProductInfo = async (nmIds: number[]): Promise<Record<number, ProductCardInfo>> => {
  if (!nmIds || nmIds.length === 0) return {};
  
  const result: Record<number, ProductCardInfo> = {};
  const nmIdsToFetch: number[] = [];
  
  // 1. Сначала проверяем кэш
  for (const nmId of nmIds) {
    if (productInfoCache[nmId] && !productInfoCache[nmId].failed) {
      result[nmId] = productInfoCache[nmId].info;
    } else {
      nmIdsToFetch.push(nmId);
    }
  }
  
  if (nmIdsToFetch.length === 0) {
    console.log(`✅ Все ${nmIds.length} товаров получены из кэша`);
    return result;
  }
  
  console.log(`🔄 Получение данных для ${nmIdsToFetch.length} товаров через массовый запрос`);
  
  try {
    // 2. Формируем запрос с пакетами по 100 товаров
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < nmIdsToFetch.length; i += batchSize) {
      const batchNmIds = nmIdsToFetch.slice(i, i + batchSize);
      
      // Формируем текстовый поиск по всем nmIds в батче
      const textSearch = batchNmIds.join(' | ');
      
      const requestBody = {
        settings: {
          cursor: { limit: 200 },
          filter: {
            textSearch,
            withPhoto: -1
          }
        }
      };
      
      batches.push(requestBody);
    }
    
    // 3. Выполняем запросы по батчам
    const token = getApiToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Запрос батча ${i+1}/${batches.length} с ${batchSize} товарами:`);
      
      const response = await axios.post(WB_CARD_API_URL, batch, { headers });
      
      // 4. Обрабатываем ответ
      const cards = response.data.cards || [];
      console.log(`✅ Получено ${cards.length} карточек товаров`);
      
      // 5. Обрабатываем каждую карточку
      for (const card of cards) {
        if (!card.nmID || !card.title) continue;
        
        const nmId = card.nmID;
        const currentTime = Date.now();
        
        // Проверяем наличие фото
        const hasImages = card.photos && card.photos.length > 0 && card.photos[0].big;
        const imageUrl = hasImages ? card.photos[0].big : "";
        
        const subjectName = card.subjectName || "Категория не указана";
        
        const productInfo: ProductCardInfo = {
          nmId: nmId,
          name: card.title,
          brand: card.brand || "Бренд не указан",
          image: imageUrl,
          category: subjectName,
          productCategory: determineProductCategory(subjectName)
        };
        
        // Сохраняем в кэш и результат
        productInfoCache[nmId] = {
          info: productInfo,
          loadedAt: currentTime,
          failed: false
        };
        
        result[nmId] = productInfo;
      }
      
      // 6. Добавляем паузу между батчами, чтобы не перегружать API
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // 7. Проверяем товары, которые не удалось получить
    for (const nmId of nmIdsToFetch) {
      if (!result[nmId]) {
        console.warn(`⚠️ Не удалось получить данные для товара nmId=${nmId}`);
        
        // Добавляем запись о неудачной попытке
        productInfoCache[nmId] = {
          info: null as any,
          loadedAt: Date.now(),
          failed: true,
          failReason: "Товар не найден в результатах массового запроса",
          retryAt: Date.now() + RETRY_INTERVAL
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Ошибка при массовом получении данных карточек товаров:`, error);
    
    // В случае ошибки попробуем получить товары по одному через обычный метод
    for (const nmId of nmIdsToFetch) {
      try {
        const info = await getProductCardInfo(nmId);
        if (info) {
          result[nmId] = info;
        }
      } catch (e) {
        console.error(`Ошибка при получении данных для nmId=${nmId}:`, e);
      }
    }
    
    return result;
  }
};

// Функция для очистки кэша
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

// Функция для удаления карточки из кэша при перемещении в поставку
export const markProductAsInSupply = (nmId: number) => {
  if (productInfoCache[nmId]) {
    productInfoCache[nmId].inSupply = true;
    console.log(`🏷️ Товар nmId=${nmId} помечен как перемещенный в поставку`);
  }
};

// Функция для повторной попытки загрузки карточки товара
export const retryLoadProductInfo = async (nmId: number) => {
  // Удаляем запись о неудачной попытке из кэша
  if (productInfoCache[nmId]) {
    delete productInfoCache[nmId];
  }
  
  console.log(`🔄 Запуск повторной загрузки информации о товаре nmId=${nmId}`);
  // Выполняем запрос к API заново
  return await getProductCardInfo(nmId);
};

// Функция для автоматического повторения загрузки неудачных запросов
export const retryFailedProductInfoRequests = async (maxRetries: number = 3) => {
  const currentTime = Date.now();
  const failedItems = Object.entries(productInfoCache)
    .filter(([_, entry]) => entry.failed && entry.retryAt && entry.retryAt <= currentTime)
    .map(([nmId]) => Number(nmId));
  
  if (failedItems.length > 0) {
    console.log(`🔄 Автоматическая повторная попытка загрузки ${failedItems.length} товаров с ошибками`);
    
    // Ограничиваем количество одновременных запросов
    const maxConcurrent = Math.min(3, failedItems.length);
    let processed = 0;
    
    while (processed < failedItems.length) {
      // Выбираем до maxConcurrent элементов для параллельной загрузки
      const batch = failedItems.slice(processed, processed + maxConcurrent);
      processed += batch.length;
      
      // Запускаем параллельные запросы
      await Promise.all(batch.map(nmId => getProductCardInfo(nmId)));
      
      // Если есть еще элементы для загрузки, добавляем паузу между батчами
      if (processed < failedItems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};

// Экспортируем функции для проверки состояния кэша
export const getProductCacheStats = () => {
  const allEntries = Object.keys(productInfoCache).length;
  const failedEntries = Object.values(productInfoCache).filter(entry => entry.failed).length;
  const inSupplyEntries = Object.values(productInfoCache).filter(entry => entry.inSupply).length;
  
  return {
    total: allEntries,
    success: allEntries - failedEntries,
    failed: failedEntries,
    inSupply: inSupplyEntries
  };
};
