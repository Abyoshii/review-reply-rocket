import { useState, useEffect } from "react";
import { WbReview, PhotoLink } from "@/types/wb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { OpenAIAPI, WbAPI } from "@/lib/api";
import { GenerateAnswerRequest } from "@/types/openai";
import { Star, Calendar, User, ArrowUpRight, MessageSquare, CheckCircle } from "lucide-react";

interface ReviewsTableProps {
  reviews: WbReview[];
  loading: boolean;
  onRefresh: () => void;
  isAnswered: boolean;
}

const ReviewsTable = ({ reviews, loading, onRefresh, isAnswered }: ReviewsTableProps) => {
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [generatingAnswers, setGeneratingAnswers] = useState<Set<string>>(new Set());
  const [sendingAnswers, setSendingAnswers] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const toggleReviewSelection = (reviewId: string) => {
    const newSelectedReviews = new Set(selectedReviews);
    if (newSelectedReviews.has(reviewId)) {
      newSelectedReviews.delete(reviewId);
    } else {
      newSelectedReviews.add(reviewId);
    }
    setSelectedReviews(newSelectedReviews);
  };

  const toggleSelectAll = () => {
    if (selectedReviews.size === (reviews?.length || 0)) {
      setSelectedReviews(new Set());
    } else {
      const newSelectedReviews = new Set((reviews || []).map(review => review.id));
      setSelectedReviews(newSelectedReviews);
    }
  };

  const generateAnswer = async (review: WbReview) => {
    const newGeneratingAnswers = new Set(generatingAnswers);
    newGeneratingAnswers.add(review.id);
    setGeneratingAnswers(newGeneratingAnswers);

    try {
      const reviewText = review.text || "Покупатель не оставил текстовый отзыв, только рейтинг";
      
      const fullReviewText = [
        reviewText,
        review.pros ? `Плюсы: ${review.pros}` : '',
        review.cons ? `Минусы: ${review.cons}` : ''
      ].filter(Boolean).join('\n');
      
      const request: GenerateAnswerRequest = {
        reviewText: fullReviewText,
        reviewId: review.id
      };

      const response = await OpenAIAPI.generateAnswer(request);
      
      setAnswers(prev => ({
        ...prev,
        [review.id]: response.answer
      }));

      toast.success(`Ответ сгенерирован! Использована модель: ${response.modelUsed}`);
    } catch (error) {
      console.error("Ошибка при генерации ответа:", error);
      toast.error("Не удалось сгенерировать ответ. Пожалуйста, попробуйте позже.");
    } finally {
      const updatedGeneratingAnswers = new Set(generatingAnswers);
      updatedGeneratingAnswers.delete(review.id);
      setGeneratingAnswers(updatedGeneratingAnswers);
    }
  };

  const sendAnswer = async (review: WbReview) => {
    if (!answers[review.id]) {
      toast.error("Нельзя отправить пустой ответ. Пожалуйста, сначала сгенерируйте ответ.");
      return;
    }

    const newSendingAnswers = new Set(sendingAnswers);
    newSendingAnswers.add(review.id);
    setSendingAnswers(newSendingAnswers);

    try {
      await WbAPI.sendAnswer({
        id: review.id,
        text: answers[review.id]
      });

      toast.success("Ответ успешно отправлен!");
      onRefresh();
    } catch (error) {
      console.error("Ошибка при отправке ответа:", error);
      toast.error("Не удалось отправить ответ. Пожалуйста, попробуйте позже.");
    } finally {
      const updatedSendingAnswers = new Set(sendingAnswers);
      updatedSendingAnswers.delete(review.id);
      setSendingAnswers(updatedSendingAnswers);
    }
  };

  const updateAnswer = (reviewId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [reviewId]: text
    }));
  };

  const generateSelectedAnswers = async () => {
    if (selectedReviews.size === 0) {
      toast.warning("Не выбрано ни одного отзыва для генерации ответов");
      return;
    }

    toast.info(`Начата генерация ответов для ${selectedReviews.size} отзывов. Это может занять некоторое время.`);

    const selectedReviewsArray = Array.from(selectedReviews);
    for (const reviewId of selectedReviewsArray) {
      const review = reviews?.find(r => r.id === reviewId);
      if (review) {
        await generateAnswer(review);
      }
    }

    toast.success(`Сгенерированы ответы для ${selectedReviews.size} отзывов`);
  };

  const sendSelectedAnswers = async () => {
    if (selectedReviews.size === 0) {
      toast.warning("Не выбрано ни одного отзыва для отправки ответов");
      return;
    }

    const reviewsWithAnswers = Array.from(selectedReviews).filter(id => answers[id]);
    const reviewsWithoutAnswers = Array.from(selectedReviews).filter(id => !answers[id]);

    if (reviewsWithoutAnswers.length > 0) {
      toast.warning(`У ${reviewsWithoutAnswers.length} выбранных отзывов нет сгенерированных ответов`);
    }

    if (reviewsWithAnswers.length === 0) {
      return;
    }

    toast.info(`Начата отправка ответов на ${reviewsWithAnswers.length} отзывов. Это может занять некоторое время.`);

    for (const reviewId of reviewsWithAnswers) {
      const review = reviews?.find(r => r.id === reviewId);
      if (review) {
        await sendAnswer(review);
      }
    }

    toast.success(`Отправлены ответы на ${reviewsWithAnswers.length} отзывов`);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Ошибка форматирования даты:", error);
      return dateString;
    }
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant="outline" 
          onClick={toggleSelectAll}
          className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          {selectedReviews.size === (reviews?.length || 0) ? "Снять выбор" : "Выбрать все"}
        </Button>
        
        {!isAnswered && (
          <>
            <Button 
              variant="outline" 
              onClick={generateSelectedAnswers}
              disabled={selectedReviews.size === 0}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              Сгенерировать ответы ({selectedReviews.size})
            </Button>
            
            <Button 
              variant="default" 
              onClick={sendSelectedAnswers}
              disabled={selectedReviews.size === 0}
              className="bg-wb-secondary hover:bg-wb-accent dark:bg-purple-700 dark:hover:bg-purple-800 transition-colors duration-300"
            >
              Отправить ответы ({selectedReviews.size})
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 dark:text-gray-300 transition-colors duration-300">Загрузка отзывов...</div>
      ) : !Array.isArray(reviews) || reviews.length === 0 ? (
        <div className="text-center py-8 dark:text-gray-300 transition-colors duration-300">Нет отзывов для отображения</div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(reviews) && reviews.map((review) => (
            <Card key={review.id} className={`p-4 shadow-sm dark:bg-gray-700 dark:text-white transition-colors duration-300 ${review.answer ? 'border-l-4 border-green-500' : ''}`}>
              <div className="flex items-start space-x-4">
                <div>
                  <Checkbox 
                    checked={selectedReviews.has(review.id)} 
                    onCheckedChange={() => toggleReviewSelection(review.id)}
                    className="mt-1 dark:border-gray-500 transition-colors duration-300"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2 items-center">
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
                    
                    {review.answer && (
                      <Badge className="bg-green-500 dark:bg-green-600 transition-colors duration-300 flex items-center gap-1">
                        <CheckCircle size={14} /> ОТВЕЧЕННЫЙ ОТЗЫВ
                      </Badge>
                    )}
                  </div>
                  
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
                        {review.nmId && (
                          <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                            NM: {review.nmId}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg dark:text-white transition-colors duration-300">
                        {review.productName || (review.productDetails?.productName || 'Название товара отсутствует')}
                      </h3>
                    </div>
                    
                    {hasValidPhotoLinks(review.photoLinks) && (
                      <div className="w-20 h-20 rounded overflow-hidden border dark:border-gray-600 transition-colors duration-300 flex-shrink-0">
                        <a href={review.photoLinks[0].fullSize} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                          <img src={review.photoLinks[0].miniSize} alt="Фото товара" className="w-full h-full object-cover" />
                        </a>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hasValidPhotoLinks(review.photoLinks) && 
                        review.photoLinks.map((photo: PhotoLink, index: number) => (
                          <a 
                            key={index} 
                            href={photo.fullSize} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-16 h-16 rounded overflow-hidden border dark:border-gray-600 transition-colors duration-300"
                          >
                            <img src={photo.miniSize} alt="Фото к отзыву" className="w-full h-full object-cover" />
                          </a>
                        ))
                      }
                    </div>
                    
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
                  
                  <div className="border-l-4 border-wb-light dark:border-purple-500 pl-3 py-1 bg-gray-50 dark:bg-gray-800 rounded transition-colors duration-300">
                    <div className="text-gray-700 dark:text-gray-300 transition-colors duration-300 mb-2">
                      <p className="font-medium flex items-center gap-1 mb-1">
                        <MessageSquare size={14} /> Отзыв клиента:
                      </p>
                      <p className="whitespace-pre-line">
                        {review.text ? review.text : (review.pros ? review.pros : "Покупатель не оставил текстовый отзыв, только рейтинг")}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {review.pros && review.text !== review.pros && (
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
                  
                  {review.answer && review.answer.text && (
                    <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="font-medium text-green-700 dark:text-green-400 mb-1">Ответ:</p>
                      <p className="text-gray-700 dark:text-gray-300">{review.answer.text}</p>
                    </div>
                  )}
                  
                  {!review.answer && (
                    <div className="mt-3 space-y-2">
                      <Textarea 
                        placeholder="Ответ на отзыв будет сгенерирован здесь..."
                        value={answers[review.id] || ""}
                        onChange={(e) => updateAnswer(review.id, e.target.value)}
                        className="min-h-24 dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-colors duration-300"
                      />
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => generateAnswer(review)}
                          disabled={generatingAnswers.has(review.id)}
                          className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          {generatingAnswers.has(review.id) ? "Генерация..." : "Сгенерировать ответ"}
                        </Button>
                        
                        <Button
                          className="bg-wb-secondary hover:bg-wb-accent dark:bg-purple-700 dark:hover:bg-purple-800 transition-colors duration-300"
                          onClick={() => sendAnswer(review)}
                          disabled={!answers[review.id] || sendingAnswers.has(review.id)}
                        >
                          {sendingAnswers.has(review.id) ? "Отправка..." : "Отправить ответ"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsTable;
