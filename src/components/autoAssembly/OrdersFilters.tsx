
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Search, ArrowDownWideNarrow, Droplets, Shirt, Paperclip, Calendar } from "lucide-react";
import { WarehouseFilter, CargoTypeFilter, ProductCategory } from "@/types/wb";

interface OrdersFiltersProps {
  warehouseOptions: WarehouseFilter[];
  cargoTypeOptions: CargoTypeFilter[];
  onFilterChange: (newFilterState: Partial<{
    warehouseId: WarehouseFilter | null;
    productCategory: ProductCategory | null;
    cargoType: CargoTypeFilter | null;
    dateFrom: Date | null;
    dateTo: Date | null;
    searchQuery: string;
  }>) => void;
}

const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  warehouseOptions,
  cargoTypeOptions,
  onFilterChange
}) => {
  const [filters, setFilters] = useState({
    warehouse: "all",
    cargoType: "all",
    category: "all",
    search: "",
    sortBy: "createdAt",
    sortDirection: 'desc' as 'asc' | 'desc',
    dateFrom: null as Date | null,
    dateTo: null as Date | null
  });

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    
    // Map the filter changes to the parent component's filter structure
    if (field === 'warehouse') {
      const warehouseFilter = value === 'all' 
        ? null 
        : warehouseOptions.find(w => w.id.toString() === value) || null;
      onFilterChange({ warehouseId: warehouseFilter });
    } else if (field === 'cargoType') {
      const cargoTypeFilter = value === 'all'
        ? null
        : cargoTypeOptions.find(c => c.id.toString() === value) || null;
      onFilterChange({ cargoType: cargoTypeFilter });
    } else if (field === 'category') {
      const categoryFilter = value === 'all'
        ? null
        : value as ProductCategory;
      onFilterChange({ productCategory: categoryFilter });
    } else if (field === 'search') {
      onFilterChange({ searchQuery: value });
    } else if (field === 'dateFrom') {
      onFilterChange({ dateFrom: value });
    } else if (field === 'dateTo') {
      onFilterChange({ dateTo: value });
    }
  };

  const resetFilters = () => {
    setFilters({
      warehouse: "all",
      cargoType: "all",
      category: "all",
      search: "",
      sortBy: "createdAt",
      sortDirection: 'desc',
      dateFrom: null,
      dateTo: null
    });
    
    onFilterChange({
      warehouseId: null,
      productCategory: null,
      cargoType: null,
      dateFrom: null,
      dateTo: null,
      searchQuery: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="warehouse">Склад</Label>
          <Select value={filters.warehouse} onValueChange={value => handleFilterChange('warehouse', value)}>
            <SelectTrigger id="warehouse">
              <SelectValue placeholder="Все склады" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все склады</SelectItem>
              {warehouseOptions.map(warehouse => (
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
              {cargoTypeOptions.map(cargoType => (
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateFrom">Дата с</Label>
          <DatePicker 
            id="dateFrom"
            selected={filters.dateFrom} 
            onSelect={(date) => handleFilterChange('dateFrom', date)}
            className="w-full"
          />
        </div>
        
        <div>
          <Label htmlFor="dateTo">Дата по</Label>
          <DatePicker 
            id="dateTo"
            selected={filters.dateTo} 
            onSelect={(date) => handleFilterChange('dateTo', date)}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetFilters}
        >
          Сбросить фильтры
        </Button>
      </div>
    </div>
  );
};

export default OrdersFilters;
