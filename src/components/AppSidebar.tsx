
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  Package, 
  MessageSquare, 
  Box, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  Settings, 
  HelpCircle,
  PackageCheck 
} from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { state, toggleSidebar } = useSidebar();
  
  // Определение активной страницы
  const isActive = (path: string) => {
    return currentPath === path;
  };

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between py-2 px-2">
        <div 
          onClick={toggleSidebar}
          className={`text-xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 transition-all duration-300 cursor-pointer hover:opacity-80 select-none ${state === 'collapsed' ? 'opacity-0' : 'opacity-100'}`}
        >
          <Box className="h-6 w-6" />
          <span>Asterion</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200"
        >
          {state === 'expanded' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="transition-all duration-300">Основное</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={150}>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isActive("/")} 
                        onClick={() => navigate("/")}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      >
                        <LayoutDashboard size={18} />
                        <span>Главная</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Дашборд и статистика
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isActive("/reviews")} 
                        onClick={() => navigate("/reviews")}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      >
                        <MessageSquare size={18} />
                        <span>Отзывы</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Отзывы и управление отзывами
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="transition-all duration-300">Управление FBS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={150}>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isActive("/auto-assembly")} 
                        onClick={() => navigate("/auto-assembly")}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      >
                        <Package size={18} />
                        <span>Автосборка</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Автосборка заданий
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isActive("/supplies")} 
                        onClick={() => navigate("/supplies")}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      >
                        <Truck size={18} />
                        <span>Поставки</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Управление поставками
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isActive("/boxes")} 
                        onClick={() => navigate("/boxes")}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      >
                        <PackageCheck size={18} />
                        <span>Короба</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Упаковка в короба
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="transition-all duration-300">Система</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={150}>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isActive("/passes")} 
                        onClick={() => navigate("/passes")}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      >
                        <Box size={18} />
                        <span>Пропуска</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Управление пропусками
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isActive("/settings")} 
                        onClick={() => navigate("/settings")}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      >
                        <Settings size={18} />
                        <span>Настройки</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Настройки приложения
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isActive("/help")} 
                        onClick={() => navigate("/help")}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      >
                        <HelpCircle size={18} />
                        <span>Помощь</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Справка и поддержка
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
