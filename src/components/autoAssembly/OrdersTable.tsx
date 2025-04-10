
import React, { useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Box, Loader2, RefreshCw, ImageOff, Clock, ShoppingBag, Package } from "lucide-react";
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

  // Форматирование ID заказа для отображения
  const formatOrderId = (orderId: number, orderUid?: string) => {
    if (orderUid) {
      // Если есть UID, показываем только последние 8 символов для краткости
      return orderUid.length > 8 ? `№${orderUid.slice(-8)}` : `№${orderUid}`;
    }
    return `№${orderId}`;
  };

  // Получение основной информации о продукте из заказа
  const getProductInfo = (order: AssemblyOrder) => {
    // Первый приоритет - проверка массива products
    if (order.products && order.products.length > 0) {
      const product = order.products[0];
      return {
        name: product.name || "Товар без названия", 
        brand: product.brand,
        photo: product.photo || product.image,
        article: product.article,
        nmId: product.nmId
      };
    }
    
    // Второй приоритет - проверка объекта productInfo
    if (order.productInfo) {
      return {
        name: order.productInfo.name,
        brand: order.productInfo.brand,
        photo: order.productInfo.image,
        article: order.supplierArticle,
        nmId: order.nmId
      };
    }
    
    // Если нет ни products, ни productInfo - возвращаем базовую информацию
    return {
      name: order.productName || `Товар ID: ${order.nmId || order.id}`,
      brand: undefined,
      photo: "",
      article: order.supplierArticle,
      nmId: order.nmId
    };
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
            `Всего заданий: ${filteredOrders.length}`
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
            <TableHead>Задание</TableHead>
            <TableHead className="w-[600px]">Наименование</TableHead>
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
            filteredOrders.map(order => {
              // Получаем информацию о продукте для текущего заказа
              const productInfo = getProductInfo(order);
              console.log("Product info for order", order.id, productInfo);
              
              return (
                <TableRow key={order.id} className={`cursor-pointer hover:bg-muted/30 ${selectedOrders.includes(order.id) ? 'bg-muted/50' : ''}`}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedOrders.includes(order.id)} 
                      onCheckedChange={() => toggleOrderSelection(order.id)} 
                    />
                  </TableCell>
                  
                  {/* Колонка с номером задания - новый дизайн */}
                  <TableCell className="align-top">
                    <div className="flex flex-col">
                      <div className="font-medium">
                        {formatOrderId(order.id, order.orderUid)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Новый
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Создан: {new Date(order.createdAt).toLocaleString('ru-RU')}
                      </div>
                      <div className="mt-2">
                        {order.cargoType && (
                          <span className="inline-block">{renderCargoTypeBadge(order.cargoType)}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Колонка с названием товара - обновленный для корректного отображения информации */}
                  <TableCell>
                    <div className="flex items-start gap-4">
                      {/* Изображение товара */}
                      <div className="w-16 h-16 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        {productInfo.photo ? (
                          <img 
                            src={productInfo.photo} 
                            alt={productInfo.name || 'Товар'} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.log("Error loading image for product", productInfo.nmId);
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-muted-foreground/50">
                                    <line x1="2" x2="22" y1="2" y2="22"></line>
                                    <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"></path>
                                    <line x1="13.5" x2="6.5" y1="13.5" y2="20.5"></line>
                                    <path d="M14 14h-4v-4"></path>
                                    <path d="M5 21v-7"></path>
                                    <path d="M15 7a4 4 0 1 0-8 0"></path>
                                    <path d="M18.5 3.5 20 2l1 1-1.5 1.5"></path>
                                    <path d="M20 6v.5"></path>
                                    <path d="M18.5 7.5 17 9l-1-1 1.5-1.5"></path>
                                    <path d="M16 8h-.5"></path>
                                    <path d="M13.5 10.5 12 12l-1-1 1.5-1.5"></path>
                                  </svg>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => productInfo.nmId && handleRetryProductInfo(productInfo.nmId)}
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
                      
                      {/* Информация о товаре - название, бренд, артикул */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-lg">
                          {productInfo.name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                          {productInfo.brand && (
                            <span className="font-semibold">{productInfo.brand}</span>
                          )}
                          {productInfo.brand && productInfo.article && (
                            <span className="mx-1">•</span>
                          )}
                          {productInfo.article && (
                            <span>Арт: {productInfo.article}</span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-green-600 mt-2">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatTimeAgo(order.createdAt)}</span>
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
