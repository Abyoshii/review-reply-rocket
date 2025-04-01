
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AutoResponderSettings } from "@/types/openai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the original function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep function to introduce delays
 * @param ms Milliseconds to sleep
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a system prompt for OpenAI based on user settings
 * @param settings AutoResponder settings
 * @returns Formatted system prompt
 */
export function generateSystemPrompt(settings: AutoResponderSettings): string {
  if (settings.customPrompt) {
    return settings.customPrompt;
  }
  
  // Язык ответов
  const languageText = {
    russian: "на русском языке",
    english: "на английском языке",
    kazakh: "на казахском языке",
  }[settings.language];
  
  // Тон ответов
  const toneText = {
    friendly: "дружелюбно и неформально",
    professional: "профессионально и информативно",
    formal: "формально и вежливо"
  }[settings.tone];
  
  // Эмодзи
  const emojiText = settings.useEmoji 
    ? "Используй эмодзи (1-2 на ответ) для живости общения." 
    : "Не используй эмодзи в ответах.";
  
  // Обновленный базовый промт с улучшенной логикой ответов на особые ситуации
  const basePrompt = `
Ты — специалист клиентского сервиса магазина на Wildberries. Отвечай ${languageText}, ${toneText}.

Правила:
- Отвечай кратко (3-5 предложений максимум).
- Стиль: живой, без шаблонов.
- ${emojiText}
- Не придумывай, пиши только по содержанию отзыва.
- Если в отзыве есть и плюсы, и минусы — прокомментируй оба.
- Если отзыв без текста, но с оценкой — поблагодари за оценку.
- Не упоминай возврат, если клиент сам не просит.

Особые ситуации:
1. Если клиент хочет вернуть парфюм или жалуется на запах:
   "К сожалению, возврат духов после вскрытия невозможен — даже если запах не подошёл. Рекомендуем не открывать упаковку, если вы сомневаетесь."

2. Если получен не тот товар (и он не вскрыт):
   "Извините за путаницу. Пожалуйста, оформите возврат через личный кабинет — главное, не использовать товар."

3. При жалобе на подделку:
   "Сожалеем, что возникли сомнения. Мы работаем только с проверенными поставщиками, никаких подделок."

4. При повреждении при доставке:
   "Нам жаль, что товар повредился при транспортировке. К сожалению, за доставку отвечает служба WB — рекомендуем обратиться в их поддержку."

${settings.signature ? `В конце каждого ответа добавляй: "${settings.signature}"` : ""}
`;

  return basePrompt.trim();
}
