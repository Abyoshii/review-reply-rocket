
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import FilterForm from "@/components/FilterForm";
import ReviewsTable from "@/components/ReviewsTable";
import QuestionsTable from "@/components/QuestionsTable";
import QuestionsFilterForm from "@/components/QuestionsFilterForm";
import AutoResponder from "@/components/AutoResponder";
import ArchiveReviewsTable from "@/components/ArchiveReviewsTable";
import { toast } from "sonner";
import FloatingActionButtons from "@/components/FloatingActionButtons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import HeaderAutoResponse from "@/components/HeaderAutoResponse";
import { ReviewListParams } from "@/types/wb";

const Reviews = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [archiveReviews, setArchiveReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [autoResponderOpen, setAutoResponderOpen] = useState(false);
  const [autoResponderSettings, setAutoResponderSettings] = useState({
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    systemPrompt: "Ты помощник по товарам на маркетплейсе Wildberries. Твоя задача - вежливо отвечать на отзывы и вопросы покупателей.",
  });

  // Функция для обновления данных
  const fetchData = async () => {
    setLoading(true);
    try {
      // Здесь должен быть код для получения данных с API
      // Для демонстрации используем моковые данные
      setTimeout(() => {
        const mockReviews = [
          { id: 1, productName: "Товар 1", rating: 5, text: "Отличный товар!", status: "new" },
          { id: 2, productName: "Товар 2", rating: 2, text: "Не соответствует описанию", status: "new" },
        ];
        
        const mockQuestions = [
          { id: 1, productName: "Товар 1", question: "Как долго работает батарея?", date: "2023-05-15" },
          { id: 2, productName: "Товар 3", question: "Есть ли в наличии красный цвет?", date: "2023-05-14" },
        ];
        
        const mockArchive = [
          { id: 3, productName: "Товар 3", rating: 4, text: "Хороший товар", status: "archived", reply: "Спасибо за отзыв!" },
          { id: 4, productName: "Товар 4", rating: 1, text: "Ужасное качество", status: "archived", reply: "Приносим извинения за неудобства." },
        ];
        
        setReviews(mockReviews);
        setQuestions(mockQuestions);
        setArchiveReviews(mockArchive);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      setLoading(false);
      toast.error("Не удалось загрузить данные. Пожалуйста, попробуйте позже.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Обработчик выбора отзывов
  const handleSelectReview = (reviewId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedReviews([...selectedReviews, reviewId]);
    } else {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId));
    }
  };

  // Обработчик множественного выбора отзывов
  const handleSelectAllReviews = (ids: number[]) => {
    setSelectedReviews(ids);
  };

  // Обработчик ответа на отзывы
  const handleReplyToReviews = () => {
    if (selectedReviews.length === 0) {
      toast.error("Выберите хотя бы один отзыв для ответа");
      return;
    }
    
    setAutoResponderOpen(true);
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Получаем выбранные отзывы
  const getSelectedReviewObjects = () => {
    return reviews.filter(review => selectedReviews.includes(review.id));
  };

  // Обработчик успешного автоответа
  const handleAutoResponseSuccess = () => {
    toast.success("Автоответы успешно отправлены");
    setAutoResponderOpen(false);
    setSelectedReviews([]);
    fetchData();
  };

  // Обработчик изменения фильтров для отзывов
  const handleFilterChange = (filters: ReviewListParams) => {
    console.log("Применяем фильтры:", filters);
    // Здесь должен быть код для фильтрации отзывов
    // Для демонстрации просто сбрасываем загрузку
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // Обработчик изменения фильтров для вопросов
  const handleQuestionsFilterChange = (filters: any) => {
    console.log("Применяем фильтры для вопросов:", filters);
    // Здесь должен быть код для фильтрации вопросов
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // Обработчик для генерации ответов на отзывы с использованием FloatingActionButtons
  const handleGenerateAnswers = () => {
    console.log("Генерируем ответы для", selectedReviews.length, "отзывов");
  };

  // Обработчик для отправки ответов на отзывы с использованием FloatingActionButtons
  const handleSendAnswers = () => {
    console.log("Отправляем ответы для", selectedReviews.length, "отзывов");
  };

  // Обработчик для очистки выбранных отзывов
  const handleClearSelection = () => {
    setSelectedReviews([]);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Управление отзывами</h1>
        <div className="flex flex-wrap gap-2">
          <HeaderAutoResponse onRefresh={handleRefresh} />
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="new" className="flex-1">Новые отзывы</TabsTrigger>
          <TabsTrigger value="questions" className="flex-1">Вопросы</TabsTrigger>
          <TabsTrigger value="archive" className="flex-1">Архив</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new">
          <Card>
            <CardContent className="p-4">
              <FilterForm 
                onFilterChange={handleFilterChange} 
                loading={loading} 
              />
              <ReviewsTable 
                reviews={reviews || []}
                loading={loading}
                onRefresh={handleRefresh}
                isAnswered={false}
              />
              
              {reviews && reviews.length > 0 && (
                <FloatingActionButtons 
                  selectedReviews={new Set(selectedReviews.map(id => id.toString()))}
                  reviews={reviews}
                  onGenerateAnswers={handleGenerateAnswers}
                  onSendAnswers={handleSendAnswers}
                  onRefresh={handleRefresh}
                  onClearSelection={handleClearSelection}
                  hasAnswers={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions">
          <Card>
            <CardContent className="p-4">
              <QuestionsFilterForm 
                onFilterChange={handleQuestionsFilterChange}
                loading={loading}
              />
              <QuestionsTable 
                questions={questions || []} 
                loading={loading} 
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archive">
          <Card>
            <CardContent className="p-4">
              <FilterForm 
                onFilterChange={handleFilterChange}
                loading={loading}
              />
              <ArchiveReviewsTable reviews={archiveReviews || []} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={autoResponderOpen} onOpenChange={setAutoResponderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AutoResponder 
            selectedReviews={getSelectedReviewObjects()} 
            onSuccess={handleAutoResponseSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reviews;
