
# Справочник API эндпойнтов

## 1. Wildberries API

### 1.1 Базовая информация

- **Базовый URL**: `https://suppliers-api.wildberries.ru`
- **Авторизация**: Bearer Token в заголовке `Authorization`
- **Формат данных**: JSON
- **Кодировка**: UTF-8

### 1.2 Отзывы и вопросы

#### Получение списка отзывов

```http
GET /api/v1/feedbacks
```

**Headers:**
```
Authorization: Bearer {wb_api_token}
Content-Type: application/json
```

**Query Parameters:**
```javascript
{
  "isAnswered": false,     // true/false - отвеченные/неотвеченные
  "take": 10,             // количество записей (1-1000)
  "skip": 0,              // пропустить записей
  "order": "dateDesc",    // dateAsc, dateDesc, ratingAsc, ratingDesc
  "nmId": 12345,          // ID товара (опционально)
  "dateFrom": "2024-01-01", // дата от (YYYY-MM-DD)
  "dateTo": "2024-12-31",   // дата до (YYYY-MM-DD)
  "hasText": true         // только с текстом отзыва
}
```

**Response (200 OK):**
```json
{
  "data": {
    "countUnanswered": 25,
    "countArchive": 150,
    "feedbacks": [
      {
        "id": "fb12345",
        "nmId": 98765,
        "productName": "Название товара",
        "supplierArticle": "ART-001",
        "brandName": "Бренд",
        "text": "Текст отзыва покупателя",
        "pros": "Плюсы товара",
        "cons": "Минусы товара",
        "rating": 5,
        "createdDate": "2024-12-20T10:30:00Z",
        "userName": "Покупатель",
        "photoLinks": [
          {
            "fullSize": "https://feedback-photos.wildberries.ru/full/123.jpg",
            "miniSize": "https://feedback-photos.wildberries.ru/mini/123.jpg"
          }
        ],
        "answer": {
          "state": "published",
          "text": "Ответ продавца",
          "editable": true,
          "createDate": "2024-12-20T11:00:00Z"
        }
      }
    ]
  },
  "error": false,
  "errorText": ""
}
```

**Error Responses:**
- `401 Unauthorized` - неверный или отсутствующий токен
- `403 Forbidden` - недостаточно прав доступа
- `429 Too Many Requests` - превышен лимит запросов
- `500 Internal Server Error` - ошибка сервера WB

#### Отправка ответа на отзыв

```http
POST /api/v1/feedbacks
```

**Headers:**
```
Authorization: Bearer {wb_api_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "fb12345",
  "text": "Спасибо за ваш отзыв! Рады, что товар вам понравился."
}
```

**Response (200 OK):**
```json
{
  "error": false,
  "errorText": "",
  "data": {
    "feedbackId": "fb12345"
  }
}
```

#### Редактирование ответа на отзыв

```http
PATCH /api/v1/feedbacks
```

**Request Body:**
```json
{
  "id": "fb12345",
  "text": "Обновленный текст ответа на отзыв"
}
```

#### Получение вопросов покупателей

```http
GET /api/v1/questions
```

**Query Parameters:** (аналогично отзывам)
```javascript
{
  "isAnswered": false,
  "take": 10,
  "skip": 0,
  "order": "dateDesc"
}
```

**Response:**
```json
{
  "data": {
    "countUnanswered": 5,
    "countArchive": 45,
    "questions": [
      {
        "id": "q12345",
        "text": "Вопрос покупателя",
        "createdDate": "2024-12-20T10:30:00Z",
        "state": "none",
        "productDetails": {
          "nmId": 98765,
          "productName": "Название товара",
          "supplierArticle": "ART-001"
        },
        "answer": null,
        "wasViewed": false,
        "userName": "Покупатель"
      }
    ]
  }
}
```

#### Ответ на вопрос покупателя

```http
POST /api/v1/questions
```

**Request Body:**
```json
{
  "id": "q12345",
  "type": "answer",  // answer, edit, decline, markViewed
  "text": "Ответ на вопрос покупателя"
}
```

### 1.3 Сборочные задания (Автосборка)

#### Получение заказов для сборки

```http
GET /api/v3/orders/new
```

**Query Parameters:**
```javascript
{
  "take": 1000,        // количество заказов
  "skip": 0,
  "warehouseId": 123,  // ID склада (опционально)
  "cargoType": 1       // тип груза: 1-обычный, 2-крупногабаритный
}
```

