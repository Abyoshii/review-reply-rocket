
/**
 * Форматирует URL изображения Wildberries для правильной загрузки
 * @param imageUrl URL изображения из API или ответа карточки WB
 * @returns Правильно отформатированный URL изображения
 */
export const formatWbImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) return "https://via.placeholder.com/100?text=Нет+фото";
  
  // Проверка, является ли URL полным
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Для изображений корзины Wildberries, поступающих в формате "c246227/imt/..."
  if (imageUrl.includes('/')) {
    // Форматирование в структуру URL корзины WB
    return `https://basket-${imageUrl.split('/')[0]}.wb.ru/${imageUrl}`;
  }

  // Для обычных изображений WB, поступающих только как ID
  // Используем правильный формат URL для изображений WB
  const vol = Math.floor(parseInt(imageUrl) / 10000);
  return `https://images.wbstatic.net/c516x688/new/${vol}0000/${imageUrl}-1.jpg`;
};

/**
 * Логирует структуру объекта для целей отладки
 */
export const logObjectStructure = (obj: any, label = "Object structure"): void => {
  console.log(`${label}:`, JSON.stringify(obj, null, 2));
}

/**
 * Проверяет доступность изображения по URL
 * @param url URL изображения для проверки
 * @returns Promise, который разрешается в true, если изображение доступно, и в false в противном случае
 */
export const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Ошибка при проверке существования изображения:', error);
    return false;
  }
};

