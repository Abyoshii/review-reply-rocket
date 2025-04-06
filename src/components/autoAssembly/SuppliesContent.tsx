
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Truck, RefreshCw, CalendarIcon, Box, Package, AlertTriangle, Eye, Trash2, Plus, Send, QrCode } from "lucide-react";
import { Supply, SupplyOrder, ProductCategory } from "@/types/wb";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { SuppliesAPI } from "@/lib/suppliesApi";
import { toast } from "sonner";
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
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

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
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [newSupplyName, setNewSupplyName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);
  const [showOrdersDialog, setShowOrdersDialog] = useState<boolean>(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrDialog, setShowQrDialog] = useState<boolean>(false);

  // Format date in Russian locale
  const formatDate = (dateString: string) => {
    if (!dateString) return null;
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
        return <Badge variant="outline">{status || "Неизвестен"}</Badge>;
    }
  };

  const createSupply = async () => {
    if (!newSupplyName.trim()) {
      toast.error("Пожалуйста, введите название поставки");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const supplyId = await SuppliesAPI.createSupply(newSupplyName);
      if (supplyId) {
        toast.success(`Поставка "${newSupplyName}" успешно создана`);
        setShowCreateDialog(false);
        setNewSupplyName("");
        await loadData();
      } else {
        toast.error("Не удалось создать поставку");
      }
    } catch (error) {
      console.error("Failed to create supply:", error);
      toast.error("Ошибка при создании поставки");
    } finally {
      setIsCreating(false);
    }
  };
  
  const deleteSupply = async (supplyId: number) => {
    try {
      const success = await SuppliesAPI.deleteSupply(supplyId);
      if (success) {
        toast.success("Поставка успешно удалена");
        await loadData();
      } else {
        toast.error("Не удалось удалить поставку");
      }
    } catch (error) {
      console.error("Error deleting supply:", error);
      toast.error("Ошибка при удалении поставки");
    }
  };
  
  const deliverSupply = async (supplyId: number) => {
    try {
      const success = await SuppliesAPI.deliverSupply(supplyId);
      if (success) {
        toast.success("Поставка передана в доставку");
        await loadData();
      } else {
        toast.error("Не удалось передать поставку в доставку");
      }
    } catch (error) {
      console.error("Error delivering supply:", error);
      toast.error("Ошибка при передаче поставки в доставку");
    }
  };
  
  const getSupplyBarcode = async (supplyId: number) => {
    try {
      const url = await SuppliesAPI.getSupplyBarcode(supplyId);
      if (url) {
        setQrCodeUrl(url);
        setShowQrDialog(true);
      } else {
        toast.error("Не удалось получить QR-код поставки");
      }
    } catch (error) {
      console.error("Error getting supply barcode:", error);
      toast.error("Ошибка при получении QR-кода поставки");
    }
  };

  const loadSupplyOrders = async (supply: Supply) => {
    setSelectedSupply(supply);
    setIsLoadingOrders(true);
    setShowOrdersDialog(true);
    
    try {
      const orders = await SuppliesAPI.getSupplyOrders(supply.id);
      setSupplyOrders(orders);
    } catch (error) {
      console.error(`Failed to load orders for supply ${supply.id}:`, error);
      toast.error(`Ошибка при загрузке заказов для поставки ${supply.id}`);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Create a new supply based on product category
  const createCategorySupply = async (category: ProductCategory) => {
    setIsCreating(true);
    const currentDate = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const supplyName = `Поставка: ${category} – ${currentDate}`;
    
    try {
      const supplyId = await SuppliesAPI.createSupply(supplyName);
      if (supplyId) {
        toast.success(`Поставка для категории "${category}" создана`);
        await loadData();
      } else {
        toast.error("Не удалось создать поставку для категории");
      }
    } catch (error) {
      console.error("Error creating category supply:", error);
      toast.error(`Ошибка при создании поставки для категории "${category}"`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Поставки</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-dashed" 
              onClick={() => loadData()}
              disabled={isLoading}
            >
              {isLoading ? 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                <RefreshCw className="mr-2 h-4 w-4" />
              }
              Обновить список
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать поставку
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(index => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : supplies.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center">
                <AlertTriangle className="h-12 w-12 text-amber-500/50" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Нет созданных поставок</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Создайте новую поставку вручную или из заказов
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <Button 
                  variant="outline" 
                  className="border-dashed" 
                  onClick={() => loadData()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Проверить снова
                </Button>
                <Button onClick={() => setActiveTab("orders")}>
                  <Truck className="mr-2 h-4 w-4" />
                  Перейти к сборочным заданиям
                </Button>
              </div>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto">
                <Button 
                  variant="outline"
                  onClick={() => createCategorySupply(ProductCategory.PERFUME)}
                  disabled={isCreating}
                >
                  Парфюмерия
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => createCategorySupply(ProductCategory.CLOTHING)}
                  disabled={isCreating}
                >
                  Одежда
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => createCategorySupply(ProductCategory.MISC)}
                  disabled={isCreating}
                >
                  Мелочёвка
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead className="hidden sm:table-cell">Дата создания</TableHead>
                    <TableHead className="hidden md:table-cell">ID поставки</TableHead>
                    <TableHead>Заказов</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((supply) => (
                    <TableRow key={supply.id}>
                      <TableCell className="font-medium">{supply.name || "Без названия"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(supply.createdAt) || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{supply.supplyId || "—"}</TableCell>
                      <TableCell>{supply.ordersCount !== undefined ? supply.ordersCount : "—"}</TableCell>
                      <TableCell>{getStatusBadge(supply.status, supply.done)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => loadSupplyOrders(supply)}
                            title="Просмотреть заказы"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => getSupplyBarcode(supply.id)}
                            title="Получить QR-код"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Передать в доставку"
                                disabled={supply.done}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Передать в доставку?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Поставка "{supply.name}" будет передана в доставку. 
                                  После этого её нельзя будет изменить.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deliverSupply(supply.id)}
                                >
                                  Передать в доставку
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Удалить поставку"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить поставку?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Поставка "{supply.name}" будет полностью удалена.
                                  Это действие нельзя отменить.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSupply(supply.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Удалить поставку
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог для создания поставки */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую поставку</DialogTitle>
            <DialogDescription>
              Введите название для новой поставки.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название поставки</Label>
              <Input
                id="name"
                placeholder="Например: Поставка на апрель 2025"
                value={newSupplyName}
                onChange={(e) => setNewSupplyName(e.target.value)}
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
              onClick={createSupply}
              disabled={isCreating || !newSupplyName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать поставку'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог для просмотра заказов в поставке */}
      <Dialog open={showOrdersDialog} onOpenChange={setShowOrdersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Заказы в поставке {selectedSupply?.name}
            </DialogTitle>
            <DialogDescription>
              Список заказов, входящих в данную поставку
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingOrders ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : supplyOrders.length === 0 ? (
            <div className="text-center py-8">
              <p>В поставке нет заказов</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.supplierArticle}</TableCell>
                    <TableCell>{order.barcode}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{order.salePrice} ₽</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                Всего заказов: {supplyOrders.length}
              </TableCaption>
            </Table>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowOrdersDialog(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог для отображения QR-кода поставки */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR-код поставки</DialogTitle>
            <DialogDescription>
              Отсканируйте QR-код или скачайте изображение
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR-код поставки" 
                className="max-w-full h-auto border rounded-md"
              />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                QR-код не удалось загрузить
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQrDialog(false)}>
              Закрыть
            </Button>
            {qrCodeUrl && (
              <Button asChild>
                <a href={qrCodeUrl} download="supply-qrcode.png">
                  Скачать
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SuppliesContent;
