
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, CheckCheck, Plus } from "lucide-react";
import { Supply } from "@/types/wb";
import { Input } from '@/components/ui/input';

interface SelectedOrdersActionsProps {
  selectedOrdersCount: number;
  isProcessing: boolean;
  supplies: Supply[];
  handlePrintStickers: () => void;
  handleAssembleOrders: (supplyId?: number, newSupplyName?: string) => void;
}

const SelectedOrdersActions: React.FC<SelectedOrdersActionsProps> = ({
  selectedOrdersCount,
  isProcessing,
  supplies,
  handlePrintStickers,
  handleAssembleOrders
}) => {
  const [showSupplyDialog, setShowSupplyDialog] = useState(false);
  const [selectedSupplyId, setSelectedSupplyId] = useState<number | "new">("new");
  const [newSupplyName, setNewSupplyName] = useState("");
  
  if (selectedOrdersCount === 0) return null;
  
  const handleSelectSupply = () => {
    if (selectedSupplyId === "new") {
      if (!newSupplyName.trim()) {
        return;
      }
      handleAssembleOrders(undefined, newSupplyName);
    } else {
      handleAssembleOrders(selectedSupplyId as number);
    }
    setShowSupplyDialog(false);
  };
  
  return (
    <>
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
          
          <Button onClick={() => setShowSupplyDialog(true)} disabled={isProcessing}>
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
      
      <Dialog open={showSupplyDialog} onOpenChange={setShowSupplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить заказы в поставку</DialogTitle>
            <DialogDescription>
              Выберите существующую поставку или создайте новую
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplySelect">Выберите поставку</Label>
              <Select value={selectedSupplyId as string} onValueChange={(value) => setSelectedSupplyId(value === "new" ? "new" : Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите поставку" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Создать новую поставку</SelectItem>
                  {supplies.map(supply => (
                    <SelectItem key={supply.id} value={supply.id.toString()}>
                      {supply.name || `Поставка #${supply.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedSupplyId === "new" && (
              <div className="space-y-2">
                <Label htmlFor="newSupplyName">Название новой поставки</Label>
                <Input
                  id="newSupplyName"
                  placeholder="Например: Поставка на апрель 2025"
                  value={newSupplyName}
                  onChange={(e) => setNewSupplyName(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplyDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSelectSupply}
              disabled={isProcessing || (selectedSupplyId === "new" && !newSupplyName.trim())}
            >
              <Plus className="mr-2 h-4 w-4" />
              {selectedSupplyId === "new" ? "Создать поставку" : "Добавить в поставку"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SelectedOrdersActions;
