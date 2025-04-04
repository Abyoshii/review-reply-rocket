import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Box, Filter, Search, ArrowDownWideNarrow, CheckCheck, Loader2, RefreshCw, Droplets, Shirt, Paperclip, Edit, Download, Send, Trash2, Image } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AssemblyOrder, ProductCategory, WarehouseFilter, CargoTypeFilter, Supply } from "@/types/wb";
import { AutoAssemblyAPI, determineProductCategory, formatTimeAgo } from "@/lib/autoAssemblyApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logObjectStructure } from "@/lib/imageUtils";
const AutoAssembly = () => {
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
      setWarehouses([{
        id: 1,
        name: "Коледино"
      }, {
        id: 2,
        name: "Электросталь"
      }, {
        id: 3,
        name: "Санкт-Петербург"
      }, {
        id: 4,
        name: "Казань"
      }, {
        id: 5,
        name: "Краснодар"
      }]);
      setCargoTypes([{
        id: 0,
        name: "Обычный"
      }, {
        id: 1,
        name: "Крупногабаритный"
      }, {
        id: 2,
        name: "Тяжеловесный"
      }]);
      const suppliesList = await AutoAssemblyAPI.getSupplies();
      console.log("Loaded supplies:", suppliesList);
      setSupplies(suppliesList);
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
      result = result.filter(order => order.productName.toLowerCase().includes(searchLower) || order.orderUid.toLowerCase().includes(searchLower) || order.supplierArticle && order.supplierArticle.toLowerCase().includes(searchLower));
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
  const handleCancelOrder = async (orderId: number) => {
    try {
      const success = await AutoAssemblyAPI.cancelOrder(orderId);
      if (success) {
        setOrders(orders.filter(order => order.id !== orderId));
        setFilteredOrders(filteredOrders.filter(order => order.id !== orderId));
        toast.success(`Заказ ${orderId} успешно отменен`);
      }
    } catch (error) {
      console.error(`Ошибка при отмене заказа ${orderId}:`, error);
      toast.error(`Не удалось отменить заказ ${orderId}`);
    }
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatPrice = (price: number): string => {
    return (price / 100).toFixed(2);
  };
  const getCategoryDisplay = (category?: ProductCategory) => {
    switch (category) {
      case ProductCategory.PERFUME:
        return {
          icon: <Droplets className="h-4 w-4" />,
          badge: <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> {category}
                </Badge>
        };
      case ProductCategory.CLOTHING:
        return {
          icon: <Shirt className="h-4 w-4" />,
          badge: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1">
                  <Shirt className="h-3 w-3" /> {category}
                </Badge>
        };
      case ProductCategory.MISC:
      default:
        return {
          icon: <Paperclip className="h-4 w-4" />,
          badge: <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 flex items-center gap-1">
                  <Paperclip className="h-3 w-3" /> {category || "Мелочёвка"}
                </Badge>
        };
    }
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
  const filteredSupplies = useMemo(() => {
    return supplies;
  }, [supplies]);
  return <div className="container mx-auto py-6 max-w-7xl">
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
            {isAutoAssembling ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Формирование поставок...
              </> : <>
                <Package className="mr-2 h-4 w-4" />
                Автосформировать п��ставки
              </>}
          </Button>
        </div>
      </div>
      
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Поставки сформированы</DialogTitle>
            <DialogDescription>
              Автоматическое формирование поставок завершено
            </DialogDescription>
          </DialogHeader>
          
          {autoAssemblyResult && <div className="py-4 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Droplets className="text-purple-500 h-5 w-5 mr-2" />
                  <span className="font-medium">Парфюмерия:</span>
                  <span className="ml-2">{autoAssemblyResult.perfumeCount} товаров</span>
                  {autoAssemblyResult.perfumeSupplyId && <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Создана</Badge>}
                </div>
                
                <div className="flex items-center">
                  <Shirt className="text-green-500 h-5 w-5 mr-2" />
                  <span className="font-medium">Одежда:</span>
                  <span className="ml-2">{autoAssemblyResult.clothingCount} товаров</span>
                  {autoAssemblyResult.clothingSupplyId && <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Создана</Badge>}
                </div>
                
                <div className="flex items-center">
                  <Paperclip className="text-gray-500 h-5 w-5 mr-2" />
                  <span className="font-medium">Мелочёвка:</span>
                  <span className="ml-2">{autoAssemblyResult.miscCount} товаров</span>
                  {autoAssemblyResult.miscSupplyId && <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Создана</Badge>}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Поставки созданы и готовы к дальнейшей обработке. Вы можете просмотреть их на вкладке "Поставки".
              </p>
            </div>}
          
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>Закрыть</Button>
            <Button onClick={() => {
            setShowResultDialog(false);
            setActiveTab("supplies");
          }} variant="outline">
              Перейти к поставкам
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
                      {warehouses.map(warehouse => <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>)}
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
                      {cargoTypes.map(cargoType => <SelectItem key={cargoType.id} value={cargoType.id.toString()}>
                          {cargoType.name}
                        </SelectItem>)}
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
                    <Input id="search" placeholder="Артикул, номер заказа..." className="pl-8" value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setFilters({
                  warehouse: '',
                  cargoType: '',
                  search: '',
                  sortBy: 'createdAt',
                  sortDirection: 'desc',
                  category: ''
                })}>
                    Сбросить фильтры
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Найдено: {filteredOrders.length}
                  </span>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}>
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
                    {isLoading ? <div className="flex items-center justify-center py-4">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Загрузка сборочных заданий...
                      </div> : filteredOrders.length === 0 ? "Нет доступных сборочных заданий" : `Всего сборочных заданий: ${filteredOrders.length}`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox checked={selectedOrders.size > 0 && selectedOrders.size === filteredOrders.length} onCheckedChange={toggleSelectAll} />
                      </TableHead>
                      <TableHead>Задание</TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead className="w-[250px] ">Наименование</TableHead>
                      <TableHead className="hidden lg:table-cell">Создан</TableHead>
                      <TableHead className="hidden md:table-cell">Доставка до</TableHead>
                      <TableHead className="hidden lg:table-cell">Склад</TableHead>
                      <TableHead className="hidden md:table-cell">Категория</TableHead>
                      <TableHead className="hidden sm:table-cell">Тип груза</TableHead>
                      <TableHead>Цена</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Загрузка сборочных заданий...
                          </div>
                        </TableCell>
                      </TableRow> : filteredOrders.length === 0 ? <TableRow>
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
                      </TableRow> : filteredOrders.map(order => <TableRow key={order.id} className="cursor-pointer">
                          <TableCell>
                            <Checkbox checked={selectedOrders.has(order.id)} onCheckedChange={() => toggleOrderSelection(order.id)} />
                          </TableCell>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.supplierArticle || "-"}</TableCell>
                          <TableCell className="max-w-[250px]">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 rounded-md">
                                <AvatarImage src={order.productInfo?.image} alt={order.productName} className="object-contain" />
                                <AvatarFallback className="rounded-md bg-muted">
                                  <Image className="h-4 w-4 text-muted-foreground" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-left font-medium truncate max-w-[180px] cursor-default">
                                        {order.productInfo?.name || order.productName}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="font-medium">{order.productInfo?.name || order.productName}</p>
                                      {order.productInfo?.category && <p className="text-xs text-muted-foreground mt-1">
                                          Категория: {order.productInfo.category}
                                        </p>}
                                      {order.productInfo?.brand && <p className="text-xs text-muted-foreground">
                                          Бренд: {order.productInfo.brand}
                                        </p>}
                                      {order.supplierArticle && <p className="text-xs text-muted-foreground">
                                          Артикул: {order.supplierArticle}
                                        </p>}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {order.productInfo?.brand && <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                    {order.productInfo.brand}
                                  </span>}
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
                            {warehouses.find(w => w.id === order.warehouseId)?.name || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {getCategoryDisplay(order.category).badge}
                                </TooltipTrigger>
                                <TooltipContent>
                                  Автоматически определено по названию
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {renderCargoTypeBadge(order.cargoType)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{formatPrice(order.price)} ₽</span>
                              {order.price !== order.salePrice && <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(order.salePrice)} ₽
                                </span>}
                            </div>
                          </TableCell>
                        </TableRow>)}
                  </TableBody>
                </Table>
              </div>
              
              {selectedOrders.size > 0 && <div className="p-4 flex flex-wrap items-center justify-between bg-muted/50 gap-2">
                  <span>Выбрано заказов: <strong>{selectedOrders.size}</strong></span>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={handlePrintStickers} disabled={isProcessing}>
                      {isProcessing ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Подготовка стикеров...
                        </> : <>
                          <Download className="mr-2 h-4 w-4" />
                          Распечатать стикеры
                        </>}
                    </Button>
                    
                    <Button onClick={handleAssembleOrders} disabled={isProcessing}>
                      {isProcessing ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание поставки...
                        </> : <>
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Создать поставку из выбранных
                        </>}
                    </Button>
                  </div>
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="supplies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Поставки</CardTitle>
              <Button variant="outline" className="border-dashed" onClick={() => loadData()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Обновить список
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка поставок...
                </div> : filteredSupplies.length === 0 ? <div className="text-center py-12">
                  <div className="flex justify-center">
                    <Truck className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">Нет созданных поставок</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Создайте поставки вручную или используйте автоматическое формирование
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab("orders")}>
                    Перейти к сборочным заданиям
                  </Button>
                </div> : <div className="space-y-4">
                  {filteredSupplies.map(supply => <Card key={supply.id} className="overflow-hidden">
                      <div className="bg-muted/30 p-4 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <span className="text-lg font-medium">{supply.name}</span>
                            {supply.category && <Badge variant="outline" className="ml-2">
                                {supply.category}
                              </Badge>}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Создана: {formatDate(supply.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={supply.done ? "outline" : "secondary"} className={supply.done ? "bg-green-50 text-green-700 border-green-300" : ""}>
                            {supply.done ? "Завершена" : "В процессе"}
                          </Badge>
                          <Badge variant="outline">
                            {supply.ordersCount} заказов
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-4 pt-4">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">ID поставки: </span>
                            <span className="text-sm text-muted-foreground">{supply.supplyId}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Скачать документы
                            </Button>
                            <Button size="sm">
                              <Send className="mr-2 h-4 w-4" />
                              Отправить в доставку
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};
export default AutoAssembly;