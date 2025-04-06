
import React from 'react';
import Header from './Header';
import AppSidebar from './AppSidebar';

// Интерфейс для Layout
interface LayoutProps {
  children: React.ReactNode;
  unansweredCount?: number;
  unansweredQuestionsCount?: number;
  onRefresh?: () => void;
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
