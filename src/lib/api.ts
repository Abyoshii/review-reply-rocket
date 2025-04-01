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
  AutoResponderSettings
} from "@/types/openai";
import { toast } from "sonner";

// WB API
const WB_API_BASE_URL = "https://feedbacks-api.wildberries.ru/api/v1";
const FEEDBACKS_URL = `${WB_API_BASE_URL}/feedbacks`;
const QUESTIONS_URL = `${WB_API_BASE_URL}/questions`;

// Дефолтный токен, будет использоваться если пользователь не указал свой
const DEFAULT_WB_TOKEN = "Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTIyNTE5NSwiaWQiOiIwMTk1ZWUyNS05NDA3LTczZTAtYTA0Mi0wZTExNTc4NTIwNDQiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6NjQyLCJzaWQiOiJlNmFjNjYwNC0xZDIxLTQxNWMtOTA1ZC0zZGMwYzRhOGYyYmUiLCJ0IjpmYWxzZSwidWlkIjo1MDEwOTI3MH0.uLCv4lMfwG2cr6JG-kR7y_xAFYOKN5uW0YQiCyR4Czyh33LICsgKrvaYfxmrCPHtWMBbSQWqQjBq-SVSJWwefg";
const DEFAULT_OPENAI_API_KEY = "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";

// Получение токена WB из localStorage или использование дефолтного
const getWbToken = (): string => {
  const token = localStorage.getItem("wb_token");
  return token || DEFAULT_WB_TOKEN;
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
          Authorization: getWbToken(),
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
          Authorization: getWbToken(),
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
          Authorization: getWbToken(),
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
          Authorization: getWbToken(),
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
          Authorization: getWbToken(),
          "Content-Type": "application/json",
        },
        params: {
          isAnswered: false,
          take: 1,  // Запрашиваем только один отзыв, нам нужен только count
          skip: 0,
        },
      });
      
      console.log("Unanswered count response:", response.data);
      
      // Проверяем структуру ответа
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
          Authorization: getWbToken(),
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
          Authorization: getWbToken(),
          "Content-Type": "application/json",
        },
      });
      
      console.log("Unanswered questions count response:", response.data);
      
      // Проверяем структуру ответа
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
          Authorization: getWbToken(),
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

export const OpenAIAPI = {
  // Генерация ответа на отзыв
  generateAnswer: async (request: GenerateAnswerRequest): Promise<GenerateAnswerResponse> => {
    const apiKey = getOpenaiApiKey();
    
    // Определение сложности отзыва и выбор модели
    const isComplexReview = request.reviewText.length > 400 || 
      /плох|ужас|гнев|разоча|обман|верн|прете|ужас|отврат|жаль|поддел|фейк/i.test(request.reviewText);
    
    const model = isComplexReview ? "gpt-4o" : "gpt-3.5-turbo";
    
    try {
      const response = await axios.post(
        OPENAI_API_BASE_URL,
        {
          model: model,
          messages: [
            {
              role: "system",
              content: "Ты — специалист клиентского сервиса магазина на Wildberries. На основе отзыва составь человечный, корректный и живой ответ (3-5 предложений). Используй эмодзи (не больше 2-3), пиши дружелюбно, избегай шаблонов. Не придумывай, пиши только по содержанию отзыва. Если отзыв без текста, но с оценкой — поблагодари за оценку. Особые правила: 1) Парфюмы после вскрытия возврату не подлежат, даже если товар не тот или не понравился запах. 2) Если прислали не тот товар (и он не вскрыт) - извинись и предложи оформить возврат. 3) При жалобах на подделку - отвечай спокойно с лёгкой иронией, что работаете только с проверенными поставщиками. 4) За повреждения при доставке отвечает Wildberries - рекомендуй обратиться в их поддержку."
            },
            {
              role: "user",
              content: `Отзыв: ${request.reviewText}`
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
      // Создаем строку с отзывами в нумерованном списке
      const reviewsText = reviews.map((review, index) => {
        const reviewText = review.text || review.pros || "Нет текста, только рейтинг";
        return `${index + 1}. "${reviewText}"`;
      }).join("\n");
      
      // Выбираем модель в зависимости от количества отзывов
      const autoSelectModel = reviews.length >= 10 ? "gpt-4o" : "gpt-3.5-turbo";
      const modelToUse = settings.model === "auto" ? autoSelectModel : settings.model;
      
      console.log(`🤖 Отправляем массовый запрос: ${reviews.length} отзывов, модель: ${modelToUse}`);
      
      // Системный промт для массовой генерации
      let systemPrompt = settings.customPrompt || `
Ты — специалист клиентского сервиса. Отвечай на отзывы с учётом политики магазина:

- Не упоминай возврат духов, если клиент сам не просит.
- Отвечай ${settings.language === 'english' ? 'на английском' : (settings.language === 'kazakh' ? 'на казахском' : 'на русском')} языке.
- Пиши ${settings.tone === 'friendly' ? 'дружелюбно и неформально' : (settings.tone === 'formal' ? 'формально и вежливо' : 'профессионально и информативно')}.
${settings.useEmoji ? '- Используй эмодзи (1-2 на ответ).' : '- Не используй эмодзи в ответах.'}
- Не нумеруй ответы.
- Каждый отзыв — отдельный ответ. Пиши по 2–5 предложений.
- Если отзыв содержит плюсы и минусы — прокомментируй оба.
- Отвечай так, чтобы человек поверил, что пишет реальный менеджер.

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
              content: `Отзывы:\n\n${reviewsText}\n\nСформируй ответы под каждым номером отзыва, но без нумерации.`
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
