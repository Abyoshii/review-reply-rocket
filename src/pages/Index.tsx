
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Clock, AlertCircle, RefreshCw, BarChart4, Coins, CalendarClock, Truck } from "lucide-react";

const Index = () => {
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  // Демо-данные для статистики (в реальном приложении будут приходить с API)
  const [stats, setStats] = useState({
    orders: {
      total: 1287,
      today: 42,
      pending: 23,
      completed: 19,
      canceled: 4
    },
    sales: {
      total: 985,
      today: 36,
      amount: 124500,
      returns: 5,
      avgOrder: 3126,
      mostSold: "Духи DIOR J'adore"
    }
  });
  
  // Обновление времени последнего обновления каждые 30 секунд для демо
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdateTime(new Date());
      
      // Имитация изменения данных для демонстрации
      setStats(prev => ({
        orders: {
          ...prev.orders,
          today: prev.orders.today + Math.floor(Math.random() * 3),
          pending: prev.orders.pending + Math.floor(Math.random() * 2),
        },
        sales: {
          ...prev.sales,
          today: prev.sales.today + Math.floor(Math.random() * 2),
          amount: prev.sales.amount + Math.floor(Math.random() * 10000),
        }
      }));
    }, 30000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400">Главная</h1>
      </div>
      
      {/* Обзорная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Всего заказов</p>
                <h3 className="text-3xl font-bold mt-1 text-purple-700 dark:text-purple-400">{stats.orders.total}</h3>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                <Package className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm mt-4 text-green-600 dark:text-green-400">+{stats.orders.today} сегодня</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ожидают сборки</p>
                <h3 className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{stats.orders.pending}</h3>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm mt-4 text-blue-600 dark:text-blue-400">{stats.orders.completed} собрано сегодня</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Всего продаж</p>
                <h3 className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.sales.total}</h3>
              </div>
              <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm mt-4 text-green-600 dark:text-green-400">+{stats.sales.today} сегодня</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Сумма продаж</p>
                <h3 className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">{new Intl.NumberFormat('ru-RU').format(stats.sales.amount)} ₽</h3>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-full">
                <RefreshCw className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-sm mt-4 text-red-500 dark:text-red-400">{stats.sales.returns} возвратов</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Подробная статистика по заказам и продажам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Блок статистики по заказам */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/20 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                <Package className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
              <CardTitle>Статистика заказов</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Заказы сегодня</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.orders.today}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium">Ожидают сборки</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.orders.pending}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Выполнено сегодня</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.orders.completed}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">Отменено</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.orders.canceled}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Обновление данных:</p>
                <p className="font-medium">Каждые 30 минут</p>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  <Clock className="h-3 w-3 mr-1" /> 30 минут
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                  <RefreshCw className="h-3 w-3 mr-1" /> 90 дней
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Блок статистики по продажам */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/20 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
              <CardTitle>Статистика продаж</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <BarChart4 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Продажи сегодня</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.sales.today}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium">Средний чек</span>
                </div>
                <p className="text-2xl font-bold mt-1">{new Intl.NumberFormat('ru-RU').format(stats.sales.avgOrder)} ₽</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm col-span-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Самый продаваемый товар</span>
                </div>
                <p className="text-xl font-bold mt-1 truncate">{stats.sales.mostSold}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Обновление данных:</p>
                <p className="font-medium">Каждые 30 минут</p>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  <Clock className="h-3 w-3 mr-1" /> 30 минут
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                  <RefreshCw className="h-3 w-3 mr-1" /> 90 дней
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Данные обновляются каждые 30 минут. Последнее обновление: {lastUpdateTime.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default Index;
