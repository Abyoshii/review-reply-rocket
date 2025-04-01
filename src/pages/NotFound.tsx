
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Пользователь попытался получить доступ к несуществующему маршруту:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-wb-primary mb-4">404</h1>
          <p className="text-2xl text-gray-600 mb-4">Упс! Страница не найдена</p>
          <p className="text-gray-500 mb-8">
            Кажется, страница, которую вы ищете, не существует или была перемещена.
          </p>
        </div>
        
        <Link to="/">
          <Button className="bg-wb-secondary hover:bg-wb-accent px-6 py-2 text-white rounded-md">
            Вернуться на главную
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
