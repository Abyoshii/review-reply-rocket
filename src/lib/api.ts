
import axios from "axios";
import { ReviewListParams, WbReviewsResponse, WbAnswerRequest, WbAnswerResponse } from "@/types/wb";
import { GenerateAnswerRequest, GenerateAnswerResponse } from "@/types/openai";
import { toast } from "sonner";

// WB API
const WB_API_BASE_URL = "https://feedbacks-api.wildberries.ru/api/v1/feedbacks";
// Дефолтный токен, будет использоваться если пользователь не указал свой
const DEFAULT_WB_TOKEN = "Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTIyNTE5NSwiaWQiOiIwMTk1ZWUyNS05NDA3LTczZTAtYTA0Mi0wZTExNTc4NTIwNDQiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6NjQyLCJzaWQiOiJlNmFjNjYwNC0xZDIxLTQxNWMtOTA1ZC0zZGMwYzRhOGYyYmUiLCJ0IjpmYWxzZSwidWlkIjo1MDEwOTI3MH0.uLCv4lMfwG2cr6JG-kR7y_xAFYOKN5uW0YQiCyR4Czyh33LICsgKrvaYfxmrCPHtWMBbSQWqQjBq-SVSJWwefg";

// Получение токена WB из localStorage или использование дефолтного
const getWbToken = (): string => {
  const token = localStorage.getItem("wb_token");
  return token || DEFAULT_WB_TOKEN;
};

// Получение токена OpenAI из localStorage
const getOpenaiApiKey = (): string | null => {
  return localStorage.getItem("openai_api_key");
};

// WB API
export const WbAPI = {
  // Получение списка отзывов
  getReviews: async (params: ReviewListParams): Promise<WbReviewsResponse> => {
    try {
      console.log("Fetching reviews with params:", params);
      console.log("Using WB token:", getWbToken());
      
      const response = await axios.get(WB_API_BASE_URL, {
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
      const response = await axios.post(`${WB_API_BASE_URL}/answer`, data, {
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
  
  // Получение количества неотвеченных отзывов
  getUnansweredCount: async (): Promise<number> => {
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/count-unanswered`, {
        headers: {
          Authorization: getWbToken(),
          "Content-Type": "application/json",
        },
      });
      
      return response.data.data.count || 0;
    } catch (error) {
      console.error("Error fetching unanswered count:", error);
      return 0;
    }
  },
};

// OpenAI API
const OPENAI_API_BASE_URL = "https://api.openai.com/v1/chat/completions";

export const OpenAIAPI = {
  // Генерация ответа на отзыв
  generateAnswer: async (request: GenerateAnswerRequest): Promise<GenerateAnswerResponse> => {
    const apiKey = getOpenaiApiKey();
    if (!apiKey) {
      toast.error("API ключ OpenAI не найден. Пожалуйста, добавьте его в настройках.");
      throw new Error("OpenAI API key not found");
    }
    
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
  }
};
