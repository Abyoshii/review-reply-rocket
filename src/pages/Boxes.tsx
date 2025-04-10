
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Plus, Package, QrCode, Trash, Clock } from "lucide-react";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { addAuthHeaders } from "@/lib/securityUtils";

// Определяем временный тип для коробов
interface TrbxBox {
  id: number;
  name: string;
  createdAt: string;
  status: string;
  ordersCount: number;
}

// Пока нет интеграции с API коробов, используем временную имплементацию
// Это будет заменено на реальную интеграцию в будущем
const BoxesAPI = {
  getTrbxBoxes: async (): Promise<TrbxBox[]> => {
    try {
      // Заглушка для API
      const mockBoxes: TrbxBox[] = [
        {
          id: 1001,
          name: "Короб №1001",
          createdAt: new Date().toISOString(),
          status: "new",
          ordersCount: 5
        },
        {
          id: 1002,
          name: "Короб №1002",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: "sent",
          ordersCount: 3
        }
      ];
      
      return mockBoxes;
    } catch (error) {
      console.error("Error fetching TRBX boxes:", error);
      toast.error("Не удалось загрузить коробы");
      return [];
    }
  },
  
  createTrbxBoxes: async (name: string): Promise<number | null> => {
    try {
      // Заглушка для создания короба
      return 1003;
    } catch (error) {
      console.error("Error creating TRBX box:", error);
      toast.error("Не удалось создать короб");
      return null;
    }
  },
  
  deleteTrbxBox: async (boxId: number): Promise<boolean> => {
    try {
      // Заглушка для удаления короба
      return true;
    } catch (error) {
      console.error(`Error deleting TRBX box ${boxId}:`, error);
      toast.error("Не удалось удалить короб");
      return false;
    }
  },
  
  addOrdersToTrbxBox: async (boxId: number, orderIds: number[]): Promise<boolean> => {
    try {
      // Заглушка для добавления заказов в короб
      return true;
    } catch (error) {
      console.error(`Error adding orders to TRBX box ${boxId}:`, error);
      toast.error("Не удалось добавить заказы в короб");
      return false;
    }
  },
  
  getTrbxStickers: async (boxId: number): Promise<string | null> => {
    try {
      // Заглушка для получения стикеров короба
      return null;
    } catch (error) {
      console.error(`Error getting stickers for TRBX box ${boxId}:`, error);
      toast.error("Не удалось получить стикеры для короба");
      return null;
    }
  }
};

const Boxes = () => {
  const [boxes, setBoxes] = useState<TrbxBox[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBox, setSelectedBox] = useState<TrbxBox | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [newBoxName, setNewBoxName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  useEffect(() => {
    loadBoxes();
  }, []);
  
  const loadBoxes = async () => {
    setLoading(true);
    try {
      const boxes = await BoxesAPI.getTrbxBoxes();
      setBoxes(boxes);
    } catch (error) {
      console.error("Error loading boxes:", error);
      toast.error("Не удалось загрузить коробы");
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'new':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Новый</Badge>;
      case 'sent':
      case 'shipped':
        return <Badge className="bg-green-600">Отправлен</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-amber-500">В обработке</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const createBox = async () => {
    if (!newBoxName.trim()) {
      toast.error("Пожалуйста, введите название короба");
      return;
    }
    
    setIsCreating(true);
    try {
      const boxId = await BoxesAPI.createTrbxBoxes(newBoxName);
      if (boxId) {
        toast.success(`Короб "${newBoxName}" создан`);
        setShowCreateDialog(false);
        setNewBoxName("");
        await loadBoxes();
      } else {
        toast.error("Не удалось создать короб");
      }
    } catch (error) {
      console.error("Error creating box:", error);
      toast.error("Ошибка при создании короба");
    } finally {
      setIsCreating(false);
    }
  };
  
  const deleteBox = async (boxId: number) => {
    try {
      const success = await BoxesAPI.deleteTrbxBox(boxId);
      if (success) {
        toast.success("Короб удален");
        await loadBoxes();
      } else {
        toast.error("Не удалось удалить короб");
      }
    } catch (error) {
      console.error("Error deleting box:", error);
      toast.error("Ошибка при удалении короба");
    }
  };
  
  const printBoxSticker = async (boxId: number) => {
    try {
      const stickerUrl = await BoxesAPI.getTrbxStickers(boxId);
      if (stickerUrl) {
        window.open(stickerUrl, '_blank');
      } else {
        toast.error("Не удалось получить стикер для короба");
      }
    } catch (error) {
      console.error("Error getting box sticker:", error);
      toast.error("Ошибка при получении стикера для короба");
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Коробы TRBX</h1>
          <p className="text-muted-foreground">
            Управление коробами TRBX для отправки через Почту России
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadBoxes}
            disabled={loading}
          >
            {loading ? 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
              <RefreshCw className="mr-2 h-4 w-4" />
            }
            Обновить
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать короб
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Список коробов</CardTitle>
          <CardDescription>
            Управление коробами и отправками
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : boxes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Нет созданных коробов</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Создайте новый короб и добавьте в него заказы для отправки
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Создать короб
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead className="hidden sm:table-cell">Дата создания</TableHead>
                    <TableHead>Заказов</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boxes.map(box => (
                    <TableRow key={box.id}>
                      <TableCell className="font-medium">{box.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDate(box.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>{box.ordersCount}</TableCell>
                      <TableCell>{getStatusBadge(box.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => printBoxSticker(box.id)}
                            title="Печать стикера"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Удалить короб"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить короб?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Короб "{box.name}" будет полностью удален.
                                  Это действие нельзя отменить.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBox(box.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Удалить короб
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Диалог создания короба */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый короб</DialogTitle>
            <DialogDescription>
              Введите название для нового короба TRBX.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название короба</Label>
              <Input
                id="name"
                placeholder="Например: Короб для Москвы"
                value={newBoxName}
                onChange={(e) => setNewBoxName(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Отмена
            </Button>
            <Button 
              onClick={createBox}
              disabled={isCreating || !newBoxName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать короб'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Boxes;
