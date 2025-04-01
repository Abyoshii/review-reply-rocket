
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Moon, 
  Sun, 
  Bell,
  BellOff,
  Settings,
  Clock,
  Eye,
  EyeOff,
  Key,
  Bot,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface HeaderProps {
  unansweredCount: number;
  unansweredQuestionsCount: number;
  onRefresh: () => void;
}

const Header = ({ unansweredCount, unansweredQuestionsCount, onRefresh }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
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
  
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [wbToken, setWbToken] = useState(() => {
    return localStorage.getItem("wb_token") || "";
  });
  // Add the missing state for autoResponder dialog
  const [autoResponderOpen, setAutoResponderOpen] = useState(false);

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

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col items-start">
        <h1 className="text-2xl font-bold">
          <span className="mr-2 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent font-bold">
            Asterion
          </span>
        </h1>
        <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
          Система управления отзывами
        </span>
        
        <div className="flex items-center mt-2">
          {unansweredCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unansweredCount} в процессе обработки
            </Badge>
          )}
          
          {unansweredQuestionsCount > 0 && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 ml-2">
              {unansweredQuestionsCount} вопросов
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2 ml-auto">
        <Button 
          variant="outline" 
          size="icon"
          className="relative"
        >
          <Bell size={18} />
          {notificationSettings?.notificationType === 'none' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
          )}
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="relative"
            >
              <Bell size={18} />
              {notificationSettings?.notificationType === 'none' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-50">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Bell size={16} /> Настройки уведомлений
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Тип уведомлений</Label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={notificationSettings?.notificationType === 'all' ? "default" : "outline"} 
                    className="w-full h-auto py-1 px-2 text-xs flex flex-col items-center gap-1"
                    onClick={() => handleNotificationSettingsChange('notificationType', 'all')}
                  >
                    <Bell size={14} />
                    <span>Все</span>
                  </Button>
                  <Button 
                    variant={notificationSettings?.notificationType === 'important' ? "default" : "outline"} 
                    className="w-full h-auto py-1 px-2 text-xs flex flex-col items-center gap-1"
                    onClick={() => handleNotificationSettingsChange('notificationType', 'important')}
                  >
                    <Eye size={14} />
                    <span>Важные</span>
                  </Button>
                  <Button 
                    variant={notificationSettings?.notificationType === 'none' ? "default" : "outline"} 
                    className="w-full h-auto py-1 px-2 text-xs flex flex-col items-center gap-1"
                    onClick={() => handleNotificationSettingsChange('notificationType', 'none')}
                  >
                    <BellOff size={14} />
                    <span>Отключить</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="transparency">Прозрачность ({Math.round((1 - (notificationSettings?.transparency || 0.9)) * 100)}%)</Label>
                  </div>
                  <Slider 
                    id="transparency"
                    min={0}
                    max={0.9}
                    step={0.1}
                    value={[notificationSettings?.transparency || 0.9]}
                    onValueChange={(value) => handleNotificationSettingsChange('transparency', value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="displayTime">Время отображения ({(notificationSettings?.displayTime || 5000) / 1000}с)</Label>
                  </div>
                  <Slider 
                    id="displayTime"
                    min={1000}
                    max={10000}
                    step={1000}
                    value={[notificationSettings?.displayTime || 5000]}
                    onValueChange={(value) => handleNotificationSettingsChange('displayTime', value[0])}
                  />
                </div>
                
                <div className="pt-2 border-t flex justify-between items-center">
                  <Label htmlFor="test-notification" className="text-sm">Тестовое уведомление</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTestNotification}
                  >
                    Проверить
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setTokenDialogOpen(true)}
        >
          <Key size={18} />
        </Button>
        
        <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        
        <Button variant="outline" onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCw size={16} />
          Обновить
        </Button>
        
        <Dialog open={autoResponderOpen} onOpenChange={setAutoResponderOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors duration-300 ml-auto"
            >
              <Settings size={16} className="transition-transform duration-300 ease-in-out group-hover:rotate-180" />
              Автоответчик
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
      
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Токен Wildberries</DialogTitle>
            <DialogDescription>
              Введите ваш токен доступа к API Wildberries
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Label htmlFor="wb-token" className="sr-only">
              Токен
            </Label>
            <Input
              id="wb-token"
              value={wbToken}
              onChange={(e) => setWbToken(e.target.value)}
              placeholder="Введите токен Wildberries"
              className="w-full"
            />
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTokenDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button type="button" onClick={saveWbToken}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Header;
