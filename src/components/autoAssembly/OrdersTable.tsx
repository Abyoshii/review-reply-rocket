
import React, { useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Box, Loader2, RefreshCw, ImageOff, Clock, ShoppingBag } from "lucide-react";
import { AssemblyOrder, ProductCategory, SortConfig } from "@/types/wb";
import { formatTimeAgo, formatPrice } from "@/lib/utils/formatUtils";
import { retryLoadProductInfo, retryFailedProductInfoRequests } from "@/lib/utils/productUtils";

interface OrdersTableProps {
  filteredOrders: AssemblyOrder[];
  isLoading: boolean;
  selectedOrders: number[];
  toggleOrderSelection: (orderId: number) => void;
  toggleSelectAll: () => void;
  allSelected: boolean;
  sortConfig: SortConfig;
  handleSort: (key: keyof AssemblyOrder) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  filteredOrders,
  isLoading,
  selectedOrders,
  toggleOrderSelection,
  toggleSelectAll,
  allSelected,
  sortConfig,
  handleSort
}) => {
  // Автоматическая повторная загрузка неудачных запросов каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      retryFailedProductInfoRequests(2); // Максимум 2 попытки за раз
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Рендер бейджа для типа груза
  const renderCargoTypeBadge = (cargoType: number) => {
    switch (cargoType) {
      case 1:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Короб</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Пакет</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  // Функция для повторной загрузки данных товара
  const handleRetryProductInfo = async (nmId: number) => {
    if (!nmId) return;
    await retryLoadProductInfo(nmId);
  };

  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <Table>
        <TableCaption>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка сборочных заданий...
            </div>
          ) : filteredOrders.length === 0 ? (
            "Нет доступных сборочных заданий"
          ) : (
            `Всего товаров в сборочных заданиях: ${filteredOrders.length}`
          )}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox 
                checked={allSelected && filteredOrders.length > 0} 
                onCheckedChange={toggleSelectAll} 
              />
            </TableHead>
            <TableHead className="w-48">Задание</TableHead>
            <TableHead className="w-[500px]">Наименование</TableHead>
            <TableHead className="text-right">Стоимость</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Загрузка сборочных заданий...
                </div>
              </TableCell>
            </TableRow>
          ) : filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                  <div>Нет товаров для сборки</div>
                  <Button variant="outline" onClick={() => console.log('refresh')}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Обновить данные
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredOrders.map(order => (
              <TableRow key={order.id} className={`cursor-pointer hover:bg-muted/30 ${selectedOrders.includes(order.id) ? 'bg-muted/50' : ''}`}>
                <TableCell>
                  <Checkbox 
                    checked={selectedOrders.includes(order.id)} 
                    onCheckedChange={() => toggleOrderSelection(order.id)} 
                  />
                </TableCell>
                
                {/* Колонка с номером задания и датой - новый дизайн */}
                <TableCell>
                  <div className="flex flex-col">
                    <div className="font-medium text-black">{order.id}</div>
                    <div className="text-xs text-muted-foreground">от {new Date(order.createdAt).toLocaleDateString('ru-RU')}</div>
                    <div className="flex items-center text-xs text-green-600 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="text-green-600">{formatTimeAgo(order.createdAt)}</span>
                      {order.cargoType && (
                        <span className="ml-2 inline-block">{renderCargoTypeBadge(order.cargoType)}</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                {/* Колонка с названием товара - новый дизайн */}
                <TableCell>
                  <div className="flex items-center gap-4">
                    {/* Изображение товара */}
                    <div className="w-10 h-10 relative flex-shrink-0">
                      {order.productInfo?.image ? (
                        <img 
                          src={order.productInfo.image} 
                          alt={order.productInfo.name || 'Товар'} 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => order.nmId && handleRetryProductInfo(order.nmId)}
                                >
                                  <ImageOff className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Загрузить изображение товара</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                    
                    {/* Информация о товаре - новый дизайн */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-blue-600 truncate">
                        {order.productInfo?.name || order.productName || `Товар ID: ${order.nmId || order.id}`}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {order.productInfo?.brand && (
                          <span className="font-medium">{order.productInfo.brand} / </span>
                        )}
                        Арт: {order.supplierArticle || (order.productInfo?.size ? `UI-${order.productInfo.size}-1` : '—')}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                {/* Колонка с ценой */}
                <TableCell className="text-right">
                  <div className="font-bold">{formatPrice(order.salePrice)} ₽</div>
                  {order.price !== order.salePrice && (
                    <div className="text-sm text-muted-foreground line-through">{formatPrice(order.price)} ₽</div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
