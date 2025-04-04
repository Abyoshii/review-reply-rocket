
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewsTable from "@/components/ReviewsTable";
import QuestionsTable from "@/components/QuestionsTable";
import ArchiveReviewsTable from "@/components/ArchiveReviewsTable";
import FilterForm from "@/components/FilterForm";
import QuestionsFilterForm from "@/components/QuestionsFilterForm";
import { useToast } from "@/hooks/use-toast";
import HeaderAutoResponse from "@/components/HeaderAutoResponse";
import AutoResponder from "@/components/AutoResponder";
import AutoResponseSettings from "@/components/AutoResponseSettings";
import AutoResponseService from "@/components/AutoResponseService";
import FloatingActionButtons from "@/components/FloatingActionButtons";

const Reviews = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("reviews");
  const [autoResponseExpanded, setAutoResponseExpanded] = useState(false);
  
  const handleRefresh = () => {
    toast({
      title: "Обновление данных",
      description: "Данные успешно обновлены",
    });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400">Отзывы</h1>
        <HeaderAutoResponse 
          autoResponseExpanded={autoResponseExpanded}
          setAutoResponseExpanded={setAutoResponseExpanded}
        />
      </div>

      {autoResponseExpanded && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Автоответчик</CardTitle>
            <CardDescription>
              Настройте шаблоны автоматических ответов на отзывы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="settings">
              <TabsList>
                <TabsTrigger value="settings">Настройки</TabsTrigger>
                <TabsTrigger value="service">Сервис</TabsTrigger>
                <TabsTrigger value="responder">Тестировщик</TabsTrigger>
              </TabsList>
              <TabsContent value="settings">
                <AutoResponseSettings />
              </TabsContent>
              <TabsContent value="service">
                <AutoResponseService />
              </TabsContent>
              <TabsContent value="responder">
                <AutoResponder />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reviews">Отзывы</TabsTrigger>
          <TabsTrigger value="questions">Вопросы</TabsTrigger>
          <TabsTrigger value="archive">Архив</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterForm />
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Отзывы</CardTitle>
              <CardDescription>
                Управление отзывами на товары
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewsTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionsFilterForm />
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Вопросы</CardTitle>
              <CardDescription>
                Управление вопросами покупателей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionsTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archive">
          <Card>
            <CardHeader>
              <CardTitle>Архив отзывов</CardTitle>
              <CardDescription>
                История обработанных отзывов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArchiveReviewsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <FloatingActionButtons onRefresh={handleRefresh} />
    </div>
  );
};

export default Reviews;
