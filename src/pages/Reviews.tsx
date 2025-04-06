
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
import { ReviewListParams, WbReview, WbQuestion, QuestionListParams } from "@/types/wb";
import { WbAPI } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { logObjectStructure } from "@/lib/imageUtils";

const Reviews = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [reviews, setReviews] = useState<WbReview[]>([]);
  const [questions, setQuestions] = useState<WbQuestion[]>([]);
  const [archiveReviews, setArchiveReviews] = useState<WbReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [autoResponderOpen, setAutoResponderOpen] = useState(false);
  const [autoResponderSettings, setAutoResponderSettings] = useState({
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    systemPrompt: "Ты помощник по товарам на маркетплейсе Wildberries. Твоя задача - вежливо отвечать на отзывы и вопросы покупателей.",
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const reviewsParams: ReviewListParams = { 
        isAnswered: false, 
        take: 10, 
        skip: 0,
        order: "dateDesc" 
      };
      
      const reviewsResponse = await WbAPI.getReviews(reviewsParams);
      
      // Log the data structure to see what we're getting from the API
      logObjectStructure(reviewsResponse, "WB API Reviews Response");
      
      const questionsParams: QuestionListParams = { 
        isAnswered: false, 
        take: 10, 
        skip: 0,
        order: "dateDesc" 
      };
      
      const questionsResponse = await WbAPI.getQuestions(questionsParams);
      
      const archiveParams: ReviewListParams = { 
        isAnswered: true, 
        take: 10, 
        skip: 0,
        order: "dateDesc" 
      };
      
      const archiveResponse = await WbAPI.getArchiveReviews(archiveParams);
      
      // Log the archive response to see what we're getting
      logObjectStructure(archiveResponse, "WB API Archive Response");
      
      setReviews(reviewsResponse.data.feedbacks || []);
      setQuestions(questionsResponse.data.questions || []);
      setArchiveReviews(archiveResponse.data.feedbacks || []);
      
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      setError("Не удалось загрузить данные. Проверьте API-токен и сетевое соединение.");
      toast.error("Не удалось загрузить данные. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectReview = (reviewId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedReviews([...selectedReviews, reviewId]);
    } else {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId));
    }
  };

  const handleSelectAllReviews = (ids: string[]) => {
    setSelectedReviews(ids);
  };

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

  const getSelectedReviewObjects = () => {
    return reviews.filter(review => selectedReviews.includes(review.id));
  };

  const handleAutoResponseSuccess = () => {
    toast.success("Автоответы успешно отправлены");
    setAutoResponderOpen(false);
    setSelectedReviews([]);
    fetchData();
  };

  const handleFilterChange = (filters: ReviewListParams) => {
    console.log("Применяем фильтры:", filters);
    setLoading(true);
    
    WbAPI.getReviews(filters)
      .then(response => {
        setReviews(response.data.feedbacks || []);
      })
      .catch(error => {
        console.error("Ошибка при фильтрации отзывов:", error);
        toast.error("Ошибка фильтрации. Попробуйте другие параметры.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleQuestionsFilterChange = (filters: QuestionListParams) => {
    console.log("Применяем фильтры для вопросов:", filters);
    setLoading(true);
    
    WbAPI.getQuestions(filters)
      .then(response => {
        setQuestions(response.data.questions || []);
      })
      .catch(error => {
        console.error("Ошибка при фильтрации вопросов:", error);
        toast.error("Ошибка фильтрации. Попробуйте другие параметры.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGenerateAnswers = () => {
    console.log("Генерируем ответы для", selectedReviews.length, "отзывов");
  };

  const handleSendAnswers = () => {
    console.log("Отправляем ответы для", selectedReviews.length, "отзывов");
  };

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

      {error && (
        <div className="mb-4 p-4 border border-red-300 bg-red-50 rounded-md text-red-700">
          <p className="font-medium">Ошибка загрузки данных:</p>
          <p>{error}</p>
          <Button variant="outline" className="mt-2" onClick={fetchData}>
            <Loader2 className="mr-2 h-4 w-4" />
            Повторить попытку
          </Button>
        </div>
      )}

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
                  selectedReviews={new Set(selectedReviews)}
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
