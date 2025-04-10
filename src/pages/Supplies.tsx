
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
  Loader2,
  Send,
  QrCode,
  Eye,
} from "lucide-react";

import { Supply, SupplyOrder } from "@/types/wb";
import { SuppliesAPI } from "@/lib/suppliesApi";

const Supplies = () => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState<boolean>(false);
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
      // Fixed: Remove extra parameters when calling getSupplies
      const result = await SuppliesAPI.getSupplies();
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
  
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };
  
  const getStatusBadge = (status: string, done: boolean) => {
    if (status === "draft" || !done) {
      return <Badge variant="outline">Черновик</Badge>;
    } else {
      return <Badge>Отправлена</Badge>;
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
                {loadError ? `Ошибка: ${loadError}` : "У вас пока нет созданных поставок"}
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
                  <TableHead>ID поставки</TableHead>
                  <TableHead className="hidden sm:table-cell">Дата создания</TableHead>
                  <TableHead>Кол-во заказов</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplies.map((supply) => (
                  <TableRow key={supply.id}>
                    <TableCell className="font-medium">{supply.supplyId || supply.id}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(supply.createdAt)}</TableCell>
                    <TableCell>{supply.ordersCount}</TableCell>
                    <TableCell>
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
                                Поставка №{supply.id} будет передана в доставку. 
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
      
      <Dialog open={showOrdersDialog} onOpenChange={setShowOrdersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Заказы в поставке {selectedSupply?.supplyId || selectedSupply?.id}
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
              <p>Поставка пока не содержит заданий</p>
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
