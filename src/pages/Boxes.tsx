
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Checkbox,
} from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Package, 
  Truck, 
  Box, 
  Filter, 
  Search, 
  RefreshCw,
  Plus,
  Trash2,
  Send,
  QrCode,
  Eye,
  Loader2,
  Download,
  ChevronLeft,
  Printer
} from "lucide-react";

import { TrbxBox, SupplyOrder } from "@/types/wb";
import { SuppliesAPI } from "@/lib/suppliesApi";

const Boxes = () => {
  const navigate = useNavigate();
  const { supplyId } = useParams<{ supplyId: string }>();
  const supplyIdNumber = parseInt(supplyId || "0");
  
  const [boxes, setBoxes] = useState<TrbxBox[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [boxAmount, setBoxAmount] = useState<number>(1);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [showAddOrdersDialog, setShowAddOrdersDialog] = useState<boolean>(false);
  const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set());
  const [showStickersDialog, setShowStickersDialog] = useState<boolean>(false);
  const [stickersUrl, setStickersUrl] = useState<string | null>(null);
  const [isGeneratingStickers, setIsGeneratingStickers] = useState<boolean>(false);
  
  // Загрузка данных
  const loadBoxes = async () => {
    if (!supplyId) return;
    
    setIsLoading(true);
    try {
      const result = await SuppliesAPI.getTrbxBoxes(supplyIdNumber);
      setBoxes(result);
    } catch (error) {
      console.error("Failed to load boxes:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Загрузка заказов в поставке, которые можно добавить в короб
  const loadSupplyOrders = async () => {
    if (!supplyId) return;
    
    setIsLoadingOrders(true);
    try {
      const orders = await SuppliesAPI.getSupplyOrders(supplyIdNumber);
      setSupplyOrders(orders);
    } catch (error) {
      console.error(`Failed to load orders for supply ${supplyId}:`, error);
    } finally {
      setIsLoadingOrders(false);
    }
  };
  
  useEffect(() => {
    if (!supplyId) {
      toast.error("ID поставки не указан");
      navigate("/supplies");
      return;
    }
    
    loadBoxes();
  }, [supplyId]);
  
  // Создание новых коробов
  const createBoxes = async () => {
    if (!supplyId) return;
    
    if (boxAmount <= 0) {
      toast.error("Количество коробов должно быть положительным числом");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const success = await SuppliesAPI.createTrbxBoxes(supplyIdNumber, boxAmount);
      if (success) {
        setShowCreateDialog(false);
        setBoxAmount(1);
        await loadBoxes();
      }
    } catch (error) {
      console.error("Failed to create boxes:", error);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Удаление короба
  const deleteBox = async (trbxId: string) => {
    if (!supplyId) return;
    
    const success = await SuppliesAPI.deleteTrbxBox(supplyIdNumber, trbxId);
    if (success) {
      await loadBoxes();
    }
  };
  
  // Открытие диалога добавления заказов в короб
  const openAddOrdersDialog = async (trbxId: string) => {
    setSelectedBoxId(trbxId);
    setSelectedOrders(new Set());
    
    // Загрузим заказы, если еще не загружены
    if (supplyOrders.length === 0) {
      await loadSupplyOrders();
    }
    
    setShowAddOrdersDialog(true);
  };
  
  // Добавление выбранных заказов в короб
  const addOrdersToBox = async () => {
    if (!supplyId || !selectedBoxId) return;
    
    if (selectedOrders.size === 0) {
      toast.error("Выберите хотя бы один заказ");
      return;
    }
    
    const orderIds = Array.from(selectedOrders);
    const success = await SuppliesAPI.addOrdersToTrbxBox(supplyIdNumber, selectedBoxId, orderIds);
    
    if (success) {
      setShowAddOrdersDialog(false);
      await loadBoxes();
    }
  };
  
  // Получение стикеров для коробов
  const getBoxStickers = async () => {
    if (!supplyId) return;
    
    if (selectedBoxes.size === 0) {
      toast.error("Выберите хотя бы один короб");
      return;
    }
    
    setIsGeneratingStickers(true);
    
    try {
      const url = await SuppliesAPI.getTrbxStickers(supplyIdNumber, Array.from(selectedBoxes));
      if (url) {
        setStickersUrl(url);
        setShowStickersDialog(true);
      }
    } catch (error) {
      console.error("Failed to get stickers:", error);
    } finally {
      setIsGeneratingStickers(false);
    }
  };
  
  // Обработка выбора короба
  const toggleBoxSelection = (trbxId: string) => {
    const newSelection = new Set(selectedBoxes);
    if (selectedBoxes.has(trbxId)) {
      newSelection.delete(trbxId);
    } else {
      newSelection.add(trbxId);
    }
    setSelectedBoxes(newSelection);
  };
  
  // Обработка выбора всех коробов
  const toggleAllBoxes = () => {
    if (selectedBoxes.size === boxes.length) {
      setSelectedBoxes(new Set());
    } else {
      setSelectedBoxes(new Set(boxes.map(box => box.id)));
    }
  };
  
  // Обработка выбора заказа для добавления в короб
  const toggleOrderSelection = (orderId: number) => {
    const newSelection = new Set(selectedOrders);
    if (selectedOrders.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };
  
  // Форматирование даты
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/supplies")}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          К поставкам
        </Button>
        
        <h1 className="text-3xl font-bold tracking-tight ml-2">Короба</h1>
        <Badge variant="secondary" className="ml-2 text-sm">Поставка #{supplyId}</Badge>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <p className="text-muted-foreground mb-4 md:mb-0">
          Управление коробами для текущей поставки
        </p>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadBoxes}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          
          <Button 
            variant="outline" 
            onClick={getBoxStickers}
            disabled={selectedBoxes.size === 0 || isGeneratingStickers}
          >
            <Printer className="mr-2 h-4 w-4" />
            Стикеры для выбранных
          </Button>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать короба
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Список коробов</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : boxes.length === 0 ? (
            <div className="text-center py-12">
              <Box className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Нет коробов</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Создайте новые короба для начала работы
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedBoxes.size > 0 && selectedBoxes.size === boxes.length}
                      onCheckedChange={toggleAllBoxes}
                    />
                  </TableHead>
                  <TableHead>ID короба</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead className="hidden md:table-cell">Дата создания</TableHead>
                  <TableHead>Заказов</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boxes.map((box) => (
                  <TableRow key={box.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedBoxes.has(box.id)} 
                        onCheckedChange={() => toggleBoxSelection(box.id)}
                      />
                    </TableCell>
                    <TableCell>{box.id}</TableCell>
                    <TableCell className="font-medium">{box.name || box.id}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(box.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={box.orders.length > 0 ? "default" : "outline"}>
                        {box.orders.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openAddOrdersDialog(box.id)}
                          title="Добавить заказы"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Удалить короб"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить короб?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Короб {box.id} будет полностью удален.
                                Это действие нельзя отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBox(box.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Удалить короб
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                Всего коробов: {boxes.length}
                {isLoading && <span className="ml-2">Загрузка...</span>}
              </TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Диалог создания новых коробов */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новые короба</DialogTitle>
            <DialogDescription>
              Укажите количество коробов для создания
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Количество коробов</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={boxAmount}
                onChange={(e) => setBoxAmount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Отмена
            </Button>
            <Button 
              onClick={createBoxes}
              disabled={isCreating || boxAmount <= 0}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать короба'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог добавления заказов в короб */}
      <Dialog open={showAddOrdersDialog} onOpenChange={setShowAddOrdersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить заказы в короб</DialogTitle>
            <DialogDescription>
              Выберите заказы для добавления в короб {selectedBoxId}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingOrders ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : supplyOrders.length === 0 ? (
            <div className="text-center py-8">
              <p>В поставке нет доступных заказов</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>ID заказа</TableHead>
                  <TableHead>Артикул</TableHead>
                  <TableHead>Штрихкод</TableHead>
                  <TableHead>Кол-во</TableHead>
                  <TableHead>Цена</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplyOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                      />
                    </TableCell>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.supplierArticle}</TableCell>
                    <TableCell>{order.barcode}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{order.salePrice} ₽</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                Выбрано заказов: {selectedOrders.size} из {supplyOrders.length}
              </TableCaption>
            </Table>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddOrdersDialog(false)}
            >
              Отмена
            </Button>
            <Button 
              onClick={addOrdersToBox}
              disabled={selectedOrders.size === 0}
            >
              Добавить в короб
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог со стикерами для коробов */}
      <Dialog open={showStickersDialog} onOpenChange={setShowStickersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Стикеры для коробов</DialogTitle>
            <DialogDescription>
              Стикеры готовы для печати
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {stickersUrl ? (
              <img 
                src={stickersUrl} 
                alt="Стикеры для коробов" 
                className="max-w-full h-auto border rounded-md"
              />
            ) : (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStickersDialog(false)}>
              Закрыть
            </Button>
            {stickersUrl && (
              <Button asChild>
                <a href={stickersUrl} download="box-stickers.png">
                  Скачать
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Boxes;
