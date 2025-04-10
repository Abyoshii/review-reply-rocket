
import { ProductCategory } from "@/types/wb";

// Ключевые слова для определения категории товара по названию
const PERFUME_KEYWORDS = [
  "духи", "туалетная вода", "парфюмерная вода", "аромат", 
  "eau de parfum", "eau de toilette", "edp", "edt", "парфюм",
  "одеколон", "cologne", "parfum", "perfume", "fragrance"
];

const CLOTHING_KEYWORDS = [
  "куртка", "брюки", "спортивные", "платье", "футболка", "джинсы", 
  "шорты", "юбка", "бейсболка", "толстовка", "жилет", "рубашка", 
  "свитер", "пальто", "худи", "джемпер", "костюм", "кофта", "майка", "кепка",
  "штаны", "носки", "легинсы", "джоггеры", "пиджак", "блузка", "топ", "бомбер",
  "лонгслив", "поло", "водолазка", "трикотаж", "шапка", "ветровка", "дубленка"
];

// Функция для определения категории товара по названию
export const determineProductCategory = (productName: string): ProductCategory => {
  if (!productName) return ProductCategory.MISC;
  
  const nameLower = productName.toLowerCase();
  
  // Проверяем по ключевым словам для парфюмерии
  if (PERFUME_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return ProductCategory.PERFUME;
  }
  
  // Проверяем по ключевым словам для одежды
  if (CLOTHING_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return ProductCategory.CLOTHING;
  }
  
  // По умолчанию - мелочёвка
  return ProductCategory.MISC;
};

// Категории товаров из API Wildberries
const PERFUME_CATEGORIES = [
  "Духи", "Парфюмерная вода", "Туалетная вода", "Одеколон", "Парфюм",
  "Ароматы для дома", "Наборы ароматов", "Ароматические свечи"
];

const CLOTHING_CATEGORIES = [
  "Куртка", "Футболка", "Брюки", "Брюки спортивные", "Пальто", "Кепка", 
  "Джинсы", "Шорты", "Юбка", "Толстовка", "Жилет", "Рубашка", "Свитер",
  "Худи", "Джемпер", "Костюм", "Кофта", "Майка", "Верхняя одежда",
  "Штаны", "Носки", "Белье", "Пижама", "Купальник", "Блузка", "Топ",
  "Бомбер", "Лонгслив", "Поло", "Водолазка", "Трикотаж", "Шапка",
  "Ветровка", "Дубленка", "Платье", "Сарафан", "Бейсболка"
];

// Функция для определения категории товара по subjectName из API
export const determineCategoryBySubject = (subjectName?: string): ProductCategory => {
  if (!subjectName) return ProductCategory.MISC;
  
  // Проверяем на парфюмерию
  if (PERFUME_CATEGORIES.some(category => subjectName.includes(category))) {
    return ProductCategory.PERFUME;
  }
  
  // Проверяем на одежду
  if (CLOTHING_CATEGORIES.some(category => subjectName.includes(category))) {
    return ProductCategory.CLOTHING;
  }
  
  // По умолчанию - мелочёвка
  return ProductCategory.MISC;
};

// Функция-обёртка, которая пытается определить категорию по subjectName или по названию
export const determineCategory = (subjectName?: string, productName?: string): ProductCategory => {
  // Сначала пробуем по subjectName
  if (subjectName) {
    return determineCategoryBySubject(subjectName);
  }
  
  // Если не получилось, пробуем по названию
  if (productName) {
    return determineProductCategory(productName);
  }
  
  // По умолчанию
  return ProductCategory.MISC;
};
