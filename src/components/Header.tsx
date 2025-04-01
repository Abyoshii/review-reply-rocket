
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Moon, Sun, RefreshCw } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";

interface HeaderProps {
  unansweredCount: number;
  onRefresh: () => void;
}

const Header = ({
  unansweredCount,
  onRefresh
}: HeaderProps) => {
  const [openApiKey, setOpenApiKey] = useState<string>("");
  const [wbToken, setWbToken] = useState<string>("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState<boolean>(false);
  const [isWbTokenDialogOpen, setIsWbTokenDialogOpen] = useState<boolean>(false);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

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
