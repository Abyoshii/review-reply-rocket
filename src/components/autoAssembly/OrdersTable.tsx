
import React, { useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Box, Loader2, RefreshCw, ImageOff, Droplets, Shirt, Paperclip, AlertTriangle, BarChart, ShoppingBag } from "lucide-react";
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
  // Настраиваем автоматическую повторную загрузку неудачных запросов каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      retryFailedProductInfoRequests(2); // Максимум 2 попытки за раз
    }, 10000); // Проверяем каждые 10 секунд
    
    return () => clearInterval(interval);
  }, []);

  const getCategoryDisplay = (category?: ProductCategory) => {
    if (!category) return {
      icon: <Paperclip className="h-4 w-4" />,
      badge: <Badge variant="outline">Нет категории</Badge>
    };

    switch (category) {
      case ProductCategory.PERFUME:
        return {
          icon: <Droplets className="h-4 w-4" />,
          badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <Droplets className="h-3 w-3 mr-1" />Парфюмерия
          </Badge>
        };
      case ProductCategory.CLOTHING:
        return {
          icon: <Shirt className="h-4 w-4" />,
          badge: <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <Shirt className="h-3 w-3 mr-1" />Одежда
          </Badge>
        };
      case ProductCategory.MISC:
      default:
        return {
          icon: <Paperclip className="h-4 w-4" />,
          badge: <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            <Paperclip className="h-3 w-3 mr-1" />Мелочёвка
          </Badge>
        };
    }
  };

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
            <TableHead className="w-12">
              <Checkbox 
                checked={allSelected && filteredOrders.length > 0} 
                onCheckedChange={toggleSelectAll} 
              />
            </TableHead>
            <TableHead className="hidden sm:table-cell">ID</TableHead>
            <TableHead className="w-[300px]">Товар</TableHead>
            <TableHead className="hidden lg:table-cell">Артикул</TableHead>
            <TableHead className="hidden lg:table-cell">Дата заказа</TableHead>
            <TableHead className="hidden md:table-cell">Категория</TableHead>
            <TableHead className="hidden sm:table-cell">Тип</TableHead>
            <TableHead>Цена</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Загрузка сборочных заданий...
                </div>
              </TableCell>
            </TableRow>
          ) : filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
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
                <TableCell className="hidden sm:table-cell font-mono text-xs">
                  <div className="flex flex-col">
                    <span className="font-medium">{order.id}</span>
                    <span className="text-muted-foreground truncate">{order.orderUid?.substring(0, 10)}...</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16 rounded-md border">
                      {order.productInfo?.image ? (
                        <AvatarImage 
                          src={order.productInfo.image} 
                          alt={order.productInfo.name} 
                          className="object-contain"
                        />
                      ) : (
                        <AvatarFallback className="rounded-md bg-muted">
                          {order.nmId ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleRetryProductInfo(order.nmId!)}
                                  >
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Нет изображения товара</p>
                                  <p className="text-xs">Нажмите для загрузки</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col w-full gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors cursor-default">
                              {order.productInfo?.name || order.productName || (
                                <span className="italic text-muted-foreground">
                                  {order.nmId ? "Товар ID: " + order.nmId : "Нет данных"}
                                </span>
                              )}
                            </h3>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {order.productInfo ? (
                              <div className="space-y-2">
                                <p className="font-medium">{order.productInfo.name}</p>
                                {order.productInfo.category && (
                                  <p className="text-xs text-muted-foreground">
                                    Категория: {order.productInfo.category}
                                  </p>
                                )}
                                {order.productInfo.brand && (
                                  <div className="flex items-center gap-1">
                                    <BarChart className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                      Бренд: {order.productInfo.brand}
                                    </p>
                                  </div>
                                )}
                                {order.nmId && (
                                  <p className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded inline-block">
                                    NM ID: {order.nmId}
                                  </p>
                                )}
                                {order.supplierArticle && (
                                  <p className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded inline-block">
                                    Артикул: {order.supplierArticle}
                                  </p>
                                )}
                              </div>
                            ) : order.nmId ? (
                              <div className="space-y-2">
                                <p>ID товара: {order.nmId}</p>
                                {order.supplierArticle && (
                                  <p className="text-xs text-muted-foreground">
                                    Артикул: {order.supplierArticle}
                                  </p>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mt-2" 
                                  onClick={() => handleRetryProductInfo(order.nmId!)}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" /> Загрузить информацию
                                </Button>
                              </div>
                            ) : (
                              <p>Информация о товаре недоступна</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {order.productInfo?.brand && (
                          <Badge variant="outline" className="text-xs bg-muted/30">
                            {order.productInfo.brand}
                          </Badge>
                        )}
                        
                        {order.category === ProductCategory.CLOTHING && order.productInfo?.size && (
                          <Badge variant="secondary" className="text-xs">
                            Размер: {order.productInfo.size}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell font-mono">
                  {order.supplierArticle ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="px-2 py-1 bg-muted rounded text-xs">
                            {order.supplierArticle}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Артикул поставщика</p>
                          {order.nmId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              NM ID: {order.nmId}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : order.nmId ? (
                    <span className="text-xs text-muted-foreground">ID: {order.nmId}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-col">
                    <span className="text-sm">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {order.category ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {getCategoryDisplay(order.category).badge}
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p>Автоматически определено по названию</p>
                            {order.productInfo?.category && (
                              <p className="mt-1">Категория в WB: {order.productInfo.category}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Badge variant="outline">Нет категории</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {renderCargoTypeBadge(order.cargoType)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{formatPrice(order.salePrice)} ₽</span>
                    {order.price !== order.salePrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(order.price)} ₽
                      </span>
                    )}
                  </div>
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
