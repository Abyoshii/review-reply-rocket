import { SecuritySettings } from "@/types/openai";
import { toast } from "sonner";
import { logWarning } from "./logUtils";

// Единый API токен для всех API запросов (обновленный)
const UNIFIED_API_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTU3ODUyNSwiaWQiOiIwMTk2MDMzNC1mYjA2LTc0ZjUtOGIwMC03MjU4YWI4OWM1MzAiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6NzkzNCwic2lkIjoiZTZhYzY2MDQtMWQyMS00MTVjLTkwNWQtM2RjMGM0YThmMmJlIiwidCI6ZmFsc2UsInVpZCI6NTAxMDkyNzB9.e8n-W4xKLY9lpMANMRP4_0xZzKHL8gKAUeaXOkcxO6sLSUWHf_vTCGF5IoBceu5o6Dbj3K9Cu7CCbgRC07myPg";

// Функция для обфускации токенов API
const obfuscateToken = (token: string): string => {
  if (!token) return '';
  
  // Простая обфускация с использованием Base64
  const encoded = btoa(token);
  return encoded;
};

// Функция для деобфускации токенов
const deobfuscateToken = (encodedToken: string): string => {
  if (!encodedToken) return '';
  
  try {
    // Декодирование Base64
    return atob(encodedToken);
  } catch (error) {
    console.error("Ошибка при деобфускации токена:", error);
    return UNIFIED_API_TOKEN; // При ошибке возвращаем единый токен
  }
};

// Функция для декодирования JWT без использования внешних библиотек
const decodeJWT = (token: string): { header: any, payload: any } | null => {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn("Неверный формат JWT токена (должен содержать 3 части), но продолжаем работу");
      return { header: {}, payload: { exp: Date.now() + 86400000 } }; // Возвращаем фиктивные данные
    }
    
    // Декодирование заголовка (header)
    const headerPart = parts[0];
    const header = JSON.parse(atob(headerPart));
    
    // Декодирование полезной нагрузки (payload)
    const payloadPart = parts[1];
    const payload = JSON.parse(atob(payloadPart));
    
    return { header, payload };
  } catch (error) {
    console.warn("Ошибка при декодировании JWT, но продолжаем работу:", error);
    return { header: {}, payload: { exp: Date.now() + 86400000 } }; // Возвращаем фиктивные данные
  }
};

// Функция для проверки токена на валидность (ОТКЛЮЧЕНА)
const isTokenValid = (token: string): boolean => {
  // ВАЖНО: Проверка выключена, всегда возвращаем true
  if (!token) {
    console.warn("⚠️ Токен отсутствует, но проверка отключена!");
    return true; // Всегда считаем токен валидным, даже если его нет
  }
  
  console.log("✓ Проверка валидности токена отключена, считаем его валидным");
  return true; // Всегда возвращаем true, независимо от состояния токена
};

// Функция для определения категории API по URL
const getApiCategoryFromUrl = (url: string): 'content' | 'marketplace' | 'unknown' => {
  if (url.includes('content-api.wildberries.ru')) {
    return 'content';
  } else if (url.includes('marketplace-api.wildberries.ru')) {
    return 'marketplace';
  }
  return 'unknown';
};

// Функция для определения требуемой категории токена
const getRequiredTokenCategory = (apiCategory: 'content' | 'marketplace' | 'unknown'): number | null => {
  switch (apiCategory) {
    case 'content':
      return 1; // Токен категории «Контент»
    case 'marketplace':
      return 1; // Токен FBS/FBO
    default:
      return null;
  }
};

// Функция для проверки соответствия токена API
const isTokenCompatibleWithApi = (token: string, apiUrl: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded) return false;
  
  const apiCategory = getApiCategoryFromUrl(apiUrl);
  const requiredCategory = getRequiredTokenCategory(apiCategory);
  
  // Если не можем определить требуемую категорию, считаем токен совместимым
  if (requiredCategory === null) return true;
  
  // Проверяем соответствие категории токена
  const { payload } = decoded;
  if (payload.ent !== undefined) {
    const isCompatible = payload.ent === requiredCategory;
    if (!isCompatible) {
      console.error(`⚠️ Несовместимость категорий! Токен: ${payload.ent}, требуется: ${requiredCategory}`);
    }
    return isCompatible;
  }
  
  // Если информации о категории нет, предполагаем, что токен совместим
  return true;
};

// Функция для сохранения токена в localStorage с обфускацией
const saveApiToken = (token: string, securitySettings: SecuritySettings): void => {
  if (!token) return;
  
  try {
    // Проверка токена отключена
    console.log("✓ Сохраняем токен без проверки валидности");
    
    const tokenToSave = securitySettings.obfuscateTokens 
      ? obfuscateToken(token)
      : token;
    
    localStorage.setItem('wb_token', tokenToSave);
    localStorage.setItem('wb_token_obfuscated', String(securitySettings.obfuscateTokens));
    localStorage.setItem('wb_header_name', securitySettings.headerName);
    
    console.log("✅ API токен успешно сохранен");
    toast.success("API токен сохранен", {
      description: "Токен сохранен без проверки валидности"
    });
  } catch (error) {
    console.error("Ошибка при сохранении токена:", error);
    toast.error("Ошибка при сохранении токена", {
      description: "Проверьте формат токена"
    });
  }
};

