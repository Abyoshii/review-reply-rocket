
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import OrdersFilters from './OrdersFilters';
import { WarehouseFilter, CargoTypeFilter, ProductCategory } from "@/types/wb";

interface CollapsibleFiltersProps {
  warehouseOptions: WarehouseFilter[];
  cargoTypeOptions: CargoTypeFilter[];
  onFilterChange: (newFilterState: Partial<{
    warehouseId: WarehouseFilter | null;
    productCategory: ProductCategory | null;
    cargoType: CargoTypeFilter | null;
    dateFrom: Date | null;
    dateTo: Date | null;
  }>) => void;
  activeFiltersCount: number;
  onResetFilters: () => void;
}

const CollapsibleFilters: React.FC<CollapsibleFiltersProps> = ({
  warehouseOptions,
  cargoTypeOptions,
  onFilterChange,
  activeFiltersCount,
  onResetFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between mb-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Фильтры</span>
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-primary w-5 h-5 text-[10px] text-white font-medium">
                  {activeFiltersCount}
                </span>
              )}
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onResetFilters} className="text-sm text-muted-foreground">
              <X className="h-3 w-3 mr-1" />
              Сбросить все
            </Button>
          )}
        </div>
        
        <CollapsibleContent>
          <Card className="mb-4">
            <CardContent className="pt-4">
              <OrdersFilters 
                warehouseOptions={warehouseOptions}
                cargoTypeOptions={cargoTypeOptions}
                onFilterChange={onFilterChange}
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CollapsibleFilters;
