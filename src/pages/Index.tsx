
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import FilterForm from "@/components/FilterForm";
import ReviewsTable from "@/components/ReviewsTable";
import QuestionsTable from "@/components/QuestionsTable";
import QuestionsFilterForm from "@/components/QuestionsFilterForm";
import ArchiveReviewsTable from "@/components/ArchiveReviewsTable";
import AutoResponder from "@/components/AutoResponder";
import { WbAPI } from "@/lib/api";
import { WbReview, ReviewListParams, QuestionListParams, WbQuestion } from "@/types/wb";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text, MessageCircle, ArchiveIcon, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/ThemeProvider";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const Index = () => {
  const [unansweredReviews, setUnansweredReviews] = useState<WbReview[]>([]);
  const [answeredReviews, setAnsweredReviews] = useState<WbReview[]>([]);
  const [archiveReviews, setArchiveReviews] = useState<WbReview[]>([]);
  const [unansweredCount, setUnansweredCount] = useState<number>(0);
  const [loadingUnanswered, setLoadingUnanswered] = useState<boolean>(false);
  const [loadingAnswered, setLoadingAnswered] = useState<boolean>(false);
  const [loadingArchive, setLoadingArchive] = useState<boolean>(false);
  const [unansweredFilters, setUnansweredFilters] = useState<ReviewListParams>({
    isAnswered: false,
    take: 100,
    skip: 0,
    order: "dateDesc"
  });
  const [answeredFilters, setAnsweredFilters] = useState<ReviewListParams>({
    isAnswered: true,
    take: 100,
    skip: 0,
    order: "dateDesc"
  });
  const [archiveFilters, setArchiveFilters] = useState<ReviewListParams>({
    take: 100,
    skip: 0,
    order: "dateDesc"
  });
  
  const [unansweredQuestions, setUnansweredQuestions] = useState<WbQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<WbQuestion[]>([]);
  const [unansweredQuestionsCount, setUnansweredQuestionsCount] = useState<number>(0);
  const [loadingUnansweredQuestions, setLoadingUnansweredQuestions] = useState<boolean>(false);
  const [loadingAnsweredQuestions, setLoadingAnsweredQuestions] = useState<boolean>(false);
  const [unansweredQuestionsFilters, setUnansweredQuestionsFilters] = useState<QuestionListParams>({
    isAnswered: false,
    take: 100,
    skip: 0,
    order: "dateDesc"
  });
  const [answeredQuestionsFilters, setAnsweredQuestionsFilters] = useState<QuestionListParams>({
    isAnswered: true,
    take: 100,
    skip: 0,
    order: "dateDesc"
  });
  
  const [activeTab, setActiveTab] = useState<string>("reviews");
  const [activeReviewsTab, setActiveReviewsTab] = useState<string>("unanswered");
  const [autoResponderOpen, setAutoResponderOpen] = useState(false);

  // Initial data loading
  useEffect(() => {
    fetchUnansweredReviews();
    fetchUnansweredCount();
    fetchUnansweredQuestionsCount();
  }, []);

  // Filter-dependent data loading
  useEffect(() => {
    fetchUnansweredReviews();
  }, [unansweredFilters]);

  useEffect(() => {
    fetchAnsweredReviews();
  }, [answeredFilters]);

  useEffect(() => {
    if (activeReviewsTab === "archive") {
      fetchArchiveReviews();
    }
  }, [archiveFilters, activeReviewsTab]);

  useEffect(() => {
    if (activeTab === "questions") {
      fetchUnansweredQuestions();
    }
  }, [unansweredQuestionsFilters, activeTab]);

  useEffect(() => {
    if (activeTab === "questions") {
      fetchAnsweredQuestions();
    }
  }, [answeredQuestionsFilters, activeTab]);

  const fetchUnansweredReviews = async () => {
    setLoadingUnanswered(true);
    try {
      const filters = { ...unansweredFilters, isAnswered: false };
      console.log("Загружаем неотвеченные отзывы с параметрами:", filters);
      
      const response = await WbAPI.getReviews(filters);
      
      if (response.data && response.data.feedbacks && Array.isArray(response.data.feedbacks)) {
        let filteredReviews = response.data.feedbacks;
        
        if (filters.ratingFilter) {
          filteredReviews = applyRatingFilter(filteredReviews, filters.ratingFilter);
        }
        
        setUnansweredReviews(filteredReviews);
      } else {
        console.error("Некорректная структура ответа API для неотвеченных отзывов:", response);
        toast({
          title: "Ошибка загрузки",
          description: "Получены некорректные данные от API",
          variant: "destructive",
          important: true
        });
        setUnansweredReviews([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке неотвеченных отзывов:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить неотвеченные отзывы. Пожалуйста, попробуйте позже.",
        variant: "destructive",
        important: true
      });
      setUnansweredReviews([]);
    } finally {
      setLoadingUnanswered(false);
    }
  };

  const fetchAnsweredReviews = async () => {
    setLoadingAnswered(true);
    try {
      const filters = { ...answeredFilters, isAnswered: true };
      console.log("Загружаем отвеченные отзывы с параметрами:", filters);
      
      const response = await WbAPI.getReviews(filters);
      
      if (response.data && response.data.feedbacks && Array.isArray(response.data.feedbacks)) {
        let filteredReviews = response.data.feedbacks.filter(review => 
          review.answer && review.answer.text && review.answer.text.trim().length > 0
        );
        
        if (filters.ratingFilter) {
          filteredReviews = applyRatingFilter(filteredReviews, filters.ratingFilter);
        }
        
        setAnsweredReviews(filteredReviews);
      } else {
        console.error("Некорректная структура ответа API для отвеченных отзывов:", response);
        toast({
          title: "Ошибка загрузки",
          description: "Получены некорректные данные от API",
          variant: "destructive",
          important: true
        });
        setAnsweredReviews([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке отвеченных отзывов:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить отвеченные отзывы. Пожалуйста, попробуйте позже.",
        variant: "destructive",
        important: true
      });
      setAnsweredReviews([]);
    } finally {
      setLoadingAnswered(false);
    }
  };

  const fetchArchiveReviews = async () => {
    setLoadingArchive(true);
    try {
      console.log("Загружаем архивные отзывы с параметрами:", archiveFilters);
      const response = await WbAPI.getArchiveReviews(archiveFilters);
      
      if (response.data && response.data.feedbacks && Array.isArray(response.data.feedbacks)) {
        let filteredReviews = response.data.feedbacks;
        
        if (archiveFilters.ratingFilter) {
          filteredReviews = applyRatingFilter(filteredReviews, archiveFilters.ratingFilter);
        }
        
        setArchiveReviews(filteredReviews);
      } else {
        console.error("Некорректная структура ответа API для архивных отзывов:", response);
        toast({
          title: "Ошибка загрузки",
          description: "Получены некорректные данные от API",
          variant: "destructive",
          important: true
        });
        setArchiveReviews([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке архивных отзывов:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить архивные отзывы. Пожалуйста, попробуйте позже.",
        variant: "destructive",
        important: true
      });
      setArchiveReviews([]);
    } finally {
      setLoadingArchive(false);
    }
  };

  const applyRatingFilter = (reviews: WbReview[], ratingFilter: string): WbReview[] => {
    if (ratingFilter === 'all') return reviews;
    
    return reviews.filter(review => {
      const rating = review.productValuation || review.rating || 0;
      
      if (ratingFilter === 'positive') return rating >= 4;
      if (ratingFilter === 'negative') return rating <= 2;
      return rating === parseInt(ratingFilter);
    });
  };

  const fetchUnansweredCount = async () => {
    try {
      const count = await WbAPI.getUnansweredCount();
      setUnansweredCount(count);
    } catch (error) {
      console.error("Ошибка при загрузке количества неотвеченных отзывов:", error);
    }
  };

  const fetchUnansweredQuestions = async () => {
    setLoadingUnansweredQuestions(true);
    try {
      console.log("Загружаем неотвеченные вопросы с параметрами:", unansweredQuestionsFilters);
      const response = await WbAPI.getQuestions(unansweredQuestionsFilters);
      
      if (response.data && response.data.questions && Array.isArray(response.data.questions)) {
        setUnansweredQuestions(response.data.questions);
      } else {
        console.error("Некорректная структура ответа API для неотвеченных вопросов:", response);
        toast({
          title: "Ошибка загрузки",
          description: "Получены некорректные данные от API",
          variant: "destructive",
          important: true
        });
        setUnansweredQuestions([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке неотвеченных вопросов:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить неотвеченные вопросы. Пожалуйста, попробуйте позже.",
        variant: "destructive",
        important: true
      });
      setUnansweredQuestions([]);
    } finally {
      setLoadingUnansweredQuestions(false);
    }
  };

  const fetchAnsweredQuestions = async () => {
    setLoadingAnsweredQuestions(true);
    try {
      console.log("Загружаем отвеченные вопросы с параметрами:", answeredQuestionsFilters);
      const response = await WbAPI.getQuestions(answeredQuestionsFilters);
      
      if (response.data && response.data.questions && Array.isArray(response.data.questions)) {
        setAnsweredQuestions(response.data.questions);
      } else {
        console.error("Некорректная структура ответа API для отвеченных вопросов:", response);
        toast({
          title: "Ошибка загрузки",
          description: "Получены некорректные данные от API",
          variant: "destructive",
          important: true
        });
        setAnsweredQuestions([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке отвеченных вопросов:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить отвеченные вопросы. Пожалуйста, попробуйте позже.",
        variant: "destructive",
        important: true
      });
      setAnsweredQuestions([]);
    } finally {
      setLoadingAnsweredQuestions(false);
    }
  };

  const fetchUnansweredQuestionsCount = async () => {
    try {
      const count = await WbAPI.getUnansweredQuestionsCount();
      setUnansweredQuestionsCount(count);
    } catch (error) {
      console.error("Ошибка при загрузке количества неотвеченных вопросов:", error);
    }
  };

  const handleRefresh = () => {
    if (activeTab === "reviews") {
      if (activeReviewsTab === "unanswered") {
        fetchUnansweredReviews();
      } else if (activeReviewsTab === "answered") {
        fetchAnsweredReviews();
      } else if (activeReviewsTab === "archive") {
        fetchArchiveReviews();
      }
      fetchUnansweredCount();
    } else if (activeTab === "questions") {
      fetchUnansweredQuestions();
      fetchAnsweredQuestions();
      fetchUnansweredQuestionsCount();
    }
    
    toast({
      title: "Данные обновлены",
      description: "Информация успешно обновлена",
      important: false
    });
  };

  const handleUnansweredFilterChange = (newFilters: ReviewListParams) => {
    setUnansweredFilters({ ...newFilters, isAnswered: false });
  };

  const handleAnsweredFilterChange = (newFilters: ReviewListParams) => {
    setAnsweredFilters({ ...newFilters, isAnswered: true });
  };

  const handleArchiveFilterChange = (newFilters: ReviewListParams) => {
    setArchiveFilters(newFilters);
  };

  const handleUnansweredQuestionsFilterChange = (newFilters: QuestionListParams) => {
    setUnansweredQuestionsFilters({...newFilters, isAnswered: false});
  };

  const handleAnsweredQuestionsFilterChange = (newFilters: QuestionListParams) => {
    setAnsweredQuestionsFilters({...newFilters, isAnswered: true});
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === "questions" && unansweredQuestions.length === 0) {
      fetchUnansweredQuestions();
      fetchAnsweredQuestions();
    }
  };

  const handleReviewsTabChange = (tab: string) => {
    setActiveReviewsTab(tab);
    
    if (tab === "unanswered" && unansweredReviews.length === 0) {
      fetchUnansweredReviews();
    } else if (tab === "answered" && answeredReviews.length === 0) {
      fetchAnsweredReviews();
    } else if (tab === "archive" && archiveReviews.length === 0) {
      fetchArchiveReviews();
    }
  };

  const handleAutoResponderSuccess = () => {
    handleRefresh();
    setAutoResponderOpen(false);
  };

  const getSelectedReviews = () => {
    if (activeReviewsTab === "unanswered") {
      return unansweredReviews;
    } else if (activeReviewsTab === "answered") {
      return answeredReviews;
    } else if (activeReviewsTab === "archive") {
      return archiveReviews;
    }
    return [];
  };

  return (
    <ThemeProvider defaultTheme="system">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <Header 
              unansweredCount={unansweredCount}
              unansweredQuestionsCount={unansweredQuestionsCount}
              onRefresh={handleRefresh} 
            />
            
            <Dialog open={autoResponderOpen} onOpenChange={setAutoResponderOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors duration-300"
                >
                  <Bot size={16} />
                  Автоответчик
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <AutoResponder 
                  selectedReviews={getSelectedReviews()} 
                  onSuccess={handleAutoResponderSuccess} 
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="mb-4 grid grid-cols-2 mx-auto max-w-md">
              <TabsTrigger value="reviews" className="flex items-center gap-1">
                <Text size={16} /> Отзывы
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-1">
                <MessageCircle size={16} /> Вопросы клиентов
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews" className="space-y-6">
              <Tabs value={activeReviewsTab} onValueChange={handleReviewsTabChange} className="space-y-4">
                <TabsList className="mb-4 grid grid-cols-3 mx-auto max-w-md">
                  <TabsTrigger value="unanswered">Ждут ответа</TabsTrigger>
                  <TabsTrigger value="answered">Есть ответ</TabsTrigger>
                  <TabsTrigger value="archive" className="flex items-center gap-1">
                    <ArchiveIcon size={14} /> Архив
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="unanswered">
                  <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors duration-300">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white transition-colors duration-300 flex items-center">
                      <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm mr-3">ЖДУТ ОТВЕТА</span>
                      Неотвеченные отзывы
                    </h2>
                    
                    <FilterForm 
                      onFilterChange={handleUnansweredFilterChange} 
                      loading={loadingUnanswered} 
                    />
                    
                    <ReviewsTable 
                      reviews={unansweredReviews} 
                      loading={loadingUnanswered} 
                      onRefresh={handleRefresh} 
                      isAnswered={false}
                    />
                  </section>
                </TabsContent>
                
                <TabsContent value="answered">
                  <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors duration-300">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white transition-colors duration-300 flex items-center">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm mr-3">ОТВЕЧЕННЫЕ</span>
                      Отвеченные отзывы
                    </h2>
                    
                    <FilterForm 
                      onFilterChange={handleAnsweredFilterChange} 
                      loading={loadingAnswered} 
                    />
                    
                    <ReviewsTable 
                      reviews={answeredReviews} 
                      loading={loadingAnswered} 
                      onRefresh={handleRefresh} 
                      isAnswered={true}
                    />
                  </section>
                </TabsContent>
                
                <TabsContent value="archive">
                  <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors duration-300">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white transition-colors duration-300 flex items-center">
                      <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm mr-3">АРХИВ</span>
                      Архивные отзывы
                    </h2>
                    
                    <FilterForm 
                      onFilterChange={handleArchiveFilterChange} 
                      loading={loadingArchive} 
                    />
                    
                    <ArchiveReviewsTable 
                      reviews={archiveReviews} 
                      loading={loadingArchive} 
                    />
                  </section>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-6">
              <div className="space-y-8">
                <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors duration-300">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white transition-colors duration-300 flex items-center">
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm mr-3">ЖДУТ ОТВЕТА</span>
                    Неотвеченные вопросы
                  </h2>
                  
                  <QuestionsFilterForm 
                    onFilterChange={handleUnansweredQuestionsFilterChange} 
                    loading={loadingUnansweredQuestions} 
                  />
                  
                  <QuestionsTable 
                    questions={unansweredQuestions} 
                    loading={loadingUnansweredQuestions} 
                    onRefresh={handleRefresh} 
                  />
                </section>
                
                <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors duration-300">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white transition-colors duration-300 flex items-center">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm mr-3">ОТВЕЧЕННЫЕ</span>
                    Отвеченные вопросы
                  </h2>
                  
                  <QuestionsFilterForm 
                    onFilterChange={handleAnsweredQuestionsFilterChange} 
                    loading={loadingAnsweredQuestions} 
                  />
                  
                  <QuestionsTable 
                    questions={answeredQuestions} 
                    loading={loadingAnsweredQuestions} 
                    onRefresh={handleRefresh} 
                  />
                </section>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center py-4 mt-8 text-sm text-gray-500 dark:text-gray-400 opacity-70 transition-colors duration-300">
            @Таабалдыев Нургазы
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
