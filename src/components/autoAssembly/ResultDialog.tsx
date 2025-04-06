import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CheckCheck } from "lucide-react";

interface ResultDialogProps {
  showResultDialog: boolean;
  setShowResultDialog: (show: boolean) => void;
  autoAssemblyResult: any;
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
          <DialogTitle>Результаты автоматической сборки</DialogTitle>
          <DialogDescription>
            Информация о созданных поставках и товарах, которые были распределены.
          </DialogDescription>
        </DialogHeader>

        {autoAssemblyResult ? (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                <CheckCheck className="mr-2 inline-block h-5 w-5 text-green-500" />
                Поставки созданы:
              </h3>
              <p>Парфюмерия: {autoAssemblyResult.perfumeCount} товаров</p>
              <p>Одежда: {autoAssemblyResult.clothingCount} товаров</p>
              <p>Мелочёвка: {autoAssemblyResult.miscCount} товаров</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-500">
                <AlertCircle className="mr-2 inline-block h-5 w-5" />
                Ошибка:
              </h3>
              <p>Не удалось автоматически создать поставки.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => {
            setShowResultDialog(false);
            setActiveTab("supplies");
          }}>
            Перейти к поставкам
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResultDialog;
