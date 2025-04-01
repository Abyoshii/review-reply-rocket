
import { ReviewListParams, WbAnswerRequest, WbReviewsResponse, WbAnswerResponse } from "@/types/wb";
import { GenerateAnswerRequest, GenerateAnswerResponse, OpenAIRequest, OpenAIResponse } from "@/types/openai";
import { toast } from "@/components/ui/sonner";

// Константы для API
const WB_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTIyNTE5NSwiaWQiOiIwMTk1ZWUyNS05NDA3LTczZTAtYTA0Mi0wZTExNTc4NTIwNDQiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6NjQyLCJzaWQiOiJlNmFjNjYwNC0xZDIxLTQxNWMtOTA1ZC0zZGMwYzRhOGYyYmUiLCJ0IjpmYWxzZSwidWlkIjo1MDEwOTI3MH0.uLCv4lMfwG2cr6JG-kR7y_xAFYOKN5uW0YQiCyR4Czyh33LICsgKrvaYfxmrCPHtWMBbSQWqQjBq-SVSJWwefg";
const OPENAI_API_KEY = "sk-YOUR-OPENAI-KEY"; // Здесь нужно заменить на реальный ключ API OpenAI

// Класс для ограничения частоты запросов (rate limiting)
class RateLimiter {
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing: boolean = false;

  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.requestQueue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, 1000 - timeSinceLastRequest); // Задержка не менее 1 секунды между запросами

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const request = this.requestQueue.shift();
    if (request) {
      this.lastRequestTime = Date.now();
      try {
        await request();
      } catch (error) {
        console.error("Error processing request:", error);
      }
    }

    // Обработка следующего запроса в очереди
    this.processQueue();
  }
}

const wbRateLimiter = new RateLimiter();

// API для работы с WB
export const WbAPI = {
  // Получение списка отзывов
  async getReviews(params: ReviewListParams): Promise<WbReviewsResponse> {
    const queryParams = new URLSearchParams();
    
    queryParams.append("isAnswered", params.isAnswered.toString());
    queryParams.append("take", params.take.toString());
    queryParams.append("skip", params.skip.toString());
    
    if (params.order) {
      queryParams.append("order", params.order);
    }
    
    if (params.nmId) {
      queryParams.append("nmId", params.nmId.toString());
    }
    
    if (params.dateFrom) {
      queryParams.append("dateFrom", params.dateFrom);
    }
    
    if (params.dateTo) {
      queryParams.append("dateTo", params.dateTo);
    }

    return wbRateLimiter.enqueue(async () => {
      try {
        const response = await fetch(
          `https://feedbacks-api.wildberries.ru/api/v1/feedbacks?${queryParams.toString()}`, 
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${WB_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Ошибка при получении отзывов: ${errorData.message || response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Ошибка при получении отзывов:", error);
        toast.error("Не удалось получить отзывы. Пожалуйста, попробуйте позже.");
        throw error;
      }
    });
  },

  // Отправка ответа на отзыв
  async sendAnswer(request: WbAnswerRequest): Promise<WbAnswerResponse> {
    return wbRateLimiter.enqueue(async () => {
      try {
        const response = await fetch(
          "https://feedbacks-api.wildberries.ru/api/v1/feedbacks/answer", 
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${WB_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Ошибка при отправке ответа: ${errorData.message || response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Ошибка при отправке ответа:", error);
        toast.error("Не удалось отправить ответ. Пожалуйста, попробуйте позже.");
        throw error;
      }
    });
  },

  // Получение количества необработанных отзывов
  async getUnansweredCount(): Promise<number> {
    return wbRateLimiter.enqueue(async () => {
      try {
        const response = await fetch(
          "https://feedbacks-api.wildberries.ru/api/v1/feedbacks/count-unanswered", 
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${WB_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Ошибка при получении количества отзывов: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return data.data.countUnanswered;
      } catch (error) {
        console.error("Ошибка при получении количества отзывов:", error);
        toast.error("Не удалось получить количество отзывов. Пожалуйста, попробуйте позже.");
        throw error;
      }
    });
  }
};

// API для работы с OpenAI
export const OpenAIAPI = {
  // Генерация ответа на отзыв
  async generateAnswer(request: GenerateAnswerRequest): Promise<GenerateAnswerResponse> {
    try {
      // Определение модели в зависимости от длины и содержания отзыва
      const reviewText = request.reviewText;
      let model = "gpt-3.5-turbo";
      
      // Если отзыв длинный или содержит агрессивный тон, используем более мощную модель
      if (
        reviewText.length > 400 || 
        /негатив|ужас|отврат|плох|некачеств|отстой|верн|неуд|гнев|злость|раздраж|раздраж|подделк|фейк/i.test(reviewText)
      ) {
        model = "gpt-4o";
      }

      const openAIRequest: OpenAIRequest = {
        model: model,
        messages: [
          {
            role: "system",
            content: "Ты — специалист клиентского сервиса интернет-магазина. На основе отзыва напиши дружелюбный, живой и полезный ответ из 3–5 предложений. Используй подходящие эмодзи, избегай шаблонных фраз. \n\nЕсли клиент хочет вернуть парфюм, объясни, что открытые или использованные духи возврату не подлежат. Если клиент получил не тот товар, извинись и уточни, что товар нужно вернуть, не используя его. Если клиент обвиняет магазин в продаже подделки или проявляет агрессию, используй лёгкую иронию или юмор, сохраняя уважение. Если товар был повреждён при доставке, вежливо объясни, что ответственность за это несёт служба доставки Wildberries, и предложи обратиться туда напрямую."
          },
          {
            role: "user",
            content: `Отзыв: ${reviewText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      };

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions", 
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(openAIRequest)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Ошибка при генерации ответа: ${errorData.error?.message || response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      return {
        answer: data.choices[0].message.content,
        modelUsed: model
      };
    } catch (error) {
      console.error("Ошибка при генерации ответа:", error);
      toast.error("Не удалось сгенерировать ответ. Пожалуйста, попробуйте позже.");
      throw error;
    }
  }
};
