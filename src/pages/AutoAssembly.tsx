
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { addAuthHeaders } from "@/lib/securityUtils";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Types for data
interface AssemblyOrder {
  orderId: string | number;
  orderUid: string;
  createdAt: string;
  products: ProductInfo[];
  status?: string;
  address?: string;
  customerName?: string;
}

interface ProductInfo {
  nmId: number;
  article: string;
  subjectName: string;
  photo: string;
  name?: string;
  brand?: string;
}

const AutoAssembly = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [selectedTab, setSelectedTab] = useState("orders");

  // Get data on page load
  useEffect(() => {
    loadAssemblyOrders();
  }, []);

  // Load assembly orders
  const loadAssemblyOrders = async () => {
    setLoading(true);
    try {
      // Step 1: Get list of assembly orders
      const ordersResponse = await axios.get("https://marketplace-api.wildberries.ru/api/v3/orders/new", {
        headers: addAuthHeaders()
      });
      
      console.log("Orders received:", ordersResponse.data);
      
      let ordersData = [];
      
      // Check response format
      if (Array.isArray(ordersResponse.data)) {
        ordersData = ordersResponse.data;
      } else if (ordersResponse.data && Array.isArray(ordersResponse.data.orders)) {
        ordersData = ordersResponse.data.orders;
      } else {
        console.error("Unknown API response format for orders:", ordersResponse.data);
        toast.error("API returned unexpected data format for orders");
        setLoading(false);
        return;
      }
      
      // Step 2: Collect all unique nmIds
      const nmIdsSet = new Set<number>();
      
      for (const order of ordersData) {
        if (order.skus && Array.isArray(order.skus)) {
          order.skus.forEach((sku: any) => {
            if (sku.nmId) {
              nmIdsSet.add(sku.nmId);
            }
          });
        }
      }
      
      const uniqueNmIds = Array.from(nmIdsSet);
      console.log("Collected unique nmIds:", uniqueNmIds);
      
      if (uniqueNmIds.length === 0) {
        setOrders([]);
        toast.warning("No products found in orders");
        setLoading(false);
        return;
      }
      
      // Step 3: Request product cards by nmId list
      // Split into chunks of 100 nmIds
      const nmIdChunks = [];
      for (let i = 0; i < uniqueNmIds.length; i += 100) {
        nmIdChunks.push(uniqueNmIds.slice(i, i + 100));
      }
      
      // Map to store product information
      const productInfoMap: Record<number, ProductInfo> = {};
      
      // Make requests for each chunk
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
          
          console.log("Product cards received:", cardsResponse.data);
          
          if (cardsResponse.data && cardsResponse.data.data && Array.isArray(cardsResponse.data.data.cards)) {
            for (const card of cardsResponse.data.data.cards) {
              productInfoMap[card.nmID] = {
                nmId: card.nmID,
                article: card.article || card.vendorCode || "No article",
                subjectName: card.subjectName || "No category",
                photo: card.photos && card.photos.length > 0 ? card.photos[0].big : "https://via.placeholder.com/150",
                name: card.name,
                brand: card.brand
              };
            }
          }
          
          // Short pause between requests to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error("Error requesting product cards:", error);
          toast.error("Failed to get product information");
        }
      }
      
      console.log("Created product map:", productInfoMap);
      
      // Step 5: Create final result
      const assemblyOrders: AssemblyOrder[] = [];
      
      for (const order of ordersData) {
        const products: ProductInfo[] = [];
        
        if (order.skus && Array.isArray(order.skus)) {
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
          customerName: order.user?.fio || "Customer"
        });
      }
      
      setOrders(assemblyOrders);
      toast.success(`Loaded ${assemblyOrders.length} orders`);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load assembly orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Automatic Assembly</h1>
          <p className="text-muted-foreground">
            Creating shipments based on orders and box production
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
          Refresh
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="orders" className="relative">
            Orders
            {orders.length > 0 && (
              <Badge className="ml-2 bg-purple-600">{orders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="supplies">Shipments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          {loading ? (
            <OrdersLoadingSkeleton />
          ) : orders.length > 0 ? (
            orders.map(order => (
              <OrderCard key={order.orderId} order={order} />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No orders to display</p>
                  <Button 
                    onClick={loadAssemblyOrders}
                    variant="outline" 
                    className="mt-4"
                  >
                    Load orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="supplies">
          <Card>
            <CardHeader>
              <CardTitle>Shipments</CardTitle>
              <CardDescription>
                Manage shipments and create new ones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-6">
                The "Shipments" section functionality will be added soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Order card component
const OrderCard = ({ order }: { order: AssemblyOrder }) => {
  const dateTime = new Date(order.createdAt).toLocaleString('en-US');
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              Order #{order.orderUid}
              <Badge variant={order.status === "new" ? "default" : "outline"}>
                {order.status === "new" ? "New" : "Processing"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Created: {dateTime}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">Add to shipment</Button>
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
                    <span className="text-xs text-gray-400">No photo</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{product.name || `Product ${product.article}`}</h4>
                <p className="text-sm text-muted-foreground">Article: {product.article}</p>
                <p className="text-xs text-muted-foreground">{product.subjectName}</p>
              </div>
            </div>
          ))}
          
          {order.address && (
            <div className="mt-4 text-sm">
              <span className="font-medium">Address: </span>
              <span className="text-muted-foreground">{order.address}</span>
            </div>
          )}
          
          {order.customerName && (
            <div className="text-sm">
              <span className="font-medium">Recipient: </span>
              <span className="text-muted-foreground">{order.customerName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Orders loading skeleton
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
