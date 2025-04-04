import { useState, useEffect } from "react";
import { WbReview, PhotoLink } from "@/types/wb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { OpenAIAPI, WbAPI } from "@/lib/api";
import { GenerateAnswerRequest, ReviewRatingType } from "@/types/openai";
import { 
  Star, 
  Calendar, 
  User, 
  ArrowUpRight, 
  MessageSquare, 
  CheckCircle, 
  Edit, 
  Save, 
  Send,
  Loader2,
  Cpu
} from "lucide-react";
import FloatingActionButtons from "./FloatingActionButtons";
import RatingStars from "./RatingStars";

interface ReviewsTableProps {
  reviews: WbReview[];
  loading: boolean;
  onRefresh: () => void;
  isAnswered: boolean;
  onReviewStateChange?: (reviewId: string, newState: "sending" | "error" | "answered" | "unanswered") => void;
  processingReviewIds?: Set<string>;
}

const ReviewsTable = ({ 
  reviews = [], 
  loading, 
  onRefresh, 
  isAnswered, 
  onReviewStateChange,
  processingReviewIds = new Set()
}: ReviewsTableProps) => {
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [generatingAnswers, setGeneratingAnswers] = useState<Set<string>>(new Set());
  const [sendingAnswers, setSendingAnswers] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [editingAnswers, setEditingAnswers] = useState<Set<string>>(new Set());
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({});
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, failed: 0 });
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });
  const [modelUsed, setModelUsed] = useState<Record<string, string>>({});

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
        reviewId: review.id,
        productName: review.productName || review.productDetails?.productName,
        rating: review.rating || review.productValuation || 0
      };

      const response = await OpenAIAPI.generateAnswer(request);
      
      setAnswers(prev => ({
        ...prev,
        [review.id]: response.answer
      }));

      setModelUsed(prev => ({
        ...prev,
        [review.id]: response.modelUsed
      }));

      setGenerationProgress(prev => ({
        ...prev,
        completed: prev.completed + 1
      }));
    } catch (error) {
      console.error("Ошибка при генерации ответа:", error);
      toast({
        title: "Ошибка генерации",
        description: "Не удалось сгенерировать ответ. Попробуйте позже.",
        variant: "destructive",
        important: true
      });
    } finally {
      const updatedGeneratingAnswers = new Set(generatingAnswers);
      updatedGeneratingAnswers.delete(review.id);
      setGeneratingAnswers(updatedGeneratingAnswers);
    }
  };

  const sendAnswer = async (review: WbReview) => {
    if (!answers[review.id]) {
      toast({
        title: "Ошибка отправки",
        description: "Нельзя отправить пустой ответ. Сначала сгенерируйте ответ.",
        variant: "destructive",
        important: true
      });
      return;
    }

    if (onReviewStateChange) {
      onReviewStateChange(review.id, "sending");
    }

    const newSendingAnswers = new Set(sendingAnswers);
    newSendingAnswers.add(review.id);
    setSendingAnswers(newSendingAnswers);

    try {
      await WbAPI.sendAnswer({
        id: review.id,
        text: answers[review.id]
      });

      toast({
        title: "Успешно отправлено",
        description: "Ответ отправлен покупателю",
        important: true
      });
      
      setSendProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
      
      if (sendProgress.total === sendProgress.sent + 1) {
        setTimeout(() => {
          onRefresh();
          toast({
            title: "Все ответы отправлены",
            description: `Успешно: ${sendProgress.sent + 1} из ${sendProgress.total}`,
            important: true
          });
          setSendProgress({ sent: 0, total: 0, failed: 0 });
        }, 500);
      }
      
      if (onReviewStateChange) {
        onReviewStateChange(review.id, "answered");
      }
    } catch (error) {
      console.error("Ошибка при отправке ответа:", error);
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить ответ. Попробуйте позже.",
        variant: "destructive",
        important: true
      });
      setSendProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
      
      if (onReviewStateChange) {
        onReviewStateChange(review.id, "error");
        setTimeout(() => {
          onReviewStateChange(review.id, "unanswered");
        }, 2000);
      }
    } finally {
      const updatedSendingAnswers = new Set(sendingAnswers);
      updatedSendingAnswers.delete(review.id);
      setSendingAnswers(updatedSendingAnswers);
    }
  };

  const startEditingAnswer = (review: WbReview) => {
    if (!review.answer) return;
    
    const newEditingAnswers = new Set(editingAnswers);
    newEditingAnswers.add(review.id);
    setEditingAnswers(newEditingAnswers);
    
    setEditedAnswers(prev => ({
      ...prev,
      [review.id]: review.answer?.text || ""
    }));
  };

  const cancelEditingAnswer = (reviewId: string) => {
    const newEditingAnswers = new Set(editingAnswers);
    newEditingAnswers.delete(reviewId);
    setEditingAnswers(newEditingAnswers);
  };

  const saveEditedAnswer = async (review: WbReview) => {
    if (!editedAnswers[review.id]) {
      toast({
        title: "Ошибка сохранения",
        description: "Нельзя сохранить пустой ответ.",
        variant: "destructive",
        important: true
      });
      return;
    }

    if (onReviewStateChange) {
      onReviewStateChange(review.id, "sending");
    }

    const newSendingAnswers = new Set(sendingAnswers);
    newSendingAnswers.add(review.id);
    setSendingAnswers(newSendingAnswers);

    try {
      await WbAPI.editAnswer({
        id: review.id,
        text: editedAnswers[review.id]
      });

      toast({
        title: "Успешно отредактировано",
        description: "Ответ успешно изменен и сохранен",
        important: true
      });
      
      const newEditingAnswers = new Set(editingAnswers);
      newEditingAnswers.delete(review.id);
      setEditingAnswers(newEditingAnswers);
      
      if (onReviewStateChange) {
        onReviewStateChange(review.id, "answered");
      }
      
      onRefresh();
    } catch (error) {
      console.error("Ошибка при редактировании ответа:", error);
      toast({
        title: "Ошибка редактирования",
        description: "Не удалось отредактировать ответ. Попробуйте позже.",
        variant: "destructive",
        important: true
      });
      
      if (onReviewStateChange) {
        onReviewStateChange(review.id, "error");
        setTimeout(() => {
          onReviewStateChange(review.id, "answered");
        }, 2000);
      }
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

  const updateEditedAnswer = (reviewId: string, text: string) => {
    setEditedAnswers(prev => ({
      ...prev,
      [reviewId]: text
    }));
  };

  const generateSelectedAnswers = async () => {
    if (selectedReviews.size === 0) {
      toast({
        title: "Внимание",
        description: "Не выбрано ни одного отзыва для генерации",
        variant: "destructive",
        important: true
      });
      return;
    }

    setGenerationProgress({ completed: 0, total: selectedReviews.size });

    toast({
      title: "Начата генерация",
      description: `Генерация ответов для ${selectedReviews.size} отзывов...`,
      important: true
    });

    const selectedReviewsArray = Array.from(selectedReviews);
    for (const reviewId of selectedReviewsArray) {
      const review = reviews?.find(r => r.id === reviewId);
      if (review) {
        await generateAnswer(review);
      }
    }

    toast({
      title: "Генерация завершена",
      description: `Сгенерированы ответы для ${selectedReviews.size} отзывов`,
      important: true
    });
    
    setTimeout(() => {
      setGenerationProgress({ completed: 0, total: 0 });
    }, 2000);
  };

  const sendSelectedAnswers = async () => {
    if (selectedReviews.size === 0) {
      toast({
        title: "Внимание",
        description: "Не выбрано ни одного отзыва для отправки",
        variant: "destructive",
        important: true
      });
      return;
    }

    const reviewsWithAnswers = Array.from(selectedReviews).filter(id => answers[id]);
    const reviewsWithoutAnswers = Array.from(selectedReviews).filter(id => !answers[id]);

    if (reviewsWithoutAnswers.length > 0) {
      toast({
        title: "Внимание",
        description: `У ${reviewsWithoutAnswers.length} выбранных отзывов нет ответов`,
        variant: "destructive",
        important: true
      });
    }

    if (reviewsWithAnswers.length === 0) {
      return;
    }

    setSendProgress({ sent: 0, total: reviewsWithAnswers.length, failed: 0 });

    toast({
      title: "Начата отправка",
      description: `Отправка ${reviewsWithAnswers.length} ответов...`,
      important: true
    });

    if (onReviewStateChange) {
      for (const reviewId of reviewsWithAnswers) {
        onReviewStateChange(reviewId, "sending");
      }
    }

    for (const reviewId of reviewsWithAnswers) {
      const review = reviews?.find(r => r.id === reviewId);
      if (review) {
        sendAnswer(review);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const clearSelection = () => {
    setSelectedReviews(new Set());
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

  const getRatingType = (rating: number): ReviewRatingType => {
    if (rating >= 4) return { type: "positive", rating };
    if (rating === 3) return { type: "neutral", rating };
    return { type: "negative", rating };
  };

  const hasValidPhotoLinks = (photoLinks: any): photoLinks is PhotoLink[] => {
    return Array.isArray(photoLinks) && photoLinks.length > 0 && photoLinks[0]?.miniSize;
  };

  const filteredReviews = reviews?.filter(review => 
    !processingReviewIds || !processingReviewIds.has(review.id)
  ) || [];

  const renderRating = (rating: number) => {
    return <RatingStars rating={rating} showBadge={true} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant="outline" 
          onClick={toggleSelectAll}
          className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
          disabled={filteredReviews.length === 0}
        >
          {selectedReviews.size === (filteredReviews?.length || 0) ? "Снять выбор" : "Выбрать все"}
        </Button>
        
        {!isAnswered && (
          <>
            <Button 
              variant="outline" 
              onClick={generateSelectedAnswers}
              disabled={selectedReviews.size === 0 || generationProgress.total > 0}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {generationProgress.total > 0 ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Генерация ({generationProgress.completed}/{generationProgress.total})
                </>
              ) : (
                <>
                  <MessageSquare size={16} className="mr-2" />
                  Сгенерировать ответы ({selectedReviews.size})
                </>
              )}
            </Button>
            
            <Button 
              variant="default" 
              onClick={sendSelectedAnswers}
              disabled={selectedReviews.size === 0 || sendProgress.total > 0}
              className="bg-wb-secondary hover:bg-wb-accent dark:bg-purple-700 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {sendProgress.total > 0 ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Отправка ({sendProgress.sent}/{sendProgress.total})
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Отправить ответы ({selectedReviews.size})
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <FloatingActionButtons 
        selectedReviews={selectedReviews}
        reviews={filteredReviews}
        onGenerateAnswers={generateSelectedAnswers}
        onSendAnswers={sendSelectedAnswers}
        onRefresh={onRefresh}
        onClearSelection={clearSelection}
        hasAnswers={Object.keys(answers).length > 0}
        generationProgress={generationProgress.total > 0 ? generationProgress : undefined}
        sendingProgress={sendProgress.total > 0 ? sendProgress : undefined}
      />

      {loading ? (
        <div className="text-center py-8 dark:text-gray-300 transition-colors duration-300">
          <Loader2 size={24} className="animate-spin mx-auto mb-2" />
          Загрузка отзывов...
        </div>
      ) : !filteredReviews.length ? (
        <div className="text-center py-8 dark:text-gray-300 transition-colors duration-300">
          <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
          Нет отзывов для отображения
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card 
              key={review.id} 
              className={`p-4 shadow-sm dark:bg-gray-700 dark:text-white transition-colors duration-300 
                ${review.answer ? 'border-l-4 border-green-500' : ''} 
                ${sendingAnswers.has(review.id) ? 'animate-pulse opacity-70' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <div>
                  <Checkbox 
                    checked={selectedReviews.has(review.id)} 
                    onCheckedChange={() => toggleReviewSelection(review.id)}
                    className="mt-1 dark:border-gray-500 transition-all duration-300 data-[state=checked]:animate-pulse"
                    disabled={sendingAnswers.has(review.id)}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  {sendingAnswers.has(review.id) && (
                    <div className="absolute right-4 top-4 flex items-center bg-black/70 text-white px-3 py-1 rounded-full text-xs z-10">
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Отправка ответа...
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="outline" className="flex items-center gap-1 dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                      <Calendar size={14} /> {formatDateCompact(review.createdDate)}
                    </Badge>
                    
                    {review.userName && (
                      <Badge variant="outline" className="flex items-center gap-1 dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                        <User size={14} /> {review.userName}
                      </Badge>
                    )}
                    
                    {renderRating(review.rating || review.productValuation || 0)}
                    
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
                  
                  {review.answer && review.answer.text && !editingAnswers.has(review.id) && (
                    <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-green-700 dark:text-green-400 mb-1">Ответ:</p>
                        {review.answer.editable && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => startEditingAnswer(review)}
                            className="h-8 px-2 text-green-600"
                            disabled={sendingAnswers.has(review.id)}
                          >
                            <Edit size={14} className="mr-1" />
                            Редактировать
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.answer.text}</p>
                    </div>
                  )}
                  
                  {review.answer && editingAnswers.has(review.id) && (
                    <div className="border-l-4 border-amber-500 pl-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                      <p className="font-medium text-amber-700 dark:text-amber-400 mb-1 flex items-center">
                        <Edit size={14} className="mr-1" /> Редактирование ответа:
                      </p>
                      <Textarea 
                        value={editedAnswers[review.id] || ""}
                        onChange={(e) => updateEditedAnswer(review.id, e.target.value)}
                        className="min-h-20 dark:bg-gray-800 dark:text-white dark:border-gray-600 mb-2 transition-colors duration-300"
                        disabled={sendingAnswers.has(review.id)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelEditingAnswer(review.id)}
                          disabled={sendingAnswers.has(review.id)}
                        >
                          Отмена
                        </Button>
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => saveEditedAnswer(review)}
                          disabled={sendingAnswers.has(review.id)}
                          className="bg-amber-500 hover:bg-amber-600"
                        >
                          <Save size={14} className="mr-1" />
                          {sendingAnswers.has(review.id) ? "Сохранение..." : "Сохранить"}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!review.answer && (
                    <div className="mt-3 space-y-2">
                      <div className="relative">
                        <Textarea 
                          placeholder="Ответ на отзыв будет сгенерирован здесь..."
                          value={answers[review.id] || ""}
                          onChange={(e) => updateAnswer(review.id, e.target.value)}
                          className="min-h-24 dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-colors duration-300"
                          disabled={sendingAnswers.has(review.id)}
                        />
                        {modelUsed[review.id] && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Cpu size={12} className="mr-1" /> 
                            Сгене��ировано: {modelUsed[review.id].includes('gpt-4') ? 'GPT-4' : 'GPT-3.5'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => generateAnswer(review)}
                          disabled={generatingAnswers.has(review.id) || sendingAnswers.has(review.id)}
                          className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          {generatingAnswers.has(review.id) ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Генерация...
                            </>
                          ) : "Сгенерировать ответ"}
                        </Button>
                        
                        <Button
                          className="bg-wb-secondary hover:bg-wb-accent dark:bg-purple-700 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105 active:scale-95"
                          onClick={() => sendAnswer(review)}
                          disabled={!answers[review.id] || sendingAnswers.has(review.id)}
                        >
                          {sendingAnswers.has(review.id) ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Отправка...
                            </>
                          ) : "Отправить ответ"}
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
