import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Loader2, RefreshCw, Shield, Database } from "lucide-react";
import { AssemblyOrder, ProductCategory, WarehouseFilter, CargoTypeFilter, Supply, SortConfig } from "@/types/wb";
import { AutoAssemblyAPI } from "@/lib/autoAssemblyApi";
import { SuppliesAPI } from "@/lib/suppliesApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getApiToken, getHeaderName, isTokenValid, UNIFIED_API_TOKEN } from "@/lib/securityUtils";
import { logAuthStatus, logError } from "@/lib/logUtils";
import TokenDiagnostics from "@/components/TokenDiagnostics";
import { getProductCacheStats, clearProductInfoCache, markProductAsInSupply } from "@/lib/utils/productUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OrdersFilters from "@/components/autoAssembly/OrdersFilters";
import OrdersTable from "@/components/autoAssembly/OrdersTable";
import SelectedOrdersActions from "@/components/autoAssembly/SelectedOrdersActions";
import SuppliesContent from "@/components/autoAssembly/SuppliesContent";
import ResultDialog from "@/components/autoAssembly/ResultDialog";

interface FilterState {
  warehouseId: WarehouseFilter | null;
  productCategory: ProductCategory | null;
  cargoType: CargoTypeFilter | null;
  dateFrom: Date | null;
  dateTo: Date | null;
}

