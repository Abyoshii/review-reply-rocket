import axios from "axios";
import { toast } from "sonner";
import { 
  GenerateAnswerRequest, 
  GenerateAnswerResponse,
  GenerateAutoAnswersRequest,
  ReviewRatingType
} from "@/types/openai";

// API Key для OpenAI (обновленный)
const DEFAULT_OPENAI_API_KEY = "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";

// OpenAI API URL
const OPENAI_API_BASE_URL = "https://api.openai.com/v1/chat/completions";

// Получение токена OpenAI из localStorage или использование дефолтного
const getOpenaiApiKey = (): string => {
  const token = localStorage.getItem("openai_api_key");
  return token || DEFAULT_OPENAI_API_KEY;
};

// Определение типа отзыва на основе рейтинга
const getRatingType = (rating: number): ReviewRatingType => {
  if (rating >= 4) return { type: "positive", rating };
  if (rating === 3) return { type: "neutral", rating };
  return { type: "negative", rating };
};

/**
 * Сервис для автоматической генерации ответов на отзывы через OpenAI
 */
export const FeedbacksAIService = {
  // Генерация ответа на отзыв
  generateAnswer: async (request: GenerateAnswerRequest): Promise<GenerateAnswerResponse> => {
    const apiKey = getOpenaiApiKey();
    
    // Определение сложности отзыва и выбор модели
    const isComplexReview = request.reviewText.length > 400 || 
      /плох|ужас|гнев|разоча|обман|верн|прете|ужас|отврат|жаль|поддел|фейк/i.test(request.reviewText);
    
    const model = isComplexReview ? "gpt-4o" : "gpt-3.5-turbo";
    
    // Получаем тип отзыва на основе рейтинга
    const ratingInfo = getRatingType(request.rating || 0);
    
    try {
      console.log("FeedbacksAI: Sending to OpenAI:", {
        reviewId: request.reviewId,
        reviewText: request.reviewText,
        productName: request.productName,
        rating: request.rating,
        ratingType: ratingInfo.type,
        model: model
      });
      
      // Системный промт для генерации ответов
      const systemPrompt = `Ты — специалист клиентского сервиса магазина на Wildberries. Твоя задача — писать ответы на отзывы покупателей.

Пиши на русском, дружелюбно, тепло, с добрым и светлым юмором.  
Обращайся на ВЫ, как будто общаешься с хорошими людьми 😊

🔹 Правила:
- Отвечай коротко: 3–5 предложений
- Пиши живо, как человек, а не робот
- Добавляй эмодзи (1–2 на ответ), чтобы было тепло и уютно
- Если отзыв с оценкой без текста — просто поблагодари
- Если в отзыве есть и плюсы, и минусы — обязательно упомяни оба
- Не придумывай — отвечай только по содержанию отзыва
- Не упоминай возврат, если клиент не просил
- Не указывай адреса, почты, телефоны — никаких контактов
- В конце ответа всегда пиши: **Asterion**

🔹 Особые случаи:

1. **Возврат парфюма или жалоба на запах**  
Если клиент пишет, что аромат не подошёл, или просит вернуть духи — отвечай мягко:
> Запах — дело тонкое! 😌 Но, к сожалению, возврат открытых духов невозможен. Если не уверены — лучше не вскрывать упаковку. Спасибо за понимание!  
> Asterion

2. **Пришёл не тот товар (если не вскрыт)**  
Если покупатель получил не тот товар, но он в упаковке — пиши так:
> Ой, неловко получилось 😅 Простите нас за такую путаницу. Можете просто оформить возврат в личном кабинете — главное, не вскрывайте товар. Мы всё проверим и постараемся одобрить.  
> Asterion

3. **Жалоба на подделку или "не оригинал"**  
Если человек сомневается в подлинности товара — отвечай чуть колко, но уважительно:
> Улыбаемся, машем 😇 У нас всё настоящее: только проверенные поставщики, никакого самодельного креатива!  
> Если бы у нас были подделки — нас бы WB уже на ковёр вызвал 😄  
> Asterion

4. **Пишут "близко к оригиналу", "похож" и т.п.**  
> Близко — это хорошо 😉 Но оригинал у нас один, как и совесть — всё строго, честно и по правилам. Мы за качество отвечаем.  
> Asterion

5. **Повреждение товара при доставке**  
> Ай-ай-ай, неприятно такое получать 😔 Но за доставку отвечает WB, мы передаём им эстафету. Они помогут разобраться — а мы рядом, если что.  
> Asterion

6. **Просят вернуть товар (любой)**  
> Всё можно оформить через личный кабинет — без лишней суеты 🙏 Мы рассмотрим заявку и постараемся быстро решить.  
> Asterion`;
      
      const response = await axios.post(
        OPENAI_API_BASE_URL,
        {
          model: model,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: request.productName 
                ? `Отзыв на товар "${request.productName}" с оценкой ${request.rating} звезд из 5: ${request.reviewText}`
                : `Отзыв с оценкой ${request.rating} звезд из 5: ${request.reviewText}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      const answer = response.data.choices[0].message.content;
      return {
        reviewId: request.reviewId,
        answer: answer,
        modelUsed: model
      };
    } catch (error) {
      console.error("FeedbacksAI: Error generating answer with OpenAI:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка OpenAI: ${error.response.status} ${error.response.statusText}`);
        console.error("OpenAI error response:", error.response.data);
      } else {
        toast.error("Ошибка при генерации ответа. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },
  
  // Генерация автоответов для нескольких отзывов
  generateAutoAnswers: async (request: GenerateAutoAnswersRequest): Promise<Record<string, string>> => {
    const apiKey = getOpenaiApiKey();
    const { settings, reviews } = request;
    
    if (!reviews || reviews.length === 0) {
      throw new Error("Не указаны отзывы для генерации автоответов");
    }
    
    try {
      // Создаем строку с отзывами в нумерованном списке, включая рейтинг
      const reviewsText = reviews.map((review, index) => {
        const reviewText = review.text || review.pros || "Нет текста, только рейтинг";
        const productName = review.productName || '';
        const rating = review.rating || 0;
        
        return productName 
          ? `${index + 1}. Товар "${productName}" (${rating} звезд): "${reviewText}"`
          : `${index + 1}. (${rating} звезд): "${reviewText}"`;
      }).join("\n");
      
      // Выбираем модель в зависимости от количества отзывов
      const autoSelectModel = reviews.length >= 10 ? "gpt-4o" : "gpt-3.5-turbo";
      const modelToUse = settings.model === "auto" ? autoSelectModel : settings.model;
      
      console.log(`🤖 FeedbacksAI: Отправляем массовый запрос: ${reviews.length} отзывов, модель: ${modelToUse}`);
      
      // Системный промт для массовой генерации с учетом рейтинга
      let systemPrompt = settings.customPrompt || `
Ты — специалист клиентского сервиса. Отвечай на отзывы с учётом политики магазина:

- Для ХОРОШИХ отзывов (4-5 звезд): благодари, выражай радость, подчеркивай качество товара.
- Для НЕЙТРАЛЬНЫХ отзывов (3 звезды): благодари за обратную связь, деликатно предлагай помощь.
- Для ПЛОХИХ отзывов (1-2 звезды): извиняйся, проявляй эмпатию, предлагай решение.

- Не упоминай возврат духов, если клиент сам не просит.
- Отвечай ${settings.language === 'english' ? 'на английском' : (settings.language === 'kazakh' ? 'на казахском' : 'на русском')} языке.
- Пиши ${settings.tone === 'friendly' ? 'дружелюбно и неформально' : (settings.tone === 'formal' ? 'формально и вежливо' : 'профессионально и информативно')}.
${settings.useEmoji ? '- Используй эмодзи (1-2 на ответ).' : '- Не используй эмодзи в ответах.'}
- Не нумеруй ответы.
- Каждый отзыв — отдельный ответ. Пиши по 2–5 предложений.
- Учитывай рейтинг в звездах в каждом отзыве при составлении ответа.

Учитывай, что:
- За доставку отвечает Wildberries
- Магазин работает только с официальными поставщиками
- Парфюм возврату не подлежит, если вскрыт
${settings.signature ? `\n- Добавь в конце каждого ответа: "${settings.signature}"` : ''}

Ответы верни списком, без нумерации, в том же порядке, что и отзывы.`;
      
      // Рассчитываем оптимальное значение max_tokens в зависимости от количества отзывов
      const maxTokens = Math.min(4000, 300 * reviews.length);
      
      const response = await axios.post(
        OPENAI_API_BASE_URL,
        {
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: `Отзывы с рейтингами:\n\n${reviewsText}\n\nСформируй ответы под каждым номером отзыва, но без нумерации.`
            }
          ],
          temperature: settings.temperature || 0.7,
          max_tokens: maxTokens
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      const answersText = response.data.choices[0].message.content;
      console.log("FeedbacksAI: Generated auto-answers raw response:", answersText);
      
      // Разбиваем по абзацам, фильтруем пустые строки
      const answerParagraphs = answersText
        .split('\n')
        .filter(line => line.trim() !== '');
      
      console.log("FeedbacksAI: Parsed answer paragraphs:", answerParagraphs);
      
      // Создаем соответствие ответов и ID отзывов
      const answersMap: Record<string, string> = {};
      
      // Распределяем ответы по отзывам
      answerParagraphs.forEach((answer, index) => {
        if (index < reviews.length && answer.trim()) {
          const reviewId = reviews[index].id;
          
          // Удаляем возможную нумерацию из ответа (если вдруг модель вернула с нумерацией)
          const cleanAnswer = answer.replace(/^\d+\.\s*/, '');
          
          answersMap[reviewId] = cleanAnswer;
        }
      });
      
      console.log(`✅ FeedbacksAI: Успешно сгенерировано ${Object.keys(answersMap).length} ответов`);
      
      return answersMap;
    } catch (error) {
      console.error("FeedbacksAI: Error generating auto-answers with OpenAI:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка OpenAI: ${error.response.status} ${error.response.statusText}`);
        console.error("OpenAI error response:", error.response.data);
      } else {
        toast.error("Ошибка при генерации автоответов. Проверьте консоль для деталей.");
      }
      throw error;
    }
  }
};
