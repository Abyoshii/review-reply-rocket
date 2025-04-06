
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Box, Loader2, RefreshCw, ImageOff, Droplets, Shirt, Paperclip } from "lucide-react";
import { AssemblyOrder, ProductCategory, SortConfig } from "@/types/wb";
import { formatTimeAgo, formatPrice } from "@/lib/utils/formatUtils";

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

  return (
    <div className="relative overflow-x-auto">
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
            `Всего сборочных заданий: ${filteredOrders.length}`
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
            <TableHead>Задание</TableHead>
            <TableHead>Артикул</TableHead>
            <TableHead className="w-[250px]">Наименование</TableHead>
            <TableHead className="hidden lg:table-cell">Создан</TableHead>
            <TableHead className="hidden md:table-cell">Доставка до</TableHead>
            <TableHead className="hidden lg:table-cell">Склад</TableHead>
            <TableHead className="hidden md:table-cell">Категория</TableHead>
            <TableHead className="hidden sm:table-cell">Тип груза</TableHead>
            <TableHead>Цена</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Загрузка сборочных заданий...
                </div>
              </TableCell>
            </TableRow>
          ) : filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Box className="h-12 w-12 text-muted-foreground/50" />
                  <div>Нет сборочных заданий по заданным фильтрам</div>
                  <Button variant="outline" onClick={() => console.log('refresh')}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Обновить данные
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredOrders.map(order => (
              <TableRow key={order.id} className="cursor-pointer">
                <TableCell>
                  <Checkbox 
                    checked={selectedOrders.includes(order.id)} 
                    onCheckedChange={() => toggleOrderSelection(order.id)} 
                  />
                </TableCell>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.supplierArticle || "-"}</TableCell>
                <TableCell className="max-w-[250px]">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 rounded-md">
                      {order.productInfo?.image ? (
                        <AvatarImage src={order.productInfo.image} alt={order.productInfo.name} className="object-contain" />
                      ) : (
                        <AvatarFallback className="rounded-md bg-muted">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col w-full">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-left font-medium text-sm truncate w-full cursor-default">
                              {order.productInfo?.name || (
                                <span className="italic text-muted-foreground">Данные недоступны</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {order.productInfo ? (
                              <>
                                <p className="font-medium">{order.productInfo.name}</p>
                                {order.productInfo.category && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Категория: {order.productInfo.category}
                                  </p>
                                )}
                                {order.productInfo.brand && (
                                  <p className="text-xs text-muted-foreground">
                                    Бренд: {order.productInfo.brand}
                                  </p>
                                )}
                                {order.supplierArticle && (
                                  <p className="text-xs text-muted-foreground">
                                    Артикул: {order.supplierArticle}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p>Информация о товаре не найдена</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {order.productInfo?.brand ? (
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {order.productInfo.brand}
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Нет данных о бренде
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatTimeAgo(order.createdAt)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(order.ddate).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {order.warehouseId ? order.warehouseId : "-"}
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
