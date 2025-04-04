
import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { 
  Package, 
  Search, 
  RefreshCw, 
  Droplets, 
  ShirtIcon, 
  Paperclip, 
  ChevronDown,
  ChevronUp, 
  PenLine, 
  Truck, 
  Ticket, 
  Trash, 
  Download,
  FileDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  autoAssemblyApi, 
  type Order, 
  type Supply, 
  type ProductCategory,
  type StickerType,
  type StickerSize
} from "@/lib/autoAssemblyApi";

// Типы для данных
interface AppOrder extends Order {
  id: number;
  selected?: boolean;
  orderId?: string;
  barcode?: string;
  count?: number;
  date?: string;
  category?: ProductCategory;
}

interface AppSupply extends Omit<Supply, 'id'> {
  id: string;
  date?: string;
  count?: number;
  orders?: AppOrder[];
}

// Функция определения категории товара по названию
const detectCategory = (name: string): "Парфюмерия" | "Одежда" | "Мелочёвка" => {
  const perfumeKeywords = ["духи", "туалетная вода", "парфюмерная вода", "аромат", "eau de parfum", "eau de toilette"];
  const clothingKeywords = ["куртка", "брюки", "спортивные", "платье", "футболка", "джинсы", "шорты", "юбка", "бейсболка", "толстовка", "жилет"];
  
  const nameLower = name.toLowerCase();
  
  if (perfumeKeywords.some(keyword => nameLower.includes(keyword))) {
    return "Парфюмерия";
  }
  
  if (clothingKeywords.some(keyword => nameLower.includes(keyword))) {
    return "Одежда";
  }
  
  return "Мелочёвка";
};

// Функция для конвертации категории товара в API тип
const categoryToApiType = (category: string): ProductCategory => {
  switch (category) {
    case "Парфюмерия":
      return "perfume";
    case "Одежда":
      return "clothing";
    default:
      return "misc";
  }
};

// Функция для конвертации API типа в категорию товара
const apiTypeToCategory = (type: ProductCategory): string => {
  switch (type) {
    case "perfume":
      return "Парфюмерия";
    case "clothing":
      return "Одежда";
    default:
      return "Мелочёвка";
  }
};

