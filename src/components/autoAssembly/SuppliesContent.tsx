
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface SuppliesContentProps {
  isLoading: boolean;
  supplies: any[];
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
        <div>
          <Button 
            variant="outline" 
            className="border-dashed" 
            onClick={loadData}
            disabled={isLoading}
          >
            {isLoading ? 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
              <RefreshCw className="mr-2 h-4 w-4" />
            }
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-amber-500/50" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Модуль поставок находится в разработке</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Раздел поставок временно недоступен и находится в разработке
          </p>
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setActiveTab("orders")}
            >
              Вернуться к заказам
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuppliesContent;
