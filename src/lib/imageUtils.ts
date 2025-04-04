
/**
 * Formats a Wildberries image URL to ensure it's properly loaded
 * @param imageUrl The image URL from the API or WB card response
 * @returns A properly formatted image URL
 */
export const formatWbImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) return "https://via.placeholder.com/100?text=Нет+фото";
  
  // Check if it's already a full URL
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // For Wildberries basket images that come in format like "c246227/imt/..."
  if (imageUrl.includes('/')) {
    // Format to the WB basket URL structure
    return `https://basket-${imageUrl.split('/')[0]}.wb.ru/${imageUrl}`;
  }

  // For regular WB images that come just as ID
  return `https://images.wbstatic.net/c246x328/new/${imageUrl.substring(0, 4)}0000/${imageUrl}-1.jpg`;
};

/**
 * Logs the structure of an object for debugging purposes
 */
export const logObjectStructure = (obj: any, label = "Object structure"): void => {
  console.log(`${label}:`, JSON.stringify(obj, null, 2));
}
