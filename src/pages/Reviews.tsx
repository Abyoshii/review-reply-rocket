
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewsTable from "@/components/ReviewsTable";
import QuestionsTable from "@/components/QuestionsTable";
import ArchiveReviewsTable from "@/components/ArchiveReviewsTable";
import FilterForm from "@/components/FilterForm";
import QuestionsFilterForm from "@/components/QuestionsFilterForm";
import { useToast } from "@/hooks/use-toast";
import HeaderAutoResponse from "@/components/HeaderAutoResponse";
import AutoResponder from "@/components/AutoResponder";
import AutoResponseSettings from "@/components/AutoResponseSettings";
import AutoResponseService from "@/components/AutoResponseService";
import FloatingActionButtons from "@/components/FloatingActionButtons";
import { WbAPI } from "@/lib/api";
import { WbReview, WbQuestion } from "@/types/wb";
import { AutoResponderSettings as AutoResponderSettingsType } from "@/types/openai";

const Reviews = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("reviews");
  const [autoResponseExpanded, setAutoResponseExpanded] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [reviews, setReviews] = useState<WbReview[]>([]);
  const [questions, setQuestions] = useState<WbQuestion[]>([]);
  const [archiveReviews, setArchiveReviews] = useState<WbReview[]>([]);
  const [isAutoResponseActive, setIsAutoResponseActive] = useState(false);
  const [autoResponseSettings, setAutoResponseSettings] = useState<AutoResponderSettingsType>({
    maxTokens: 150,
    temperature: 0.7,
    maxReviews: 10,
    useAI: true
  });
  const [autoResponseStatus, setAutoResponseStatus] = useState({
    isRunning: false,
    lastCheck: null as Date | null,
    processedCount: 0,
    successCount: 0,
    failedCount: 0
  });
  const [autoResponseInterval, setAutoResponseInterval] = useState(30); // minutes
  
  const handleRefresh = () => {
    fetchReviews();
    fetchQuestions();
    fetchArchive();
    
    toast({
      title: "Обновление данных",
      description: "Данные успешно обновлены",
    });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await WbAPI.getReviews({
        isAnswered: false,
        take: 50,
        skip: 0
      });
      if (response.data && response.data.feedbacks) {
        setReviews(response.data.feedbacks);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить отзывы",
        variant: "destructive"
      });
    } finally {
      setReviewsLoading(false);
    }
  };
  
  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const response = await WbAPI.getQuestions({
        isAnswered: false,
        take: 50,
        skip: 0
      });
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить вопросы",
        variant: "destructive"
      });
    } finally {
      setQuestionsLoading(false);
    }
  };
  
  const fetchArchive = async () => {
    setArchiveLoading(true);
    try {
      const response = await WbAPI.getReviews({
        isAnswered: true,
        take: 50,
        skip: 0
      });
      if (response.data && response.data.feedbacks) {
        setArchiveReviews(response.data.feedbacks);
      }
    } catch (error) {
      console.error("Error fetching archive:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить архив",
        variant: "destructive"
      });
    } finally {
      setArchiveLoading(false);
    }
  };
  
  const handleFilterChange = async (filters: any) => {
    setReviewsLoading(true);
    try {
      const response = await WbAPI.getReviews({
        ...filters,
        isAnswered: false
      });
      if (response.data && response.data.feedbacks) {
        setReviews(response.data.feedbacks);
      }
    } catch (error) {
      console.error("Error filtering reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };
  
  const handleQuestionsFilterChange = async (filters: any) => {
    setQuestionsLoading(true);
    try {
      const response = await WbAPI.getQuestions({
        ...filters,
        isAnswered: false
      });
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
      }
    } catch (error) {
      console.error("Error filtering questions:", error);
    } finally {
      setQuestionsLoading(false);
    }
  };
  
  const handleStartAutoResponse = (settings: AutoResponderSettingsType, interval: number) => {
    setAutoResponseSettings(settings);
    setAutoResponseInterval(interval);
    setIsAutoResponseActive(true);
    toast({
      title: "Автоответчик активирован",
      description: `Будет проверять новые отзывы каждые ${interval} минут`,
    });
  };
  
  const handleStopAutoResponse = () => {
    setIsAutoResponseActive(false);
    toast({
      title: "Автоответчик деактивирован",
      description: "Автоматические ответы остановлены",
    });
  };
  
  const handleStatusUpdate = (status: {
    isRunning: boolean;
    lastCheck: Date | null;
    processedCount: number;
    successCount: number;
    failedCount: number;
  }) => {
    setAutoResponseStatus(status);
  };

  useEffect(() => {
    fetchReviews();
    fetchQuestions();
    fetchArchive();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400">Отзывы</h1>
        <HeaderAutoResponse 
          unansweredCount={reviews?.length || 0}
          unansweredQuestionsCount={questions?.length || 0}
          onRefresh={handleRefresh}
        />
      </div>

      {autoResponseExpanded && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Автоответчик</CardTitle>
            <CardDescription>
              Настройте шаблоны автоматических ответов на отзывы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="settings">
              <TabsList>
                <TabsTrigger value="settings">Настройки</TabsTrigger>
                <TabsTrigger value="service">Сервис</TabsTrigger>
                <TabsTrigger value="responder">Тестировщик</TabsTrigger>
              </TabsList>
              <TabsContent value="settings">
                <AutoResponseSettings 
                  open={autoResponseExpanded}
                  onOpenChange={setAutoResponseExpanded}
                  onStartAutoResponse={handleStartAutoResponse}
                  onStopAutoResponse={handleStopAutoResponse}
                  isAutoResponseActive={isAutoResponseActive}
                />
              </TabsContent>
              <TabsContent value="service">
                <AutoResponseService 
                  isActive={isAutoResponseActive}
                  settings={autoResponseSettings}
                  interval={autoResponseInterval}
                  onStatusUpdate={handleStatusUpdate}
                  onDeactivate={handleStopAutoResponse}
                />
              </TabsContent>
              <TabsContent value="responder">
                <AutoResponder />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reviews">Отзывы</TabsTrigger>
          <TabsTrigger value="questions">Вопросы</TabsTrigger>
          <TabsTrigger value="archive">Архив</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterForm 
                onFilterChange={handleFilterChange}
                loading={reviewsLoading}
              />
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Отзывы</CardTitle>
              <CardDescription>
                Управление отзывами на товары
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewsTable 
                reviews={reviews || []}
                loading={reviewsLoading}
                onRefresh={fetchReviews}
                isAnswered={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionsFilterForm 
                onFilterChange={handleQuestionsFilterChange}
                loading={questionsLoading}
              />
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Вопросы</CardTitle>
              <CardDescription>
                Управление вопросами покупателей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionsTable 
                questions={questions || []}
                loading={questionsLoading}
                onRefresh={fetchQuestions}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archive">
          <Card>
            <CardHeader>
              <CardTitle>Архив отзывов</CardTitle>
              <CardDescription>
                История обработанных отзывов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArchiveReviewsTable 
                reviews={archiveReviews || []}
                loading={archiveLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {activeTab === "reviews" && (
        <FloatingActionButtons 
          onRefresh={handleRefresh}
          selectedReviews={new Set()}
          reviews={reviews || []}
          onGenerateAnswers={() => {}}
          onSendAnswers={() => {}}
          onClearSelection={() => {}}
          hasAnswers={false}
        />
      )}
    </div>
  );
};

export default Reviews;
