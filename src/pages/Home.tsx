
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Панель управления</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">Поставки и сборка</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Управление поставками и автоматическая сборка заказов
          </p>
          <div className="space-x-2">
            <Button asChild>
              <Link to="/supplies">Поставки</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auto-assembly">Автосборка</Link>
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">Настройки</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Настройте приложение и API токены
          </p>
          <Button asChild>
            <Link to="/settings">Настройки</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
