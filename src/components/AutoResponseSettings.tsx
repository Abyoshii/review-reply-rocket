
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AutoResponderSettings } from "@/types/openai";
import { toast } from "@/hooks/use-toast";
import { Clock, Bot, MessageSquare, Cpu, Zap, Bell, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AutoResponseSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartAutoResponse: (settings: AutoResponderSettings, interval: number) => void;
  onStopAutoResponse: () => void;
  isAutoResponseActive: boolean;
}

const AutoResponseSettings = ({
  open,
  onOpenChange,
  onStartAutoResponse,
  onStopAutoResponse,
  isAutoResponseActive
}: AutoResponseSettingsProps) => {
  const [settings, setSettings] = useState<AutoResponderSettings>({
    model: "gpt-3.5-turbo",
    maxReviewsPerRequest: 5,
    language: "russian",
    tone: "professional",
    useEmoji: true,
    signature: "",
    temperature: 0.7,
  });

  const [checkInterval, setCheckInterval] = useState(15);
  const [savedSettings, setSavedSettings] = useState<AutoResponderSettings | null>(null);
  const [savedInterval, setSavedInterval] = useState<number | null>(null);

  useEffect(() => {
    // Load saved settings from localStorage
    try {
      const savedAutoSettings = localStorage.getItem("auto_response_settings");
      if (savedAutoSettings) {
        const parsed = JSON.parse(savedAutoSettings);
        setSettings(parsed.settings);
        setCheckInterval(parsed.interval);
        setSavedSettings(parsed.settings);
        setSavedInterval(parsed.interval);
      }
    } catch (e) {
      console.error("Failed to load auto response settings", e);
    }
  }, []);

  useEffect(() => {
    // Auto-save settings when they change
    try {
      localStorage.setItem(
        "auto_response_settings",
        JSON.stringify({ settings, interval: checkInterval })
      );
    } catch (e) {
      console.error("Failed to auto-save auto response settings", e);
    }
  }, [settings, checkInterval]);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem("auto_response_settings", JSON.stringify({
        settings,
        interval: checkInterval
      }));
      setSavedSettings(settings);
      setSavedInterval(checkInterval);
      toast({
        title: "Настройки сохранены",
        description: "Настройки автоматического ответа успешно сохранены",
      });
    } catch (e) {
      console.error("Failed to save auto response settings", e);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive"
      });
    }
  };

  const handleStartAutoResponse = () => {
    handleSaveSettings();
    onStartAutoResponse(settings, checkInterval);
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <Bot className="text-purple-500" />
          Настройки автоматического ответа на отзывы
          {isAutoResponseActive && (
            <Badge className="ml-2 bg-green-500">Активно</Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          Настройте параметры для автоматического ответа на отзывы
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="check-interval" className="flex items-center gap-2">
                <Clock size={16} className="text-purple-500" />
                Интервал проверки (минуты)
              </Label>
              <Input
                id="check-interval"
                type="number"
                min={1}
                max={60}
                value={checkInterval}
                onChange={(e) => setCheckInterval(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Как часто проверять наличие новых отзывов
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="flex items-center gap-2">
                <Cpu size={16} className="text-purple-500" />
                Модель ИИ
              </Label>
              <Select
                value={settings.model}
                onValueChange={(value: any) => setSettings({ ...settings, model: value })}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Выберите модель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (быстрая)</SelectItem>
                  <SelectItem value="gpt-4">GPT-4 (качественная)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (оптимальная)</SelectItem>
                  <SelectItem value="auto">Авто (по сложности отзыва)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-reviews" className="flex items-center gap-2">
                <MessageSquare size={16} className="text-purple-500" />
                Макс. количество отзывов за раз
              </Label>
              <Select
                value={settings.maxReviewsPerRequest.toString()}
                onValueChange={(value: string) => {
                  // Convert string to one of the valid literal types (5, 10, or 20)
                  const numValue = Number(value) as 5 | 10 | 20;
                  setSettings({ ...settings, maxReviewsPerRequest: numValue });
                }}
              >
                <SelectTrigger id="max-reviews">
                  <SelectValue placeholder="Выберите количество" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 отзывов</SelectItem>
                  <SelectItem value="10">10 отзывов</SelectItem>
                  <SelectItem value="20">20 отзывов</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature" className="flex items-center gap-2">
                <Zap size={16} className="text-purple-500" />
                Креативность (температура)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm">0.1</span>
                <Input
                  id="temperature"
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-sm">1.0</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Более низкие значения - более предсказуемые ответы, высокие - более креативные
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <MessageSquare size={16} className="text-purple-500" />
                Язык ответов
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value: any) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="russian">Русский</SelectItem>
                  <SelectItem value="english">Английский</SelectItem>
                  <SelectItem value="kazakh">Казахский</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone" className="flex items-center gap-2">
                <Bell size={16} className="text-purple-500" />
                Тон общения
              </Label>
              <Select
                value={settings.tone}
                onValueChange={(value: any) => setSettings({ ...settings, tone: value })}
              >
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Выберите тон" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Профессиональный</SelectItem>
                  <SelectItem value="friendly">Дружелюбный</SelectItem>
                  <SelectItem value="formal">Формальный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 my-4">
              <Switch
                id="use-emoji"
                checked={settings.useEmoji}
                onCheckedChange={(checked) => setSettings({ ...settings, useEmoji: checked })}
              />
              <Label htmlFor="use-emoji">Использовать эмодзи</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature" className="flex items-center gap-2">
                <User size={16} className="text-purple-500" />
                Подпись (необязательно)
              </Label>
              <Input
                id="signature"
                placeholder="С уважением, команда..."
                value={settings.signature || ""}
                onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-prompt" className="flex items-center gap-2">
                <Bot size={16} className="text-purple-500" />
                Свой промпт (необязательно)
              </Label>
              <Textarea
                id="custom-prompt"
                placeholder="Инструкции для ИИ по генерации ответов..."
                value={settings.customPrompt || ""}
                onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex justify-between items-center gap-2 pt-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {savedSettings && savedInterval ? (
              <span>Последнее сохранение: интервал {savedInterval} мин., модель: {savedSettings.model}</span>
            ) : (
              <span>Настройки не сохранены</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveSettings}>
              Сохранить настройки
            </Button>
            {isAutoResponseActive ? (
              <Button variant="destructive" onClick={onStopAutoResponse}>
                Остановить автоответчик
              </Button>
            ) : (
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleStartAutoResponse}
              >
                <Bot size={16} className="mr-2" />
                Запустить автоответчик
              </Button>
            )}
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  );
};

export default AutoResponseSettings;
