import { SecuritySettings } from "@/types/openai";
import { toast } from "sonner";
import { logWarning } from "./logUtils";

// Единый API токен для всех API запросов
const UNIFIED_API_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTcxOTY3NywiaWQiOiIwMTk2MGI5ZS1jOGU2LTcxMDUtYjU2MC1lMTU2YzA4OWQwZDYiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6MTI4LCJzaWQiOiJlNmFjNjYwNC0xZDIxLTQxNWMtOTA1ZC0zZGMwYzRhOGYyYmUiLCJ0IjpmYWxzZSwidWlkIjo1MDEwOTI3MH0.ast0KkuIGky-fGx5nm3ZKeW0Y1-oCIcRPl104niIGBwWzJrKdsOn3cmYh0qoE6Wti1Cc5oCQLy2g94coavG0eQ";

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
    return '';
  }
};

// Функция для декодирования JWT без использования внешних библиотек
const decodeJWT = (token: string): { header: any, payload: any } | null => {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error("Неверный формат JWT токена (должен содержать 3 части)");
      return null;
    }
    
    // Декодирование заголовка (header)
    const headerPart = parts[0];
    const header = JSON.parse(atob(headerPart));
    
    // Декодирование полезной нагрузки (payload)
    const payloadPart = parts[1];
    const payload = JSON.parse(atob(payloadPart));
    
    return { header, payload };
  } catch (error) {
    console.error("Ошибка при декодировании JWT:", error);
    return null;
  }
};

// Функция для проверки токена на валидность
const isTokenValid = (token: string): boolean => {
  if (!token) return false;
  
  // Проверяем формат (должен начинаться с "ey")
  if (!token.startsWith('ey')) {
    console.warn("⚠️ Токен не начинается с 'ey', возможно, это не JWT");
    return false;
  }
  
  // Декодируем JWT
  const decoded = decodeJWT(token);
  if (!decoded) return false;
  
  // Проверяем срок действия (exp)
  const { payload } = decoded;
  if (payload.exp) {
    const expirationTime = payload.exp * 1000; // в миллисекундах
    const currentTime = Date.now();
    
    if (currentTime > expirationTime) {
      console.error(`⚠️ Токен просрочен! Истек: ${new Date(expirationTime).toLocaleString()}`);
      return false;
    }
    
    // Дополнительно проверяем, сколько осталось до истечения срока
    const timeLeft = expirationTime - currentTime;
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 7) {
      console.warn(`⚠️ Токен скоро истечет! Осталось ${daysLeft} дней.`);
    } else {
      console.log(`✅ Токен действителен еще ${daysLeft} дней.`);
    }
  } else {
    console.warn("⚠️ В токене отсутствует поле exp (срок действия)");
  }
  
  // Проверяем тип/категорию токена (ent)
  if (payload.ent !== undefined) {
    console.log(`ℹ️ Категория токена (ent): ${payload.ent}`);
  } else {
    console.warn("⚠️ В токене отсутствует поле ent (категория)");
  }
  
  return true;
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
    // Проверяем токен на валидность
    if (!isTokenValid(token)) {
      logWarning("Токен не прошел проверку валидности", "Возможно, токен просрочен или имеет неверный формат");
      return;
    }
    
    const tokenToSave = securitySettings.obfuscateTokens 
      ? obfuscateToken(token)
      : token;
    
    localStorage.setItem('wb_token', tokenToSave);
    localStorage.setItem('wb_token_obfuscated', String(securitySettings.obfuscateTokens));
    localStorage.setItem('wb_header_name', securitySettings.headerName);
    
    console.log("✅ API токен успешно сохранен");
    toast.success("API токен сохранен", {
      description: "Проверка токена прошла успешно"
    });
  } catch (error) {
    console.error("Ошибка при сохранении токена:", error);
    toast.error("Ошибка при сохранении токена", {
      description: "Проверьте формат и срок действия токена"
    });
  }
};

// Функция для получения токена из localStorage с деобфускацией при необходимости
const getApiToken = (): string => {
  const token = localStorage.getItem('wb_token') || UNIFIED_API_TOKEN;
  const isObfuscated = localStorage.getItem('wb_token_obfuscated') === 'true';
  
  if (!token) {
    console.warn("⚠️ API токен отсутствует!");
    return UNIFIED_API_TOKEN;
  }
  
  const resultToken = isObfuscated ? deobfuscateToken(token) : token;
  
  // Проверяем токен на валидность (срок действия)
  if (!isTokenValid(resultToken)) {
    console.warn("⚠️ Токен не прошел проверку валидности при получении!");
    toast.warning("Проблема с API токеном", {
      description: "Токен может быть просрочен или иметь неверный формат"
    });
    return UNIFIED_API_TOKEN;
  }
  
  return resultToken;
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
    return { isValid: false, details: "Токен отсутствует" };
  }
  
  if (!token.startsWith('ey')) {
    return { isValid: false, details: "Неверный формат JWT (должен начинаться с 'ey')" };
  }
  
  const decoded = decodeJWT(token);
  if (!decoded) {
    return { isValid: false, details: "Невозможно декодировать JWT" };
  }
  
  const { payload } = decoded;
  const result: any = { isValid: true };
  
  // Проверяем срок действия
  if (payload.exp) {
    const expirationTime = payload.exp * 1000;
    result.expiresAt = new Date(expirationTime);
    result.isExpired = Date.now() > expirationTime;
  }
  
  // Добавляем категорию токена
  if (payload.ent !== undefined) {
    result.category = payload.ent;
  }
  
  // Детализация токена - удаляем пустые данные
  let details = "";
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
