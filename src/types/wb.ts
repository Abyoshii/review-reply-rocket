
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
  createdDate: string;
  lastModifiedDate: string;
  photoLinks: string[] | null;
  size: string;
  rating: number;
  color: string;
  wbUserDetails: {
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
    uri: string;
    thumbnail: string;
  } | null;
  productDetails?: {
    imtId: number;
    nmId: number;
    productName: string;
    supplierArticle: string;
    supplierName: string;
    brandName: string;
    size: string;
  };
  pros?: string;
  cons?: string;
  productValuation?: number;
  wasViewed?: boolean;
  userName?: string;
  matchingSize?: string;
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

export interface ReviewListParams {
  isAnswered: boolean;
  take: number;
  skip: number;
  order?: "dateAsc" | "dateDesc";
  nmId?: number;
  dateFrom?: string;
  dateTo?: string;
}
