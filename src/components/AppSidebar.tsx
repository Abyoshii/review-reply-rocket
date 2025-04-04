
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { 
  Home, MessageSquare, Calendar, FileSpreadsheet, Settings,
  ShoppingCart, HelpCircle, LucideIcon, MenuIcon, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarItemProps {
  icon: LucideIcon;
  title: string;
  href: string;
  badge?: number;
}

const SidebarItem = ({ icon: Icon, title, href, badge }: SidebarItemProps) => {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
          isActive ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : ""
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{title}</span>
      {badge ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-medium text-red-700">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
};

interface AppSidebarProps {}

const AppSidebar = ({}: AppSidebarProps) => {
  const { state, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Добавляем кнопку меню для отображения сайдбара на мобильных устройствах
  const FloatingMenuButton = () => {
    if (!isMobile || openMobile) return null;
    
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-50 bg-background/50 backdrop-blur-sm hover:bg-background/80 border border-gray-200 dark:border-gray-800"
        onClick={toggleSidebar}
      >
        <MenuIcon className="h-4 w-4" />
      </Button>
    );
  };
  
  return (
    <>
      <FloatingMenuButton />
      
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-background transition-transform duration-300 ease-in-out dark:border-gray-800",
          isMobile && state !== "expanded" && "-translate-x-full",
          isMobile && state === "expanded" && "shadow-lg"
        )}
      >
        {isMobile && (
          <div className="absolute right-2 top-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenMobile(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Закрыть меню</span>
            </Button>
          </div>
        )}
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex h-14 items-center border-b px-4 dark:border-gray-800">
            <span className="text-lg font-semibold">WB Контроллер</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            <div className="space-y-1">
              <SidebarItem icon={Home} title="Главная" href="/" />
              <SidebarItem icon={MessageSquare} title="Отзывы" href="/reviews" />
              <SidebarItem icon={ShoppingCart} title="Автосборка" href="/auto-assembly" />
            </div>
            <Separator className="my-4" />
            <div className="space-y-1">
              <SidebarItem icon={Settings} title="Настройки" href="/settings" />
              <SidebarItem icon={HelpCircle} title="Помощь" href="/help" />
            </div>
          </nav>
          <div className="border-t p-4 dark:border-gray-800">
            <div className="flex items-center gap-3 rounded-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">v1.0.0</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Обновлено: 04.04.2025
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppSidebar;
