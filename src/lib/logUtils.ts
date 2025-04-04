
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
