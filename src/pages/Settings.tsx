
import React from 'react';

const Settings = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Настройки</h1>
      <p className="text-muted-foreground mb-6">
        Управление настройками приложения и API токенами
      </p>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Настройки API</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Этот раздел находится в разработке.
        </p>
      </div>
    </div>
  );
};

export default Settings;
