
import { useState, useEffect } from "react";
import { WbReview } from "@/types/wb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { OpenAIAPI, WbAPI } from "@/lib/api";
import { GenerateAnswerRequest, GenerateAnswerResponse } from "@/types/openai";

interface ReviewsTableProps {
  reviews: WbReview[];
  loading: boolean;
  onRefresh: () => void;
}

const ReviewsTable = ({ reviews, loading, onRefresh }: ReviewsTableProps) => {
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [generatingAnswers, setGeneratingAnswers] = useState<Set<string>>(new Set());
  const [sendingAnswers, setSendingAnswers] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Функция выбора/отмены выбора отзыва
  const toggleReviewSelection = (reviewId: string) => {
    const newSelectedReviews = new Set(selectedReviews);
    if (newSelectedReviews.has(reviewId)) {
      newSelectedReviews.delete(reviewId);
    } else {
      newSelectedReviews.add(reviewId);
    }
    setSelectedReviews(newSelectedReviews);
  };

  // Функция выбора/отмены выбора всех отзывов
  const toggleSelectAll = () => {
    if (selectedReviews.size === reviews.length) {
      // Если все выбраны - снимаем выбор
      setSelectedReviews(new Set());
    } else {
      // Иначе выбираем все
      const newSelectedReviews = new Set(reviews.map(review => review.id));
      setSelectedReviews(newSelectedReviews);
    }
  };

  // Функция генерации ответа для отзыва
  const generateAnswer = async (review: WbReview) => {
    const newGeneratingAnswers = new Set(generatingAnswers);
    newGeneratingAnswers.add(review.id);
    setGeneratingAnswers(newGeneratingAnswers);

    try {
      const request: GenerateAnswerRequest = {
        reviewText: review.text,
        reviewId: review.id
      };

      const response: GenerateAnswerResponse = await OpenAIAPI.generateAnswer(request);
      
      // Обновляем состояние с ответами
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

  // Функция отправки ответа на отзыв
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
      onRefresh(); // Обновляем список отзывов после отправки ответа
    } catch (error) {
      console.error("Ошибка при отправке ответа:", error);
      toast.error("Не удалось отправить ответ. Пожалуйста, попробуйте позже.");
    } finally {
      const updatedSendingAnswers = new Set(sendingAnswers);
      updatedSendingAnswers.delete(review.id);
      setSendingAnswers(updatedSendingAnswers);
    }
  };

  // Функция обновления текста ответа
  const updateAnswer = (reviewId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [reviewId]: text
    }));
  };

  // Функция генерации ответов для всех выбранных отзывов
  const generateSelectedAnswers = async () => {
    if (selectedReviews.size === 0) {
      toast.warning("Не выбрано ни одного отзыва для генерации ответов");
      return;
    }

    toast.info(`Начата генерация ответов для ${selectedReviews.size} отзывов. Это может занять некоторое время.`);

    const selectedReviewsArray = Array.from(selectedReviews);
    for (const reviewId of selectedReviewsArray) {
      const review = reviews.find(r => r.id === reviewId);
      if (review) {
        await generateAnswer(review);
      }
    }

    toast.success(`Сгенерированы ответы для ${selectedReviews.size} отзывов`);
  };

  // Функция отправки ответов для всех выбранных отзывов
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
      const review = reviews.find(r => r.id === reviewId);
      if (review) {
        await sendAnswer(review);
      }
    }

    toast.success(`Отправлены ответы на ${reviewsWithAnswers.length} отзывов`);
  };

  return (
    <div className="space-y-4">
      {/* Панель выбора действий */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant="outline" 
          onClick={toggleSelectAll}
        >
          {selectedReviews.size === reviews.length ? "Снять выбор" : "Выбрать все"}
        </Button>
        <Button 
          variant="outline" 
          onClick={generateSelectedAnswers}
          disabled={selectedReviews.size === 0}
        >
          Сгенерировать ответы ({selectedReviews.size})
        </Button>
        <Button 
          variant="default" 
          onClick={sendSelectedAnswers}
          disabled={selectedReviews.size === 0}
          className="bg-wb-secondary hover:bg-wb-accent"
        >
          Отправить ответы ({selectedReviews.size})
        </Button>
      </div>

      {/* Список отзывов */}
      {loading ? (
        <div className="text-center py-8">Загрузка отзывов...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">Нет отзывов для отображения</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4 shadow-sm">
              <div className="flex items-start space-x-4">
                <div>
                  <Checkbox 
                    checked={selectedReviews.has(review.id)} 
                    onCheckedChange={() => toggleReviewSelection(review.id)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">Артикул: {review.nmId}</span>
                    <Badge variant="outline">{review.brandName}</Badge>
                    <Badge variant="outline">{review.supplierArticle}</Badge>
                    <Badge className="bg-amber-500">Рейтинг: {review.rating}</Badge>
                    <Badge variant="outline">{new Date(review.createdDate).toLocaleDateString()}</Badge>
                  </div>
                  
                  <h3 className="font-semibold text-lg">{review.productName}</h3>
                  
                  <div className="border-l-4 border-wb-light pl-3 py-1 bg-gray-50 rounded">
                    <p className="text-gray-700">{review.text}</p>
                  </div>
                  
                  {/* Фото отзыва */}
                  {review.photoLinks && review.photoLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {review.photoLinks.map((photo, index) => (
                        <a 
                          key={index} 
                          href={photo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-16 h-16 rounded overflow-hidden border"
                        >
                          <img src={photo} alt="Фото к отзыву" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {/* Текстовое поле для ответа */}
                  <div className="mt-3 space-y-2">
                    <Textarea 
                      placeholder="Ответ на отзыв будет сгенерирован здесь..."
                      value={answers[review.id] || ""}
                      onChange={(e) => updateAnswer(review.id, e.target.value)}
                      className="min-h-24"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => generateAnswer(review)}
                        disabled={generatingAnswers.has(review.id)}
                      >
                        {generatingAnswers.has(review.id) ? "Генерация..." : "Сгенерировать ответ"}
                      </Button>
                      
                      <Button
                        className="bg-wb-secondary hover:bg-wb-accent"
                        onClick={() => sendAnswer(review)}
                        disabled={!answers[review.id] || sendingAnswers.has(review.id)}
                      >
                        {sendingAnswers.has(review.id) ? "Отправка..." : "Отправить ответ"}
                      </Button>
                    </div>
                  </div>
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
