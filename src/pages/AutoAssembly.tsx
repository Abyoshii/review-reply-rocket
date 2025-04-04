
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Box, Loader2, RefreshCw } from "lucide-react";
import { AssemblyOrder, ProductCategory, WarehouseFilter, CargoTypeFilter, Supply } from "@/types/wb";
import { AutoAssemblyAPI } from "@/lib/autoAssemblyApi";
import { formatPrice } from "@/lib/utils/formatUtils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Импорт компонентов
import OrdersTable from "@/components/autoAssembly/OrdersTable";
import OrdersFilters from "@/components/autoAssembly/OrdersFilters";
import SuppliesContent from "@/components/autoAssembly/SuppliesContent";
import ResultDialog from "@/components/autoAssembly/ResultDialog";
import SelectedOrdersActions from "@/components/autoAssembly/SelectedOrdersActions";
import { getCategoryDisplay, renderCargoTypeBadge } from "@/components/autoAssembly/CategoryUtils";

const AutoAssembly = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<AssemblyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [warehouses, setWarehouses] = useState<WarehouseFilter[]>([]);
  const [cargoTypes, setCargoTypes] = useState<CargoTypeFilter[]>([]);
  const [filters, setFilters] = useState({
    warehouse: '',
    cargoType: '',
    search: '',
    sortBy: 'createdAt',
    sortDirection: 'desc' as 'asc' | 'desc',
    category: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoAssembling, setIsAutoAssembling] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [autoAssemblyResult, setAutoAssemblyResult] = useState<{
    success: boolean;
    perfumeCount: number;
    clothingCount: number;
    miscCount: number;
    perfumeSupplyId?: number;
    clothingSupplyId?: number;
    miscSupplyId?: number;
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const newOrders = await AutoAssemblyAPI.getNewOrders();
      console.log("Loaded orders:", newOrders);
      setOrders(newOrders);
      setFilteredOrders(newOrders);
      setWarehouses([
        { id: 1, name: "Коледино" }, 
        { id: 2, name: "Электросталь" }, 
        { id: 3, name: "Санкт-Петербург" }, 
        { id: 4, name: "Казань" }, 
        { id: 5, name: "Краснодар" }
      ]);
      setCargoTypes([
        { id: 0, name: "Обычный" }, 
        { id: 1, name: "Крупногабаритный" }, 
        { id: 2, name: "Тяжеловесный" }
      ]);
      
      const suppliesResponse = await AutoAssemblyAPI.getSupplies();
      console.log("Loaded supplies:", suppliesResponse);
      setSupplies(suppliesResponse || []);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      toast.error("Не удалось загрузить данные по сборочным заданиям");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = [...orders];
    if (filters.warehouse) {
      const warehouseId = parseInt(filters.warehouse);
      result = result.filter(order => order.warehouseId === warehouseId);
    }
    if (filters.cargoType) {
      const cargoType = parseInt(filters.cargoType);
      result = result.filter(order => order.cargoType === cargoType);
    }
    if (filters.category) {
      result = result.filter(order => order.category === filters.category);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(order => 
        order.productName.toLowerCase().includes(searchLower) || 
        order.orderUid.toLowerCase().includes(searchLower) || 
        order.supplierArticle && order.supplierArticle.toLowerCase().includes(searchLower)
      );
    }
    result.sort((a, b) => {
      let compareA, compareB;
      switch (filters.sortBy) {
        case 'createdAt':
          compareA = new Date(a.createdAt).getTime();
          compareB = new Date(b.createdAt).getTime();
          break;
        case 'price':
          compareA = a.salePrice;
          compareB = b.salePrice;
          break;
        case 'ddate':
          compareA = new Date(a.ddate).getTime();
          compareB = new Date(b.ddate).getTime();
          break;
        case 'name':
          compareA = a.productName;
          compareB = b.productName;
          break;
        case 'category':
          compareA = a.category || '';
          compareB = b.category || '';
          break;
        default:
          compareA = a.id;
          compareB = b.id;
      }
      if (typeof compareA === 'string' && typeof compareB === 'string') {
        return filters.sortDirection === 'asc' ? compareA.localeCompare(compareB) : compareB.localeCompare(compareA);
      }
      return filters.sortDirection === 'asc' ? compareA - compareB : compareB - compareA;
    });
    setFilteredOrders(result);
  }, [filters, orders]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleOrderSelection = (orderId: number) => {
    const newSelectedOrders = new Set(selectedOrders);
    if (selectedOrders.has(orderId)) {
      newSelectedOrders.delete(orderId);
    } else {
      newSelectedOrders.add(orderId);
    }
    setSelectedOrders(newSelectedOrders);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    }
  };

  const handleAssembleOrders = async () => {
    if (selectedOrders.size === 0) {
      toast.error("Выберите хотя бы одно сборочное задание");
      return;
    }
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Создана поставка с ${selectedOrders.size} сборочными заданиями`);
      const updatedOrders = orders.map(order => {
        if (selectedOrders.has(order.id)) {
          return {
            ...order,
            inSupply: true
          };
        }
        return order;
      });
      setOrders(updatedOrders);
      setSelectedOrders(new Set());
    } catch (error) {
      console.error("Ошибка создания поставки:", error);
      toast.error("Не удалось создать поставку");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoAssemble = async () => {
    const availableOrders = orders.filter(order => !order.inSupply);
    if (availableOrders.length === 0) {
      toast.error("Нет доступных заказов для автосборки");
      return;
    }
    setIsAutoAssembling(true);
    try {
      const result = await AutoAssemblyAPI.createCategorizedSupplies(availableOrders);
      if (result.success) {
        const updatedOrders = orders.map(order => {
          const category = order.category;
          let shouldBeInSupply = false;
          if (category === ProductCategory.PERFUME && result.perfumeSupplyId) {
            shouldBeInSupply = true;
          } else if (category === ProductCategory.CLOTHING && result.clothingSupplyId) {
            shouldBeInSupply = true;
          } else if (category === ProductCategory.MISC && result.miscSupplyId) {
            shouldBeInSupply = true;
          }
          if (shouldBeInSupply) {
            return {
              ...order,
              inSupply: true
            };
          }
          return order;
        });
        setOrders(updatedOrders);
        setAutoAssemblyResult(result);
        setShowResultDialog(true);
        if (!result.perfumeSupplyId && !result.clothingSupplyId && !result.miscSupplyId) {
          toast.error("Не удалось создать ни одной поставки");
        }
      } else {
        toast.error("Ошибка при автоматическом формировании поставок");
      }
    } catch (error) {
      console.error("Ошибка автосборки:", error);
      toast.error("Произошла ошибка при автоматическом формировании поставок");
    } finally {
      setIsAutoAssembling(false);
    }
  };

  const handleRefreshOrders = async () => {
    await loadData();
    toast.success("Список заданий обновлен");
  };

  const handlePrintStickers = async () => {
    if (selectedOrders.size === 0) {
      toast.error("Выберите хотя бы одно сборочное задание");
      return;
    }
    setIsProcessing(true);
    try {
      const orderIds = Array.from(selectedOrders);
      const downloadUrl = await AutoAssemblyAPI.printStickers(orderIds);
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `stickers_${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Стикеры для ${selectedOrders.size} заказов созданы`);
      } else {
        toast.error("Не удалось создать стикеры");
      }
    } catch (error) {
      console.error("Ошибка при создании стикеров:", error);
      toast.error("Произошла ошибка при создании стикеров");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Автосборка</h1>
          <p className="text-muted-foreground">
            Управление сборочными заданиями и создание поставок
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-dashed" onClick={handleRefreshOrders} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить задания
          </Button>
          
          <Button variant="purple" size="lg" onClick={handleAutoAssemble} disabled={isLoading || isAutoAssembling}>
            {isAutoAssembling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Формирование поставок...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Автосформировать поставки
              </>
            )}
          </Button>
        </div>
      </div>
      
      <ResultDialog 
        showResultDialog={showResultDialog} 
        setShowResultDialog={setShowResultDialog} 
        autoAssemblyResult={autoAssemblyResult} 
        setActiveTab={setActiveTab} 
      />
      
      <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="orders">
            <Box className="mr-2 h-4 w-4" />
            Сборочные задания
          </TabsTrigger>
          <TabsTrigger value="supplies">
            <Truck className="mr-2 h-4 w-4" />
            Поставки
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          <OrdersFilters 
            filters={filters} 
            warehouses={warehouses} 
            cargoTypes={cargoTypes} 
            handleFilterChange={handleFilterChange} 
            filteredOrdersCount={filteredOrders.length} 
          />
          
          <Card>
            <CardContent className="p-0">
              <OrdersTable 
                filteredOrders={filteredOrders}
                isLoading={isLoading}
                selectedOrders={selectedOrders}
                warehouses={warehouses}
                toggleOrderSelection={toggleOrderSelection}
                toggleSelectAll={toggleSelectAll}
                handleRefreshOrders={handleRefreshOrders}
                formatPrice={formatPrice}
                getCategoryDisplay={getCategoryDisplay}
                renderCargoTypeBadge={(cargoType) => renderCargoTypeBadge(cargoType, cargoTypes)}
              />
              
              <SelectedOrdersActions 
                selectedOrdersCount={selectedOrders.size}
                isProcessing={isProcessing}
                handlePrintStickers={handlePrintStickers}
                handleAssembleOrders={handleAssembleOrders}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="supplies" className="space-y-4">
          <SuppliesContent 
            isLoading={isLoading}
            supplies={supplies}
            loadData={loadData}
            setActiveTab={setActiveTab}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoAssembly;
