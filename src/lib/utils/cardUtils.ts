
import axios from "axios";
import { addAuthHeaders } from "@/lib/securityUtils";
import { ProductCardInfo, ProductInfo, ProductCategory } from "@/types/wb";
import { determineCategory } from "./categoryUtils";
import { toast } from "sonner";

/**
 * Универсальная функция для получения карточек товаров по их nmId
 * @param nmIds массив идентификаторов товаров
 * @returns объект, где ключ - это nmId, а значение - информация о товаре
 */
export const getCardsByNmIds = async (nmIds: number[]): Promise<Map<number, ProductInfo>> => {
  // Используем Map вместо обычного объекта для лучшей производительности
  const productInfoMap = new Map<number, ProductInfo>();
  
  if (!nmIds || nmIds.length === 0) {
    console.warn("getCardsByNmIds: получен пустой массив nmIds");
    return productInfoMap;
  }
  
  // Разбиваем запрос на чанки по 100 nmId
  const nmIdChunks: number[][] = [];
  for (let i = 0; i < nmIds.length; i += 100) {
    nmIdChunks.push(nmIds.slice(i, i + 100));
  }
  
  console.log(`Разбито ${nmIds.length} nmIds на ${nmIdChunks.length} чанков`);
  
  for (const chunk of nmIdChunks) {
    // Защита от пустых чанков
    if (chunk.length === 0) continue;
    
    try {
      const cardsResponse = await axios.post("https://content-api.wildberries.ru/content/v2/get/cards/list", {
        settings: {
          cursor: {
            limit: 100
          },
          filter: {
            nmID: [...chunk] // Убедимся, что передается массив
          }
        }
      }, {
        headers: addAuthHeaders()
      });
      
      console.log(`Получено ${cardsResponse.data?.cards?.length || 0} карточек для чанка из ${chunk.length} nmIds`);
      
      // Исправлен путь до карточек: cardsResponse.data.cards вместо cardsResponse.data.data.cards
      if (cardsResponse.data && Array.isArray(cardsResponse.data.cards)) {
        for (const card of cardsResponse.data.cards) {
          // Проверка на существование card.nmID
          if (!card.nmID) continue;
          
          const category = determineCategory(card.subjectName, card.name);
          let size = undefined;
          if (category === ProductCategory.CLOTHING && card.sizes && card.sizes.length > 0) {
            size = card.sizes[0].name || card.sizes[0].value;
          }
          
          productInfoMap.set(card.nmID, {
            nmId: card.nmID,
            article: card.article || card.vendorCode || "Нет артикула",
            subjectName: card.subjectName || "Нет категории",
            photo: card.photos && card.photos.length > 0 ? card.photos[0].big : "https://via.placeholder.com/150",
            image: card.photos && card.photos.length > 0 ? card.photos[0].big : "https://via.placeholder.com/150",
            name: card.name || "Неизвестный товар",
            brand: card.brand || "—",
            category,
            size,
            productCategory: category
          });
        }
      } else {
        console.warn("Неожиданный формат ответа API карточек:", cardsResponse.data);
      }
      
      // Добавляем задержку между запросами для предотвращения блокировки
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error("Ошибка при запросе карточек товаров:", error);
    }
  }
  
  console.log(`Всего получено информации о ${productInfoMap.size} товарах из ${nmIds.length} запрошенных`);
  return productInfoMap;
};

/**
 * Преобразует Map в обычный объект Record для обратной совместимости
 */
export const mapToRecord = <K extends number | string, V>(map: Map<K, V>): Record<K, V> => {
  return Array.from(map.entries()).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as Record<K, V>);
};

/**
 * Проверяет наличие обязательных полей в карточке товара
 */
export const validateProductCard = (card: ProductInfo | ProductCardInfo | null): boolean => {
  if (!card) return false;
  return Boolean(card.name && card.nmId);
};

