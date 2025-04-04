
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowDownWideNarrow, Droplets, Shirt, Paperclip } from "lucide-react";
import { WarehouseFilter, CargoTypeFilter, ProductCategory } from "@/types/wb";

interface OrdersFiltersProps {
  filters: {
    warehouse: string;
    cargoType: string;
    search: string;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    category: string;
  };
  warehouses: WarehouseFilter[];
  cargoTypes: CargoTypeFilter[];
  handleFilterChange: (field: string, value: string) => void;
  filteredOrdersCount: number;
}

const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  filters,
  warehouses,
  cargoTypes,
  handleFilterChange,
  filteredOrdersCount
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Фильтры</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="warehouse">Склад</Label>
            <Select value={filters.warehouse} onValueChange={value => handleFilterChange('warehouse', value)}>
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Все склады" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все склады</SelectItem>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="cargoType">Тип груза</Label>
            <Select value={filters.cargoType} onValueChange={value => handleFilterChange('cargoType', value)}>
              <SelectTrigger id="cargoType">
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {cargoTypes.map(cargoType => (
                  <SelectItem key={cargoType.id} value={cargoType.id.toString()}>
                    {cargoType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="category">Категория товара</Label>
            <Select value={filters.category} onValueChange={value => handleFilterChange('category', value)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value={ProductCategory.PERFUME}>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Парфюмерия
                  </div>
                </SelectItem>
                <SelectItem value={ProductCategory.CLOTHING}>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4" />
                    Одежда
                  </div>
                </SelectItem>
                <SelectItem value={ProductCategory.MISC}>
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Мелочёвка
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sortBy">Сортировка</Label>
            <Select value={filters.sortBy} onValueChange={value => handleFilterChange('sortBy', value)}>
              <SelectTrigger id="sortBy">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">По дате создания</SelectItem>
                <SelectItem value="price">По цене</SelectItem>
                <SelectItem value="ddate">По сроку доставки</SelectItem>
                <SelectItem value="name">По наименованию</SelectItem>
                <SelectItem value="category">По категории</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="search">Поиск</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="search" 
                placeholder="Артикул, номер заказа..." 
                className="pl-8" 
                value={filters.search} 
                onChange={e => handleFilterChange('search', e.target.value)} 
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                handleFilterChange('warehouse', 'all');
                handleFilterChange('cargoType', 'all');
                handleFilterChange('search', '');
                handleFilterChange('sortBy', 'createdAt');
                handleFilterChange('sortDirection', 'desc');
                handleFilterChange('category', 'all');
              }}
            >
              Сбросить фильтры
            </Button>
            <span className="text-sm text-muted-foreground">
              Найдено: {filteredOrdersCount}
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowDownWideNarrow className={`h-4 w-4 mr-1 ${filters.sortDirection === 'asc' ? 'rotate-180' : ''}`} />
            {filters.sortDirection === 'asc' ? 'По убыванию' : 'По возрастанию'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersFilters;
