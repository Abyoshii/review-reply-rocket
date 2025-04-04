
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Truck, 
  Box, 
  Filter, 
  Search, 
  ArrowDownWideNarrow, 
  Check, 
  Loader2
} from "lucide-react";

// Типы данных для сборочных заданий
interface AssemblyOrder {
  id: number;
  orderUid: string;
  createdAt: string;
  ddate: string;
  price: number;
  salePrice: number;
  supplierArticle?: string;
  productName: string;
  warehouseId: number;
  cargoType: number;
  selected?: boolean;
}

interface WarehouseFilter {
  id: number;
  name: string;
}

interface CargoTypeFilter {
  id: number;
  name: string;
}

const AutoAssembly = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<AssemblyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [warehouses, setWarehouses] = useState<WarehouseFilter[]>([]);
  const [cargoTypes, setCargoTypes] = useState<CargoTypeFilter[]>([]);
  const [filters, setFilters] = useState({
    warehouse: '',
    cargoType: '',
    search: '',
    sortBy: 'createdAt',
    sortDirection: 'desc' as 'asc' | 'desc'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Имитация загрузки данных
    const loadData = async () => {
      setIsLoading(true);
      try {
        // В реальном приложении здесь был бы API запрос
        const mockOrders: AssemblyOrder[] = [
          {
            id: 5632423,
            orderUid: "WB-GI-1122334455",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            ddate: new Date(Date.now() + 86400000 * 3).toISOString(),
            price: 1290.50,
            salePrice: 990.00,
            supplierArticle: "ABC123",
            productName: "Футболка белая с принтом",
            warehouseId: 1,
            cargoType: 0
          },
          {
            id: 5632424,
            orderUid: "WB-GI-1122334456",
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            ddate: new Date(Date.now() + 86400000 * 2).toISOString(),
            price: 2490.00,
            salePrice: 1990.00,
            supplierArticle: "DEF456",
            productName: "Джинсы классические",
            warehouseId: 2,
            cargoType: 1
          },
          {
            id: 5632425,
            orderUid: "WB-GI-1122334457",
            createdAt: new Date(Date.now() - 10800000).toISOString(),
            ddate: new Date(Date.now() + 86400000 * 4).toISOString(),
            price: 4990.00,
            salePrice: 3990.00,
            supplierArticle: "GHI789",
            productName: "Куртка демисезонная",
            warehouseId: 1,
            cargoType: 2
          }
        ];
        
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
        
        setWarehouses([
          { id: 1, name: "Коледино" },
          { id: 2, name: "Электросталь" }
        ]);
        
        setCargoTypes([
          { id: 0, name: "Обычный" },
          { id: 1, name: "Крупногабаритный" },
          { id: 2, name: "Тяжеловесный" }
        ]);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные по сборочным заданиям",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    // Применение фильтров
    let result = [...orders];
    
    if (filters.warehouse) {
      const warehouseId = parseInt(filters.warehouse);
      result = result.filter(order => order.warehouseId === warehouseId);
    }
    
    if (filters.cargoType) {
      const cargoType = parseInt(filters.cargoType);
      result = result.filter(order => order.cargoType === cargoType);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(order => 
        order.productName.toLowerCase().includes(searchLower) ||
        order.orderUid.toLowerCase().includes(searchLower) ||
        order.supplierArticle?.toLowerCase().includes(searchLower)
      );
    }
    
    // Сортировка
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
        default:
          compareA = a.id;
          compareB = b.id;
      }
      
      return filters.sortDirection === 'asc' 
        ? compareA - compareB 
        : compareB - compareA;
    });
    
    setFilteredOrders(result);
  }, [filters, orders]);
  
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
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
      toast({
        title: "Внимание",
        description: "Выберите хотя бы одно сборочное задание",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Имитация создания поставки и добавления заданий
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Успешно",
        description: `Создана поставка с ${selectedOrders.size} сборочными заданиями`,
      });
      
      // В реальном приложении обновили бы список с сервера
      const updatedOrders = orders.filter(order => !selectedOrders.has(order.id));
      setOrders(updatedOrders);
      setFilteredOrders(updatedOrders.filter(order => {
        if (filters.warehouse && order.warehouseId !== parseInt(filters.warehouse)) return false;
        if (filters.cargoType && order.cargoType !== parseInt(filters.cargoType)) return false;
        return true;
      }));
      setSelectedOrders(new Set());
    } catch (error) {
      console.error("Ошибка создания поставки:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать поставку",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const renderCargoTypeBadge = (cargoType: number) => {
    const type = cargoTypes.find(t => t.id === cargoType);
    
    switch (cargoType) {
      case 0:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          {type?.name || "Обычный"}
        </Badge>;
      case 1:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
          {type?.name || "Крупногабаритный"}
        </Badge>;
      case 2:
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
          {type?.name || "Тяжеловесный"}
        </Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Автосборка</h1>
          <p className="text-muted-foreground">
            Управление сборочными заданиями и создание поставок
          </p>
        </div>
        <Button 
          size="lg" 
          className="bg-green-600 hover:bg-green-700"
          onClick={handleAssembleOrders}
          disabled={selectedOrders.size === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Создание поставки...
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              Собрать выбранные ({selectedOrders.size})
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="orders" className="mb-6">
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
          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="warehouse">Склад</Label>
                  <Select
                    value={filters.warehouse}
                    onValueChange={(value) => handleFilterChange('warehouse', value)}
                  >
                    <SelectTrigger id="warehouse">
                      <SelectValue placeholder="Все склады" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все склады</SelectItem>
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
                  <Select
                    value={filters.cargoType}
                    onValueChange={(value) => handleFilterChange('cargoType', value)}
                  >
                    <SelectTrigger id="cargoType">
                      <SelectValue placeholder="Все типы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все типы</SelectItem>
                      {cargoTypes.map(cargoType => (
                        <SelectItem key={cargoType.id} value={cargoType.id.toString()}>
                          {cargoType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sortBy">Сортировка</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger id="sortBy">
                      <SelectValue placeholder="Сортировка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">По дате создания</SelectItem>
                      <SelectItem value="price">По цене</SelectItem>
                      <SelectItem value="ddate">По сроку доставки</SelectItem>
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
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({
                      warehouse: '',
                      cargoType: '',
                      search: '',
                      sortBy: 'createdAt',
                      sortDirection: 'desc'
                    })}
                  >
                    Сбросить фильтры
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Найдено: {filteredOrders.length}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange(
                    'sortDirection', 
                    filters.sortDirection === 'asc' ? 'desc' : 'asc'
                  )}
                >
                  <ArrowDownWideNarrow className={`h-4 w-4 mr-1 ${filters.sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                  {filters.sortDirection === 'asc' ? 'По убыванию' : 'По возрастанию'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-0">
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
                      <TableHead>ID</TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead className="hidden md:table-cell">Наименование</TableHead>
                      <TableHead className="hidden lg:table-cell">Создан</TableHead>
                      <TableHead className="hidden md:table-cell">Доставка до</TableHead>
                      <TableHead className="hidden lg:table-cell">Склад</TableHead>
                      <TableHead className="hidden md:table-cell">Тип груза</TableHead>
                      <TableHead>Цена</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          Загрузка...
                        </TableCell>
                      </TableRow>
                    ) : filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          Нет сборочных заданий по заданным фильтрам
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="cursor-pointer">
                          <TableCell>
                            <Checkbox 
                              checked={selectedOrders.has(order.id)} 
                              onCheckedChange={() => toggleOrderSelection(order.id)}
                            />
                          </TableCell>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.supplierArticle || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                            {order.productName}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(order.ddate)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {warehouses.find(w => w.id === order.warehouseId)?.name || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {renderCargoTypeBadge(order.cargoType)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.salePrice.toFixed(2)} ₽</span>
                              {order.price !== order.salePrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {order.price.toFixed(2)} ₽
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="supplies">
          <Card className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Раздел в разработке</h3>
            <p className="text-muted-foreground">
              Здесь будет отображаться информация о созданных поставках
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoAssembly;
