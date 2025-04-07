
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AutoAssembly = () => {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Автоматическая сборка</h1>
        <p className="text-muted-foreground">
          Формирование поставок на основе заказов и производство коробов
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новый раздел автосборки</CardTitle>
          <CardDescription>
            Этот раздел находится в разработке. Здесь будет интерфейс для управления автоматической сборкой заказов.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">
            Функциональность раздела "Автосборка" будет добавлена в ближайшее время.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoAssembly;
