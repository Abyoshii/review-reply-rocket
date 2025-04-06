
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Filter, CalendarIcon, CheckSquare, X, Truck, QrCode, AlertTriangle, Plus } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

import { AssemblyOrder, Supply, ProductCategory } from "@/types/wb";
import { AutoAssemblyAPI, formatTimeAgo } from "@/lib/autoAssemblyApi";

interface OrdersContentProps {
  isLoading: boolean;
  orders: AssemblyOrder[];
  supplies: Supply[];
  loadData: () => Promise<void>;
  setActiveTab: (tab: "orders" | "supplies") => void;
}

const OrdersContent: React.FC<OrdersContentProps> = ({
  isLoading,
  orders,
  supplies,
  loadData,
  setActiveTab
}) => {
  // Состояния для выбранных заказов
  const [selectedOrders, setSelectedOrders] = useState<AssemblyOrder[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  
  // Состояния для фильтрации
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showOnlyFreeOrders, setShowOnlyFreeOrders] = useState<boolean>(true);
  
  // Состояния для диалогов
  const [showAddToSupplyDialog, setShowAddToSupplyDialog] = useState<boolean>(false);
  const [selectedSupplyId, setSelectedSupplyId] = useState<number | null>(null);
  const [isAddingToSupply, setIsAddingToSupply] = useState<boolean>(false);
  
  // Состояния для диалога создания поставок по категориям
  const [showCreateCategorySuppliesDialog, setShowCreateCategorySuppliesDialog] = useState<boolean>(false);
  const [isCreatingCategorySupplies, setIsCreatingCategorySupplies] = useState<boolean>(false);
  const [categorySuppliesResult, setCategorySuppliesResult] = useState<any>(null);
  
  // Состояния для QR-кодов стикеров
  const [showQrDialog, setShowQrDialog] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  
  // Обработка выделения всех заказов
  useEffect(() => {
    if (selectAll) {
      setSelectedOrders(filteredOrders);
    } else if (!selectAll && selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    }
  }, [selectAll]);
  
  // Обработка изменения списка заказов
  useEffect(() => {
    setSelectedOrders([]);
    setSelectAll(false);
  }, [orders]);
  
  // Фильтрация заказов
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Фильтр по поисковому запросу
      const searchMatch = searchTerm === "" ||
        order.supplierArticle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm);
      
      // Фильтр по категории товара
      const categoryMatch = filterCategory === "all" ||
        order.category === filterCategory;
      
      // Фильтр по наличию в поставке
      const supplyMatch = !showOnlyFreeOrders || !order.inSupply;
      
      return searchMatch && categoryMatch && supplyMatch;
    });
  }, [orders, searchTerm, filterCategory, showOnlyFreeOrders]);
  
  // Группировка заказов по категориям для статистики
  const ordersByCategory = useMemo(() => {
    const result: Record<string, number> = {
      [ProductCategory.PERFUME]: 0,
      [ProductCategory.CLOTHING]: 0,
      [ProductCategory.MISC]: 0,
    };
    
    filteredOrders.forEach(order => {
      if (order.category) {
        result[order.category] = (result[order.category] || 0) + 1;
      } else {
        result[ProductCategory.MISC] = (result[ProductCategory.MISC] || 0) + 1;
      }
    });
    
    return result;
  }, [filteredOrders]);
  
  // Обработка выделения заказа
  const handleToggleOrder = (order: AssemblyOrder) => {
    setSelectedOrders(prevSelected => {
      const isSelected = prevSelected.some(item => item.id === order.id);
      
      if (isSelected) {
        return prevSelected.filter(item => item.id !== order.id);
      } else {
        return [...prevSelected, order];
      }
    });
  };
  
  // Очистка выделения
  const clearSelection = () => {
    setSelectedOrders([]);
    setSelectAll(false);
  };
  
  // Добавление заказов в поставку
  const addOrdersToSupply = async () => {
    if (!selectedSupplyId || selectedOrders.length === 0) {
      toast.error("Выберите поставку и заказы для добавления");
      return;
    }
    
    setIsAddingToSupply(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const order of selectedOrders) {
        const success = await AutoAssemblyAPI.addOrderToSupply(selectedSupplyId, order.id);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(
          `${successCount} ${successCount === 1 ? 'заказ добавлен' : 'заказов добавлено'} в поставку`
        );
      }
      
      if (errorCount > 0) {
        toast.error(`Не удалось добавить ${errorCount} заказов`);
      }
      
      setShowAddToSupplyDialog(false);
      clearSelection();
      await loadData();
      
    } catch (error) {
      console.error("Error adding orders to supply:", error);
      toast.error("Произошла ошибка при добавлении заказов");
    } finally {
      setIsAddingToSupply(false);
    }
  };
  
  // Создание поставок по категориям
  const createCategorizedSupplies = async () => {
    setIsCreatingCategorySupplies(true);
    setCategorySuppliesResult(null);
    
    try {
      const result = await AutoAssemblyAPI.createCategorizedSupplies(
        showOnlyFreeOrders ? filteredOrders.filter(order => !order.inSupply) : filteredOrders
      );
      
      setCategorySuppliesResult(result);
      
      if (result.success) {
        toast.success("Поставки по категориям успешно созданы");
        await loadData();
        setActiveTab("supplies");
      } else {
        toast.error("Не удалось создать все поставки по категориям");
      }
    } catch (error) {
      console.error("Error creating categorized supplies:", error);
      toast.error("Произошла ошибка при создании поставок");
    } finally {
      setIsCreatingCategorySupplies(false);
    }
  };
  
  // Генерация QR-кодов для стикеров
  const generateStickers = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Выберите заказы для генерации стикеров");
      return;
    }
    
    setIsGeneratingQr(true);
    
    try {
      const orderIds = selectedOrders.map(order => order.id);
      const url = await AutoAssemblyAPI.printStickers(orderIds);
      
      if (url) {
        setQrCodeUrl(url);
        setShowQrDialog(true);
      } else {
        toast.error("Не удалось сгенерировать стикеры");
      }
    } catch (error) {
      console.error("Error generating stickers:", error);
      toast.error("Произошла ошибка при генерации стикеров");
    } finally {
      setIsGeneratingQr(false);
    }
  };
  
  // Отмена заказов
  const cancelSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Выберите заказы для отмены");
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const order of selectedOrders) {
      try {
        const success = await AutoAssemblyAPI.cancelOrder(order.id);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Error canceling order ${order.id}:`, error);
      }
    }
    
    if (successCount > 0) {
      toast.success(
        `${successCount} ${successCount === 1 ? 'заказ отменен' : 'заказов отменено'}`
      );
    }
    
    if (errorCount > 0) {
      toast.error(`Не удалось отменить ${errorCount} заказов`);
    }
    
    clearSelection();
    await loadData();
  };
  
  // Функция форматирования времени
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
    <>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Фильтры</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("all");
              }}
            >
              Сбросить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Поиск по артикулу или названию</Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Введите запрос..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Категория товара</Label>
              <Select 
                value={filterCategory} 
                onValueChange={setFilterCategory}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  <SelectItem value={ProductCategory.PERFUME}>Парфюмерия</SelectItem>
                  <SelectItem value={ProductCategory.CLOTHING}>Одежда</SelectItem>
                  <SelectItem value={ProductCategory.MISC}>Мелочёвка</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="free-orders" 
                  checked={showOnlyFreeOrders}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setShowOnlyFreeOrders(checked);
                    }
                  }}
                />
                <Label 
                  htmlFor="free-orders"
                  className="cursor-pointer"
                >
                  Только свободные заказы
                </Label>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-blue-500">
              Всего: {filteredOrders.length}
            </Badge>
            <Badge variant="outline" className="text-purple-500">
              Парфюмерия: {ordersByCategory[ProductCategory.PERFUME] || 0}
            </Badge>
            <Badge variant="outline" className="text-green-500">
              Одежда: {ordersByCategory[ProductCategory.CLOTHING] || 0}
            </Badge>
            <Badge variant="outline" className="text-amber-500">
              Мелочёвка: {ordersByCategory[ProductCategory.MISC] || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Сборочные задания</CardTitle>
          <div className="flex gap-2">
            {selectedOrders.length > 0 ? (
              <>
                <Badge variant="outline" className="mr-2">
                  Выбрано: {selectedOrders.length}
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={clearSelection}
                >
                  <X className="w-4 h-4 mr-2" /> Снять выделение
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddToSupplyDialog(true)}
                >
                  <Truck className="w-4 h-4 mr-2" /> 
                  В поставку
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateStickers}
                  disabled={isGeneratingQr}
                >
                  {isGeneratingQr ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4 mr-2" />
                  )}
                  Стикеры
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:bg-red-50"
                  onClick={cancelSelectedOrders}
                >
                  <X className="w-4 h-4 mr-2" />
                  Отменить
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                onClick={() => setShowCreateCategorySuppliesDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Создать поставки по категориям
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center">
                <AlertTriangle className="h-12 w-12 text-amber-500/50" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Нет активных сборочных заданий</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {orders.length === 0
                  ? "В системе нет новых заказов для сборки"
                  : "Попробуйте изменить параметры фильтрации"
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={selectAll} 
                        onCheckedChange={(checked) => {
                          if (typeof checked === 'boolean') {
                            setSelectAll(checked);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Товар</TableHead>
                    <TableHead className="hidden md:table-cell">Дата</TableHead>
                    <TableHead className="hidden lg:table-cell">Срок сборки</TableHead>
                    <TableHead className="hidden sm:table-cell">Категория</TableHead>
                    <TableHead className="text-right">Цена</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow 
                      key={order.id}
                      className={order.inSupply ? "bg-gray-50" : ""}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrders.some(item => item.id === order.id)}
                          onCheckedChange={() => handleToggleOrder(order)}
                          disabled={order.inSupply}
                        />
                      </TableCell>
                      <TableCell>
                        {order.id}
                        {order.inSupply && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            В поставке
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.supplierArticle}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatTimeAgo(order.ddate)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge 
                          variant="outline" 
                          className={
                            order.category === ProductCategory.PERFUME 
                              ? "border-purple-500 text-purple-500" 
                              : order.category === ProductCategory.CLOTHING
                                ? "border-green-500 text-green-500"
                                : "border-amber-500 text-amber-500"
                          }
                        >
                          {order.category || ProductCategory.MISC}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.price} ₽
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Всего заказов: {filteredOrders.length} из {orders.length}
                </TableCaption>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Диалог для добавления заказов в поставку */}
      <Dialog open={showAddToSupplyDialog} onOpenChange={setShowAddToSupplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавление в поставку</DialogTitle>
            <DialogDescription>
              Выберите поставку, в которую нужно добавить {selectedOrders.length} заказов
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supply">Поставка</Label>
              <Select 
                value={selectedSupplyId?.toString() || ""} 
                onValueChange={(value) => setSelectedSupplyId(parseInt(value))}
              >
                <SelectTrigger id="supply">
                  <SelectValue placeholder="Выберите поставку" />
                </SelectTrigger>
                <SelectContent>
                  {supplies
                    .filter(supply => !supply.done)
                    .map((supply) => (
                      <SelectItem 
                        key={supply.id} 
                        value={supply.id.toString()}
                      >
                        {supply.name} (ID: {supply.id})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {supplies.filter(supply => !supply.done).length === 0 && (
              <div className="text-amber-500 text-sm flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Нет доступных поставок. Сначала создайте новую поставку.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddToSupplyDialog(false)}
            >
              Отмена
            </Button>
            <Button 
              onClick={addOrdersToSupply}
              disabled={!selectedSupplyId || isAddingToSupply}
            >
              {isAddingToSupply ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Добавление...
                </>
              ) : (
                'Добавить в поставку'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог для создания поставок по категориям */}
      <Dialog 
        open={showCreateCategorySuppliesDialog} 
        onOpenChange={setShowCreateCategorySuppliesDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создание поставок по категориям</DialogTitle>
            <DialogDescription>
              Система создаст отдельные поставки для каждой категории товаров и автоматически
              распределит по ним все доступные заказы.
            </DialogDescription>
          </DialogHeader>
          
          {categorySuppliesResult ? (
            <div className="space-y-4 py-4">
              <div className="rounded-md border p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Результат создания поставок:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Парфюмерия:</span>
                    <span>
                      {categorySuppliesResult.perfumeCount} заказов
                      {categorySuppliesResult.perfumeSupplyId && (
                        <Badge className="ml-2 bg-purple-500">ID: {categorySuppliesResult.perfumeSupplyId}</Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Одежда:</span>
                    <span>
                      {categorySuppliesResult.clothingCount} заказов
                      {categorySuppliesResult.clothingSupplyId && (
                        <Badge className="ml-2 bg-green-500">ID: {categorySuppliesResult.clothingSupplyId}</Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Мелочёвка:</span>
                    <span>
                      {categorySuppliesResult.miscCount} заказов
                      {categorySuppliesResult.miscSupplyId && (
                        <Badge className="ml-2 bg-amber-500">ID: {categorySuppliesResult.miscSupplyId}</Badge>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="only-free" 
                    checked={showOnlyFreeOrders}
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') {
                        setShowOnlyFreeOrders(checked);
                      }
                    }}
                  />
                  <Label 
                    htmlFor="only-free"
                    className="cursor-pointer"
                  >
                    Только свободные заказы
                  </Label>
                </div>
              </div>
              
              <div className="rounded-md border p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Будут созданы поставки:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Парфюмерия:</span>
                    <span>{ordersByCategory[ProductCategory.PERFUME] || 0} заказов</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Одежда:</span>
                    <span>{ordersByCategory[ProductCategory.CLOTHING] || 0} заказов</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Мелочёвка:</span>
                    <span>{ordersByCategory[ProductCategory.MISC] || 0} заказов</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {categorySuppliesResult ? (
              <Button 
                onClick={() => {
                  setShowCreateCategorySuppliesDialog(false);
                  setCategorySuppliesResult(null);
                  setActiveTab("supplies");
                }}
              >
                Перейти к поставкам
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateCategorySuppliesDialog(false)}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={createCategorizedSupplies}
                  disabled={isCreatingCategorySupplies}
                >
                  {isCreatingCategorySupplies ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    'Создать поставки'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог для отображения QR-кода стикеров */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Стикеры для заказов</DialogTitle>
            <DialogDescription>
              Отсканируйте QR-код или скачайте изображение
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Стикеры для заказов" 
                className="max-w-full h-auto border rounded-md"
              />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Стикеры не удалось загрузить
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQrDialog(false)}>
              Закрыть
            </Button>
            {qrCodeUrl && (
              <Button asChild>
                <a href={qrCodeUrl} download="order-stickers.png">
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

export default OrdersContent;
