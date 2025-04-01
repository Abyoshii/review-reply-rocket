
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import FilterForm from "@/components/FilterForm";
import ReviewsTable from "@/components/ReviewsTable";
import { WbAPI } from "@/lib/api";
import { WbReview, ReviewListParams } from "@/types/wb";
import { toast } from "sonner";

const Index = () => {
  const [reviews, setReviews] = useState<WbReview[]>([]);
  const [unansweredCount, setUnansweredCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<ReviewListParams>({
    isAnswered: false,
    take: 100,
    skip: 0,
    order: "dateDesc"
  });

  // Загрузка отзывов при изменении фильтров
  useEffect(() => {
    fetchReviews();
  }, [filters]);

  // Получение количества неотвеченных отзывов
  useEffect(() => {
    fetchUnansweredCount();
  }, []);

  // Функция загрузки отзывов
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await WbAPI.getReviews(filters);
      
      // Проверяем, что response.data.feedbacks существует и является массивом
      if (response.data && response.data.feedbacks && Array.isArray(response.data.feedbacks)) {
        setReviews(response.data.feedbacks);
      } else {
        // Если структура ответа не соответствует ожидаемой, выводим сообщение и устанавливаем пустой массив
        console.error("Некорректная структура ответа API:", response);
        toast.error("Получены некорректные данные от API");
        setReviews([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке отзывов:", error);
      toast.error("Не удалось загрузить отзывы. Пожалуйста, попробуйте позже.");
      setReviews([]);
    } finally {
      setLoading(false);
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
    fetchReviews();
    fetchUnansweredCount();
    toast.success("Данные обновлены");
  };

  // Функция обработки изменения фильтров
  const handleFilterChange = (newFilters: ReviewListParams) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <Header 
          unansweredCount={unansweredCount} 
          onRefresh={handleRefresh} 
        />
        
        <div className="space-y-6">
          <FilterForm 
            onFilterChange={handleFilterChange} 
            loading={loading} 
          />
          
          <ReviewsTable 
            reviews={reviews} 
            loading={loading} 
            onRefresh={handleRefresh} 
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