const AutoAssembly = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [autoAssemblyResult, setAutoAssemblyResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "supplies">("orders");

  const [showTokenDiagnostics, setShowTokenDiagnostics] = useState(false);

  const [filterState, setFilterState] = useState<FilterState>({
    warehouseId: null,
    productCategory: null,
    cargoType: null,
    dateFrom: null,
    dateTo: null,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: null,
  });

  const warehouseOptions: WarehouseFilter[] = [
    { id: 121842, name: "Коледино" },
    { id: 117531, name: "Подольск" },
    { id: 117986, name: "Санкт-Петербург" },
    { id: 117987, name: "Краснодар" },
    { id: 117988, name: "Екатеринбург" },
    { id: 117989, name: "Новосибирск" },
    { id: 117990, name: "Хабаровск" },
    { id: 119034, name: "Алматы" },
  ];

  const cargoTypeOptions: CargoTypeFilter[] = [
    { id: 1, name: "Короб" },
    { id: 2, name: "Пакет" },
  ];

  const filteredOrders = orders.filter((order) => {
    if (order.inSupply) {
      return false;
    }
    
    if (filterState.warehouseId && order.warehouseId !== filterState.warehouseId.id) {
      return false;
    }
    if (filterState.productCategory && order.category !== filterState.productCategory) {
      return false;
    }
    if (filterState.cargoType && order.cargoType !== filterState.cargoType.id) {
      return false;
    }
    if (filterState.dateFrom && new Date(order.createdAt) < filterState.dateFrom) {
      return false;
    }
    if (filterState.dateTo && new Date(order.createdAt) > filterState.dateTo) {
      return false;
    }
    return true;
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem("wb_token", UNIFIED_API_TOKEN);
      
      const token = getApiToken();
      const headerName = getHeaderName();
      
      console.log("Используемый токен для запроса:", token);
      console.log("Текущий единый токен:", UNIFIED_API_TOKEN);
      console.log("Токены совпадают:", token === UNIFIED_API_TOKEN);
      
      if (!isTokenValid(token)) {
        logError("Проблема с токеном авторизации", "Токен может быть просрочен или неправильного формата");
        toast.error("Ошибка авторизации API", {
          description: "Откройте диагностику токена для решения проблемы",
          action: {
            label: "Диагностика",
            onClick: () => setShowTokenDiagnostics(true)
          }
        });
      } else {
        logAuthStatus(token, headerName);
      }
      
      const newOrders = await AutoAssemblyAPI.getNewOrders();
      console.log("Loaded orders:", newOrders);
      
      const ordersWithSupplyStatus = newOrders.map(order => {
        if (order.inSupply) {
          if (order.nmId) {
            markProductAsInSupply(order.nmId);
          }
        }
        return order;
      });
      
      setOrders(ordersWithSupplyStatus);
      
      const suppliesResponse = await SuppliesAPI.getSupplies();
      console.log("Loaded supplies via SuppliesAPI:", suppliesResponse);
      
      if (suppliesResponse && suppliesResponse.supplies) {
        suppliesResponse.supplies.forEach((supply, index) => {
          console.log(`Supply ${index}:`, supply);
        });
        
        setSupplies(suppliesResponse.supplies);
      } else {
        console.error("Supplies response is undefined or missing supplies array");
        
        const backupSupplies = await AutoAssemblyAPI.getSupplies();
        console.log("Loaded supplies via backup method:", backupSupplies);
        
        if (backupSupplies && backupSupplies.length > 0) {
          setSupplies(backupSupplies);
        } else {
          toast.error("Не удалось загрузить данные о поставках");
        }
      }
      
    } catch (error) {
      console.error("Error loading data:", error);
      
      if (error instanceof Error && error.message.includes('401')) {
        toast.error("Ошибка авторизации API (401)", {
          description: "Проверьте токен авторизации",
          action: {
            label: "Диагностика",
            onClick: () => setShowTokenDiagnostics(true)
          }
        });
      } else {
        toast.error("Ошибка загрузки данных", {
          description: error instanceof Error ? error.message : "Неизвестная ошибка"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshOrders = async () => {
    loadData();
  };

  const handleAutoAssemble = async () => {
    setIsLoading(true);
    try {
      const result = await AutoAssemblyAPI.createCategorizedSupplies(filteredOrders);
      setAutoAssemblyResult(result);
      setShowResultDialog(true);
    } catch (error) {
      console.error("Error during auto-assembly:", error);
      toast.error("Ошибка при автоматической сборке", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders((prevSelected) =>
      prevSelected.includes(orderId)
        ? prevSelected.filter((id) => id !== orderId)
        : [...prevSelected, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders([]);
    } else {
      const filteredOrderIds = filteredOrders.map((order) => order.id);
      setSelectedOrders(filteredOrderIds);
    }
  };

  const allSelected = filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length;
  const selectedOrdersCount = selectedOrders.length;

  const handlePrintStickers = async () => {
    setIsProcessing(true);
    try {
      const result = await AutoAssemblyAPI.printStickers(selectedOrders);
      console.log("Print stickers result:", result);
      toast.success("Задания на печать стикеров отправлены", {
        description: `Выбрано ${selectedOrders.length} заказов`
      });
    } catch (error) {
      console.error("Error printing stickers:", error);
      toast.error("Ошибка при печати стикеров", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssembleOrders = async (supplyId?: number, newSupplyName?: string) => {
    setIsProcessing(true);
    try {
      let targetSupplyId = supplyId;
      
      if (!targetSupplyId && newSupplyName) {
        targetSupplyId = await SuppliesAPI.createSupply(newSupplyName);
        if (!targetSupplyId) {
          toast.error("Не удалось создать новую поставку");
          setIsProcessing(false);
          return;
        }
      } else if (!targetSupplyId) {
        if (supplies.length === 0) {
          const currentDate = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const supplyName = `Поставка от ${currentDate}`;
          targetSupplyId = await SuppliesAPI.createSupply(supplyName);
          
          if (!targetSupplyId) {
            toast.error("Не удалось создать новую поставку");
            setIsProcessing(false);
            return;
          }
        } else {
          targetSupplyId = supplies[0].id;
        }
      }
      
      let successCount = 0;
      for (const orderId of selectedOrders) {
        const success = await SuppliesAPI.addOrderToSupply(targetSupplyId, orderId);
        if (success) {
          successCount++;
          
          const assembledOrder = orders.find(order => order.id === orderId);
          if (assembledOrder?.nmId) {
            markProductAsInSupply(assembledOrder.nmId);
          }
          
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId 
                ? { ...order, inSupply: true } 
                : order
            )
          );
        }
      }
      
      await loadData();
      
      if (successCount > 0) {
        toast.success(`Добавлено ${successCount} из ${selectedOrders.length} заказов в поставку`, {
          description: `ID поставки: ${targetSupplyId}`
        });
        
        if (successCount === selectedOrders.length) {
          setActiveTab("supplies");
          setSelectedOrders([]);
        }
      } else {
        toast.error("Не удалось добавить заказы в поставку", {
          description: "Проверьте статус заказов и поставки"
        });
      }
    } catch (error) {
      console.error("Error assembling orders:", error);
      toast.error("Ошибка при сборке заказов", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilterChange = (newFilterState: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...newFilterState }));
  };

  const handleSort = (key: keyof AssemblyOrder) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  useEffect(() => {
    if (sortConfig.key) {
      const sortedOrders = [...filteredOrders].sort((a, b) => {
        const key = sortConfig.key as keyof AssemblyOrder;
        const aValue = a[key];
        const bValue = b[key];

        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else {
          return 0;
        }
      });

      setOrders(sortedOrders);
    } else {
      loadData();
    }
  }, [sortConfig]);

  const handleCheckToken = useCallback(() => {
    setShowTokenDiagnostics(true);
  }, []);
  
  const handleSetActiveTab = (tab: string) => {
    if (tab === "orders" || tab === "supplies") {
      setActiveTab(tab);
    }
  };

  const handleClearCache = useCallback(() => {
    clearProductInfoCache();
    loadData();
  }, []);

  const cacheStats = getProductCacheStats();

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Автоматическая сборка</h1>
          <p className="text-muted-foreground">
            Формирование поставок на основе заказов и производство коробов
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-dashed flex items-center gap-1" 
                  onClick={handleClearCache}
                >
                  <Database className="h-4 w-4" />
                  Кэш: {cacheStats.total}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-medium">Статистика кэша товаров:</p>
                  <p>Успешно загружено: {cacheStats.success}</p>
                  <p>С ошибками: {cacheStats.failed}</p>
                  <p>В поставках: {cacheStats.inSupply}</p>
                  <p className="mt-1">Нажмите для очистки кэша</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button 
            variant="outline" 
            className="border-dashed flex items-center gap-1" 
            onClick={handleCheckToken}
          >
            <Shield className="h-4 w-4" />
            Проверить токен
          </Button>
          
          <Button variant="outline" className="border-dashed" onClick={handleRefreshOrders} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить данные
          </Button>
          <Button onClick={handleAutoAssemble} disabled={isLoading || !filteredOrders.length}>
            <Package className="mr-2 h-4 w-4" />
            Автосборка
          </Button>
        </div>
      </div>
      
      <ResultDialog 
        showResultDialog={showResultDialog} 
        setShowResultDialog={setShowResultDialog} 
        autoAssemblyResult={autoAssemblyResult} 
        setActiveTab={handleSetActiveTab}
      />
      
      <TokenDiagnostics 
        open={showTokenDiagnostics}
        onOpenChange={setShowTokenDiagnostics}
      />
      
      <Tabs defaultValue="orders" value={activeTab} onValueChange={(value: string) => setActiveTab(value as "orders" | "supplies")} className="mb-6">
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Заказы ({filteredOrders.length})
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            Поставки ({supplies.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          <OrdersFilters 
            onFilterChange={handleFilterChange} 
            warehouseOptions={warehouseOptions}
            cargoTypeOptions={cargoTypeOptions}
          />
          <Card>
            <OrdersTable 
              filteredOrders={filteredOrders}
              isLoading={isLoading}
              selectedOrders={selectedOrders}
              toggleOrderSelection={toggleOrderSelection}
              toggleSelectAll={toggleSelectAll}
              allSelected={allSelected}
              sortConfig={sortConfig}
              handleSort={handleSort}
            />
            <SelectedOrdersActions 
              selectedOrdersCount={selectedOrdersCount}
              isProcessing={isProcessing}
              supplies={supplies}
              handlePrintStickers={handlePrintStickers}
              handleAssembleOrders={handleAssembleOrders}
            />
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
