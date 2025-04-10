import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Truck, Package2, Filter } from "lucide-react";
import { toast } from "sonner";
import { addAuthHeaders } from "@/lib/securityUtils";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { determineCategory, shouldShowSize, formatSize } from "@/lib/utils/categoryUtils";
import { ProductCategory, AssemblyOrder, SortConfig, WarehouseFilter, CargoTypeFilter } from "@/types/wb";
import OrdersTable from "@/components/autoAssembly/OrdersTable";
import CollapsibleFilters from "@/components/autoAssembly/CollapsibleFilters";

const AutoAssembly = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [selectedTab, setSelectedTab] = useState("orders");
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [supplies, setSupplies] = useState<{id: number, name: string}[]>([]);
  const [processingAction, setProcessingAction] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc'
  });
  
  const [filters, setFilters] = useState<{
    warehouseId: WarehouseFilter | null,
    productCategory: ProductCategory | null,
    cargoType: CargoTypeFilter | null,
    dateFrom: Date | null,
    dateTo: Date | null,
    searchQuery: string
  }>({
    warehouseId: null,
    productCategory: null,
    cargoType: null,
    dateFrom: null,
    dateTo: null,
    searchQuery: ''
  });
  
  const warehouseOptions: WarehouseFilter[] = [
    { id: 1, name: "Коледино" },
    { id: 2, name: "Подольск" },
    { id: 3, name: "Казань" },
    { id: 4, name: "Электросталь" }
  ];
  
  const cargoTypeOptions: CargoTypeFilter[] = [
    { id: 1, name: "Короб" },
    { id: 2, name: "Пакет" }
  ];
  
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.warehouseId) count++;
    if (filters.productCategory) count++;
    if (filters.cargoType) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);
  
  const resetAllFilters = () => {
    setFilters({
      warehouseId: null,
      productCategory: null,
      cargoType: null,
      dateFrom: null,
      dateTo: null,
      searchQuery: ''
    });
  };
  
  const updateFilters = (newFilterState: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilterState }));
  };

  useEffect(() => {
    loadAssemblyOrders();
    loadSupplies();
  }, []);

  const loadSupplies = async () => {
    try {
      const suppliesResponse = await axios.get("https://marketplace-api.wildberries.ru/api/v3/supplies", {
        headers: addAuthHeaders(),
        params: { limit: 100 }
      });
      
      console.log("Полученные поставки:", suppliesResponse.data);
      
      let suppliesData = [];
      
      if (Array.isArray(suppliesResponse.data)) {
        suppliesData = suppliesResponse.data.map(supply => ({
          id: supply.id,
          name: supply.name || `Поставка #${supply.id}`
        }));
      } else if (suppliesResponse.data && Array.isArray(suppliesResponse.data.supplies)) {
        suppliesData = suppliesResponse.data.supplies.map(supply => ({
          id: supply.id,
          name: supply.name || `Поставка #${supply.id}`
        }));
      }
      
      setSupplies(suppliesData);
    } catch (error) {
      console.error("Ошибка при загрузке поставок:", error);
    }
  };

  const loadAssemblyOrders = async () => {
    setLoading(true);
    try {
      const ordersResponse = await axios.get("https://marketplace-api.wildberries.ru/api/v3/orders/new", {
        headers: addAuthHeaders()
      });
      
      console.log("Получены заказы:", ordersResponse.data);
      
      let ordersData = [];
      
      if (Array.isArray(ordersResponse.data)) {
        ordersData = ordersResponse.data;
      } else if (ordersResponse.data && Array.isArray(ordersResponse.data.orders)) {
        ordersData = ordersResponse.data.orders;
      } else {
        console.error("Неизвестный формат ответа API заказов:", ordersResponse.data);
        toast.error("API вернуло неожиданный формат данных для заказов");
        setLoading(false);
        return;
      }
      
      const nmIdsSet = new Set<number>();
      
      for (const order of ordersData) {
        if (order.nmId) {
          nmIdsSet.add(order.nmId);
        } else if (order.skus && Array.isArray(order.skus)) {
          order.skus.forEach((sku: any) => {
            if (sku.nmId) {
              nmIdsSet.add(sku.nmId);
            }
          });
        }
      }
      
      const uniqueNmIds = Array.from(nmIdsSet);
      console.log("Собраны уникальные nmId:", uniqueNmIds);
      
      if (uniqueNmIds.length === 0) {
        setOrders([]);
        toast.warning("Не найдено товаров в заказах");
        setLoading(false);
        return;
      }
      
      const nmIdChunks = [];
      for (let i = 0; i < uniqueNmIds.length; i += 100) {
        nmIdChunks.push(uniqueNmIds.slice(i, i + 100));
      }
      
      const productInfoMap: Record<number, ProductInfo> = {};
      
      for (const chunk of nmIdChunks) {
        try {
          const cardsResponse = await axios.post("https://content-api.wildberries.ru/content/v2/get/cards/list", {
            settings: {
              cursor: {
                limit: 100
              },
              filter: {
                nmID: chunk
              }
            }
          }, {
            headers: addAuthHeaders()
          });
          
          console.log("Получены карточки товаров:", cardsResponse.data);
          
          if (cardsResponse.data && cardsResponse.data.data && Array.isArray(cardsResponse.data.data.cards)) {
            for (const card of cardsResponse.data.data.cards) {
              const category = determineCategory(card.subjectName, card.name);
              let size = undefined;
              if (category === ProductCategory.CLOTHING && card.sizes && card.sizes.length > 0) {
                size = card.sizes[0].name || card.sizes[0].value;
              }
              
              productInfoMap[card.nmID] = {
                nmId: card.nmID,
                article: card.article || card.vendorCode || "Нет артикула",
                subjectName: card.subjectName || "Нет категории",
                photo: card.photos && card.photos.length > 0 ? card.photos[0].big : "https://via.placeholder.com/150",
                name: card.name,
                brand: card.brand,
                category,
                size
              };
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Ошибка при запросе карточек товаров:", error);
          toast.error("Не удалось получить информацию о товарах");
        }
      }
      
      console.log("Создана карта товаров:", productInfoMap);
      
      const assemblyOrders: AssemblyOrder[] = [];
      
      for (const order of ordersData) {
        const products: ProductInfo[] = [];
        
        if (order.nmId && productInfoMap[order.nmId]) {
          products.push(productInfoMap[order.nmId]);
        } else if (order.skus && Array.isArray(order.skus)) {
          for (const sku of order.skus) {
            if (sku.nmId && productInfoMap[sku.nmId]) {
              products.push(productInfoMap[sku.nmId]);
            }
          }
        }
        
        assemblyOrders.push({
          orderId: order.orderId || order.id,
          orderUid: order.orderUid || order.rid || `${order.orderId}`,
          createdAt: order.createdAt || new Date().toISOString(),
          products,
          status: order.status || "new",
          address: order.address?.addressString,
          customerName: order.user?.fio || "Клиент"
        });
      }
      
      setOrders(assemblyOrders);
      toast.success(`Загружено ${assemblyOrders.length} заказов`);
      
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      toast.error("Не удалось загрузить сборочные задания");
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const handlePrintStickers = async () => {
    if (selectedOrders.length === 0) return;
    
    setProcessingAction(true);
    try {
      const orderIds = Array.from(selectedOrders);
      const response = await axios.post("https://marketplace-api.wildberries.ru/api/v3/orders/stickers", 
        {
          orders: orderIds,
          type: "pdf"
        }, 
        {
          headers: addAuthHeaders(),
          responseType: 'blob'
        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Стикеры_${new Date().toLocaleDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Стикеры успешно созданы и загружены");
    } catch (error) {
      console.error("Ошибка при создании стикеров:", error);
      toast.error("Не удалось создать и загрузить стикеры");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCreateSupply = async () => {
    if (selectedOrders.length === 0) return;
    
    setProcessingAction(true);
    try {
      const currentDate = new Date().toLocaleDateString('ru-RU');
      const response = await axios.post("https://marketplace-api.wildberries.ru/api/v3/supplies", 
        { name: `Автосборка ${currentDate}` }, 
        { headers: addAuthHeaders() }
      );
      
      if (!response.data || !response.data.id) {
        throw new Error("API не вернуло ID поставки");
      }
      
      const supplyId = response.data.id;
      console.log("Создана поставка с ID:", supplyId);
      
      let successCount = 0;
      for (const orderId of selectedOrders) {
        try {
          await axios.patch(
            `https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders/${orderId}`, 
            {}, 
            { headers: addAuthHeaders() }
          );
          successCount++;
        } catch (err) {
          console.error(`Ошибка при добавлении заказа ${orderId} в поставку:`, err);
        }
      }
      
      loadSupplies();
      
      if (successCount > 0) {
        loadAssemblyOrders();
        toast.success(`${successCount} из ${selectedOrders.length} заказов успешно добавлены в поставку`);
      } else {
        toast.error("Не удалось добавить заказы в поставку");
      }
      
    } catch (error) {
      console.error("Ошибка при создании поставки:", error);
      toast.error("Не удалось создать поставку");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSort = (key: keyof AssemblyOrder) => {
    setSortConfig(config => ({
      key,
      direction: config.key === key && config.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        if (filters.warehouseId && order.warehouseId !== filters.warehouseId.id) {
          return false;
        }
        
        if (filters.productCategory && order.category !== filters.productCategory) {
          return false;
        }
        
        if (filters.cargoType && order.cargoType !== filters.cargoType.id) {
          return false;
        }
        
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          const searchIn = [
            order.productName,
            order.supplierArticle,
            order.id.toString(),
            order.nmId?.toString(),
            order.productInfo?.brand,
            order.productInfo?.name
          ].filter(Boolean).join(' ').toLowerCase();
          
          if (!searchIn.includes(query)) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        const key = sortConfig.key || 'createdAt';
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        
        if (!a[key] && !b[key]) return 0;
        if (!a[key]) return 1;
        if (!b[key]) return -1;
        
        if (typeof a[key] === 'number' && typeof b[key] === 'number') {
          return (a[key] as number - (b[key] as number)) * direction;
        }
        
        if (typeof a[key] === 'string' && typeof b[key] === 'string') {
          return (a[key] as string).localeCompare(b[key] as string) * direction;
        }
        
        if (a[key] instanceof Date && b[key] instanceof Date) {
          return ((a[key] as Date).getTime() - (b[key] as Date).getTime()) * direction;
        }
        
        return 0;
      });
  }, [orders, sortConfig, filters]);

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Автоматическая сборка</h1>
          <p className="text-muted-foreground">
            Формирование поставок на основе заказов и производство коробов
          </p>
        </div>
        <Button 
          onClick={loadAssemblyOrders} 
          variant="outline"
          disabled={loading}
          className="flex gap-2 items-center"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Обновить
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="orders" className="relative">
            Заказы
            {orders.length > 0 && (
              <Badge className="ml-2 bg-purple-600">{orders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="supplies">Поставки</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          <CollapsibleFilters
            warehouseOptions={warehouseOptions}
            cargoTypeOptions={cargoTypeOptions}
            onFilterChange={updateFilters}
            activeFiltersCount={activeFiltersCount}
            onResetFilters={resetAllFilters}
          />

          {selectedOrders.length > 0 && (
            <div className="p-4 flex flex-wrap items-center justify-between bg-muted/50 gap-2 rounded-lg mb-4">
              <span>Выбрано заказов: <strong>{selectedOrders.length}</strong></span>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={handlePrintStickers} disabled={processingAction}>
                  {processingAction ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Package2 className="mr-2 h-4 w-4" />
                  )}
                  Распечатать стикеры
                </Button>
                
                <Button onClick={handleCreateSupply} disabled={processingAction}>
                  {processingAction ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="mr-2 h-4 w-4" />
                  )}
                  Создать поставку
                </Button>
              </div>
            </div>
          )}
          
          {loading ? (
            <OrdersLoadingSkeleton />
          ) : orders.length > 0 ? (
            orders.map(order => (
              <OrderCard 
                key={order.orderId} 
                order={order}
                selected={order.selected}
                onSelect={() => toggleOrderSelection(order.orderId)}
              />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Нет заказов для отображения</p>
                  <Button 
                    onClick={loadAssemblyOrders}
                    variant="outline" 
                    className="mt-4"
                  >
                    Загрузить заказы
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="supplies">
          <Card>
            <CardHeader>
              <CardTitle>Поставки</CardTitle>
              <CardDescription>
                Управление поставками и формирование новых
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplies.length > 0 ? (
                <div className="space-y-4">
                  {supplies.map(supply => (
                    <div key={supply.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{supply.name}</h3>
                        <p className="text-sm text-muted-foreground">ID поставки: {supply.id}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Управление
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  Нет активных поставок
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const OrderCard = ({ 
  order, 
  selected, 
  onSelect 
}: { 
  order: AssemblyOrder;
  selected?: boolean;
  onSelect: () => void;
}) => {
  const dateTime = new Date(order.createdAt).toLocaleString('ru-RU');
  
  return (
    <Card className={`${selected ? 'border-purple-500 shadow-purple-100 dark:shadow-purple-900/20' : ''} transition-all duration-200`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              Заказ №{order.orderUid}
              <Badge variant={order.status === "new" ? "default" : "outline"}>
                {order.status === "new" ? "Новый" : "В обработке"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Созда��: {dateTime}
            </CardDescription>
          </div>
          <Button 
            variant={selected ? "default" : "outline"} 
            size="sm"
            onClick={onSelect}
          >
            {selected ? "Выбрано" : "Выбрать"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {order.products.map((product) => (
            <div 
              key={product.nmId} 
              className="flex gap-4 items-center p-2 border rounded-md"
            >
              <div className="w-16 h-16 overflow-hidden rounded">
                {product.photo ? (
                  <img 
                    src={product.photo} 
                    alt={product.name || product.article} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/150";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-400">Нет фото</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{product.name || `Товар ${product.article}`}</h4>
                <p className="text-sm text-muted-foreground">Артикул: {product.article}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {product.subjectName || "Нет категории"}
                  </Badge>
                  {product.brand && (
                    <Badge variant="outline" className="text-xs">
                      {product.brand}
                    </Badge>
                  )}
                  {product.category === ProductCategory.CLOTHING && product.size && (
                    <Badge variant="secondary" className="text-xs">
                      Размер: {product.size}
                    </Badge>
                  )}
                  {product.category && (
                    <Badge className={`text-xs ${
                      product.category === ProductCategory.PERFUME ? 'bg-pink-500' : 
                      product.category === ProductCategory.CLOTHING ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {product.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {order.address && (
            <div className="mt-4 text-sm">
              <span className="font-medium">Адрес: </span>
              <span className="text-muted-foreground">{order.address}</span>
            </div>
          )}
          
          {order.customerName && (
            <div className="text-sm">
              <span className="font-medium">Получатель: </span>
              <span className="text-muted-foreground">{order.customerName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OrdersLoadingSkeleton = () => {
  return (
    <>
      {[1, 2, 3].map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
              <Skeleton className="h-9 w-36" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2].map((_, idx) => (
                <div key={idx} className="flex gap-4 items-center p-2 border rounded-md">
                  <Skeleton className="w-16 h-16 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-xs mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-4 w-64 mt-4" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default AutoAssembly;
