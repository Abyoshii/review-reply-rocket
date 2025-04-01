
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
              content: "Ты — специалист клиентского сервиса интернет-магазина. На основе отзыва напиши дружелюбный, живой и полезный ответ из 3–5 предложений. Используй подходящие эмодзи, избегай шаблонных фраз. Если клиент хочет вернуть парфюм, объясни, что открытые или использованные духи возврату не подлежат. Если клиент получил не тот товар, извинись и уточни, что товар нужно вернуть, не используя его. Если клиент обвиняет магазин в продаже подделки или проявляет агрессию, используй лёгкую иронию или юмор, сохраняя уважение. Если товар был повреждён при доставке, вежливо объясни, что ответственность за это несёт служба доставки Wildberries, и предложи обратиться туда напрямую."
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
      
      // Выбираем язык системного сообщения
      let systemPrompt = "Ты — специалист клиентского сервиса в интернет-магазине, продающем товары через Wildberries. Отвечай кратко (3–5 предложений)";
      
      // Добавляем стиль
      switch(settings.tone) {
        case "professional":
          systemPrompt += ", профессионально и по делу";
          break;
        case "friendly":
          systemPrompt += ", дружелюбно и с заботой";
          break;
        case "formal":
          systemPrompt += " в формальном деловом тоне";
          break;
      }
      
      // Добавляем эмодзи
      if (settings.useEmoji) {
        systemPrompt += ", используя подходящие эмодзи";
      } else {
        systemPrompt += ", без использования эмодзи";
      }
      
      // Добавляем основные правила
      systemPrompt += `.\n\nПравила:
- Балансируй плюсы и минусы.
- Если хотят вернуть открытый парфюм — вежливо откажи.
- Если получили не тот товар — извинись и попроси вернуть неиспользованным.
- Если жалоба на подделку — легко пошути, что подделок не продаём.
- Если повреждение при доставке — направь в поддержку Wildberries.

Ответы нумеруй строго так же, как в списке отзывов, чтобы можно было точно сопоставить.\n`;

      // Добавляем подпись если указана
      if (settings.signature) {
        systemPrompt += `\nДобавляй в конце каждого ответа: "${settings.signature}"\n`;
      }
      
      const response = await axios.post(
        OPENAI_API_BASE_URL,
        {
          model: settings.model,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: reviewsText
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      const answersText = response.data.choices[0].message.content;
      console.log("Generated auto-answers:", answersText);
      
      // Парсим ответы - ищем числа в начале строк и считаем их ответами
      const answerLines = answersText.split("\n");
      const answersMap: Record<string, string> = {};
      
      let currentIndex = -1;
      let currentAnswer = "";
      
      for (const line of answerLines) {
        // Проверяем, начинается ли строка с числа и точки (например "1. ")
        const match = line.match(/^(\d+)\.\s+(.+)/);
        
        if (match) {
          // Если у нас уже был предыдущий ответ, сохраняем его
          if (currentIndex >= 0 && currentAnswer) {
            const reviewId = reviews[currentIndex]?.id;
            if (reviewId) {
              answersMap[reviewId] = currentAnswer.trim();
            }
          }
          
          // Начинаем новый ответ
          currentIndex = parseInt(match[1]) - 1;
          currentAnswer = match[2];
        } else if (currentIndex >= 0) {
          // Продолжаем текущий ответ
          currentAnswer += " " + line;
        }
      }
      
      // Добавляем последний ответ
      if (currentIndex >= 0 && currentAnswer) {
        const reviewId = reviews[currentIndex]?.id;
        if (reviewId) {
          answersMap[reviewId] = currentAnswer.trim();
        }
      }
      
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