**Response:**
```json
{
  "data": {
    "orders": [
      {
        "id": 12345,
        "orderUid": "order-uuid-123",
        "createdAt": "2024-12-20T10:30:00Z",
        "supplierArticle": "ART-001",
        "price": 1500,
        "salePrice": 1200,
        "nmId": 98765,
        "warehouseId": 321,
        "cargoType": 1
      }
    ]
  }
}
```

#### Создание поставки

```http
POST /api/v3/supplies
```

**Request Body:**
```json
{
  "name": "Поставка от 2024-12-20"
}
```

**Response:**
```json
{
  "data": {
    "supplyId": 54321
  },
  "error": false
}
```

#### Добавление заказа в поставку

```http
PATCH /api/v3/supplies/{supplyId}
```

**Request Body:**
```json
{
  "orderId": 12345
}
```

#### Получение информации о поставках

```http
GET /api/v3/supplies
```

**Response:**
```json
{
  "data": {
    "supplies": [
      {
        "id": 54321,
        "name": "Поставка от 2024-12-20",
        "createdAt": "2024-12-20T10:30:00Z",
        "done": false,
        "closedAt": null,
        "ordersCount": 15
      }
    ]
  }
}
```

### 1.4 Карточки товаров

#### Получение информации о товарах

```http
POST /content/v2/get/cards/list
```

**Base URL**: `https://content-api.wildberries.ru`

**Request Body:**
```json
{
  "settings": {
    "cursor": {
      "limit": 100
    },
    "filter": {
      "nmID": [12345, 67890, 54321]
    }
  }
}
```

**Response:**
```json
{
  "cards": [
    {
      "nmID": 12345,
      "name": "Название товара",
      "brand": "Бренд",
      "article": "ART-001",
      "subjectName": "Категория товара",
      "photos": [
        {
          "big": "https://images.wbstatic.net/big/12345.jpg",
          "c246x328": "https://images.wbstatic.net/c246x328/12345.jpg"
        }
      ],
      "sizes": [
        {
          "name": "M",
          "value": "M"
        }
      ]
    }
  ]
}
```

### 1.5 Лимиты и ограничения

| Эндпойнт | Лимит запросов | Лимит записей | Особенности |
|----------|----------------|---------------|-------------|
| `/api/v1/feedbacks` | 100/мин | 1000/запрос | Кэширование 5 мин |
| `/api/v1/questions` | 100/мин | 1000/запрос | Кэширование 5 мин |
| `/api/v3/orders/new` | 200/мин | 1000/запрос | Данные в реальном времени |
| `/api/v3/supplies` | 300/мин | - | CRUD операции |
| `/content/v2/get/cards/list` | 100/мин | 100/запрос | Тяжелые запросы |

## 2. OpenAI API

### 2.1 Базовая информация

- **Базовый URL**: `https://api.openai.com/v1`
- **Авторизация**: Bearer Token в заголовке `Authorization`
- **Формат данных**: JSON

### 2.2 Генерация ответов на отзывы

#### Chat Completions API

```http
POST /chat/completions
```

**Headers:**
```
Authorization: Bearer {openai_api_key}
Content-Type: application/json
```

**Request Body:**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "Ты — специалист клиентского сервиса магазина на Wildberries..."
    },
    {
      "role": "user", 
      "content": "Отзыв на товар \"Футболка\" с оценкой 5 звезд: Отличная футболка, хорошее качество!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

**Response (200 OK):**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Спасибо огромное за такой позитивный отзыв! 😊 Очень рады, что наша футболка оправдала ваши ожидания и качество вас порадовало. Ваше мнение очень важно для нас!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 45,
    "total_tokens": 195
  }
}
```

### 2.3 Доступные модели

| Модель | Назначение | Цена (на 1K токенов) | Лимиты |
|--------|------------|---------------------|--------|
| `gpt-3.5-turbo` | Стандартные ответы | $0.0015 / $0.002 | 4,096 токенов |
| `gpt-4o` | Сложные отзывы | $0.03 / $0.06 | 8,192 токена |
| `gpt-4o-mini` | Быстрые ответы | $0.00015 / $0.0006 | 16,384 токена |

### 2.4 Обработка ошибок OpenAI

**Error Responses:**

```json
// 401 Unauthorized
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}

// 429 Rate Limit
{
  "error": {
    "message": "Rate limit reached",
    "type": "insufficient_quota",
    "code": "rate_limit_exceeded"
  }
}

