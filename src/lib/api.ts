import axios from "axios";
import { 
  ReviewListParams, 
  WbReviewsResponse, 
  WbAnswerRequest, 
  WbAnswerResponse,
  QuestionListParams,
  WbQuestionsResponse,
  WbQuestionAnswerRequest,
  WbQuestionAnswerResponse,
  WbEditAnswerRequest,
  WbEditAnswerResponse,
  WbArchiveReviewsResponse
} from "@/types/wb";
import { 
  GenerateAnswerRequest, 
  GenerateAnswerResponse,
  GenerateAutoAnswersRequest, 
  AutoResponderSettings,
  ReviewRatingType
} from "@/types/openai";
import { toast } from "sonner";

// WB API base URLs and token handling
const WB_API_BASE_URL = "https://feedbacks-api.wildberries.ru/api/v1";
const FEEDBACKS_URL = `${WB_API_BASE_URL}/feedbacks`;
const QUESTIONS_URL = `${WB_API_BASE_URL}/questions`;

// Единый токен для всех API
const UNIFIED_WB_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTcxOTY3NywiaWQiOiIwMTk2MGI5ZS1jOGU2LTcxMDUtYjU2MC1lMTU2YzA4OWQwZDYiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6MTI4LCJzaWQiOiJlNmFjNjYwNC0xZDIxLTQxNWMtOTA1ZC0zZGMwYzRhOGYyYmUiLCJ0IjpmYWxzZSwidWlkIjo1MDEwOTI3MH0.ast0KkuIGky-fGx5nm3ZKeW0Y1-oCIcRPl104niIGBwWzJrKdsOn3cmYh0qoE6Wti1Cc5oCQLy2g94coavG0eQ";
const DEFAULT_OPENAI_API_KEY = "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";

// Получение токена WB из localStorage или использование единого токена
const getWbToken = (): string => {
  const token = localStorage.getItem("wb_token");
  return token || UNIFIED_WB_TOKEN;
};

// Получение токена OpenAI из localStorage или использование дефолтного
const getOpenaiApiKey = (): string => {
  const token = localStorage.getItem("openai_api_key");
  return token || DEFAULT_OPENAI_API_KEY;
};

