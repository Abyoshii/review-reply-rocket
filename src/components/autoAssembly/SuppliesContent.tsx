
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Truck, RefreshCw, CalendarIcon, Box, Package } from "lucide-react";
import { Supply } from "@/types/wb";
import { Badge } from "@/components/ui/badge";

interface SuppliesContentProps {
  isLoading: boolean;
  supplies: Supply[];
  loadData: () => Promise<void>;
  setActiveTab: (tab: "orders" | "supplies") => void;
}

const SuppliesContent: React.FC<SuppliesContentProps> = ({
  isLoading,
  supplies,
  loadData,
  setActiveTab
}) => {
  // Format date in Russian locale
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get badge color based on supply status
  const getStatusBadge = (status: string, done: boolean) => {
    if (done) {
      return <Badge className="bg-green-600">Завершена</Badge>;
    }
    
    switch(status) {
      case 'NEW':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Новая</Badge>;
      case 'PROCESSING':
        return <Badge variant="secondary" className="bg-amber-500">В обработке</Badge>;
      case 'READY':
        return <Badge variant="secondary" className="bg-green-500">Готова</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Поставки</CardTitle>
        <Button variant="outline" className="border-dashed" onClick={() => loadData()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить список
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка поставок...
          </div>
        ) : supplies.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center">
              <Truck className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Нет созданных поставок</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Создайте поставки вручную или используйте автоматическое формирование
            </p>
            <Button className="mt-4" onClick={() => setActiveTab("orders")}>
              Перейти к сборочным заданиям
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplies.map(supply => (
              <div key={supply.id} className="p-4 border rounded-lg shadow-sm hover:shadow transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-base">{supply.name}</h3>
                  {getStatusBadge(supply.status, supply.done)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Создана: {formatDate(supply.createdAt)}</span>
                  </div>
                  
                  {supply.scanDt && (
                    <div className="flex items-center text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>Сканирование: {formatDate(supply.scanDt)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center mt-1">
                    <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{supply.ordersCount}</span>
                    <span className="text-muted-foreground ml-1">заказов</span>
                  </div>
                  
                  {supply.supplyId && (
                    <div className="flex items-center mt-1">
                      <Box className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">ID: {supply.supplyId}</span>
                    </div>
                  )}
                  
                  {supply.category && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">{supply.category}</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuppliesContent;
