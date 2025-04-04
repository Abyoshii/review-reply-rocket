
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
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { Package, MessageSquare, Home, Box } from "lucide-react";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Определение активной страницы
  const isActive = (path: string) => {
    return currentPath === path;
  };

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center py-2">
        <div className="text-xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
          <Box className="h-6 w-6" />
          <span>WB Контроль</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive("/")} 
                  onClick={() => navigate("/")}
                  tooltip="Главная"
                >
                  <Home size={18} />
                  <span>Главная</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive("/reviews")} 
                  onClick={() => navigate("/reviews")}
                  tooltip="Отзывы"
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
  );
};

export default AppSidebar;
