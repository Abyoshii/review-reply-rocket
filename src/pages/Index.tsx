
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import FilterForm from "@/components/FilterForm";
import ReviewsTable from "@/components/ReviewsTable";
import { WbAPI } from "@/lib/api";
import { WbReview, ReviewListParams } from "@/types/wb";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Filter, Text } from "lucide-react";

const Index = () => {
  const [unansweredReviews, setUnansweredReviews] = useState<WbReview[]>([]);
  const [answeredReviews, setAnsweredReviews] = useState<WbReview[]>([]);
  const [unansweredCount, setUnansweredCount] = useState<number>(0);
  const [loadingUnanswered, setLoadingUnanswered] = useState<boolean>(false);
  const [loadingAnswered, setLoadingAnswered] = useState<boolean>(false);
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
  const [showTextOnly, setShowTextOnly] = useState<boolean>(false);

  // Загрузка отзывов при изменении фильтров
  useEffect(() => {
    fetchUnansweredReviews();
  }, [unansweredFilters]);

  useEffect(() => {
    fetchAnsweredReviews();
  }, [answeredFilters]);

  // Получение количества неотвеченных отзывов
  useEffect(() => {
    fetchUnansweredCount();
  }, []);

  // Функция загрузки неотвеченных отзывов
  const fetchUnansweredReviews = async () => {
    setLoadingUnanswered(true);
    try {
      console.log("Загружаем неотвеченные отзывы с параметрами:", unansweredFilters);
      const response = await WbAPI.getReviews(unansweredFilters);
      
      console.log("Ответ API для неотвеченных отзывов:", response);
      
      // Проверяем, что response.data.feedbacks существует и является массивом
      if (response.data && response.data.feedbacks && Array.isArray(response.data.feedbacks)) {
        setUnansweredReviews(response.data.feedbacks);
      } else {
        // Если структура ответа не соответствует ожидаемой, выводим сообщение и устанавливаем пустой массив
        console.error("Некорректная структура ответа API для неотвеченных отзывов:", response);
        toast.error("Получены некорректные данные от API");
        setUnansweredReviews([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке неотвеченных отзывов:", error);
      toast.error("Не удалось загрузить неотвеченные отзывы. Пожалуйста, попробуйте позже.");
      setUnansweredReviews([]);
    } finally {
      setLoadingUnanswered(false);
    }
  };

  // Функция загрузки отвеченных отзывов
  const fetchAnsweredReviews = async () => {
    setLoadingAnswered(true);
    try {
      console.log("Загружаем отвеченные отзывы с параметрами:", answeredFilters);
      const response = await WbAPI.getReviews(answeredFilters);
      
      console.log("Ответ API для отвеченных отзывов:", response);
      
      // Проверяем, что response.data.feedbacks существует и является массивом
      if (response.data && response.data.feedbacks && Array.isArray(response.data.feedbacks)) {
        setAnsweredReviews(response.data.feedbacks);
      } else {
        // Если структура ответа не соответствует ожидаемой, выводим сообщение и устанавливаем пустой массив
        console.error("Некорректная структура ответа API для отвеченных отзывов:", response);
        toast.error("Получены некорректные данные от API");
        setAnsweredReviews([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке отвеченных отзывов:", error);
      toast.error("Не удалось загрузить отвеченные отзывы. Пожалуйста, попробуйте позже.");
      setAnsweredReviews([]);
    } finally {
      setLoadingAnswered(false);
    }
  };

  // Функция получения количества неотвеченных отзывов
  const fetchUnansweredCount = async () => {
    try {
      const count = await WbAPI.getUnansweredCount();
      setUnansweredCount(count);
    } catch (error) {
      console.error("Ошибка при загрузке количества неотвеченных отзывов:", error);
    }
  };

  // Функция обновления данных
  const handleRefresh = () => {
    fetchUnansweredReviews();
    fetchAnsweredReviews();
    fetchUnansweredCount();
    toast.success("Данные обновлены");
  };

  // Функция обработки изменения фильтров для неотвеченных отзывов
  const handleUnansweredFilterChange = (newFilters: ReviewListParams) => {
    // Сохраняем параметр isAnswered = false и hasText если был включен
    setUnansweredFilters({...newFilters, isAnswered: false, hasText: showTextOnly ? true : undefined});
  };

  // Функция обработки изменения фильтров для отвеченных отзывов
  const handleAnsweredFilterChange = (newFilters: ReviewListParams) => {
    // Сохраняем параметр isAnswered = true и hasText если был включен
    setAnsweredFilters({...newFilters, isAnswered: true, hasText: showTextOnly ? true : undefined});
  };

  // Функция переключения фильтра "только с текстом"
  const toggleTextOnlyFilter = () => {
    const newValue = !showTextOnly;
    setShowTextOnly(newValue);
    
    // Обновляем фильтры
    setUnansweredFilters(prev => ({...prev, hasText: newValue ? true : undefined}));
    setAnsweredFilters(prev => ({...prev, hasText: newValue ? true : undefined}));
    
    // Уведомляем пользователя
    toast.info(newValue ? "Показываются только отзывы с текстом" : "Показываются все отзывы");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6">
        <Header 
          unansweredCount={unansweredCount} 
          onRefresh={handleRefresh} 
        />
        
        <div className="mb-4 flex items-center justify-between">
          <Toggle 
            pressed={showTextOnly} 
            onPressedChange={toggleTextOnlyFilter}
            className="bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
          >
            <Text size={16} className="mr-2" />
            {showTextOnly ? "Только с текстом" : "Все отзывы"}
          </Toggle>
        </div>
        
        <div className="space-y-8">
          {/* Секция неотвеченных отзывов */}
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
          
          {/* Секция отвеченных отзывов */}
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
        </div>

        {/* Водяной знак */}
        <div className="text-center py-4 mt-8 text-sm text-gray-500 dark:text-gray-400 opacity-70 transition-colors duration-300">
          @Таабалдыев Нургазы
        </div>
      </div>
    </div>
  );
};

export default Index;
