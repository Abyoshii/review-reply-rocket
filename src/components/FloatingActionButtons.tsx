
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { WbReview } from "@/types/wb";
import { Progress } from "@/components/ui/progress";

interface FloatingActionButtonsProps {
  selectedReviews: Set<string>;
  reviews: WbReview[];
  onGenerateAnswers: () => void;
  onSendAnswers: () => void;
  onRefresh: () => void;
  hasAnswers: boolean;
  generationProgress?: { completed: number; total: number };
  sendingProgress?: { sent: number; total: number; failed: number };
}

const FloatingActionButtons = ({ 
  selectedReviews, 
  reviews, 
  onGenerateAnswers, 
  onSendAnswers, 
  onRefresh, 
  hasAnswers,
  generationProgress,
  sendingProgress
}: FloatingActionButtonsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide based on scroll direction
      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (selectedReviews.size === 0) {
    return null;
  }

  const generationInProgress = generationProgress && generationProgress.completed < generationProgress.total;
  const sendingInProgress = sendingProgress && sendingProgress.sent < sendingProgress.total;

  return (
    <div 
      className={`fixed bottom-6 right-6 flex flex-col items-end space-y-2 transition-all duration-300 z-50 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
        <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Выбрано отзывов: {selectedReviews.size}
        </div>
        
        {generationInProgress && (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Генерация ответов</span>
              <span>{generationProgress.completed}/{generationProgress.total}</span>
            </div>
            <Progress value={(generationProgress.completed / generationProgress.total) * 100} className="h-2" />
          </div>
        )}
        
        {sendingInProgress && (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Отправка ответов</span>
              <span>{sendingProgress.sent}/{sendingProgress.total}</span>
            </div>
            <Progress value={(sendingProgress.sent / sendingProgress.total) * 100} className="h-2" />
            {sendingProgress.failed > 0 && (
              <div className="text-xs text-red-500">Ошибок: {sendingProgress.failed}</div>
            )}
          </div>
        )}
        
        <Button 
          onClick={onGenerateAnswers} 
          variant="outline" 
          size="sm"
          className="w-full"
          disabled={generationInProgress}
        >
          {generationInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Сгенерировать ответы
            </>
          )}
        </Button>
        
        <Button 
          onClick={onSendAnswers} 
          disabled={!hasAnswers || sendingInProgress}
          size="sm"
          className="w-full bg-wb-secondary hover:bg-wb-accent"
        >
          {sendingInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Отправить ответы
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FloatingActionButtons;
