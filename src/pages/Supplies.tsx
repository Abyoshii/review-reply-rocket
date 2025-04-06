
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  Loader2
} from "lucide-react";

import { Supply, SupplyOrder } from "@/types/wb";
import { SuppliesAPI } from "@/lib/suppliesApi";

const Supplies = () => {
  const navigate = useNavigate();
  
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState<boolean>(false);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [newSupplyName, setNewSupplyName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [hasMorePages, setHasMorePages] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrDialog, setShowQrDialog] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const loadSupplies = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading supplies...");
      const result = await SuppliesAPI.getSupplies();
      console.log("Loaded supplies:", result);
      
      setSupplies(result.supplies);
      setNextPageToken(result.next);
      setHasMorePages(result.hasMore);
      
      if (result.supplies.length === 0) {
        console.log("No supplies found, checking if there's an error");
      }
    } catch (error: any) {
      console.error("Failed to load supplies:", error);
      setLoadError(error.message || "Не удалось загрузить поставки");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadSupplies();
  }, []);
  
  const loadNextPage = async () => {
    if (!nextPageToken) return;
    
    setIsLoading(true);
    try {
      const result = await SuppliesAPI.getSupplies(50, nextPageToken);
      setSupplies([...supplies, ...result.supplies]);
      setNextPageToken(result.next);
      setHasMorePages(result.hasMore);
    } catch (error) {
      console.error("Failed to load next page:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSupplyOrders = async (supply: Supply) => {
    setSelectedSupply(supply);
    setIsLoadingOrders(true);
    setShowOrdersDialog(true);
    
    try {
      // Сначала попробуем получить детали поставки для обновления данных
      const supplyDetails = await SuppliesAPI.getSupplyDetails(supply.id);
      if (supplyDetails) {
        setSelectedSupply(supplyDetails);
      }
      
      // Теперь получим заказы в поставке
      const orders = await SuppliesAPI.getSupplyOrders(supply.id);
      console.log(`Loaded ${orders.length} orders for supply ${supply.id}:`, orders);
      setSupplyOrders(orders);
    } catch (error) {
      console.error(`Failed to load orders for supply ${supply.id}:`, error);
    } finally {
      setIsLoadingOrders(false);
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
        setShowCreateDialog(false);
        setNewSupplyName("");
        await loadSupplies();
      }
    } catch (error) {
      console.error("Failed to create supply:", error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const deleteSupply = async (supplyId: number) => {
    const success = await SuppliesAPI.deleteSupply(supplyId);
    if (success) {
      await loadSupplies();
    }
  };
  
  const deliverSupply = async (supplyId: number) => {
    const success = await SuppliesAPI.deliverSupply(supplyId);
    if (success) {
      await loadSupplies();
    }
  };
  
  const getSupplyBarcode = async (supplyId: number) => {
    const url = await SuppliesAPI.getSupplyBarcode(supplyId);
    if (url) {
      setQrCodeUrl(url);
      setShowQrDialog(true);
    }
  };
  
  const goToBoxes = (supply: Supply) => {
    navigate(`/trbx/${supply.id}`);
  };
  
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
  
  const getStatusBadge = (status: string, done: boolean) => {
    if (done) {
      return <Badge variant="secondary" className="bg-green-500 hover:bg-green-600">Доставлена</Badge>;
    }
    
    switch(status.toLowerCase()) {
      case 'new':
        return <Badge variant="outline">Новая</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">В процессе</Badge>;
      case 'ready_to_ship':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Готова к отправке</Badge>;
      case 'shipped':
        return <Badge variant="secondary" className="bg-purple-600 hover:bg-purple-700">Отправлена</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Поставки</h1>
          <p className="text-muted-foreground">
            Управление поставками на Wildberries
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={loadSupplies}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать поставку
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Список поставок</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && supplies.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : supplies.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Нет поставок</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {loadError ? `Ошибка: ${loadError}` : "Создайте новую поставку для начала работы"}
              </p>
              {loadError && (
                <Button 
                  variant="outline" 
                  onClick={loadSupplies}
                  className="mt-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Попробовать снова
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead className="hidden sm:table-cell">Дата создания</TableHead>
                  <TableHead className="hidden md:table-cell">Номер поставки</TableHead>
                  <TableHead>Кол-во заказов</TableHead>
                  <TableHead className="hidden lg:table-cell">Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplies.map((supply) => (
                  <TableRow key={supply.id}>
                    <TableCell>{supply.id}</TableCell>
                    <TableCell className="font-medium">{supply.name || "Без названия"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(supply.createdAt)}</TableCell>
                    <TableCell className="hidden md:table-cell">{supply.supplyId || '-'}</TableCell>
                    <TableCell>{supply.ordersCount}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {getStatusBadge(supply.status, supply.done)}
                    </TableCell>
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
                          onClick={() => goToBoxes(supply)}
                          title="Управление коробами"
                        >
                          <Box className="h-4 w-4" />
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
                                Поставка №{supply.id} "{supply.name}" будет передана в доставку. 
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
                                Поставка №{supply.id} "{supply.name}" будет полностью удалена.
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
              <TableCaption>
                Всего поставок: {supplies.length}
                {isLoading && <span className="ml-2">Загрузка...</span>}
              </TableCaption>
            </Table>
          )}
        </CardContent>
        
        {hasMorePages && (
          <CardFooter className="flex justify-center py-4">
            <Button 
              variant="outline" 
              onClick={loadNextPage}
              disabled={isLoading || !nextPageToken}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                'Загрузить еще'
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
      
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
                placeholder="Например: Поставка на март 2023"
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
      
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR-код поставки</DialogTitle>
            <DialogDescription>
              Отсканируйте QR-код или скачайте изображение
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="QR-код поставки" 
                className="max-w-full h-auto border rounded-md"
              />
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
    </div>
  );
};

export default Supplies;
