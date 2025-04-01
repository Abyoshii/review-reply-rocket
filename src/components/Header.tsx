
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Moon, Sun, RefreshCw, MessageCircle, Bell, BellOff, Settings } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  unansweredCount: number;
  unansweredQuestionsCount?: number;
  onRefresh: () => void;
}

interface NotificationSettings {
  enabled: boolean;
  opacity: number;
  duration: number;
  type: 'important' | 'all' | 'none';
}

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  opacity: 0.9,
  duration: 5000,
  type: 'important'
};

const Header = ({
  unansweredCount,
  unansweredQuestionsCount = 0,
  onRefresh
}: HeaderProps) => {
  const [openApiKey, setOpenApiKey] = useState<string>("");
  const [wbToken, setWbToken] = useState<string>("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState<boolean>(false);
  const [isWbTokenDialogOpen, setIsWbTokenDialogOpen] = useState<boolean>(false);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState<boolean>(false);

  // Инициализация темы и токенов при загрузке компонента
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkTheme(true);
      document.documentElement.classList.add("dark");
    }
    
    // Загрузка сохраненного токена WB
    const savedWbToken = localStorage.getItem("wb_token");
    if (savedWbToken) {
      setWbToken(savedWbToken);
    }
    
    // Загрузка сохраненного API ключа OpenAI
    const savedOpenAiKey = localStorage.getItem("openai_api_key");
    if (savedOpenAiKey) {
      setOpenApiKey(savedOpenAiKey);
    }

    // Загрузка настроек уведомлений
    const savedNotificationSettings = localStorage.getItem("notification_settings");
    if (savedNotificationSettings) {
      try {
        setNotificationSettings(JSON.parse(savedNotificationSettings));
      } catch (e) {
        console.error("Failed to parse notification settings", e);
      }
    }
  }, []);

  // Обработчик переключения темы
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    if (!isDarkTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpenApiKey(e.target.value);
  };

  const handleWbTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWbToken(e.target.value);
  };

  const handleApiKeySave = () => {
    localStorage.setItem("openai_api_key", openApiKey);
    setIsApiKeyDialogOpen(false);
    toast.success("API ключ OpenAI сохранен");
  };

  const handleWbTokenSave = () => {
    localStorage.setItem("wb_token", wbToken);
    setIsWbTokenDialogOpen(false);
    toast.success("Токен Wildberries сохранен, данные будут обновлены");
    onRefresh(); // Обновляем данные сразу после изменения токена
  };

  const handleNotificationSettingChange = (setting: keyof NotificationSettings, value: any) => {
    const newSettings = { ...notificationSettings, [setting]: value };
    setNotificationSettings(newSettings);
    localStorage.setItem("notification_settings", JSON.stringify(newSettings));
    
    // Применяем настройки к глобальному стилю тостов
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
      toastContainer.setAttribute('style', `opacity: ${newSettings.opacity};`);
    }
    
    // Обновляем глобальные настройки toast
    window.toastSettings = {
      duration: newSettings.duration,
      important: newSettings.type === 'important',
      disabled: newSettings.type === 'none' || !newSettings.enabled
    };
  };

  return <header className="bg-wb-primary dark:bg-gray-900 text-white p-4 rounded-lg shadow-md mb-6 transition-colors duration-300">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 text-transparent bg-clip-text bg-size-200 animate-gradient-x">Asterion</h1>
            <p className="text-gray-300 dark:text-gray-400 mt-1 transition-colors duration-300">
              Автоматизированная обработка отзывов Wildberries с помощью OpenAI
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 dark:bg-black/20 py-2 px-4 rounded-full transition-colors duration-300">
              <span className="font-medium">Необработанных отзывов: </span>
              <span className="text-wb-secondary font-bold">{unansweredCount}</span>
            </div>

            {unansweredQuestionsCount > 0 && (
              <div className="bg-white/10 dark:bg-black/20 py-2 px-4 rounded-full transition-colors duration-300 flex items-center">
                <MessageCircle size={16} className="mr-2" />
                <span className="font-medium">Неотвеченные вопросы: </span>
                <span className="text-wb-secondary font-bold">{unansweredQuestionsCount}</span>
              </div>
            )}
            
            {/* Колокольчик уведомлений */}
            <Popover open={isNotificationSettingsOpen} onOpenChange={setIsNotificationSettingsOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="border-white/20 dark:border-gray-700 hover:bg-white/10 hover:text-white rounded-full transition-colors duration-300 relative"
                >
                  {notificationSettings.enabled ? <Bell size={18} /> : <BellOff size={18} />}
                  {unansweredCount > 0 && <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center text-xs">{unansweredCount}</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Tabs defaultValue="general" className="w-full">
                  <div className="border-b px-3 py-2 flex items-center justify-between">
                    <h4 className="font-medium">Настройки уведомлений</h4>
                    <TabsList className="grid grid-cols-2 h-8">
                      <TabsTrigger value="general" className="text-xs">Общие</TabsTrigger>
                      <TabsTrigger value="display" className="text-xs">Отображение</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="general" className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">Включить уведомления</h4>
                        <p className="text-xs text-muted-foreground">Показывать ли уведомления на сайте</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.enabled} 
                        onCheckedChange={(checked) => handleNotificationSettingChange('enabled', checked)} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Тип уведомлений</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={notificationSettings.type === 'important' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleNotificationSettingChange('type', 'important')}
                          className="h-8 text-xs"
                        >
                          Важные
                        </Button>
                        <Button 
                          variant={notificationSettings.type === 'all' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleNotificationSettingChange('type', 'all')}
                          className="h-8 text-xs"
                        >
                          Все
                        </Button>
                        <Button 
                          variant={notificationSettings.type === 'none' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleNotificationSettingChange('type', 'none')}
                          className="h-8 text-xs"
                        >
                          Отключить
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="display" className="space-y-4 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Прозрачность</h4>
                        <span className="text-xs text-muted-foreground">{notificationSettings.opacity * 100}%</span>
                      </div>
                      <Slider 
                        value={[notificationSettings.opacity * 100]} 
                        onValueChange={(value) => handleNotificationSettingChange('opacity', value[0] / 100)}
                        min={50}
                        max={100}
                        step={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Длительность отображения</h4>
                        <span className="text-xs text-muted-foreground">{notificationSettings.duration / 1000}с</span>
                      </div>
                      <Slider 
                        value={[notificationSettings.duration / 1000]} 
                        onValueChange={(value) => handleNotificationSettingChange('duration', value[0] * 1000)}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
            
            <Toggle 
              pressed={isDarkTheme} 
              onPressedChange={toggleTheme}
              className="border-white/20 dark:border-gray-700 hover:bg-white/10 hover:text-white transition-colors duration-300"
            >
              {isDarkTheme ? <Moon size={18} /> : <Sun size={18} />}
            </Toggle>
            
            <Button 
              variant="outline" 
              onClick={onRefresh} 
              className="border-white/20 dark:border-gray-700 hover:bg-white/10 hover:text-white transition-colors duration-300"
            >
              <RefreshCw size={16} className="mr-1" /> Обновить
            </Button>

            <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/20 dark:border-gray-700 hover:bg-white/10 hover:text-white transition-colors duration-300">
                  API ключ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:text-white transition-colors duration-300">
                <DialogHeader>
                  <DialogTitle>Настройка API ключа OpenAI</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    Введите свой API ключ OpenAI. Ключ будет сохранен только в вашем браузере и не будет передаваться на сервер.
                  </p>
                  <Input 
                    placeholder="sk-..." 
                    value={openApiKey} 
                    onChange={handleApiKeyChange} 
                    className="col-span-3 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors duration-300" 
                  />
                  <Button onClick={handleApiKeySave} className="bg-wb-secondary hover:bg-wb-accent dark:bg-purple-700 dark:hover:bg-purple-800 transition-colors duration-300">
                    Сохранить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isWbTokenDialogOpen} onOpenChange={setIsWbTokenDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/20 dark:border-gray-700 hover:bg-white/10 hover:text-white transition-colors duration-300">
                  WB токен
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:text-white transition-colors duration-300">
                <DialogHeader>
                  <DialogTitle>Настройка токена Wildberries</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    Введите свой JWT токен Wildberries. Токен будет сохранен только в вашем браузере.
                  </p>
                  <Input 
                    placeholder="Bearer eyJhbG..." 
                    value={wbToken} 
                    onChange={handleWbTokenChange} 
                    className="col-span-3 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors duration-300" 
                  />
                  <Button onClick={handleWbTokenSave} className="bg-wb-secondary hover:bg-wb-accent dark:bg-purple-700 dark:hover:bg-purple-800 transition-colors duration-300">
                    Сохранить и обновить данные
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>;
};

export default Header;
