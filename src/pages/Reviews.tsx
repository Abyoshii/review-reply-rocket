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
import { Loader2, AlertCircle } from "lucide-react";
import { logObjectStructure } from "@/lib/imageUtils";
import { UNIFIED_API_TOKEN, saveApiToken } from "@/lib/securityUtils";
import { FeedbacksService } from "@/lib/feedbacks";

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
  const [tokenResetAttempted, setTokenResetAttempted] = useState(false);

  const ensureLatestToken = () => {
    try {
      saveApiToken(UNIFIED_API_TOKEN, {
        useHeaderApiKey: true,
        headerName: 'Authorization',
        obfuscateTokens: true
      });
      console.log("Токен сброшен до актуального значения");
    } catch (error) {
      console.error("Ошибка при сбросе токена:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!tokenResetAttempted) {
        ensureLatestToken();
        setTokenResetAttempted(true);
      }
      
      const reviewsParams: ReviewListParams = { 
        isAnswered: false, 
        take: 10, 
        skip: 0,
        order: "dateDesc" 
      };
      
      const reviewsResponse = await FeedbacksService.reviews.getReviews(reviewsParams);
      
      logObjectStructure(reviewsResponse, "WB API Reviews Response");
      
      const questionsParams: QuestionListParams = { 
        isAnswered: false, 
        take: 10, 
        skip: 0,
        order: "dateDesc" 
      };
      
      const questionsResponse = await FeedbacksService.questions.getQuestions(questionsParams);
      
      const archiveParams: ReviewListParams = { 
        isAnswered: true, 
        take: 10, 
        skip: 0,
        order: "dateDesc" 
      };
      
      const archiveResponse = await FeedbacksService.reviews.getArchiveReviews(archiveParams);
      
      logObjectStructure(archiveResponse, "WB API Archive Response");
      
      setReviews(reviewsResponse.data.feedbacks || []);
      setQuestions(questionsResponse.data.questions || []);
      setArchiveReviews(archiveResponse.data.feedbacks || []);
      
      toast.success("Данные успешно загружены", {
        description: `Загружено отзывов: ${reviewsResponse.data.feedbacks?.length || 0}`
      });
      
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      
      let errorMessage = "Не удалось загрузить данные. Проверьте API-токен и сетевое соединение.";
      
      if (error.response?.status === 401) {
        errorMessage = "Ошибка авторизации (401). Токен недействителен или отозван.";
        
        if (!tokenResetAttempted) {
          ensureLatestToken();
          setTokenResetAttempted(true);
          toast.info("Попытка обновления токена", {
            description: "Выполняется обновление токена авторизации..."
          });
          setError(null);
          setLoading(false);
          setTimeout(fetchData, 1000);
          return;
        }
      }
      
      setError(errorMessage);
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
    
    FeedbacksService.reviews.getReviews(filters)
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
    
    FeedbacksService.questions.getQuestions(filters)
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
          <p className="font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Ошибка загрузки данных:
          </p>
          <p>{error}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <Loader2 className="mr-2 h-4 w-4" />
              Повторить попытку
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => {
                ensureLatestToken();
                setTokenResetAttempted(true);
                toast.info("Токен сброшен до актуального значения", {
                  description: "Попробуйте загрузить данные снова"
                });
              }}
            >
              Сбросить токен
            </Button>
          </div>
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
