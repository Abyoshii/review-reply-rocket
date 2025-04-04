
/**
 * Утилиты для логирования с поддержкой отображения в ConsoleViewer
 */

import { toast } from "sonner";

/**
 * Функция для логирования предупреждений с поддержкой 
 * отображения в интерфейсе через toast
 */
export const logWarning = (message: string, details?: string) => {
  console.warn(`⚠️ [WARN] ${message}`);
  
  toast.error(message, {
    description: details
  });
};

/**
 * Функция для логирования ошибок с поддержкой
 * отображения в интерфейсе через toast
 */
export const logError = (message: string, error?: any) => {
  console.error(`❌ ${message}`, error);
  
  toast.error(message, {
    description: error?.message || "Неизвестная ошибка"
  });
};

/**
 * Функция для логирования успешных операций
 */
export const logSuccess = (message: string, details?: string) => {
  console.log(`✅ ${message}`);
  
  toast.success(message, {
    description: details
  });
};

/**
 * Логирование информационного сообщения
 */
export const logInfo = (message: string, details?: string) => {
  console.log(`ℹ️ ${message}`);
  
  if (details) {
    toast(message, { 
      description: details 
    });
  }
};

/**
 * Функция для тестирования токена авторизации
 * с выводом подробной информации о состоянии
 */
export const logAuthStatus = (token: string, headerName: string) => {
  if (!token) {
    console.error('❌ [AUTH] Токен отсутствует! Авторизация невозможна.');
    return;
  }
  
  console.log('✅ [AUTH] Авторизационные данные:');
  console.log(`✅ [AUTH] Заголовок: ${headerName}`);
  console.log(`✅ [AUTH] Токен (первые 20 символов): ${token.substring(0, 20)}...`);
  console.log(`✅ [AUTH] Длина токена: ${token.length} символов`);
  
  // Проверка формата токена (должен начинаться с "ey")
  if (token.startsWith('ey')) {
    console.log('✅ [AUTH] Формат токена: похоже на JWT');
  } else {
    console.warn('⚠️ [AUTH] Формат токена: не похож на стандартный JWT!');
  }
};
