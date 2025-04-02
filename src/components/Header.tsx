import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  RefreshCw,
  Sun,
  Moon,
  Settings,
  Bot,
  Key,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import AutoResponder from "@/components/AutoResponder";
import HeaderAutoResponse from "@/components/HeaderAutoResponse";

interface HeaderProps {
  unansweredCount: number;
  unansweredQuestionsCount: number;
  onRefresh: () => void;
}

const Header = ({ unansweredCount, unansweredQuestionsCount, onRefresh }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem("notification_settings");
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (e) {
      console.error("Failed to parse notification settings", e);
    }
    return {
      transparency: 0.9,
      displayTime: 5000,
      notificationType: 'important'
    };
  });
  
  const [autoResponderOpen, setAutoResponderOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [wbToken, setWbToken] = useState(() => {
    return localStorage.getItem("wb_token") || "";
  });
  const [apiToken, setApiToken] = useState(() => {
    return localStorage.getItem("api_token") || "";
  });

  const handleNotificationSettingsChange = (key: string, value: any) => {
    const updatedSettings = {
      ...notificationSettings,
      [key]: value
    };
    
    setNotificationSettings(updatedSettings);
    localStorage.setItem("notification_settings", JSON.stringify(updatedSettings));
    
    // Apply settings to global window object
    window.toastSettings = {
      duration: updatedSettings.displayTime,
      important: updatedSettings.notificationType === 'important',
      disabled: updatedSettings.notificationType === 'none'
    };
  };

  const updateNotificationSettings = (key: string, value: any) => {
    handleNotificationSettingsChange(key, value);
  };

  const handleTestNotification = () => {
    // Adding a small delay to ensure the settings have been applied
    setTimeout(() => {
      toast({
        title: "Тестовое уведомление",
        description: "Это тестовое уведомление с вашими настройками",
        important: false
      });
      
      setTimeout(() => {
        toast({
          title: "Важное уведомление",
          description: "Это тестовое ВАЖНОЕ уведомление",
          important: true
        });
      }, 1000);
    }, 100);
  };

  const saveWbToken = () => {
    localStorage.setItem("wb_token", wbToken);
    setTokenDialogOpen(false);
    toast({
      title: "Токен сохранен",
      description: "Токен Wildberries успешно сохранен",
      important: true
    });
  };

  const saveApiToken = () => {
    localStorage.setItem("api_token", apiToken);
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-[#0A0D14] text-white">
      <div className="flex flex-col items-start">
        <h1 className={`text-3xl font-bold ${isMobile ? 'text-center w-full' : ''}`}>
          <span className="mr-2 font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-gradient-x bg-size-200">
            Asterion
          </span>
        </h1>
        
        <div className={`flex items-center mt-2 ${isMobile ? 'flex-wrap justify-center gap-1' : ''}`}>
          {unansweredCount > 0 && (
            <Badge variant="destructive" className={`${isMobile ? 'mb-1' : 'ml-2'}`}>
              {unansweredCount} в процессе обработки
            </Badge>
          )}
          
          {unansweredQuestionsCount > 0 && (
            <Badge variant="outline" className={`bg-amber-100 text-amber-800 border-amber-300 ${isMobile ? 'mb-1' : 'ml-2'}`}>
              {unansweredQuestionsCount} вопросов
            </Badge>
          )}
        </div>
      </div>
      
      <div className={`flex items-center ${isMobile ? 'flex-wrap justify-center gap-2 mt-2' : 'gap-1'}`}>
        <Button 
          variant="nav" 
          size="navIcon"
          onClick={onRefresh}
          className="text-white rounded-md"
          title="Обновить"
        >
          <RefreshCw size={isMobile ? 18 : 20} />
        </Button>
        
        <HeaderAutoResponse onRefresh={onRefresh} />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="nav" 
              size="navIcon"
              className="relative text-white rounded-md"
            >
              <Bell size={isMobile ? 18 : 20} />
              {notificationSettings?.notificationType === 'none' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 shadow-md rounded-lg">
            <div className="bg-white dark:bg-gray-800 rounded-md overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white py-3 px-4">
                <h3 className="font-medium">Настройки уведомлений</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="block font-medium text-sm">Тип уведомлений</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateNotificationSettings('notificationType', 'all')}
                      className={`px-3 py-1.5 text-sm rounded-md transition duration-150 ${
                        notificationSettings?.notificationType === 'all'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      Все
                    </button>
                    <button
                      onClick={() => updateNotificationSettings('notificationType', 'important')}
                      className={`px-3 py-1.5 text-sm rounded-md transition duration-150 ${
                        notificationSettings?.notificationType === 'important'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      Важные
                    </button>
                    <button
                      onClick={() => updateNotificationSettings('notificationType', 'none')}
                      className={`px-3 py-1.5 text-sm rounded-md transition duration-150 ${
                        notificationSettings?.notificationType === 'none'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      Отключены
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block font-medium text-sm">Время отображения (сек)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={notificationSettings?.displayTime ? notificationSettings.displayTime / 1000 : 5}
                    onChange={(e) => updateNotificationSettings('displayTime', parseInt(e.target.value) * 1000)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1с</span>
                    <span>{notificationSettings?.displayTime ? notificationSettings.displayTime / 1000 : 5}с</span>
                    <span>10с</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block font-medium text-sm">Прозрачность</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.1"
                    value={notificationSettings?.transparency || 0.9}
                    onChange={(e) => updateNotificationSettings('transparency', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>50%</span>
                    <span>{Math.round((notificationSettings?.transparency || 0.9) * 100)}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <button
                  onClick={testNotification}
                  className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition"
                >
                  Проверить уведомления
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button 
          variant="nav" 
          size="navIcon"
          onClick={() => setTokenDialogOpen(true)}
          className="text-white rounded-md"
        >
          <Key size={isMobile ? 18 : 20} />
        </Button>
        
        <Button 
          variant="nav" 
          size="navIcon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-white rounded-md"
        >
          {theme === "dark" ? <Sun size={isMobile ? 18 : 20} /> : <Moon size={isMobile ? 18 : 20} />}
        </Button>
        
        <Dialog open={autoResponderOpen} onOpenChange={setAutoResponderOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="nav" 
              size="navIcon"
              className="text-white rounded-md"
            >
              <Settings size={isMobile ? 18 : 20} />
            </Button>
          </DialogTrigger>
          <DialogContent className={`${isMobile ? 'w-[90vw] max-w-[90vw]' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto`}>
            <AutoResponder 
              selectedReviews={[]} 
              onSuccess={() => {
                setAutoResponderOpen(false);
                onRefresh();
              }}
            />
          </DialogContent>
        </Dialog>
        
        <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>API Токены</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">OpenAI API Key</label>
                <div className="flex">
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 px-3 py-2 border rounded-l-md dark:bg-gray-800 dark:border-gray-700"
                  />
                  <button
                    onClick={saveApiToken}
                    className="px-4 py-2 bg-purple-500 text-white rounded-r-md hover:bg-purple-600 transition"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Wildberries Token</label>
                <div className="flex">
                  <input
                    type="password"
                    value={wbToken}
                    onChange={(e) => setWbToken(e.target.value)}
                    placeholder="WB токен..."
                    className="flex-1 px-3 py-2 border rounded-l-md dark:bg-gray-800 dark:border-gray-700"
                  />
                  <button
                    onClick={saveWbToken}
                    className="px-4 py-2 bg-purple-500 text-white rounded-r-md hover:bg-purple-600 transition"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Header;
