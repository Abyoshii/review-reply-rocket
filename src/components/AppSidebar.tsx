
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
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Package, MessageSquare, Box, LayoutDashboard, ChevronLeft, ChevronRight, Menu } from "lucide-react";
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
      {state === 'collapsed' && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="fixed left-2 top-2 z-50 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-300 animate-fade-in rounded-full shadow-md"
        >
          <Menu size={18} />
        </Button>
      )}
    
      <Sidebar>
        <SidebarHeader className="flex items-center justify-between py-2 px-2">
          <div className={`text-xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 transition-opacity duration-300 ${state === 'collapsed' ? 'opacity-0' : 'opacity-100'}`}>
            <Box className="h-6 w-6" />
            <span>WB Контроль</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-300"
          >
            {state === 'expanded' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </Button>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="transition-all duration-300">Навигация</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={isActive("/")} 
                    onClick={() => navigate("/")}
                    tooltip="Главная - статистика заказов и продаж"
                    className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-300"
                  >
                    <LayoutDashboard size={18} />
                    <span>Главная</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={isActive("/reviews")} 
                    onClick={() => navigate("/reviews")}
                    tooltip="Отзывы и управление отзывами"
                    className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-300"
                  >
                    <MessageSquare size={18} />
                    <span>Отзывы</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={isActive("/auto-assembly")} 
                    onClick={() => navigate("/auto-assembly")}
                    tooltip="Автосборка"
                    className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-300"
                  >
                    <Package size={18} />
                    <span>Автосборка</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default AppSidebar;
