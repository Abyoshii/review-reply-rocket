
import { SecuritySettings } from "@/types/openai";

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

// Используем константу для API токена, чтобы избежать опечаток
const API_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTIyNTE5NSwiaWQiOiIwMTk1ZWUyNS05NDA3LTczZTAtYTA0Mi0wZTExNTc4NTIwNDQiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6NjQyLCJzaWQiOiJlNmFjNjYwNC0xZDIxLTQxNWMtOTA1ZC0zZGMwYzRhOGYyYmUiLCJ0IjpmYWxzZSwidWlkIjo1MDEwOTI3MH0.uLCv4lMfwG2cr6JG-kR7y_xAFYOKN5uW0YQiCyR4Czyh33LICsgKrvaYfxmrCPHtWMBbSQWqQjBq-SVSJWwefg";

// Функция для сохранения токена в localStorage с обфускацией
const saveApiToken = (token: string, securitySettings: SecuritySettings): void => {
  if (!token) return;
  
  try {
    const tokenToSave = securitySettings.obfuscateTokens 
      ? obfuscateToken(token)
      : token;
    
    localStorage.setItem('wb_api_token', tokenToSave);
    localStorage.setItem('wb_token_obfuscated', String(securitySettings.obfuscateTokens));
    localStorage.setItem('wb_header_name', securitySettings.headerName);
    
    console.log("API токен успешно сохранен");
  } catch (error) {
    console.error("Ошибка при сохранении токена:", error);
  }
};

// Функция для получения токена из localStorage с деобфускацией при необходимости
const getApiToken = (): string => {
  const token = localStorage.getItem('wb_api_token') || API_TOKEN;
  const isObfuscated = localStorage.getItem('wb_token_obfuscated') === 'true';
  
  if (!token) {
    console.warn("⚠️ API токен отсутствует!");
    return '';
  }
  
  const resultToken = isObfuscated ? deobfuscateToken(token) : token;
  console.log(`ℹ️ API токен получен (${resultToken.length} символов, ${resultToken.substring(0, 10)}...)`);
  return resultToken;
};

// Функция для получения имени заголовка авторизации
const getHeaderName = (): string => {
  return localStorage.getItem('wb_header_name') || 'Authorization';
};

// Функция для добавления заголовков авторизации к запросам
const addAuthHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getApiToken();
  const headerName = getHeaderName();
  
  if (token) {
    console.log(`Добавление заголовка ${headerName} к запросу`);
    // ВАЖНО: API Wildberries требует формат "Bearer токен"
    return {
      ...headers,
      [headerName]: `Bearer ${token}`,
      'Content-Type': 'application/json' // Добавляем Content-Type для всех запросов
    };
  }
  
  console.warn("⚠️ Невозможно добавить заголовок авторизации - токен отсутствует!");
  return headers;
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

export {
  obfuscateToken,
  deobfuscateToken,
  saveApiToken,
  getApiToken,
  getHeaderName,
  addAuthHeaders,
  initSecuritySettings,
  saveSecuritySettings
};
