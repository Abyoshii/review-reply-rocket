
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Clock, AlertCircle, RefreshCw, BarChart4, Coins, CalendarClock, Truck, Loader2 } from "lucide-react";
import { WbAPI } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Статистика 
  const [stats, setStats] = useState({
    reviews: {
      unansweredCount: 0,
      archiveCount: 0,
      lastUpdated: new Date()
    },
    questions: {
      unansweredCount: 0,
      lastUpdated: new Date()
    },
    sales: {
      total: 0,
      today: 0,
      amount: 0,
      returns: 0,
      avgOrder: 0,
      mostSold: "-"
    }
  });
  
  // Получение данных с API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Получаем количество неотвеченных отзывов
      const unansweredCount = await WbAPI.getUnansweredCount();
      
      // Получаем количество неотвеченных вопросов
      const unansweredQuestionsCount = await WbAPI.getUnansweredQuestionsCount();
      
      // Обновляем статистику с полученными данными
      setStats(prev => ({
        ...prev,
        reviews: {
          unansweredCount,
          archiveCount: prev.reviews.archiveCount,
          lastUpdated: new Date()
        },
        questions: {
          unansweredCount: unansweredQuestionsCount,
          lastUpdated: new Date()
        }
      }));
      
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      setError("Не удалось загрузить данные. Проверьте API-токен и сетевое соединение.");
      toast.error("Не удалось обновить статистику. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };
  
  // Загрузка данных при первом рендере
  useEffect(() => {
    fetchData();
    
    // Обновление данных каждые 5 минут
    const timer = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Обработчик ручного обновления
  const handleRefresh = () => {
    fetchData();
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400">Главная</h1>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          className="flex items-center gap-2"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Обновить данные
        </Button>
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
      
      {/* Обзорная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Неотвеченные отзывы</p>
                <h3 className="text-3xl font-bold mt-1 text-purple-700 dark:text-purple-400">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.reviews.unansweredCount}
                </h3>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                <Package className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm mt-4 text-gray-600 dark:text-gray-400">Требуют вашего ответа</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Неотвеченные вопросы</p>
                <h3 className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.questions.unansweredCount}
                </h3>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm mt-4 text-blue-600 dark:text-blue-400">Ожидают ответа</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800/20 shadow-md col-span-1 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Статистика Wildberries</p>
                <h3 className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
                  Данные доступны в личном кабинете WB
                </h3>
              </div>
              <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm mt-4 text-green-600 dark:text-green-400">
              Статистика продаж и аналитика недоступны через API
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Подробная статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Блок статистики по отзывам */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/20 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                <Package className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
              <CardTitle>Статистика отзывов</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Неотвеченные отзывы</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.reviews.unansweredCount}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium">Последнее обновление</span>
                </div>
                <p className="text-sm font-bold mt-1">
                  {stats.reviews.lastUpdated.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Обновление данных:</p>
                <p className="font-medium">Каждые 5 минут</p>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  <Clock className="h-3 w-3 mr-1" /> 5 минут
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                  <RefreshCw className="h-3 w-3 mr-1" /> Автоматически
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Блок статистики по вопросам */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/20 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
              <CardTitle>Статистика вопросов</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <BarChart4 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Неотвеченные вопросы</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.questions.unansweredCount}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium">Последнее обновление</span>
                </div>
                <p className="text-sm font-bold mt-1">
                  {stats.questions.lastUpdated.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Обновление данных:</p>
                <p className="font-medium">Каждые 5 минут</p>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  <Clock className="h-3 w-3 mr-1" /> 5 минут
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                  <RefreshCw className="h-3 w-3 mr-1" /> Автоматически
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Данные обновляются каждые 5 минут. Последнее обновление: {lastUpdateTime.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default Index;
