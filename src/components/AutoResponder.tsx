
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Bot,
  AlertCircle,
  Check,
  Settings,
  Send,
  RefreshCw,
  Loader2,
  Code,
  Sparkles,
  Sliders,
  Thermometer,
  Clock,
  FileDigit
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WbReview } from "@/types/wb";
import { AutoResponderSettings } from "@/types/openai";
import { OpenAIAPI, WbAPI } from "@/lib/api";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { debounce, generateSystemPrompt, sleep } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface AutoResponderProps {
  selectedReviews: WbReview[];
  onSuccess: () => void;
}

interface NotificationSettings {
  transparency: number;
  displayTime: number;
  notificationType: 'important' | 'all' | 'none';
}

const defaultSettings: AutoResponderSettings = {
  model: "auto",
  maxReviewsPerRequest: 20,
  language: "russian",
  tone: "friendly",
  useEmoji: true,
  signature: "",
  temperature: 0.7,
  customPrompt: ""
};

const defaultNotificationSettings: NotificationSettings = {
  transparency: 0.9,
  displayTime: 5000,
  notificationType: 'important'
};

const AutoResponder = ({ selectedReviews, onSuccess }: AutoResponderProps) => {
  const [settings, setSettings] = useState<AutoResponderSettings>(() => {
    const savedSettings = localStorage.getItem('autoResponderSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultNotificationSettings;
  });
  
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [processingReviews, setProcessingReviews] = useState<Set<string>>(new Set());
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [promptPreview, setPromptPreview] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentReviews, setSentReviews] = useState<Set<string>>(new Set());
  const [pendingReviews, setPendingReviews] = useState<Set<string>>(new Set());
  const [failedReviews, setFailedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preview = generateSystemPrompt(settings);
    setPromptPreview(preview);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('autoResponderSettings', JSON.stringify(settings));
  }, [settings]);
  
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    
    // Применяем настройки к глобальному объекту для тостов
    window.toastSettings = {
      duration: notificationSettings.displayTime,
      important: notificationSettings.notificationType === 'important',
      disabled: notificationSettings.notificationType === 'none'
    };
    
  }, [notificationSettings]);

  const handleSettingsChange = (key: keyof AutoResponderSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleNotificationSettingsChange = (key: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const getGenerationMode = () => {
    if (settings.model === "gpt-4" || settings.model === "gpt-4o") {
      return "Массовый (один запрос)";
    } else {
      return "Поочередный (отдельные запросы)";
    }
  };

  const generateAutoAnswers = useCallback(debounce(async () => {
    if (selectedReviews.length === 0) {
      toast({
        title: "Внимание",
        description: "Выберите отзывы для генерации автоответов",
        variant: "destructive",
        important: true,
      });
      return;
    }

    if (selectedReviews.length > settings.maxReviewsPerRequest) {
      toast({
        title: "Превышение лимита",
        description: `Выбрано ${selectedReviews.length} отзывов, но максимально допустимо ${settings.maxReviewsPerRequest}. Уменьшите количество выбранных отзывов или увеличьте лимит в настройках.`,
        variant: "destructive",
        important: true,
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    const reviewIds = selectedReviews.map(r => r.id);
    setProcessingReviews(new Set(reviewIds));
    
    try {
      const reviewsForApi = selectedReviews.map(review => ({
        id: review.id,
        text: review.text || undefined,
        pros: review.pros,
        cons: review.cons,
        productName: review.productName || review.productDetails?.productName
      }));
      
      console.log(`🚀 Отправляем в массовую обработку ${reviewsForApi.length} отзывов одним запросом`);
      console.log('Данные отправляемые в API:', reviewsForApi);
      
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 5;
        });
      }, 300);
      
      let effectiveModel = settings.model;
      if (settings.model === "auto") {
        effectiveModel = reviewsForApi.length >= 10 ? "gpt-4o" : "gpt-3.5-turbo";
        console.log(`Автоматически выбрана модель: ${effectiveModel} (на основе количества отзывов: ${reviewsForApi.length})`);
      }
      
      const effectiveSettings = {
        ...settings,
        model: effectiveModel as "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "auto"
      };
      
      const result = await OpenAIAPI.generateAutoAnswers({
        settings: effectiveSettings,
        reviews: reviewsForApi
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setAnswersMap(result);
      
      if (notificationSettings.notificationType !== 'none') {
        const isImportant = notificationSettings.notificationType === 'important';
        toast({
          title: "Успешно",
          description: `Сгенерированы автоответы для ${Object.keys(result).length} отзывов. Использовалась модель: ${effectiveModel}`,
          variant: "default",
          important: isImportant,
        });
      }
    } catch (error) {
      console.error("Error generating auto answers:", error);
      toast({
        title: "Ошибка",
        description: "Ошибка при генерации автоответов",
        variant: "destructive",
        important: true,
      });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProcessingReviews(new Set());
        setGenerationProgress(0);
      }, 500);
    }
  }, 500), [selectedReviews, settings, notificationSettings]);

  const sendAutoAnswers = useCallback(debounce(async () => {
    const reviewIds = Object.keys(answersMap);
    if (reviewIds.length === 0) {
      toast({
        title: "Внимание",
        description: "Нет сгенерированных ответов для отправки",
        variant: "destructive",
        important: true,
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setFailedReviews(new Set());
    
    // Сначала все отзывы перемещаем в фантомный буфер (fanout buffer)
    setSentReviews(new Set());
    setPendingReviews(new Set(reviewIds));
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < reviewIds.length; i++) {
        const reviewId = reviewIds[i];
        
        setSendingProgress(Math.round((i / reviewIds.length) * 100));
        
        try {
          // Случайная задержка от 1.5 до 3 секунд, чтобы анимация была заметна
          const delay = Math.floor(Math.random() * 1500) + 1500; // 1500-3000мс задержка
          await sleep(delay);
          
          console.log(`📤 Отправка ответа для отзыва ${reviewId} (${i+1}/${reviewIds.length})`);
          
          await WbAPI.sendAnswer({
            id: reviewId,
            text: answersMap[reviewId]
          });
          
          setSentReviews(prev => {
            const updated = new Set(prev);
            updated.add(reviewId);
            return updated;
          });
          
          setPendingReviews(prev => {
            const updated = new Set(prev);
            updated.delete(reviewId);
            return updated;
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error sending answer for review ${reviewId}:`, error);
          errorCount++;
          
          setFailedReviews(prev => {
            const updated = new Set(prev);
            updated.add(reviewId);
            return updated;
          });
          
          setPendingReviews(prev => {
            const updated = new Set(prev);
            updated.delete(reviewId);
            return updated;
          });
        }
      }

      setSendingProgress(100);

      if (successCount > 0) {
        if (notificationSettings.notificationType !== 'none') {
          const isImportant = notificationSettings.notificationType === 'important';
          if (errorCount > 0) {
            toast({
              title: "Частичный успех",
              description: `Отправлено ${successCount} ответов. Не удалось отправить ${errorCount} ответов.`,
              variant: "default",
              important: isImportant,
            });
          } else {
            toast({
              title: "Успешно",
              description: `Отправлено ${successCount} ответов`,
              variant: "default",
              important: isImportant,
            });
          }
        }
        
        onSuccess();
        
        const sentIds = Array.from(sentReviews);
        const newAnswersMap = { ...answersMap };
        sentIds.forEach(id => {
          delete newAnswersMap[id];
        });
        setAnswersMap(newAnswersMap);
      } else if (notificationSettings.notificationType !== 'none') {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить ни одного ответа",
          variant: "destructive",
          important: true,
        });
      }
    } catch (error) {
      console.error("Error sending auto answers:", error);
      if (notificationSettings.notificationType !== 'none') {
        toast({
          title: "Ошибка",
          description: "Ошибка при отправке автоответов",
          variant: "destructive",
          important: true,
        });
      }
    } finally {
      setTimeout(() => {
        setIsSending(false);
        setSendingProgress(0);
        setPendingReviews(new Set());
      }, 500);
    }
  }, 500), [answersMap, onSuccess, notificationSettings]);

  const updateAnswerText = (reviewId: string, text: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [reviewId]: text
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    toast({
      title: "Настройки сброшены",
      description: "Настройки сброшены к значениям по умолчанию",
      variant: "default",
      important: false,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bot size={18} /> Автоответчик (ChatGPT)
        </DialogTitle>
        <DialogDescription>
          Автоматическая генерация и отправка ответов на отзывы с помощью ChatGPT
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Settings size={16} /> Настройки автоответчика
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Модель</Label>
              <Select
                value={settings.model}
                onValueChange={(value: "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "auto") => handleSettingsChange('model', value)}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Выберите модель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Автовыбор (рекомендуется)</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (быстрее и дешевле)</SelectItem>
                  <SelectItem value="gpt-4">GPT-4 (качественнее, но дороже)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (новейшая модель)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Автовыбор: до 10 отзывов — GPT-3.5, от 10 и более — GPT-4o
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-reviews">Макс. отзывов за запрос</Label>
              <Select
                value={String(settings.maxReviewsPerRequest)}
                onValueChange={(value) => handleSettingsChange('maxReviewsPerRequest', Number(value))}
              >
                <SelectTrigger id="max-reviews">
                  <SelectValue placeholder="Максимальное количество отзывов" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 отзывов</SelectItem>
                  <SelectItem value="10">10 отзывов</SelectItem>
                  <SelectItem value="20">20 отзывов</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Язык ответа</Label>
              <Select
                value={settings.language}
                onValueChange={(value: "russian" | "english" | "kazakh") => handleSettingsChange('language', value)}
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
              <Label htmlFor="tone">Тон ответа</Label>
              <Select
                value={settings.tone}
                onValueChange={(value: "professional" | "friendly" | "formal") => handleSettingsChange('tone', value)}
              >
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Выберите тон" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Профессионально</SelectItem>
                  <SelectItem value="friendly">Дружелюбно</SelectItem>
                  <SelectItem value="formal">Формально</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="use-emoji" 
                checked={settings.useEmoji}
                onCheckedChange={(checked) => handleSettingsChange('useEmoji', checked)}
              />
              <Label htmlFor="use-emoji">Включить emoji</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Подпись в конце ответа</Label>
              <Input
                id="signature"
                placeholder="С уважением, команда магазина"
                value={settings.signature || ""}
                onChange={(e) => handleSettingsChange('signature', e.target.value)}
              />
            </div>

            <Collapsible 
              open={showAdvancedSettings} 
              onOpenChange={setShowAdvancedSettings}
              className="border rounded-md p-3 bg-gray-50 dark:bg-gray-700"
            >
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-center cursor-pointer">
                  <span className="font-medium flex items-center gap-1">
                    <Sliders size={14} /> Расширенные настройки
                  </span>
                  <Button variant="ghost" size="sm">
                    {showAdvancedSettings ? "Скрыть" : "Показать"}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temperature" className="flex items-center gap-1">
                      <Thermometer size={14} /> Температура ({settings.temperature})
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSettingsChange('temperature', 0.7)}
                    >
                      Сбросить
                    </Button>
                  </div>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => handleSettingsChange('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Точные ответы</span>
                    <span>Креативные</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customPrompt" className="flex items-center gap-1">
                      <Code size={14} /> Собственный промт
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSettingsChange('customPrompt', '')}
                    >
                      Сбросить
                    </Button>
                  </div>
                  <Textarea
                    id="customPrompt"
                    placeholder="Настройте собственную инструкцию для ChatGPT..."
                    value={settings.customPrompt || ""}
                    onChange={(e) => handleSettingsChange('customPrompt', e.target.value)}
                    className="min-h-24"
                  />
                  <p className="text-xs text-gray-500">
                    При заполнении собственного промта, все остальные настройки (язык, тон, эмодзи) игнорируются
                  </p>
                </div>
                
                <Button onClick={resetSettings} variant="outline" size="sm" className="w-full">
                  Сбросить все настройки
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <AlertCircle size={16} /> Информация
          </h3>
          
          <div className="space-y-4">
            <Alert>
              <AlertTitle className="flex items-center gap-1">
                <Bot size={16} /> Статус автоответчика: 
                <Badge variant="outline" className="ml-1">
                  {settings.model === "auto" ? 
                    (selectedReviews.length >= 10 ? "GPT-4o (массовый режим)" : "GPT-3.5 Turbo (поочередный режим)") : 
                    (settings.model === "gpt-4o" ? "GPT-4o (массовый режим)" : 
                      (settings.model === "gpt-4" ? "GPT-4 (массовый режим)" : "GPT-3.5 Turbo (поочередный режим)"))}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">📦 Модель:</span> 
                    <span>{settings.model === "auto" ? 
                      (selectedReviews.length >= 10 ? "gpt-4o" : "gpt-3.5-turbo") : 
                      settings.model}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">📑 Количество отзывов:</span> 
                    <span>{selectedReviews.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">⌛ Режим генерации:</span> 
                    <span>{getGenerationMode()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">⚙️ Отправка:</span> 
                    <span>По одному с задержкой ~2с</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium flex items-center gap-1">
                  <Sparkles size={14} /> Промт для ChatGPT:
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(promptPreview);
                      toast({
                        title: "Скопировано",
                        description: "Промт скопирован в буфер обмена",
                        variant: "default",
                        important: false,
                      });
                    } catch (e) {
                      toast({
                        title: "Ошибка",
                        description: "Не удалось скопировать промт",
                        variant: "destructive",
                        important: true,
                      });
                    }
                  }}
                >
                  Копировать
                </Button>
              </div>
              <Textarea
                value={promptPreview}
                onChange={(e) => handleSettingsChange('customPrompt', e.target.value)}
                className="min-h-32 text-sm"
                placeholder="Промт будет сгенерирован автоматически на основе настроек"
              />
              <p className="text-xs text-gray-500">
                Все изменения промта влияют на генерацию ответов. Настройки автоматически обновляются при изменении промта.
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="font-medium">Результат генерации:</p>
              {Object.keys(answersMap).length > 0 ? (
                <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check size={16} /> Сгенерировано ответов: {Object.keys(answersMap).length}
                </p>
              ) : (
                <p className="text-gray-500">Ответы еще не сгенерированы</p>
              )}
            </div>
            
            {isGenerating && (
              <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" /> Генерация ответов
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    {Math.round(generationProgress)}%
                  </p>
                </div>
                <Progress value={generationProgress} className="h-1.5" />
              </div>
            )}
            
            {isSending && (
              <div className="space-y-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Send size={14} /> Отправка ответов
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {Math.round(sendingProgress)}%
                  </p>
                </div>
                <Progress value={sendingProgress} className="h-1.5" />
                <div className="flex justify-between text-xs">
                  <p>Отправлено: {sentReviews.size}</p>
                  <p>Ожидает: {pendingReviews.size}</p>
                  {failedReviews.size > 0 && (
                    <p className="text-red-500">Ошибки: {failedReviews.size}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="pt-2 space-y-2">
              <Button 
                onClick={generateAutoAnswers} 
                disabled={isGenerating || isSending || selectedReviews.length === 0}
                variant="outline" 
                className="w-full flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> 
                    Генерация... ({Math.round(generationProgress)}%)
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} /> 
                    Сгенерировать автоответы
                  </>
                )}
              </Button>
              
              <Button 
                onClick={sendAutoAnswers}
                disabled={isSending || isGenerating || Object.keys(answersMap).length === 0}
                variant="default"
                className="w-full bg-wb-secondary hover:bg-wb-accent"
              >
                {isSending ? (
                  <>
                    <Clock size={16} className="mr-2" /> 
                    Отправка... ({sentReviews.size}/{sentReviews.size + pendingReviews.size})
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Отправить все автоответы
                  </>
                )}
              </Button>
            </div>
            
            {Object.keys(answersMap).length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileDigit size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    Сгенерировано {Object.keys(answersMap).length} ответов
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-green-700 hover:text-green-800 hover:bg-green-100"
                  onClick={() => {
                    const allAnswers = Object.values(answersMap).join('\n\n');
                    try {
                      navigator.clipboard.writeText(allAnswers);
                      toast({
                        title: "Скопировано",
                        description: "Все ответы скопированы в буфер обмена",
                        variant: "default",
                        important: false,
                      });
                    } catch (e) {
                      toast({
                        title: "Ошибка",
                        description: "Не удалось скопировать ответы",
                        variant: "destructive",
                        important: true,
                      });
                    }
                  }}
                >
                  Скопировать все
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {Object.keys(answersMap).length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-lg font-medium">Сгенерированные ответы</h3>
          <div className="max-h-64 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-800 p-3 rounded">
            {selectedReviews
              .filter(review => answersMap[review.id])
              .map((review) => {
                const isPending = pendingReviews.has(review.id);
                const isSent = sentReviews.has(review.id);
                const isFailed = failedReviews.has(review.id);
                
                return (
                  <div 
                    key={review.id} 
                    className={`bg-white dark:bg-gray-700 p-3 rounded shadow-sm transition-opacity duration-300 ${
                      isSent ? 'opacity-60' : (isPending ? 'opacity-80' : 'opacity-100')
                    }`}
                  >
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <span className="font-semibold">Отзыв:</span> {review.text || review.pros || "Нет текста, только рейтинг"}
                    </div>
                    <div className={`border-l-4 pl-2 ${
                      isFailed ? 'border-red-500' : (isSent ? 'border-green-500' : (isPending ? 'border-amber-500' : 'border-blue-500'))
                    }`}>
                      {isPending && !isSent && !isFailed && (
                        <div className="flex items-center text-amber-600 mb-2">
                          <Loader2 size={14} className="animate-spin mr-2" />
                          <span className="text-xs">Отправка ответа...</span>
                        </div>
                      )}
                      
                      {isFailed && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs p-2 mb-2 rounded">
                          Ошибка отправки. Попробуйте снова.
                        </div>
                      )}
                      
                      <Textarea
                        value={answersMap[review.id]}
                        onChange={(e) => updateAnswerText(review.id, e.target.value)}
                        className="min-h-20 text-sm"
                        disabled={isPending || isSent}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
};

export default AutoResponder;