// 400 Bad Request
{
  "error": {
    "message": "Invalid request format",
    "type": "invalid_request_error",
    "code": "invalid_request"
  }
}
```

### 2.5 Оптимизация запросов

#### Системные промпты для разных типов отзывов:

**Позитивные отзывы (4-5 звезд):**
```
Отвечай радостно и с благодарностью. Подчеркни качество товара и сервиса. Используй эмодзи 😊🎉👍. Длина ответа: 20-40 слов.
```

**Негативные отзывы (1-2 звезды):**
```
Проявляй эмпатию и извинись за неудобства. Предложи решение проблемы или компенсацию. Тон серьезный, но дружелюбный. Длина: 40-80 слов.
```

**Нейтральные отзывы (3 звезды):**
```
Поблагодари за обратную связь. Деликатно узнай, что можно улучшить. Предложи помощь. Длина: 30-50 слов.
```

## 3. Интеграция в приложении

### 3.1 Обработка ошибок

```typescript
// Универсальный обработчик ошибок API
export const handleApiError = (error: any) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.errorText || error.message;
    
    switch (status) {
      case 401:
        return {
          type: 'auth',
          message: 'Токен недействителен или отозван',
          action: 'refreshToken'
        };
      case 403:
        return {
          type: 'permission',
          message: 'Недостаточно прав доступа',
          action: 'checkPermissions'
        };
      case 429:
        return {
          type: 'rateLimit',
          message: 'Превышен лимит запросов',
          action: 'retryLater'
        };
      case 500:
        return {
          type: 'server',
          message: 'Ошибка сервера',
          action: 'retryRequest'
        };
      default:
        return {
          type: 'unknown',
          message: message,
          action: 'showError'
        };
    }
  }
  
  return {
    type: 'network',
    message: 'Ошибка сети',
    action: 'checkConnection'
  };
};
```

### 3.2 Кэширование запросов

```typescript
// Простое кэширование с TTL
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000) { // 5 минут по умолчанию
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
```

### 3.3 Повторные попытки

```typescript
// Утилита для повторных запросов с экспоненциальной задержкой
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Не повторяем при ошибках клиента (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
```

## 4. Мониторинг и метрики

### 4.1 Логирование API запросов

```typescript
// Middleware для логирования всех API запросов
export const apiLogger = {
  logRequest: (url: string, method: string, data?: any) => {
    console.log(`[API] ${method} ${url}`, {
      timestamp: new Date().toISOString(),
      data: data ? JSON.stringify(data).substring(0, 200) : null
    });
  },
  
  logResponse: (url: string, status: number, duration: number) => {
    console.log(`[API] Response ${status} for ${url}`, {
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },
  
  logError: (url: string, error: any) => {
    console.error(`[API] Error for ${url}`, {
      message: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString()
    });
  }
};
```

### 4.2 Метрики производительности

```typescript
// Сбор метрик API запросов
class ApiMetrics {
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    responseTimeHistory: [] as number[]
  };
  
  recordRequest(duration: number, success: boolean) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    this.metrics.responseTimeHistory.push(duration);
    if (this.metrics.responseTimeHistory.length > 100) {
      this.metrics.responseTimeHistory.shift();
    }
    
    this.metrics.averageResponseTime = 
      this.metrics.responseTimeHistory.reduce((a, b) => a + b, 0) / 
      this.metrics.responseTimeHistory.length;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
        : 0
    };
  }
  
  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimeHistory: []
    };
  }
}

export const apiMetrics = new ApiMetrics();
```

## 5. Тестирование API

### 5.1 Примеры тестовых запросов

#### Тестирование подключения к Wildberries:

```bash
# Проверка токена
curl -X GET "https://suppliers-api.wildberries.ru/api/v1/feedbacks?take=1" \
  -H "Authorization: Bearer YOUR_WB_TOKEN" \
  -H "Content-Type: application/json"
```

#### Тестирование OpenAI:

```bash
# Проверка API ключа
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test message"}],
    "max_tokens": 50
  }'
```

### 5.2 Отладочные эндпойнты

```typescript
// Создание отладочных эндпойнтов для тестирования
export const debugEndpoints = {
  // Проверка подключения к WB API
  testWbConnection: async () => {
    try {
      const response = await axios.get('/api/v1/feedbacks?take=1', {
        headers: { Authorization: `Bearer ${WB_TOKEN}` }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Проверка OpenAI API
  testOpenAiConnection: async () => {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      }, {
        headers: { Authorization: `Bearer ${OPENAI_KEY}` }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
```

---

## Заключение

Данный справочник содержит исчерпывающую информацию обо всех API эндпойнтах, используемых в системе управления отзывами Wildberries. Регулярно обновляйте токены доступа и следите за лимитами использования API для обеспечения стабильной работы системы.

---
*Последнее обновление: 2024*
*Версия справочника: 1.0*