// WB API
export const WbAPI = {
  // Получение списка отзывов
  getReviews: async (params: ReviewListParams): Promise<WbReviewsResponse> => {
    try {
      console.log("Fetching reviews with params:", params);
      console.log("Using WB token:", getWbToken());
      
      const response = await axios.get(FEEDBACKS_URL, {
        headers: {
          Authorization: `Bearer ${getWbToken()}`,
          "Content-Type": "application/json",
        },
        params: params,
      });
      
      console.log("WB API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка получения отзывов: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка получения отзывов. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },
  
  // Отправка ответа на отзыв
  sendAnswer: async (data: WbAnswerRequest): Promise<WbAnswerResponse> => {
    try {
      const response = await axios.post(`${FEEDBACKS_URL}/answer`, data, {
        headers: {
          Authorization: `Bearer ${getWbToken()}`,
          "Content-Type": "application/json",
        },
      });
      
      return response.data;
    } catch (error) {
      console.error("Error sending answer:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка отправки ответа: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка отправки ответа. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },

  // Редактирование ответа на отзыв
  editAnswer: async (data: WbEditAnswerRequest): Promise<WbEditAnswerResponse> => {
    try {
      const response = await axios.patch(`${FEEDBACKS_URL}/answer`, data, {
        headers: {
          Authorization: `Bearer ${getWbToken()}`,
          "Content-Type": "application/json",
        },
      });
      
      return response.data;
    } catch (error) {
      console.error("Error editing answer:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка редактирования ответа: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка редактирования ответа. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },
  
  // Получение архивных отзывов
  getArchiveReviews: async (params: ReviewListParams): Promise<WbArchiveReviewsResponse> => {
    try {
      console.log("Fetching archive reviews with params:", params);
      
      const response = await axios.get(`${FEEDBACKS_URL}/archive`, {
        headers: {
          Authorization: `Bearer ${getWbToken()}`,
          "Content-Type": "application/json",
        },
        params: params,
      });
      
      console.log("WB API Archive Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching archive reviews:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка получения архивных отзывов: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка получения архивных отзывов. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },
  
  // Получение количества неотвеченных отзывов
  getUnansweredCount: async (): Promise<number> => {
    try {
      console.log("Fetching unanswered count...");
      const response = await axios.get(FEEDBACKS_URL, {
        headers: {
          Authorization: `Bearer ${getWbToken()}`,
          "Content-Type": "application/json",
        },
        params: {
          isAnswered: false,
          take: 1,
          skip: 0,
        },
      });
      
      console.log("Unanswered count response:", response.data);
      
      if (response.data && response.data.data && typeof response.data.data.countUnanswered === 'number') {
        return response.data.data.countUnanswered;
      } else {
        console.error("Некорректная структура ответа API при получении количества неотвеченных отзывов:", response.data);
        return 0;
      }
    } catch (error) {
      console.error("Error fetching unanswered count:", error);
      return 0;
    }
  },

  // Получение списка вопросов
  getQuestions: async (params: QuestionListParams): Promise<WbQuestionsResponse> => {
    try {
      console.log("Fetching questions with params:", params);
      
      const response = await axios.get(QUESTIONS_URL, {
        headers: {
          Authorization: `Bearer ${getWbToken()}`,
          "Content-Type": "application/json",
        },
        params: params,
      });
      
      console.log("WB API Questions Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching questions:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка получения вопросов: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка получения вопросов. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },

  // Получение количества неотвеченных вопросов
  getUnansweredQuestionsCount: async (): Promise<number> => {
    try {
      console.log("Fetching unanswered questions count...");
      const response = await axios.get(`${QUESTIONS_URL}/count-unanswered`, {
        headers: {
          Authorization: `Bearer ${getWbToken()}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log("Unanswered questions count response:", response.data);
      
      if (response.data && response.data.data && typeof response.data.data.count === 'number') {
        return response.data.data.count;
      } else {
        console.error("Некорректная структура ответа API при получении количества неотвеченных вопросов:", response.data);
        return 0;
      }
    } catch (error) {
      console.error("Error fetching unanswered questions count:", error);
      return 0;
    }
  },

  // Работа с вопросом (ответ, редактирование, отклонение, отметка просмотренным)
  handleQuestion: async (data: WbQuestionAnswerRequest): Promise<WbQuestionAnswerResponse> => {
    try {
      const response = await axios.patch(QUESTIONS_URL, data, {
        headers: {
          Authorization: `Bearer ${getWbToken()}`,
          "Content-Type": "application/json",
        },
      });
      
      return response.data;
    } catch (error) {
      console.error("Error handling question:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка при работе с вопросом: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка при работе с вопросом. Проверьте консоль для деталей.");
      }
      throw error;
    }
  }
};

// OpenAI API
const OPENAI_API_BASE_URL = "https://api.openai.com/v1/chat/completions";

// Определение типа отзыва на основе рейтинга
const getRatingType = (rating: number): ReviewRatingType => {
  if (rating >= 4) return { type: "positive", rating };
  if (rating === 3) return { type: "neutral", rating };
  return { type: "negative", rating };
};

export const OpenAIAPI = {
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
      console.log("Sending to OpenAI:", {
        reviewId: request.reviewId,
        reviewText: request.reviewText,
        productName: request.productName,
        rating: request.rating,
        ratingType: ratingInfo.type,
        model: model
      });
      
      // Новый системный промт, одинаковый для всех типов отзывов
      const systemPrompt = `Ты — специалист клиентского сервиса магазина на Wildberries. Твоя задача — писать ответы на отзывы покупателей.

Пиши на русском, дружелюбно, тепло, с добрым и с��етлым юмором.  
Обращайся на ВЫ, как будто общаешься с хорошими людьми 😊

🔹 Правила:
- Отвечай коротко: 3–5 предложений
- Пиши живо, как человек, а не робот
- Добавляй эмодзи (1–2 на ответ), чтобы было тепло и уютно
- Если отзыв с оценкой без текста — просто поблагодари
- Если в отзыве есть и плюсы, и минусы — обязательно упомяни оба
- Не придумывай — отвечай только по содержанию отзыва
- Не упоминай воз��рат, если клиент не просил
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
      console.error("Error generating answer with OpenAI:", error);
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
      
      console.log(`🤖 Отправляем массовый запрос: ${reviews.length} отзывов, модель: ${modelToUse}`);
      
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
      console.log("Generated auto-answers raw response:", answersText);
      
      // Разбиваем по абзацам, фильтруем пустые строки
      const answerParagraphs = answersText
        .split('\n')
        .filter(line => line.trim() !== '');
      
      console.log("Parsed answer paragraphs:", answerParagraphs);
      
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
      
      console.log(`✅ Успешно сгенерировано ${Object.keys(answersMap).length} ответов`);
      
      return answersMap;
    } catch (error) {
      console.error("Error generating auto-answers with OpenAI:", error);
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
