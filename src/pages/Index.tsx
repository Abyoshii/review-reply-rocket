
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package, TrendingUp, Clock, AlertCircle, RefreshCw } from "lucide-react";

const Index = () => {
  const [ordersExpanded, setOrdersExpanded] = useState(true);
  const [salesExpanded, setSalesExpanded] = useState(true);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400">Главная</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-purple-100 dark:border-purple-900/40">
          <Collapsible open={ordersExpanded} onOpenChange={setOrdersExpanded}>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/20 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                    <Package className="h-6 w-6 text-purple-700 dark:text-purple-400" />
                  </div>
                  <CardTitle>Заказы</CardTitle>
                </div>
                <CollapsibleTrigger className="hover:bg-purple-100 dark:hover:bg-purple-900/20 p-1 rounded-full transition-all duration-200">
                  <ChevronRight className={`h-5 w-5 text-purple-700 dark:text-purple-400 transition-transform duration-300 ${ordersExpanded ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
              </div>
              <CardDescription>
                Метод предоставляет информацию обо всех заказах. Данные обновляются каждые 30 минут.
              </CardDescription>
            </CardHeader>
            
            <CollapsibleContent className="animate-accordion-down">
              <CardContent className="pt-4 space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg text-sm">
                  <span className="font-mono text-sm text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-2 py-1 rounded">
                    GET https://statistics-api.wildberries.ru/api/v1/supplier/orders
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                      <Clock className="h-3 w-3 mr-1" /> Обновление: 30 минут
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                      <AlertCircle className="h-3 w-3 mr-1" /> Лимит: 1 запрос/мин
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                      <RefreshCw className="h-3 w-3 mr-1" /> Хранение: 90 дней
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Основные принципы:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>1 строка = 1 заказ = 1 сборочное задание = 1 товар</li>
                      <li>Для идентификации заказа используется <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">srid</span></li>
                      <li>Информация хранится <strong>90 дней</strong></li>
                      <li>Максимум <strong>1 запрос в минуту</strong></li>
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Параметры запроса:</h3>
                    <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 space-y-3 shadow-sm">
                      <div>
                        <span className="font-mono text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 px-1.5 py-0.5 rounded mr-2">
                          dateFrom
                        </span>
                        <span className="text-xs text-red-500 dark:text-red-400">[обязательный]</span>
                        <p className="text-sm mt-1 ml-1 text-gray-700 dark:text-gray-300">
                          Дата/время в формате RFC3339 (<code>2019-06-20T00:00:00</code>)
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded mr-2">
                          flag
                        </span>
                        <span className="text-xs text-gray-500">[по умолчанию 0]</span>
                        <ul className="text-sm mt-1 ml-5 list-disc text-gray-700 dark:text-gray-300">
                          <li><code>flag=0</code> — выгружаются заказы, обновлённые с момента <code>dateFrom</code></li>
                          <li><code>flag=1</code> — выгружаются <strong>все заказы на дату</strong> <code>dateFrom</code> (время игнорируется)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg">
                    <h3 className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1 text-sm">
                      <AlertCircle className="h-4 w-4" /> Ограничение ответа
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                      В ответе — максимум ~80 000 строк. Чтобы получить больше — повторно вызываем API, 
                      передавая в <code>dateFrom</code> значение поля <code>lastChangeDate</code> из последней строки ответа.
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                      Если в ответе массив <code>[]</code>, значит всё уже выгружено.
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-purple-100 dark:border-purple-900/40">
          <Collapsible open={salesExpanded} onOpenChange={setSalesExpanded}>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/20 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-700 dark:text-purple-400" />
                  </div>
                  <CardTitle>Продажи</CardTitle>
                </div>
                <CollapsibleTrigger className="hover:bg-purple-100 dark:hover:bg-purple-900/20 p-1 rounded-full transition-all duration-200">
                  <ChevronRight className={`h-5 w-5 text-purple-700 dark:text-purple-400 transition-transform duration-300 ${salesExpanded ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
              </div>
              <CardDescription>
                Метод предоставляет данные о продажах и возвратах товаров. Обновление данных — раз в 30 минут.
              </CardDescription>
            </CardHeader>
            
            <CollapsibleContent className="animate-accordion-down">
              <CardContent className="pt-4 space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg text-sm">
                  <span className="font-mono text-sm text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-2 py-1 rounded">
                    GET https://statistics-api.wildberries.ru/api/v1/supplier/sales
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                      <Clock className="h-3 w-3 mr-1" /> Обновление: 30 минут
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                      <AlertCircle className="h-3 w-3 mr-1" /> Лимит: 1 запрос/мин
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                      <RefreshCw className="h-3 w-3 mr-1" /> Хранение: 90 дней
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Основные принципы:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>1 строка = 1 продажа = 1 товар</li>
                      <li>Используется <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">srid</span> для идентификации</li>
                      <li>Данные хранятся <strong>90 дней</strong></li>
                      <li>Лимит — <strong>1 запрос в минуту</strong></li>
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Параметры запроса:</h3>
                    <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 space-y-3 shadow-sm">
                      <div>
                        <span className="font-mono text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 px-1.5 py-0.5 rounded mr-2">
                          dateFrom
                        </span>
                        <span className="text-xs text-red-500 dark:text-red-400">[обязательный]</span>
                        <p className="text-sm mt-1 ml-1 text-gray-700 dark:text-gray-300">
                          Дата/время в формате RFC3339 (<code>2019-06-20T00:00:00</code>)
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded mr-2">
                          flag
                        </span>
                        <span className="text-xs text-gray-500">[по умолчанию 0]</span>
                        <ul className="text-sm mt-1 ml-5 list-disc text-gray-700 dark:text-gray-300">
                          <li><code>flag=0</code> — только новые обновления с момента <code>dateFrom</code></li>
                          <li><code>flag=1</code> — всё, что было в день <code>dateFrom</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg">
                    <h3 className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1 text-sm">
                      <AlertCircle className="h-4 w-4" /> Ограничение ответа
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                      Максимум ~80 000 строк в одном ответе. Далее — новый запрос с <code>lastChangeDate</code>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Данные обновляются каждые 30 минут. Последнее обновление: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default Index;
