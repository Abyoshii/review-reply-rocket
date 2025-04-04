
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Box, Loader2, RefreshCw, ImageOff, Droplets, Shirt, Paperclip } from "lucide-react";
import { AssemblyOrder, ProductCategory, WarehouseFilter } from "@/types/wb";
import { formatTimeAgo } from "@/lib/utils/formatUtils";

interface OrdersTableProps {
  filteredOrders: AssemblyOrder[];
  isLoading: boolean;
  selectedOrders: Set<number>;
  warehouses: WarehouseFilter[];
  toggleOrderSelection: (orderId: number) => void;
  toggleSelectAll: () => void;
  handleRefreshOrders: () => void;
  formatPrice: (price: number) => string;
  getCategoryDisplay: (category?: ProductCategory) => { 
    icon: JSX.Element; 
    badge: JSX.Element;
  };
  renderCargoTypeBadge: (cargoType: number) => JSX.Element;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  filteredOrders,
  isLoading,
  selectedOrders,
  warehouses,
  toggleOrderSelection,
  toggleSelectAll,
  handleRefreshOrders,
  formatPrice,
  getCategoryDisplay,
  renderCargoTypeBadge
}) => {
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
                checked={selectedOrders.size > 0 && selectedOrders.size === filteredOrders.length} 
                onCheckedChange={toggleSelectAll} 
              />
            </TableHead>
            <TableHead>Задание</TableHead>
            <TableHead>Артикул</TableHead>
            <TableHead className="w-[250px]">Наименование</TableHead>
            <TableHead className="hidden lg:table-cell">Создан</TableHead>
            <TableHead className="hidden md:table-cell">Доставка до</TableHead>
            {/* Скрываем склад, если warehouseId отсутствует */}
            {filteredOrders.some(order => order.warehouseId !== undefined) && (
              <TableHead className="hidden lg:table-cell">Склад</TableHead>
            )}
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
                  <Button variant="outline" onClick={handleRefreshOrders} className="mt-2">
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
                    checked={selectedOrders.has(order.id)} 
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
                              {order.productInfo?.name || order.productName || "Неизвестный товар"}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium">{order.productInfo?.name || order.productName || "Неизвестный товар"}</p>
                            {order.productInfo?.category && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Категория: {order.productInfo.category}
                              </p>
                            )}
                            {order.productInfo?.brand && (
                              <p className="text-xs text-muted-foreground">
                                Бренд: {order.productInfo.brand}
                              </p>
                            )}
                            {order.supplierArticle && (
                              <p className="text-xs text-muted-foreground">
                                Артикул: {order.supplierArticle}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {order.productInfo?.brand && (
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {order.productInfo.brand}
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
                {filteredOrders.some(o => o.warehouseId !== undefined) && (
                  <TableCell className="hidden lg:table-cell">
                    {order.warehouseId ? warehouses.find(w => w.id === order.warehouseId)?.name || "-" : "-"}
                  </TableCell>
                )}
                <TableCell className="hidden md:table-cell">
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
