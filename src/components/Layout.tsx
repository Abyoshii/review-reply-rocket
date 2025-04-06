
import React from 'react';
import Header, { HeaderProps } from './Header';
import { Sidebar } from './ui/sidebar';
import AppSidebar from './AppSidebar';

// Создаем интерфейс для Layout, который наследует все пропсы от Header
interface LayoutProps extends HeaderProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  unansweredCount, 
  unansweredQuestionsCount,
  onRefresh 
}) => {
  return (
    <div className="flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          unansweredCount={unansweredCount} 
          unansweredQuestionsCount={unansweredQuestionsCount}
          onRefresh={onRefresh}
        />
        <main className="flex-1 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
