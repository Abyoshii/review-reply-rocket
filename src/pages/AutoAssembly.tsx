
import React, { useState, useEffect } from 'react';
import { Check, Filter, Package, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  getOrders, 
  getSupplies, 
  createSupply, 
  addOrderToSupply,
  Supply,
  Order,
  ProductCategory
} from '@/lib/autoAssemblyApi';

interface Filters {
  warehouse: string;
  cargoType: string;
  search: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  category: string;
}

const AutoAssembly: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  
  // Update initial state of filters to use 'all' instead of empty string
  const [filters, setFilters] = useState<Filters>({
    warehouse: 'all',
    cargoType: 'all',
    search: '',
    sortBy: 'createdAt',
    sortDirection: 'desc',
    category: 'all'
  });

  // This function ensures we don't set an empty value to our filters object
  const handleFilterChange = (field: string, value: string) => {
    // If value is empty string, set it to a non-empty default value
    if (field === 'warehouse' || field === 'cargoType' || field === 'category') {
      setFilters(prev => ({
        ...prev,
        [field]: value === '' ? 'all' : value
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Fetch orders and supplies on component mount
  useEffect(() => {
    fetchOrders();
    fetchSupplies();
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список заданий",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch supplies
  const fetchSupplies = async () => {
    try {
      const data = await getSupplies();
      setSupplies(data);
    } catch (error) {
      console.error("Failed to fetch supplies:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список поставок",
        variant: "destructive",
      });
    }
  };

  // Handle order selection
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // Handle select all orders
  const toggleSelectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  // Auto-assemble supplies based on categories
  const autoAssembleSupplies = async () => {
    if (orders.length === 0) {
      toast({
        title: "Внимание",
        description: "Нет заданий для формирования поставок",
        variant: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      // Group orders by category
      const perfumeOrders = orders.filter(order => 
        /духи|туалетная вода|парфюмерная вода|аромат|eau de parfum|eau de toilette/i.test(order.name)
      );
      
      const clothingOrders = orders.filter(order => 
        /куртка|брюки|спортивные|платье|футболка|джинсы|шорты|юбка|бейсболка|толстовка|жилет/i.test(order.name)
      );
      
      // Everything else goes to misc
      const miscOrders = orders.filter(order => 
        !(/духи|туалетная вода|парфюмерная вода|аромат|eau de parfum|eau de toilette|куртка|брюки|спортивные|платье|футболка|джинсы|шорты|юбка|бейсболка|толстовка|жилет/i.test(order.name))
      );

      const date = new Date().toLocaleDateString('ru-RU');
      const createdSupplies = [];
      let totalOrdersAdded = 0;

      // Create perfume supply if there are perfume orders
      if (perfumeOrders.length > 0) {
        const supplyName = `Поставка: Парфюмерия – ${date}`;
        const newSupply = await createSupply(supplyName, 'perfume');
        
        for (const order of perfumeOrders) {
          await addOrderToSupply(newSupply.id, order.id);
        }
        
        createdSupplies.push({ category: 'perfume', count: perfumeOrders.length });
        totalOrdersAdded += perfumeOrders.length;
      }

      // Create clothing supply if there are clothing orders
      if (clothingOrders.length > 0) {
        const supplyName = `Поставка: Одежда – ${date}`;
        const newSupply = await createSupply(supplyName, 'clothing');
        
        for (const order of clothingOrders) {
          await addOrderToSupply(newSupply.id, order.id);
        }
        
        createdSupplies.push({ category: 'clothing', count: clothingOrders.length });
        totalOrdersAdded += clothingOrders.length;
      }

      // Create misc supply if there are misc orders
      if (miscOrders.length > 0) {
        const supplyName = `Поставка: Мелочёвка – ${date}`;
        const newSupply = await createSupply(supplyName, 'misc');
        
        for (const order of miscOrders) {
          await addOrderToSupply(newSupply.id, order.id);
        }
        
        createdSupplies.push({ category: 'misc', count: miscOrders.length });
        totalOrdersAdded += miscOrders.length;
      }

      // Refresh data
      await fetchSupplies();
      await fetchOrders();

      // Show success notification
      if (createdSupplies.length > 0) {
        const suppliesInfo = createdSupplies.map(s => {
          const categoryName = s.category === 'perfume' ? 'Парфюмерия' : s.category === 'clothing' ? 'Одежда' : 'Мелочёвка';
          return `${categoryName} (${s.count} товаров)`;
        }).join(', ');
        
        toast({
          title: "Поставки сформированы",
          description: `Создано ${createdSupplies.length} поставок: ${suppliesInfo}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Внимание",
          description: "Нет товаров для формирования поставок",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Failed to auto-assemble supplies:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сформировать поставки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on selected filters
  const filteredOrders = orders.filter(order => {
    // Filter by warehouse
    if (filters.warehouse !== 'all' && order.warehouse !== filters.warehouse) {
      return false;
    }
    
    // Filter by cargo type
    if (filters.cargoType !== 'all' && order.cargoType !== filters.cargoType) {
      return false;
    }
    
    // Filter by category
    if (filters.category !== 'all') {
      if (filters.category === 'perfume' && 
          !(/духи|туалетная вода|парфюмерная вода|аромат|eau de parfum|eau de toilette/i.test(order.name))) {
        return false;
      }
      if (filters.category === 'clothing' && 
          !(/куртка|брюки|спортивные|платье|футболка|джинсы|шорты|юбка|бейсболка|толстовка|жилет/i.test(order.name))) {
        return false;
      }
      if (filters.category === 'misc' && 
          (/духи|туалетная вода|парфюмерная вода|аромат|eau de parfum|eau de toilette|куртка|брюки|спортивные|платье|футболка|джинсы|шорты|юбка|бейсболка|толстовка|жилет/i.test(order.name))) {
        return false;
      }
    }
    
    // Filter by search
    if (filters.search && !order.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !order.id.toString().includes(filters.search) && 
        !order.article.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    const direction = filters.sortDirection === 'asc' ? 1 : -1;
    
    switch (filters.sortBy) {
      case 'name':
        return direction * a.name.localeCompare(b.name);
      case 'cargoType':
        return direction * a.cargoType.localeCompare(b.cargoType);
      case 'createdAt':
      default:
        return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  });

  // Get category badge variant
  const getCategoryBadgeVariant = (category: ProductCategory) => {
    switch (category) {
      case 'perfume':
        return 'purple';
      case 'clothing':
        return 'green';
      case 'misc':
      default:
        return 'secondary';
    }
  };

  // Get category display name
  const getCategoryName = (category: ProductCategory) => {
    switch (category) {
      case 'perfume':
        return 'Парфюмерия';
      case 'clothing':
        return 'Одежда';
      case 'misc':
      default:
        return 'Мелочёвка';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case 'perfume':
        return '💧';
      case 'clothing':
        return '👕';
      case 'misc':
      default:
        return '🧷';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Автосборка</h1>
      
      <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="orders">Сборочные задания</TabsTrigger>
            <TabsTrigger value="supplies">Поставки</TabsTrigger>
          </TabsList>
          
          {activeTab === 'orders' && (
            <div className="flex gap-2">
              <Button 
                onClick={fetchOrders} 
                variant="outline" 
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCcw size={16} />
                Обновить задания
              </Button>
              
              <Button 
                onClick={autoAssembleSupplies}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={loading || orders.length === 0}
              >
                <Package size={16} className="mr-1" /> 
                Автосформировать поставки
              </Button>
            </div>
          )}
        </div>
        
        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg flex items-center">
                <Filter size={16} className="mr-2" />
                Фильтры
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Склад</label>
                <Select
                  value={filters.warehouse}
                  onValueChange={(value) => handleFilterChange('warehouse', value)}
                >
                  <SelectTrigger>
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
              
              <div>
                <label className="text-sm font-medium">Тип груза</label>
                <Select
                  value={filters.cargoType}
                  onValueChange={(value) => handleFilterChange('cargoType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип груза" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="regular">Обычный</SelectItem>
                    <SelectItem value="oversized">Крупногабарит</SelectItem>
                    <SelectItem value="heavy">Тяжеловес</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Категория</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    <SelectItem value="perfume">Парфюмерия</SelectItem>
                    <SelectItem value="clothing">Одежда</SelectItem>
                    <SelectItem value="misc">Мелочёвка</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Поиск</label>
                <Input
                  placeholder="Поиск по артикулу, ID или названию"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Сортировка</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Сортировать по" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">По дате</SelectItem>
                    <SelectItem value="name">По наименованию</SelectItem>
                    <SelectItem value="cargoType">По типу</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Направление сортировки</label>
                <Select
                  value={filters.sortDirection}
                  onValueChange={(value) => handleFilterChange('sortDirection', value as 'asc' | 'desc')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Направление сортировки" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">По возрастанию</SelectItem>
                    <SelectItem value="desc">По убыванию</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Orders Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="py-3 px-4 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                          onChange={toggleSelectAllOrders}
                          className="rounded border-gray-300 mr-2"
                        />
                        ID
                      </div>
                    </th>
                    <th className="py-3 px-4 text-left">Артикул</th>
                    <th className="py-3 px-4 text-left">Наименование</th>
                    <th className="py-3 px-4 text-left">Категория</th>
                    <th className="py-3 px-4 text-left">Склад</th>
                    <th className="py-3 px-4 text-left">Тип груза</th>
                    <th className="py-3 px-4 text-left">Дата создания</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">Загрузка...</td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">Нет доступных заданий</td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      // Determine order category
                      let category: ProductCategory = 'misc';
                      if (/духи|туалетная вода|парфюмерная вода|аромат|eau de parfum|eau de toilette/i.test(order.name)) {
                        category = 'perfume';
                      } else if (/куртка|брюки|спортивные|платье|футболка|джинсы|шорты|юбка|бейсболка|толстовка|жилет/i.test(order.name)) {
                        category = 'clothing';
                      }
                      
                      return (
                        <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order.id)}
                                onChange={() => toggleOrderSelection(order.id)}
                                className="rounded border-gray-300 mr-2"
                              />
                              {order.id}
                            </div>
                          </td>
                          <td className="py-3 px-4">{order.article}</td>
                          <td className="py-3 px-4">{order.name}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={getCategoryBadgeVariant(category)}
                              className="flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>{getCategoryIcon(category)}</span>
                              <span>{getCategoryName(category)}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {order.warehouse === 'moscow' ? 'Москва' : 
                             order.warehouse === 'saint-petersburg' ? 'Санкт-Петербург' : 
                             order.warehouse === 'novosibirsk' ? 'Новосибирск' : 
                             order.warehouse}
                          </td>
                          <td className="py-3 px-4">
                            {order.cargoType === 'regular' ? 'Обычный' : 
                             order.cargoType === 'oversized' ? 'Крупногабарит' : 
                             order.cargoType === 'heavy' ? 'Тяжеловес' : 
                             order.cargoType}
                          </td>
                          <td className="py-3 px-4">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="supplies" className="space-y-4">
          {/* Supplies Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Название</th>
                    <th className="py-3 px-4 text-left">Категория</th>
                    <th className="py-3 px-4 text-left">Количество заказов</th>
                    <th className="py-3 px-4 text-left">Статус</th>
                    <th className="py-3 px-4 text-left">Дата создания</th>
                    <th className="py-3 px-4 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">Загрузка...</td>
                    </tr>
                  ) : supplies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">Нет доступных поставок</td>
                    </tr>
                  ) : (
                    supplies.map(supply => (
                      <tr key={supply.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">{supply.id}</td>
                        <td className="py-3 px-4">{supply.name}</td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={getCategoryBadgeVariant(supply.category)}
                            className="flex items-center gap-1 whitespace-nowrap"
                          >
                            <span>{getCategoryIcon(supply.category)}</span>
                            <span>{getCategoryName(supply.category)}</span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{supply.ordersCount}</td>
                        <td className="py-3 px-4">
                          {supply.status === 'new' ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300">
                              Новая
                            </Badge>
                          ) : supply.status === 'in_delivery' ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300">
                              В доставке
                            </Badge>
                          ) : supply.status === 'delivered' ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300">
                              <Check size={12} className="mr-1" />
                              Доставлена
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300">
                              Отменена
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">{new Date(supply.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Содержимое
                            </Button>
                            <Button variant="outline" size="sm">
                              Редактировать
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoAssembly;
