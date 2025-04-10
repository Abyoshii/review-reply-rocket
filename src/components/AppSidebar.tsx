
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Package, MessageSquare, Box, LayoutDashboard, ChevronLeft, ChevronRight, Settings, HelpCircle, PackageCheck, PackagePlus } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const {
    state,
    toggleSidebar
  } = useSidebar();

  // Determine active page
  const isActive = (path: string) => {
    return currentPath === path;
  };

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="flex items-center justify-between py-2 px-2">
        <div onClick={toggleSidebar} className={`text-xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 transition-all duration-300 cursor-pointer hover:opacity-80 select-none ${state === 'collapsed' ? 'opacity-0' : 'opacity-100'}`}>
          <Box className="h-6 w-6" />
          <span>Asterion</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200">
          {state === 'expanded' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="transition-all duration-300">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={150}>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton isActive={isActive("/")} onClick={() => navigate("/")} className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Dashboard and statistics
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton isActive={isActive("/reviews")} onClick={() => navigate("/reviews")} className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                        <MessageSquare size={18} />
                        <span>Reviews</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Reviews and review management
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="transition-all duration-300">FBS Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={150}>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton isActive={isActive("/boxes")} onClick={() => navigate("/boxes")} className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                        <PackageCheck size={18} />
                        <span>Boxes</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Packaging in boxes
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton isActive={isActive("/auto-assembly")} onClick={() => navigate("/auto-assembly")} className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                        <PackagePlus size={18} />
                        <span>Auto Assembly</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Automatic order assembly
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="transition-all duration-300">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={150}>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton isActive={isActive("/passes")} onClick={() => navigate("/passes")} className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                        <Box size={18} />
                        <span>Passes</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Pass management
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton isActive={isActive("/settings")} onClick={() => navigate("/settings")} className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                        <Settings size={18} />
                        <span>Settings</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Application settings
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton isActive={isActive("/help")} onClick={() => navigate("/help")} className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                        <HelpCircle size={18} />
                        <span>Help</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={state === 'expanded' ? 'hidden' : ''}>
                      Help and support
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
