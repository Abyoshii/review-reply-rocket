
import React from 'react';
import { useParams } from 'react-router-dom';

const TrbxManager = () => {
  const { supplyId } = useParams<{ supplyId: string }>();

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Управление коробами</h1>
      <p className="text-muted-foreground mb-6">
        Поставка #{supplyId}
      </p>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
        <p className="text-gray-500 dark:text-gray-400">
          Этот раздел находится в разработке.
        </p>
      </div>
    </div>
  );
};

export default TrbxManager;
