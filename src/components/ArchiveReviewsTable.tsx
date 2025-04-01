
import { useState } from "react";
import { WbReview, PhotoLink } from "@/types/wb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Calendar, User, ArrowUpRight, MessageSquare, ArchiveIcon } from "lucide-react";

interface ArchiveReviewsTableProps {
  reviews: WbReview[];
  loading: boolean;
}

const ArchiveReviewsTable = ({ reviews, loading }: ArchiveReviewsTableProps) => {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleExpand = (reviewId: string) => {
    const newExpandedReviews = new Set(expandedReviews);
    if (newExpandedReviews.has(reviewId)) {
      newExpandedReviews.delete(reviewId);
    } else {
      newExpandedReviews.add(reviewId);
    }
    setExpandedReviews(newExpandedReviews);
  };

  const formatDateCompact = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/(\d{2})\.(\d{2})\.(\d{2}), (\d{2}):(\d{2})/, '$1.$2.$3, $4:$5');
    } catch (error) {
      console.error("Ошибка форматирования даты:", error);
      return dateString;
    }
  };

  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={16} 
          className={`${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      );
    }
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-1 text-sm font-medium">{rating}</span>
      </div>
    );
  };

  const hasValidPhotoLinks = (photoLinks: any): photoLinks is PhotoLink[] => {
    return Array.isArray(photoLinks) && photoLinks.length > 0 && photoLinks[0]?.miniSize;
  };

  if (loading) {
    return <div className="text-center py-8 dark:text-gray-300 transition-colors duration-300">Загрузка архивных отзывов...</div>;
  }

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return <div className="text-center py-8 dark:text-gray-300 transition-colors duration-300">Нет архивных отзывов для отображения</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card 
          key={review.id} 
          className={`p-4 shadow-sm dark:bg-gray-700 dark:text-white transition-colors duration-300 ${
            expandedReviews.has(review.id) ? 'border-l-4 border-gray-500' : ''
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <Badge variant="outline" className="flex items-center gap-1 dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                  <Calendar size={14} /> {formatDateCompact(review.createdDate)}
                </Badge>
                
                {review.userName && (
                  <Badge variant="outline" className="flex items-center gap-1 dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                    <User size={14} /> {review.userName}
                  </Badge>
                )}
                
                <Badge className="bg-amber-500 dark:bg-amber-600 transition-colors duration-300">
                  {renderRating(review.rating || review.productValuation || 0)}
                </Badge>
                
                <Badge className="bg-gray-500 dark:bg-gray-600 transition-colors duration-300 flex items-center gap-1">
                  <ArchiveIcon size={14} /> АРХИВНЫЙ ОТЗЫВ
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base dark:text-white transition-colors duration-300 truncate mr-2">
                  {review.productName || (review.productDetails?.productName || 'Название товара отсутствует')}
                </h3>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleExpand(review.id)}
                  className="text-gray-600 dark:text-gray-300"
                >
                  {expandedReviews.has(review.id) ? "Свернуть" : "Подробнее"}
                </Button>
              </div>
              
              {expandedReviews.has(review.id) && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-sm bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded dark:text-gray-200 transition-colors duration-300">
                          Артикул: {review.supplierArticle || (review.productDetails?.supplierArticle || 'Н/Д')}
                        </span>
                        {review.brandName && (
                          <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                            {review.brandName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {hasValidPhotoLinks(review.photoLinks) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {review.photoLinks.map((photo: PhotoLink, index: number) => (
                          <a 
                            key={index} 
                            href={photo.fullSize} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-16 h-16 rounded overflow-hidden border dark:border-gray-600 transition-colors duration-300"
                          >
                            <img src={photo.miniSize} alt="Фото к отзыву" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {review.video && (review.video.previewImage || review.video.thumbnail) && (
                      <div className="w-20 h-20 rounded overflow-hidden border dark:border-gray-600 transition-colors duration-300 flex-shrink-0 relative">
                        <a 
                          href={review.video.link || review.video.uri || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full h-full"
                        >
                          <img 
                            src={review.video.previewImage || review.video.thumbnail || ''} 
                            alt="Превью видео" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                              <ArrowUpRight size={16} className="text-black" />
                            </div>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {(review.text || review.pros || review.cons) && (
                    <div className="border-l-4 border-gray-300 dark:border-gray-500 pl-3 py-1 bg-gray-50 dark:bg-gray-800 rounded transition-colors duration-300">
                      <div className="text-gray-700 dark:text-gray-300 transition-colors duration-300 mb-2">
                        <p className="font-medium flex items-center gap-1 mb-1">
                          <MessageSquare size={14} /> Отзыв клиента:
                        </p>
                        {review.text && (
                          <p className="whitespace-pre-line">{review.text}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {review.pros && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">Плюсы:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.pros}</p>
                          </div>
                        )}
                        
                        {review.cons && (
                          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Минусы:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.cons}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {review.answer && review.answer.text && (
                    <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="font-medium text-green-700 dark:text-green-400 mb-1">Ответ:</p>
                      <p className="text-gray-700 dark:text-gray-300">{review.answer.text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ArchiveReviewsTable;
