
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Truck, RefreshCw } from "lucide-react";
import { Supply } from "@/types/wb";

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
              <div key={supply.id} className="p-4 border rounded-lg">
                {supply.name}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuppliesContent;
