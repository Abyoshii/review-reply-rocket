
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Supply, AssemblyOrder, ProductCategory } from "@/types/wb";
import { AutoAssemblyAPI } from "@/lib/autoAssemblyApi";
import { SuppliesAPI } from "@/lib/suppliesApi";
import SuppliesContent from "@/components/autoAssembly/SuppliesContent";
import OrdersContent from "@/components/autoAssembly/OrdersContent";

const AutoAssembly = () => {
  // Состояния для данных
  const [activeTab, setActiveTab] = useState<"orders" | "supplies">("orders");
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [isLoadingSupplies, setIsLoadingSupplies] = useState<boolean>(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Загрузка поставок
  const loadSupplies = async () => {
    setIsLoadingSupplies(true);
    setHasError(false);
    
    try {
      console.log("Загрузка списка поставок...");
      const suppliesData = await AutoAssemblyAPI.getSupplies();
      console.log(`Загружено ${suppliesData.length} поставок`, suppliesData);
      setSupplies(suppliesData);
    } catch (error) {
      console.error("Ошибка при загрузке поставок:", error);
      setHasError(true);
      toast.error("Не удалось загрузить список поставок");
    } finally {
      setIsLoadingSupplies(false);
    }
  };
  
  // Загрузка заказов
  const loadOrders = async () => {
    setIsLoadingOrders(true);
    setHasError(false);
    
    try {
      console.log("Загрузка новых заказов...");
      const ordersData = await AutoAssemblyAPI.getNewOrders();
      console.log(`Загружено ${ordersData.length} заказов`, ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Ошибка при загрузке заказов:", error);
      setHasError(true);
      toast.error("Не удалось загрузить список заказов");
    } finally {
      setIsLoadingOrders(false);
    }
  };
  
  // Загрузка всех данных
  const loadAllData = async () => {
    await Promise.all([
      loadSupplies(),
      loadOrders()
    ]);
  };
  
  // Загрузка данных при монтировании
  useEffect(() => {
    loadAllData();
  }, []);
  
  // Обработчик смены вкладки
  const handleTabChange = (value: string) => {
    if (value === "orders" || value === "supplies") {
      setActiveTab(value);
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Автосборка</h1>
          <p className="text-muted-foreground">
            Управление сборочными заданиями и поставками
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={loadAllData}
          disabled={isLoadingSupplies || isLoadingOrders}
          className="mt-4 md:mt-0"
        >
          {(isLoadingSupplies || isLoadingOrders) ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Обновить все данные
        </Button>
      </div>
      
      <Tabs 
        defaultValue="orders" 
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Сборочные задания</TabsTrigger>
          <TabsTrigger value="supplies">Поставки</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          <OrdersContent
            isLoading={isLoadingOrders}
            orders={orders}
            supplies={supplies}
            loadData={loadAllData}
            setActiveTab={setActiveTab}
          />
        </TabsContent>
        
        <TabsContent value="supplies" className="space-y-4">
          <SuppliesContent 
            isLoading={isLoadingSupplies}
            supplies={supplies}
            loadData={loadAllData}
            setActiveTab={setActiveTab}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoAssembly;
