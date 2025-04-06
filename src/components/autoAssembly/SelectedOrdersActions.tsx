
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Download, CheckCheck } from "lucide-react";

interface SelectedOrdersActionsProps {
  selectedOrdersCount: number;
  isProcessing: boolean;
  handlePrintStickers: () => void;
  handleAssembleOrders: () => void;
}

const SelectedOrdersActions: React.FC<SelectedOrdersActionsProps> = ({
  selectedOrdersCount,
  isProcessing,
  handlePrintStickers,
  handleAssembleOrders
}) => {
  if (selectedOrdersCount === 0) return null;
  
  return (
    <div className="p-4 flex flex-wrap items-center justify-between bg-muted/50 gap-2">
      <span>Выбрано заказов: <strong>{selectedOrdersCount}</strong></span>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={handlePrintStickers} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Подготовка стикеров...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Распечатать стикеры
            </>
          )}
        </Button>
        
        <Button onClick={handleAssembleOrders} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Создание поставки...
            </>
          ) : (
            <>
              <CheckCheck className="mr-2 h-4 w-4" />
              Создать поставку из выбранных
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectedOrdersActions;
