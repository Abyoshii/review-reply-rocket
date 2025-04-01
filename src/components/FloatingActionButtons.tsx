
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Loader2, CheckCircle } from "lucide-react";
import { WbReview } from "@/types/wb";
import { Progress } from "@/components/ui/progress";

interface FloatingActionButtonsProps {
  selectedReviews: Set<string>;
  reviews: WbReview[];
  onGenerateAnswers: () => void;
  onSendAnswers: () => void;
  onRefresh: () => void;
  onClearSelection: () => void; // New prop for clearing selection
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
  onClearSelection, // New prop
  hasAnswers,
  generationProgress,
  sendingProgress
}: FloatingActionButtonsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

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

  // Monitor sending progress to determine when all reviews are sent
  useEffect(() => {
    if (sendingProgress && sendingProgress.sent + sendingProgress.failed === sendingProgress.total && sendingProgress.total > 0) {
      // Show completion message
      setShowCompletionMessage(true);
      
      // Clear selection after a short delay (to allow the user to see the completion message)
      const timer = setTimeout(() => {
        onClearSelection();
        setShowCompletionMessage(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [sendingProgress, onClearSelection]);

  if (selectedReviews.size === 0) {
    return null;
  }

  const generationInProgress = generationProgress && generationProgress.completed < generationProgress.total;
  const sendingInProgress = sendingProgress && sendingProgress.sent < sendingProgress.total;
  const allSent = sendingProgress && sendingProgress.sent + sendingProgress.failed === sendingProgress.total && sendingProgress.total > 0;

  return (
    <div 
      className={`fixed bottom-6 right-6 flex flex-col items-end space-y-2 transition-all duration-300 z-[100] ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
        <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {showCompletionMessage ? (
            <span className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" /> Все ответы отправлены
            </span>
          ) : (
            `Выбрано отзывов: ${selectedReviews.size}`
          )}
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
          disabled={generationInProgress || allSent}
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
          disabled={!hasAnswers || sendingInProgress || allSent}
          size="sm"
          className="w-full bg-wb-secondary hover:bg-wb-accent"
        >
          {sendingInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : allSent ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Отправлено
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
