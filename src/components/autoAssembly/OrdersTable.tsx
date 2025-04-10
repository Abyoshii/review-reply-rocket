import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AssemblyOrder, SortConfig } from "@/types/wb";
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Clock, Package } from 'lucide-react';
import { formatTimeAgo } from "@/lib/utils/formatUtils";

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
  const getSortIcon = (key: string) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? 
        <ChevronUp className="h-4 w-4" /> : 
        <ChevronDown className="h-4 w-4" />;
    }
    return null;
  };
  
  const renderSortButton = (key: keyof AssemblyOrder, label: string) => (
    <Button 
      variant="ghost" 
      size="sm" 
      className="flex items-center gap-1 p-0 h-auto font-medium"
      onClick={() => handleSort(key)}
    >
      {label}
      {getSortIcon(key)}
    </Button>
  );

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getProductData = (order: AssemblyOrder) => {
    if (order.products && order.products.length > 0) {
      return {
        name: order.products[0].name || "Неизвестный товар",
        brand: order.products[0].brand || "—",
        article: order.products[0].article || "—",
        photo: order.products[0].photo || "https://via.placeholder.com/50",
      };
    }
    
    if (order.productInfo) {
      return {
        name: order.productInfo.name || "Неизвестный товар",
        brand: order.productInfo.brand || "—",
        article: order.supplierArticle || "—",
        photo: order.productInfo.image || "https://via.placeholder.com/50",
      };
    }
    
    return {
      name: order.productName || "Неизвестный товар",
      brand: "—",
      article: order.supplierArticle || "—",
      photo: "https://via.placeholder.com/50",
    };
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-muted/30">
        <Package className="h-10 w-10 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Нет сборочных заданий</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLoading ? "Загрузка..." : "Не найдено заданий по заданным критериям"}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={allSelected} 
                onCheckedChange={toggleSelectAll}
                aria-label="Выбрать все"
              />
            </TableHead>
            <TableHead>
              {renderSortButton('productName', 'Товар')}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {renderSortButton('createdAt', 'Дата заказа')}
            </TableHead>
            <TableHead className="text-right">
              {renderSortButton('price', 'Цена')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => {
            const isSelected = selectedOrders.includes(order.id);
            const productData = getProductData(order);
            
            return (
              <TableRow key={order.id} className={isSelected ? "bg-muted/50" : ""}>
                <TableCell>
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => toggleOrderSelection(order.id)}
                    aria-label={`Выбрать заказ ${order.id}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-3 items-center">
                    <div className="flex-shrink-0 w-12 h-12 relative overflow-hidden rounded border">
                      <img 
                        src={productData.photo} 
                        alt={productData.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/50?text=Нет+фото";
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{productData.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Бренд: {productData.brand}
                      </div>
                      {productData.article && (
                        <div className="text-xs text-muted-foreground">
                          Артикул: {productData.article}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{formatDate(order.createdAt)}</span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">{order.price} ₽</div>
                  {order.salePrice !== order.price && (
                    <div className="text-sm text-muted-foreground line-through">{order.salePrice} ₽</div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableCaption>
          Всего заданий: {filteredOrders.length}
        </TableCaption>
      </Table>
    </div>
  );
};

export default OrdersTable;
