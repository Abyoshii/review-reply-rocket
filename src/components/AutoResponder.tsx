
import { useState } from "react";
import { Card } from "@/components/ui/card";
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
import { 
  Bot,
  AlertCircle,
  Check,
  Settings,
  Send,
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { WbReview } from "@/types/wb";
import { AutoResponderSettings } from "@/types/openai";
import { OpenAIAPI, WbAPI } from "@/lib/api";

interface AutoResponderProps {
  selectedReviews: WbReview[];
  onSuccess: () => void;
}

const defaultSettings: AutoResponderSettings = {
  model: "gpt-3.5-turbo",
  maxReviewsPerRequest: 5,
  language: "russian",
  tone: "friendly",
  useEmoji: true,
  signature: ""
};

const AutoResponder = ({ selectedReviews, onSuccess }: AutoResponderProps) => {
  const [settings, setSettings] = useState<AutoResponderSettings>(defaultSettings);
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingsChange = (key: keyof AutoResponderSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const generateAutoAnswers = async () => {
    if (selectedReviews.length === 0) {
      toast.warning("Выберите отзывы для генерации автоответов");
      return;
    }

    if (selectedReviews.length > settings.maxReviewsPerRequest) {
      toast.warning(`Выбрано ${selectedReviews.length} отзывов, но максимально допустимо ${settings.maxReviewsPerRequest}. Уменьшите количество выбранных отзывов или увеличьте лимит в настройках.`);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await OpenAIAPI.generateAutoAnswers({
        settings,
        reviews: selectedReviews.map(review => ({
          id: review.id,
          text: review.text || undefined,
          pros: review.pros,
          cons: review.cons
        }))
      });

      setAnswersMap(result);
      toast.success(`Сгенерированы автоответы для ${Object.keys(result).length} отзывов`);
    } catch (error) {
      console.error("Error generating auto answers:", error);
      toast.error("Ошибка при генерации автоответов");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendAutoAnswers = async () => {
    const reviewIds = Object.keys(answersMap);
    if (reviewIds.length === 0) {
      toast.warning("Нет сгенерированных ответов для отправки");
      return;
    }

    setIsSending(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const reviewId of reviewIds) {
        try {
          await WbAPI.sendAnswer({
            id: reviewId,
            text: answersMap[reviewId]
          });
          successCount++;
        } catch (error) {
          console.error(`Error sending answer for review ${reviewId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Успешно отправлено ${successCount} ответов`);
        if (errorCount > 0) {
          toast.warning(`Не удалось отправить ${errorCount} ответов`);
        }
        onSuccess();
        setIsOpen(false);
        setAnswersMap({});
      } else {
        toast.error("Не удалось отправить ни одного ответа");
      }
    } catch (error) {
      console.error("Error sending auto answers:", error);
      toast.error("Ошибка при отправке автоответов");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800"
          disabled={selectedReviews.length === 0}
        >
          <Bot size={16} />
          Автоответчик ({selectedReviews.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot size={18} /> Автоответчик (ChatGPT)
          </DialogTitle>
          <DialogDescription>
            Автоматическая генерация и отправка ответов на отзывы с помощью ChatGPT
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Settings size={16} /> Настройки автоответчика
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Модель</Label>
                <Select
                  value={settings.model}
                  onValueChange={(value) => handleSettingsChange('model', value)}
                >
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Выберите модель" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (быстрее и дешевле)</SelectItem>
                    <SelectItem value="gpt-4">GPT-4 (качественнее, но дороже)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (новейшая модель)</SelectItem>
                  </SelectContent>
                </Select>
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
                  onValueChange={(value) => handleSettingsChange('language', value)}
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
                  onValueChange={(value) => handleSettingsChange('tone', value)}
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
                  value={settings.signature}
                  onChange={(e) => handleSettingsChange('signature', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <AlertCircle size={16} /> Информация
            </h3>
            
            <div className="text-sm space-y-3">
              <p>Выбрано отзывов: <strong>{selectedReviews.length}</strong></p>
              <p>Лимит за один запрос: <strong>{settings.maxReviewsPerRequest}</strong></p>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="font-medium">Промт для ChatGPT:</p>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                  <p>Ты — специалист клиентского сервиса в интернет-магазине, продающем товары через Wildberries.</p>
                  <p>Отвечай кратко (3–5 предложений), используя выбранный тон и язык.</p>
                  <p>Правила:</p>
                  <ul className="list-disc list-inside">
                    <li>Балансируй плюсы и минусы</li>
                    <li>Если хотят вернуть открытый парфюм — вежливо откажи</li>
                    <li>Если получили не тот товар — извинись и попроси вернуть неиспользованным</li>
                    <li>Если жалоба на подделку — легко пошути, что подделок не продаём</li>
                    <li>Если повреждение при доставке — направь в поддержку Wildberries</li>
                  </ul>
                </div>
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
              
              <div className="pt-2 space-y-2">
                <Button 
                  onClick={generateAutoAnswers} 
                  disabled={isGenerating || selectedReviews.length === 0}
                  variant="outline" 
                  className="w-full"
                >
                  {isGenerating ? "Генерация..." : "Сгенерировать автоответы"}
                </Button>
                
                <Button 
                  onClick={sendAutoAnswers}
                  disabled={isSending || Object.keys(answersMap).length === 0}
                  variant="default"
                  className="w-full bg-wb-secondary hover:bg-wb-accent"
                >
                  <Send size={16} className="mr-2" />
                  {isSending ? "Отправка..." : "Отправить все автоответы"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        {Object.keys(answersMap).length > 0 && (
          <div className="mt-4 space-y-3">
            <h3 className="text-lg font-medium">Сгенерированные ответы</h3>
            <div className="max-h-64 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-800 p-3 rounded">
              {selectedReviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span className="font-semibold">Отзыв:</span> {review.text || review.pros || "Нет текста, только рейтинг"}
                  </div>
                  <div className="border-l-4 border-green-500 pl-2">
                    <span className="font-semibold text-sm">Ответ:</span>
                    <Textarea
                      value={answersMap[review.id] || ""}
                      onChange={(e) => setAnswersMap(prev => ({ ...prev, [review.id]: e.target.value }))}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Закрыть
          </Button>
          <Button 
            onClick={sendAutoAnswers}
            disabled={isSending || Object.keys(answersMap).length === 0}
            className="bg-wb-secondary hover:bg-wb-accent"
          >
            <Send size={16} className="mr-2" />
            {isSending ? "Отправка..." : "Отправить все ответы"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutoResponder;
