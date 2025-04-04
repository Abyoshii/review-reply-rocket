
/**
 * Утилиты для логирования с поддержкой отображения в ConsoleViewer
 */

import { toast } from "sonner";
import { decodeJWT } from "./securityUtils";

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
    
    // Декодирование JWT для получения дополнительной информации
    const decoded = decodeJWT(token);
    if (decoded) {
      const { payload } = decoded;
      
      console.log('📋 [AUTH] Информация из JWT:');
      
      // Проверка срока действия
      if (payload.exp) {
        const expirationTime = new Date(payload.exp * 1000);
        const now = new Date();
        const isExpired = now > expirationTime;
        
        if (isExpired) {
          console.error(`❌ [AUTH] Токен ПРОСРОЧЕН! Истек: ${expirationTime.toLocaleString()}`);
        } else {
          console.log(`✅ [AUTH] Токен действителен до: ${expirationTime.toLocaleString()}`);
          
          // Сколько дней осталось
          const daysLeft = Math.floor((expirationTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`✅ [AUTH] Токен действителен еще ${daysLeft} дней`);
        }
      } else {
        console.warn('⚠️ [AUTH] В токене отсутствует поле exp (срок действия)');
      }
      
      // Проверка типа/категории токена
      if (payload.ent !== undefined) {
        console.log(`ℹ️ [AUTH] Категория токена (ent): ${payload.ent}`);
        
        switch (payload.ent) {
          case 1:
            console.log('ℹ️ [AUTH] Тип: Стандартный (подходит для большинства API)');
            break;
          default:
            console.log(`ℹ️ [AUTH] Тип: Другой (${payload.ent})`);
        }
      }
      
      // Дополнительные поля JWT
      console.log('📋 [AUTH] Дополнительные поля JWT:');
      Object.entries(payload).forEach(([key, value]) => {
        if (!['exp', 'ent'].includes(key)) {
          console.log(`ℹ️ [AUTH] ${key}: ${value}`);
        }
      });
    } else {
      console.warn('⚠️ [AUTH] Не удалось декодировать JWT токен');
    }
  } else {
    console.warn('⚠️ [AUTH] Формат токена: не похож на стандартный JWT!');
  }
};
