// Типы для работы с API Wildberries

export interface WbReview {
  id: string;
  nmId: number;
  productName: string;
  supplierArticle: string;
  subjectName: string;
  brandName: string;
  productsArticle: string;
  text?: string | null; // Текст отзыва может быть null или undefined
  pros?: string;
  cons?: string;
  createdDate: string;
  lastModifiedDate: string;
  photoLinks: PhotoLink[] | null;
  size: string;
  rating: number;
  productValuation?: number;
  color: string;
  wbUserDetails?: {
    name: string;
    height: number;
    weight: number;
    gender: string;
  };
  answer: {
    state: "none" | "declined" | "wbRejected" | "published";
    text: string;
    editable: boolean;
    createDate: string;
    declinedModerationComment: string;
  } | null;
  video: {
    previewImage?: string;
    link?: string;
    uri?: string;
    thumbnail?: string;
    durationSec?: number;
  } | null;
  productDetails?: {
    imtId: number;
    nmId: number;
    productName: string;
    supplierArticle: string;
    supplierName: string;
    brandName: string;
    size: string;
    image?: string; 
    category?: string; 
  };
  wasViewed?: boolean;
  userName?: string;
  matchingSize?: string;
  lastOrderCreatedAt?: string;
}

export interface PhotoLink {
  fullSize: string;
  miniSize: string;
}

export interface WbReviewsResponse {
  data: {
    countUnanswered: number;
    countArchive: number;
    feedbacks: WbReview[];
  };
  error?: boolean;
  errorText?: string;
}

export interface WbArchiveReviewsResponse {
  data: {
    count: number;
    feedbacks: WbReview[];
  };
  error?: boolean;
  errorText?: string;
}

export interface WbAnswerRequest {
  id: string;
  text: string;
}

export interface WbAnswerResponse {
  error: boolean;
  errorText: string;
  data: {
    feedbackId: string;
  };
}

export interface WbEditAnswerRequest {
  id: string;
  text: string;
}

export interface WbEditAnswerResponse {
  error: boolean;
  errorText: string;
  data: {
    feedbackId: string;
  };
}

export interface ReviewListParams {
  isAnswered?: boolean;
  take: number;
  skip: number;
  order?: "dateAsc" | "dateDesc" | "ratingAsc" | "ratingDesc";
  nmId?: number;
  dateFrom?: string;
  dateTo?: string;
  hasText?: boolean;
  ratingFilter?: string; // Добавлено поле для фильтрации по рейтингу
}

// Типы для работы с вопросами клиентов
export interface WbQuestion {
  id: string;
  text: string;
  createdDate: string;
  state: string;
  answer: {
    text: string;
    state: string;
    editable: boolean;
    createDate: string;
  } | null;
  productDetails: {
    imtId: number;
    nmId: number;
    productName: string;
    supplierArticle: string;
    supplierName: string;
    brandName: string;
  };
  wasViewed: boolean;
  isWarned: boolean;
  userName?: string;
  photoLinks?: PhotoLink[];
}

export interface WbQuestionsResponse {
  data: {
    countUnanswered: number;
    countArchive: number;
    questions: WbQuestion[];
  };
  error: boolean;
  errorText: string;
  additionalErrors: any;
}

export interface QuestionListParams {
  isAnswered?: boolean;
  take: number;
  skip: number;
  order?: "dateAsc" | "dateDesc";
  nmId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface WbQuestionAnswerRequest {
  id: string;
  type: "answer" | "edit" | "decline" | "markViewed";
  text?: string;
}

export interface WbQuestionAnswerResponse {
  error: boolean;
  errorText: string;
  data: {
    questionId: string;
  };
}

// Новые типы для работы с поставками
export interface Supply {
  id: number;
  name: string;
  createdAt: string;
  done: boolean;
  scanDt?: string;
  closedAt?: string; // Added the closedAt property
  status: string;
  supplyId: string;
  ordersCount: number;
  cargoType?: number;
  category?: ProductCategory;
}

export interface SupplyOrder {
  id: number;
  supplierArticle: string;
  nmId: number;
  chrtId: string;
  barcode: string;
  quantity: number;
  rid: string;
  price: number;
  salePrice: number;
  convertedPrice: number;
  convertedSalePrice: number;
  isSupply: boolean;
  isReturn: boolean;
  cargoType: number;
  isLargeCargo?: boolean;
}

// Типы для коробов
export interface TrbxBox {
  id: string;
  name: string;
  supplyId: number;
  createdAt: string;
  orders: TrbxOrder[];
}

export interface TrbxOrder {
  id: number;
  rid: string;
}

// Типы для работы с Автосборкой

// Тип товара для категоризации
export enum ProductCategory {
  PERFUME = "Парфюмерия",
  CLOTHING = "Одежда",
  MISC = "Мелочёвка"
}

// Новый тип для информации о товаре из карточки
export interface ProductCardInfo {
  nmId: number;
  name: string;
  brand: string;
  image: string;
  category?: string; 
  productCategory?: ProductCategory;
  size?: string;
}

// Interface for product info in an assembly order
export interface ProductInfo {
  nmId: number;
  article: string;
  subjectName: string;
  photo: string;
  name: string;
  brand?: string;
  category?: ProductCategory;
  size?: string;
  productCategory?: ProductCategory; // Добавлено для совместимости с ProductCardInfo
}

// Типы для заказов автосборки
export interface AssemblyOrder {
  id: number;
  orderUid: string;
  createdAt: string;
  ddate?: string;
  price: number;
  salePrice: number;
  supplierArticle?: string;
  productName?: string;
  warehouseId?: number;
  cargoType?: number;
  selected?: boolean;
  category?: ProductCategory;
  inSupply?: boolean;
  nmId?: number;
  productInfo?: ProductCardInfo;
  status?: string;
  address?: string;
  customerName?: string;
  products?: ProductInfo[];
}

// Фильтры
export interface WarehouseFilter {
  id: number;
  name: string;
}

export interface CargoTypeFilter {
  id: number;
  name: string;
}

// API запросы для поставок
export interface CreateSupplyRequest {
  name?: string;
}

export interface CreateSupplyResponse {
  data: {
    supplyId: number;
  };
  error: boolean;
  errorText: string;
}

export interface GetSuppliesResponse {
  data: {
    supplies: Supply[];
  };
  error: boolean;
  errorText: string;
}

export interface GetOrdersResponse {
  data: {
    orders: AssemblyOrder[];
  };
  error: boolean;
  errorText: string;
}

export interface AddOrderToSupplyRequest {
  supplyId: number;
  orderId: number;
}

export interface AddOrderToSupplyResponse {
  error: boolean;
  errorText: string;
}

export interface AutoAssemblyResult {
  perfumeCount: number;
  clothingCount: number;
  miscCount: number;
  perfumeSupplyId?: number;
  clothingSupplyId?: number;
  miscSupplyId?: number;
}

// Интерфейс для ответа API карточки товара
export interface ProductCardResponse {
  data: {
    products: ProductCardData[];
  };
}

export interface ProductCardData {
  id: number;
  name: string;
  brand: string;
  brandId: number;
  images: string[];
  subjectName?: string; // Категория товара
  subject?: string; // Альтернативное поле для категории товара
  category?: string; // Дополнительное поле для категории
  // другие поля из API карточки товара...
}

// Add SortConfig interface for OrdersTable component
export interface SortConfig {
  key: keyof AssemblyOrder | null;
  direction: 'asc' | 'desc' | null;
}
