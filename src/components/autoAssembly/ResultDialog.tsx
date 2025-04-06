
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Droplets, Shirt, Paperclip } from "lucide-react";

interface ResultDialogProps {
  showResultDialog: boolean;
  setShowResultDialog: (show: boolean) => void;
  autoAssemblyResult: {
    success: boolean;
    perfumeCount: number;
    clothingCount: number;
    miscCount: number;
    perfumeSupplyId?: number;
    clothingSupplyId?: number;
    miscSupplyId?: number;
  } | null;
  setActiveTab: (tab: string) => void;
}

const ResultDialog: React.FC<ResultDialogProps> = ({
  showResultDialog,
  setShowResultDialog,
  autoAssemblyResult,
  setActiveTab
}) => {
  return (
    <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Поставки сформированы</DialogTitle>
          <DialogDescription>
            Автоматическое формирование поставок завершено
          </DialogDescription>
        </DialogHeader>
        
        {autoAssemblyResult && (
          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <Droplets className="text-purple-500 h-5 w-5 mr-2" />
                <span className="font-medium">Парфюмерия:</span>
                <span className="ml-2">{autoAssemblyResult.perfumeCount} товаров</span>
                {autoAssemblyResult.perfumeSupplyId && <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Создана</Badge>}
              </div>
              
              <div className="flex items-center">
                <Shirt className="text-green-500 h-5 w-5 mr-2" />
                <span className="font-medium">Одежда:</span>
                <span className="ml-2">{autoAssemblyResult.clothingCount} товаров</span>
                {autoAssemblyResult.clothingSupplyId && <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Создана</Badge>}
              </div>
              
              <div className="flex items-center">
                <Paperclip className="text-gray-500 h-5 w-5 mr-2" />
                <span className="font-medium">Мелочёвка:</span>
                <span className="ml-2">{autoAssemblyResult.miscCount} товаров</span>
                {autoAssemblyResult.miscSupplyId && <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Создана</Badge>}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Поставки созданы и готовы к дальнейшей обработке. Вы можете просмотреть их на вкладке "Поставки".
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => setShowResultDialog(false)}>Закрыть</Button>
          <Button 
            onClick={() => {
              setShowResultDialog(false);
              setActiveTab("supplies");
            }} 
            variant="outline"
          >
            Перейти к поставкам
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResultDialog;