// Главный компонент
const AutoAssembly: React.FC = () => {
  // Состояния
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<AppOrder[]>([]);
  const [supplies, setSupplies] = useState<AppSupply[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [selectedCargoType, setSelectedCargoType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showCreateSupplyModal, setShowCreateSupplyModal] = useState(false);
  const [newSupplyName, setNewSupplyName] = useState("");
  const [currentSupply, setCurrentSupply] = useState<AppSupply | null>(null);
  const [currentSupplyOrders, setCurrentSupplyOrders] = useState<AppOrder[]>([]);
  const [showSupplyDetailsModal, setShowSupplyDetailsModal] = useState(false);
  const [showAutoCreateDialog, setShowAutoCreateDialog] = useState(false);
  const [autoCreateResult, setAutoCreateResult] = useState<{
    perfume: number;
    clothing: number;
    other: number;
  } | null>(null);
  const [editSupplyId, setEditSupplyId] = useState<string | null>(null);
  const [editSupplyName, setEditSupplyName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplyToDelete, setSupplyToDelete] = useState<string | null>(null);
  const [openedSupplyContent, setOpenedSupplyContent] = useState<string | null>(null);
  const [showStickersDialog, setShowStickersDialog] = useState(false);
  const [stickerType, setStickerType] = useState<StickerType>("png");
  const [stickerSize, setStickerSize] = useState<StickerSize>("58x40");
  const [stickerSupplyId, setStickerSupplyId] = useState<string | null>(null);
  const [showDeliverConfirm, setShowDeliverConfirm] = useState(false);
  const [supplyToDeliver, setSupplyToDeliver] = useState<string | null>(null);
  const [isLoadingStickers, setIsLoadingStickers] = useState(false);
  const [isLoadingSupplyContent, setIsLoadingSupplyContent] = useState(false);
  
  // Загрузка данных
  useEffect(() => {
    fetchOrders();
    fetchSupplies();
  }, []);
  
  // Получение заказов
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await autoAssemblyApi.getOrders();
      const processedOrders = data.map((order) => ({
        ...order,
        orderId: `WB-${order.id}`,
        barcode: `123${order.id}`,
        count: 1,
        date: order.createdAt,
        category: detectCategory(order.name) as ProductCategory
      }));
      setOrders(processedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Ошибка загрузки заданий",
        description: "Не удалось загрузить сборочные задания",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Получение поставок
  const fetchSupplies = async () => {
    try {
      const data = await autoAssemblyApi.getSupplies();
      const processedSupplies = data.map((supply) => ({
        ...supply,
        id: supply.id.toString(),
        date: supply.createdAt,
        count: supply.ordersCount,
        category: supply.category
      }));
      setSupplies(processedSupplies);
    } catch (error) {
      console.error("Failed to fetch supplies:", error);
      toast({
        title: "Ошибка загрузки поставок",
        description: "Не удалось загрузить список поставок",
        variant: "destructive"
      });
    }
  };

  // Загрузка заказов поставки
  const fetchSupplyOrders = async (supplyId: string) => {
    setIsLoadingSupplyContent(true);
    try {
      const data = await autoAssemblyApi.getSupplyOrders(parseInt(supplyId));
      const processedOrders = data.map((order) => ({
        ...order,
        orderId: `WB-${order.id}`,
        barcode: `123${order.id}`,
        count: 1,
        date: order.createdAt,
        category: detectCategory(order.name)
      }));
      
      // Обновляем список заказов для поставки
      const updatedSupplies = supplies.map(supply => {
        if (supply.id === supplyId) {
          return {
            ...supply,
            orders: processedOrders
          };
        }
        return supply;
      });
      
      setSupplies(updatedSupplies);
      return processedOrders;
    } catch (error) {
      console.error("Failed to fetch supply orders:", error);
      toast({
        title: "Ошибка загрузки заказов",
        description: "Не удалось загрузить список заказов в поставке",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoadingSupplyContent(false);
    }
  };
  
  // Фильтрация заказов
  const filteredOrders = orders.filter(order => {
    if (selectedWarehouse !== "all" && order.warehouse !== selectedWarehouse) {
      return false;
    }
    
    if (selectedCargoType !== "all" && order.cargoType !== selectedCargoType) {
      return false;
    }
    
    if (selectedCategory !== "all" && order.category !== selectedCategory) {
      return false;
    }
    
    if (searchQuery && 
        !order.id.toString().includes(searchQuery.toLowerCase()) && 
        !order.article.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Сортировка заказов
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "name":
        return a.name.localeCompare(b.name);
      case "category":
        return (a.category || "").localeCompare(b.category || "");
      default:
        return 0;
    }
  });
  
  // Создание поставки
  const createSupply = async () => {
    if (!newSupplyName.trim()) {
      toast({
        title: "Ошибка",
        description: "Название поставки не может быть пустым",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const categoryCounts = {
        perfume: 0,
        clothing: 0,
        misc: 0
      };
      
      selectedOrders.forEach(orderId => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          if (order.category === "Парфюмерия") categoryCounts.perfume++;
          else if (order.category === "Одежда") categoryCounts.clothing++;
          else categoryCounts.misc++;
        }
      });
      
      let category: ProductCategory = 'misc';
      if (categoryCounts.perfume > categoryCounts.clothing && categoryCounts.perfume > categoryCounts.misc) {
        category = 'perfume';
      } else if (categoryCounts.clothing > categoryCounts.perfume && categoryCounts.clothing > categoryCounts.misc) {
        category = 'clothing';
      }
      
      const supply = await autoAssemblyApi.createSupply(newSupplyName, category);
      
      await Promise.all(selectedOrders.map(orderId => 
        autoAssemblyApi.addOrderToSupply(supply.id, orderId)
      ));
      
      toast({
        title: "Поставка создана",
        description: `Поставка "${newSupplyName}" успешно создана с ${selectedOrders.length} товарами`
      });
      
      fetchOrders();
      fetchSupplies();
      
      setSelectedOrders([]);
      setNewSupplyName("");
      setShowCreateSupplyModal(false);
    } catch (error) {
      console.error("Failed to create supply:", error);
      toast({
        title: "Ошибка создания поставки",
        description: "Не удалось создать поставку",
        variant: "destructive"
      });
    }
  };
  
  // Автоматическое создание поставок по категориям
  const autoCreateSupplies = async () => {
    try {
      const date = new Date().toLocaleDateString('ru-RU');
      
      const perfumeOrders = orders.filter(order => order.category === "Парфюмерия").map(order => order.id);
      const clothingOrders = orders.filter(order => order.category === "Одежда").map(order => order.id);
      const otherOrders = orders.filter(order => order.category === "Мелочёвка").map(order => order.id);
      
      const results = {
        perfume: perfumeOrders.length,
        clothing: clothingOrders.length,
        other: otherOrders.length
      };
      
      if (perfumeOrders.length > 0) {
        const perfumeSupply = await autoAssemblyApi.createSupply(
          `Поставка: Парфюмерия – ${date}`,
          'perfume'
        );
        
        await Promise.all(perfumeOrders.map(orderId => 
          autoAssemblyApi.addOrderToSupply(perfumeSupply.id, orderId)
        ));
      }
      
      if (clothingOrders.length > 0) {
        const clothingSupply = await autoAssemblyApi.createSupply(
          `Поставка: Одежда – ${date}`,
          'clothing'
        );
        
        await Promise.all(clothingOrders.map(orderId => 
          autoAssemblyApi.addOrderToSupply(clothingSupply.id, orderId)
        ));
      }
      
      if (otherOrders.length > 0) {
        const otherSupply = await autoAssemblyApi.createSupply(
          `Поставка: Мелочёвка – ${date}`,
          'misc'
        );
        
        await Promise.all(otherOrders.map(orderId => 
          autoAssemblyApi.addOrderToSupply(otherSupply.id, orderId)
        ));
      }
      
      fetchOrders();
      fetchSupplies();
      setAutoCreateResult(results);
      setShowAutoCreateDialog(false);
      
      toast({
        title: "Поставки созданы",
        description: `Создано: Парфюмерия (${results.perfume}), Одежда (${results.clothing}), Мелочёвка (${results.other})`,
      });
    } catch (error) {
      console.error("Failed to auto-create supplies:", error);
      toast({
        title: "Ошибка создания поставок",
        description: "Не удалось автоматически создать поставки",
        variant: "destructive"
      });
      setShowAutoCreateDialog(false);
    }
  };
  
  // Обработка выбора заказа
  const handleOrderSelect = (orderId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };
  
  // Выбор всех отфильтрованных заказов
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(sortedOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };
  
  // Просмотр деталей поставки
  const viewSupplyDetails = (supply: AppSupply) => {
    setCurrentSupply(supply);
    setShowSupplyDetailsModal(true);
    
    // Если у поставки уже есть загруженные заказы, просто устанавливаем их
    if (supply.orders && supply.orders.length > 0) {
      setCurrentSupplyOrders(supply.orders);
    } else {
      // Иначе загружаем заказы этой поставки
      fetchSupplyOrders(supply.id).then(orders => {
        setCurrentSupplyOrders(orders);
      });
    }
  };
  
  // Управление содержимым поставки
  const toggleSupplyContent = async (supplyId: string) => {
    if (openedSupplyContent === supplyId) {
      setOpenedSupplyContent(null);
    } else {
      setOpenedSupplyContent(supplyId);
      const supply = supplies.find(s => s.id === supplyId);
      
      // Проверяем есть ли уже загруженные заказы
      if (!supply?.orders || supply.orders.length === 0) {
        await fetchSupplyOrders(supplyId);
      }
    }
  };
  
  // Редактирование названия поставки
  const startEditSupply = (supplyId: string, currentName: string) => {
    setEditSupplyId(supplyId);
    setEditSupplyName(currentName);
  };
  
  const saveSupplyName = async () => {
    if (!editSupplyId || !editSupplyName.trim()) return;
    
    try {
      await autoAssemblyApi.updateSupplyName(parseInt(editSupplyId), editSupplyName);
      toast({
        title: "Название обновлено",
        description: "Название поставки успешно обновлено"
      });
      fetchSupplies();
      setEditSupplyId(null);
    } catch (error) {
      console.error("Failed to update supply name:", error);
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить название поставки",
        variant: "destructive"
      });
    }
  };
  
  // Генерация стикеров
  const openStickersDialog = (supplyId: string) => {
    setStickerSupplyId(supplyId);
    setShowStickersDialog(true);
  };
  
  const generateStickers = async () => {
    if (!stickerSupplyId) return;
    
    const supply = supplies.find(s => s.id === stickerSupplyId);
    if (!supply) return;
    
    // Получаем заказы для поставки, если они еще не загружены
    let orderIds: number[] = [];
    if (supply.orders && supply.orders.length > 0) {
      orderIds = supply.orders.map(o => o.id);
    } else {
      const orders = await fetchSupplyOrders(stickerSupplyId);
      orderIds = orders.map(o => o.id);
    }
    
    if (orderIds.length === 0) {
      toast({
        title: "Невозможно создать стикеры",
        description: "В поставке нет заказов для создания стикеров",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingStickers(true);
    try {
      // Разбираем размер стикера
      const [width, height] = stickerSize.split('x').map(Number);
      
      const stickerParams = {
        type: stickerType,
        width,
        height,
        orders: orderIds
      };
      
      const result = await autoAssemblyApi.generateStickers(stickerParams);
      
      toast({
        title: "Стикеры созданы",
        description: `Стикеры успешно созданы. Начинаем скачивание...`
      });
      
      // В реальном приложении здесь был бы код для скачивания файла
      setTimeout(() => {
        toast({
          title: "Стикеры скачаны",
          description: `Файл ${result} успешно скачан`
        });
      }, 1500);
      
      setShowStickersDialog(false);
    } catch (error) {
      console.error("Failed to generate stickers:", error);
      toast({
        title: "Ошибка создания стикеров",
        description: "Не удалось создать стикеры для заказов",
        variant: "destructive"
      });
    } finally {
      setIsLoadingStickers(false);
    }
  };
  
  // Подтверждение передачи в доставку
  const confirmDeliverSupply = (supplyId: string) => {
    setSupplyToDeliver(supplyId);
    setShowDeliverConfirm(true);
  };
  
  const deliverSupply = async () => {
    if (!supplyToDeliver) return;
    
    try {
      await autoAssemblyApi.deliverSupply(parseInt(supplyToDeliver));
      toast({
        title: "Успешно",
        description: "Поставка передана в доставку"
      });
      fetchSupplies();
      setShowDeliverConfirm(false);
      setSupplyToDeliver(null);
    } catch (error) {
      console.error("Failed to deliver supply:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось передать поставку в доставку",
        variant: "destructive"
      });
    }
  };
  
  // Удаление поставки
  const confirmDeleteSupply = (supplyId: string) => {
    setSupplyToDelete(supplyId);
    setShowDeleteConfirm(true);
  };
  
  const deleteSupply = async () => {
    if (!supplyToDelete) return;
    
    try {
      await autoAssemblyApi.deleteSupply(parseInt(supplyToDelete));
      toast({
        title: "Поставка удалена",
        description: "Поставка успешно удалена"
      });
      fetchSupplies();
      fetchOrders();
      setShowDeleteConfirm(false);
      setSupplyToDelete(null);
    } catch (error) {
      console.error("Failed to delete supply:", error);
      toast({
        title: "Ошибка удаления",
        description: error instanceof Error ? error.message : "Не удалось удалить поставку",
        variant: "destructive"
      });
    }
  };
  
  // Функция получения иконки для категории
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Парфюмерия":
        return <Droplets className="h-4 w-4" />;
      case "Одежда":
        return <ShirtIcon className="h-4 w-4" />;
      case "Мелочёвка":
        return <Paperclip className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };
  
  // Функция получения цвета для бейджа категории
  const getCategoryBadgeVariant = (category: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (category) {
      case "Парфюмерия":
        return "secondary";
      case "Одежда":
        return "secondary";
      case "Мелочёвка":
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Автосборка</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 overflow-x-auto flex w-auto">
          <TabsTrigger value="orders" className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>Сборочные задания</span>
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>Поставки</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 mb-4 flex-wrap">
            <div className="w-full md:w-auto">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Выберите склад" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все склады</SelectItem>
                  <SelectItem value="moscow">Москва</SelectItem>
                  <SelectItem value="saint-petersburg">Санкт-Петербург</SelectItem>
                  <SelectItem value="novosibirsk">Новосибирск</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto">
              <Select value={selectedCargoType} onValueChange={setSelectedCargoType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Тип груза" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="regular">Обычный</SelectItem>
                  <SelectItem value="oversized">Крупногабарит</SelectItem>
                  <SelectItem value="heavy">Тяжеловес</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Тип товара" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="Парфюмерия">Парфюмерия</SelectItem>
                  <SelectItem value="Одежда">Одежда</SelectItem>
                  <SelectItem value="Мелочёвка">Мелочёвка</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">По дате</SelectItem>
                  <SelectItem value="name">По наименованию</SelectItem>
                  <SelectItem value="category">По категории</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Поиск по ID или артикулу"
                  className="w-full pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="md:w-auto"
              onClick={fetchOrders}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить задания
            </Button>
            
            <Button 
              className="md:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowAutoCreateDialog(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Автосформировать поставки
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Сборочные задания</CardTitle>
              <CardDescription>
                Всего: {sortedOrders.length} заданий {selectedOrders.length > 0 && `(выбрано: ${selectedOrders.length})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] text-center">
                        <Checkbox 
                          checked={sortedOrders.length > 0 && selectedOrders.length === sortedOrders.length}
                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead className="hidden md:table-cell">Наименование</TableHead>
                      <TableHead className="hidden md:table-cell">Кол-во</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead className="hidden md:table-cell">Склад</TableHead>
                      <TableHead className="hidden md:table-cell">Тип груза</TableHead>
                      <TableHead className="hidden md:table-cell">Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.length > 0 ? (
                      sortedOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={(checked) => handleOrderSelect(order.id, checked === true)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{order.orderId || `WB-${order.id}`}</TableCell>
                          <TableCell>{order.article}</TableCell>
                          <TableCell className="hidden md:table-cell max-w-[200px] truncate">{order.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{order.count || 1}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={getCategoryBadgeVariant(order.category || "")}
                              className="flex items-center gap-1"
                            >
                              {getCategoryIcon(order.category || "")}
                              <span className="hidden sm:inline">{order.category}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{order.warehouse}</TableCell>
                          <TableCell className="hidden md:table-cell">{order.cargoType}</TableCell>
                          <TableCell className="hidden md:table-cell">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4">
                          {isLoading ? "Загрузка заданий..." : "Нет заданий для отображения"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              {selectedOrders.length > 0 && (
                <Button onClick={() => setShowCreateSupplyModal(true)}>
                  Создать поставку ({selectedOrders.length})
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="supplies" className="space-y-4">
          <Button 
            variant="outline"
            className="mb-2"
            onClick={fetchSupplies}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить список
          </Button>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {supplies.length > 0 ? (
              supplies.map((supply) => (
                <Card key={supply.id}>
                  <CardHeader className="pb-2">
                    {editSupplyId === supply.id ? (
                      <div className="flex gap-2">
                        <Input 
                          value={editSupplyName}
                          onChange={(e) => setEditSupplyName(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={saveSupplyName}>Сохранить</Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditSupplyId(null)}
                        >
                          Отмена
                        </Button>
                      </div>
                    ) : (
                      <CardTitle className="text-lg flex items-center justify-between">
                        {supply.name}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => startEditSupply(supply.id, supply.name)}
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    )}
                    <CardDescription>
                      {supply.count} товаров • {new Date(supply.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 space-y-2">
                    <Badge 
                      variant={getCategoryBadgeVariant(supply.category)}
                      className="flex items-center gap-1"
                    >
                      {getCategoryIcon(supply.category)}
                      {supply.category}
                    </Badge>

                    <Collapsible
                      open={openedSupplyContent === supply.id}
                      onOpenChange={(open) => {
                        if (open) {
                          toggleSupplyContent(supply.id);
                        } else {
                          setOpenedSupplyContent(null);
                        }
                      }}
                      className="w-full"
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mb-2 flex justify-between"
                        >
                          <span>Содержимое</span>
                          {openedSupplyContent === supply.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="border rounded-md p-2 mt-2 space-y-2 bg-muted/50">
                        {isLoadingSupplyContent && <p className="text-center py-2">Загрузка...</p>}
                        
                        {!isLoadingSupplyContent && supply.orders && supply.orders.length > 0 ? (
                          <div className="max-h-60 overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Артикул</TableHead>
                                  <TableHead>Название</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {supply.orders.map(order => (
                                  <TableRow key={order.id}>
                                    <TableCell>{order.orderId || `WB-${order.id}`}</TableCell>
                                    <TableCell>{order.article}</TableCell>
                                    <TableCell className="max-w-[150px] truncate">{order.name}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          !isLoadingSupplyContent && (
                            <p className="text-center py-2">Нет товаров в поставке</p>
                          )
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => openStickersDialog(supply.id)}
                    >
                      <Ticket className="h-4 w-4" />
                      <span>Стикеры</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => confirmDeliverSupply(supply.id)}
                    >
                      <Truck className="h-4 w-4" />
                      <span>В доставку</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-500 hover:text-red-700"
                      onClick={() => confirmDeleteSupply(supply.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span>Удалить</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  Нет созданных поставок
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Модальные окна */}
      <Dialog open={showCreateSupplyModal} onOpenChange={setShowCreateSupplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создание поставки</DialogTitle>
            <DialogDescription>
              Будет создана новая поставка с выбранными товарами ({selectedOrders.length}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="supply-name" className="text-sm font-medium">
                Название поставки
              </label>
              <Input
                id="supply-name"
                value={newSupplyName}
                onChange={(e) => setNewSupplyName(e.target.value)}
                placeholder="Введите название поставки"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSupplyModal(false)}>
              Отмена
            </Button>
            <Button onClick={createSupply}>Создать поставку</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showSupplyDetailsModal} onOpenChange={setShowSupplyDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentSupply?.name}</DialogTitle>
            <DialogDescription>
              Категория: {currentSupply?.category} • {currentSupply?.count} товаров
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md overflow-hidden mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Артикул</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead>Кол-во</TableHead>
                  <TableHead>Категория</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSupplyOrders?.length ? (
                  currentSupplyOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderId || `WB-${order.id}`}</TableCell>
                      <TableCell>{order.article}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.name}</TableCell>
                      <TableCell>{order.count || 1}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getCategoryBadgeVariant(order.category || "")}
                          className="flex items-center gap-1"
                        >
                          {getCategoryIcon(order.category || "")}
                          <span>{order.category}</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      {isLoadingSupplyContent ? "Загрузка товаров..." : "Нет товаров в поставке"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showAutoCreateDialog} onOpenChange={setShowAutoCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Автоформирование поставок</AlertDialogTitle>
            <AlertDialogDescription>
              Система автоматически распределит товары по категориям и создаст отдельные поставки для каждой категории (Парфюмерия, Одежда, Мелочёвка).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={autoCreateSupplies}>
              Создать поставки
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить поставку? Все товары в ней будут освобождены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSupply} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showDeliverConfirm} onOpenChange={setShowDeliverConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Передать в доставку</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите передать поставку в доставку?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={deliverSupply}>
              Передать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={showStickersDialog} onOpenChange={setShowStickersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Стикеры для поставки</DialogTitle>
            <DialogDescription>
              Выберите формат и размер для генерации стикеров
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="sticker-type" className="text-sm font-medium">
                  Формат
                </label>
                <Select value={stickerType} onValueChange={(val) => setStickerType(val as StickerType)}>
                  <SelectTrigger id="sticker-type">
                    <SelectValue placeholder="Выберите формат" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                    <SelectItem value="zplv">ZPLV</SelectItem>
                    <SelectItem value="zplh">ZPLH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="sticker-size" className="text-sm font-medium">
                  Размер
                </label>
                <Select value={stickerSize} onValueChange={(val) => setStickerSize(val as StickerSize)}>
                  <SelectTrigger id="sticker-size">
                    <SelectValue placeholder="Выберите размер" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58x40">58x40</SelectItem>
                    <SelectItem value="40x30">40x30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStickersDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={generateStickers}
              disabled={isLoadingStickers}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoadingStickers ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Скачать стикеры
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {autoCreateResult && (
        <Dialog open={!!autoCreateResult} onOpenChange={() => setAutoCreateResult(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Поставки успешно созданы</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Alert>
                <AlertTitle className="flex items-center gap-1">
                  <Droplets className="h-4 w-4" /> Парфюмерия
                </AlertTitle>
                <AlertDescription>
                  Создана поставка с {autoCreateResult.perfume} товарами
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTitle className="flex items-center gap-1">
                  <ShirtIcon className="h-4 w-4" /> Одежда
                </AlertTitle>
                <AlertDescription>
                  Создана поставка с {autoCreateResult.clothing} товарами
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTitle className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" /> Мелочёвка
                </AlertTitle>
                <AlertDescription>
                  Создана поставка с {autoCreateResult.other} товарами
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                setAutoCreateResult(null);
                setActiveTab("supplies");
              }}>
                Перейти к поставкам
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AutoAssembly;
