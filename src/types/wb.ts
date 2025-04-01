
// Типы для работы с API Wildberries

export interface WbReview {
  id: string;
  nmId: number;
  productName: string;
  supplierArticle: string;
  subjectName: string;
  brandName: string;
  productsArticle: string;
  text: string;
  createdDate: string;
  lastModifiedDate: string;
  photoLinks: string[];
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
  };
  video: {
    uri: string;
    thumbnail: string;
  };
}

export interface WbReviewsResponse {
  data: WbReview[];
  countUnanswered: number;
  countArchive: number;
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
