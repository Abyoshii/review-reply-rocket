
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
import { Package, MessageSquare, Box, LayoutDashboard, Menu } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";

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
    <>
      <Sidebar>
        <SidebarHeader className="flex items-center justify-between py-2 px-2">
          <div 
            onClick={toggleSidebar}
            className="text-xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 transition-all duration-200 cursor-pointer hover:opacity-80 select-none"
          >
            <Box className="h-6 w-6" />
            <span className={`bg-gradient-to-r from-purple-400 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-gradient-x bg-size-200 transition-opacity duration-200 ${state === 'collapsed' ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>WB Контроллер</span>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="transition-all duration-200">Навигация</SidebarGroupLabel>
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
                        Главная - статистика заказов и продаж
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
                        Автосборка и формирование поставок
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                </TooltipProvider>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Floating menu button */}
      {state === 'collapsed' && (
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="fixed left-3 top-3 z-50 bg-purple-500/20 hover:bg-purple-500/40 rounded-full p-2 shadow-md"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5 text-purple-700 dark:text-purple-300" />
        </Button>
      )}
    </>
  );
};

export default AppSidebar;
