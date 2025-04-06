
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { addAuthHeaders } from "@/lib/securityUtils";
import axios from "axios";

// API базовый URL для FBS API
const WB_API_BASE_URL = "https://feedbacks-api.wildberries.ru/api/v3";

interface Office {
  id: number;
  name: string;
  address: string;
}

interface Pass {
  id: number;
  officeId: number;
  officeName: string;
  carNumber: string;
  fullName: string;
  dateFrom: string;
  dateTo: string;
}

const Passes = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    carNumber: "",
    dateFrom: "",
    dateTo: "",
    officeId: ""
  });

  // Fetch offices and passes on component mount
  useEffect(() => {
    fetchOffices();
    fetchPasses();
  }, []);

  // Fetch offices
  const fetchOffices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/passes/offices`, {
        headers: addAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data)) {
        setOffices(response.data);
      } else {
        // Mock data if API doesn't return expected format
        const mockOffices = [
          { id: 1, name: "Склад Коледино", address: "Московская обл., г. Подольск, д. Коледино, 1с1" },
          { id: 2, name: "Склад Электросталь", address: "Московская обл., г. Электросталь, ул. Промышленная, 20" },
          { id: 3, name: "Склад Санкт-Петербург", address: "г. Санкт-Петербург, Пулковское шоссе, 19" }
        ];
        setOffices(mockOffices);
      }
    } catch (error) {
      console.error("Error fetching offices:", error);
      toast.error("Не удалось загрузить список складов");
      
      // Mock data in case of error
      const mockOffices = [
        { id: 1, name: "Склад Коледино", address: "Московская обл., г. Подольск, д. Коледино, 1с1" },
        { id: 2, name: "Склад Электросталь", address: "Московская обл., г. Электросталь, ул. Промышленная, 20" },
        { id: 3, name: "Склад Санкт-Петербург", address: "г. Санкт-Петербург, Пулковское шоссе, 19" }
      ];
      setOffices(mockOffices);
    } finally {
      setLoading(false);
    }
  };

  // Fetch passes
  const fetchPasses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${WB_API_BASE_URL}/passes`, {
        headers: addAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data)) {
        setPasses(response.data);
      } else {
        // Mock data if API doesn't return expected format
        const mockPasses = [
          { 
            id: 1, 
            officeId: 1, 
            officeName: "Склад Коледино", 
            carNumber: "А123БВ777", 
            fullName: "Иванов Иван Иванович", 
            dateFrom: "2023-08-01T10:00:00", 
            dateTo: "2023-08-01T18:00:00" 
          },
          { 
            id: 2, 
            officeId: 2, 
            officeName: "Склад Электросталь", 
            carNumber: "Х777YZ50", 
            fullName: "Петров Петр Петрович", 
            dateFrom: "2023-08-02T09:00:00", 
            dateTo: "2023-08-02T17:00:00" 
          }
        ];
        setPasses(mockPasses);
      }
    } catch (error) {
      console.error("Error fetching passes:", error);
      toast.error("Не удалось загрузить список пропусков");
      
      // Mock data in case of error
      const mockPasses = [
        { 
          id: 1, 
          officeId: 1, 
          officeName: "Склад Коледино", 
          carNumber: "А123БВ777", 
          fullName: "Иванов Иван Иванович", 
          dateFrom: "2023-08-01T10:00:00", 
          dateTo: "2023-08-01T18:00:00" 
        },
        { 
          id: 2, 
          officeId: 2, 
          officeName: "Склад Электросталь", 
          carNumber: "Х777YZ50", 
          fullName: "Петров Петр Петрович", 
          dateFrom: "2023-08-02T09:00:00", 
          dateTo: "2023-08-02T17:00:00" 
        }
      ];
      setPasses(mockPasses);
    } finally {
      setLoading(false);
    }
  };

  // Create pass
  const createPass = async () => {
    if (!formData.officeId || !formData.fullName || !formData.carNumber || !formData.dateFrom || !formData.dateTo) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${WB_API_BASE_URL}/passes`, formData, {
        headers: addAuthHeaders()
      });
      
      toast.success("Пропуск успешно создан");
      
      // Reset form
      setFormData({
        fullName: "",
        carNumber: "",
        dateFrom: "",
        dateTo: "",
        officeId: ""
      });
      
      // Refresh passes list
      fetchPasses();
    } catch (error) {
      console.error("Error creating pass:", error);
      toast.error("Ошибка при создании пропуска");
    } finally {
      setLoading(false);
    }
  };

  // Delete pass
  const deletePass = async (passId: number) => {
    setLoading(true);
    try {
      await axios.delete(`${WB_API_BASE_URL}/passes/${passId}`, {
        headers: addAuthHeaders()
      });
      
      toast.success("Пропуск успешно удален");
      
      // Update passes list
      setPasses(passes.filter(pass => pass.id !== passId));
    } catch (error) {
      console.error(`Error deleting pass ${passId}:`, error);
      toast.error("Ошибка при удалении пропуска");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Управление пропусками</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form for creating new pass */}
        <Card>
          <CardHeader>
            <CardTitle>Создать новый пропуск</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="office">Склад</Label>
                <Select 
                  value={formData.officeId} 
                  onValueChange={(value) => setFormData({...formData, officeId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите склад" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map(office => (
                      <SelectItem key={office.id} value={office.id.toString()}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">ФИО водителя</Label>
                <Input 
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Иванов Иван Иванович" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carNumber">Номер автомобиля</Label>
                <Input 
                  id="carNumber"
                  value={formData.carNumber}
                  onChange={(e) => setFormData({...formData, carNumber: e.target.value})}
                  placeholder="А123БВ777" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Дата и время с</Label>
                  <Input 
                    id="dateFrom"
                    type="datetime-local"
                    value={formData.dateFrom}
                    onChange={(e) => setFormData({...formData, dateFrom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Дата и время по</Label>
                  <Input 
                    id="dateTo"
                    type="datetime-local"
                    value={formData.dateTo}
                    onChange={(e) => setFormData({...formData, dateTo: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                type="button"
                onClick={createPass}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Создание..." : "Создать пропуск"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List of existing passes */}
        <Card>
          <CardHeader>
            <CardTitle>Активные пропуска</CardTitle>
          </CardHeader>
          <CardContent>
            {passes.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Активных пропусков нет
              </div>
            ) : (
              <div className="space-y-4">
                {passes.map(pass => (
                  <Card key={pass.id} className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{pass.fullName}</h3>
                          <p className="text-sm text-gray-500">{pass.officeName}</p>
                          <p className="text-sm">Автомобиль: <span className="font-medium">{pass.carNumber}</span></p>
                          <p className="text-sm">
                            {formatDate(pass.dateFrom)} — {formatDate(pass.dateTo)}
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deletePass(pass.id)}
                          disabled={loading}
                        >
                          Удалить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={fetchPasses} 
              className="w-full mt-4"
              disabled={loading}
            >
              Обновить список
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Passes;