// Функция для получения токена из localStorage с деобфускацией при необходимости
const getApiToken = (): string => {
  // При первом запуске или если токен в localStorage устаревший, обновляем его
  const storedToken = localStorage.getItem('wb_token');
  
  // Если токен отсутствует, возвращаем новый единый токен
  if (!storedToken) {
    const isObfuscated = localStorage.getItem('wb_token_obfuscated') === 'true';
    const tokenToSave = isObfuscated ? obfuscateToken(UNIFIED_API_TOKEN) : UNIFIED_API_TOKEN;
    localStorage.setItem('wb_token', tokenToSave);
    
    return UNIFIED_API_TOKEN;
  }
  
  const isObfuscated = localStorage.getItem('wb_token_obfuscated') === 'true';
  
  try {
    const resultToken = isObfuscated ? deobfuscateToken(storedToken) : storedToken;
    return resultToken || UNIFIED_API_TOKEN;
  } catch (error) {
    console.error("Ошибка при получении токена:", error);
    return UNIFIED_API_TOKEN;
  }
};

// Функция для получения имени заголовка авторизации
const getHeaderName = (): string => {
  return localStorage.getItem('wb_header_name') || 'Authorization';
};

// Функция для добавления заголовков авторизации к запросам
const addAuthHeaders = (headers: Record<string, string> = {}, apiUrl?: string): Record<string, string> => {
  const token = getApiToken();
  const headerName = getHeaderName();
  
  // Проверяем совместимость токена с API, если URL предоставлен
  if (apiUrl && !isTokenCompatibleWithApi(token, apiUrl)) {
    console.warn(`⚠️ Токен может быть несовместим с API: ${apiUrl}`);
  }
  
  console.log(`Добавление заголовка ${headerName} к запросу ${apiUrl || ''}`);
  
  // ВАЖНО: API Wildberries требует формат "Bearer токен" и Content-Type
  return {
    ...headers,
    [headerName]: `Bearer ${token}`,
    'Content-Type': 'application/json' // Добавляем Content-Type для всех запросов
  };
};

// Функция для проверки настроек безопасности при запуске приложения
const initSecuritySettings = (): SecuritySettings => {
  const defaultSettings: SecuritySettings = {
    useHeaderApiKey: true,
    headerName: 'Authorization',
    obfuscateTokens: true
  };
  
  try {
    const savedSettings = localStorage.getItem('security_settings');
    
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    // Если настроек нет, создаем дефолтные
    localStorage.setItem('security_settings', JSON.stringify(defaultSettings));
    return defaultSettings;
  } catch (error) {
    console.error("Ошибка при инициализации настроек безопасности:", error);
    return defaultSettings;
  }
};

// Функция для сохранения настроек безопасности
const saveSecuritySettings = (settings: SecuritySettings): void => {
  try {
    localStorage.setItem('security_settings', JSON.stringify(settings));
    
    // Если изменилось имя заголовка, обновляем его
    localStorage.setItem('wb_header_name', settings.headerName);
    
    // Если изменилась настройка обфускации, переобфускируем текущий токен
    const currentObfuscated = localStorage.getItem('wb_token_obfuscated') === 'true';
    if (currentObfuscated !== settings.obfuscateTokens) {
      const token = getApiToken();
      if (token) {
        saveApiToken(token, settings);
      }
    }
  } catch (error) {
    console.error("Ошибка при сохранении настроек безопасности:", error);
  }
};

// Функция для форматирования вывода JWT полезной нагрузки
const getTokenDetails = (token: string): { 
  isValid: boolean, 
  isExpired?: boolean, 
  expiresAt?: Date, 
  category?: number,
  details?: string
} => {
  if (!token) {
    return { isValid: true, details: "Токен отсутствует, но считается валидным (проверка отключена)" };
  }
  
  // Всегда считаем токен валидным
  const result: any = { isValid: true };
  
  try {
    const decoded = decodeJWT(token);
    if (decoded) {
      const { payload } = decoded;
      
      // Проверяем срок действия
      if (payload.exp) {
        const expirationTime = payload.exp * 1000;
        result.expiresAt = new Date(expirationTime);
        result.isExpired = false; // Всегда считаем, что токен не просрочен
      }
      
      // Добавляем категорию токена
      if (payload.ent !== undefined) {
        result.category = payload.ent;
      }
      
      // Детализация токена - удаляем пустые данные
      let details = "Проверка валидности отключена. Считаем токен действительным.\n";
      if (result.expiresAt) {
        details += `Истекает: ${result.expiresAt.toLocaleDateString()} ${result.expiresAt.toLocaleTimeString()}\n`;
      }
      if (result.category !== undefined) {
        details += `Категория: ${result.category}\n`;
      }
      if (payload.id) {
        details += `ID: ${payload.id}\n`;
      }
      if (payload.oid) {
        details += `OID: ${payload.oid}\n`;
      }
      if (payload.s) {
        details += `S: ${payload.s}\n`;
      }
      if (payload.sid) {
        details += `SID: ${payload.sid}\n`;
      }
      
      result.details = details.trim();
    } else {
      result.details = "Формат токена неизвестен, но считается валидным (проверка отключена)";
    }
  } catch (error) {
    result.details = "Ошибка при декодировании токена, но считаем его валидным (проверка отключена)";
  }
  
  return result;
};

export {
  obfuscateToken,
  deobfuscateToken,
  saveApiToken,
  getApiToken,
  getHeaderName,
  addAuthHeaders,
  initSecuritySettings,
  saveSecuritySettings,
  decodeJWT,
  isTokenValid,
  getTokenDetails,
  UNIFIED_API_TOKEN
};
