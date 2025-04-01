
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import AutoResponder from "./AutoResponder";
import { WbReview } from "@/types/wb";

interface FloatingActionButtonsProps {
  selectedReviews: Set<string>;
  reviews: WbReview[];
  onGenerateAnswers: () => void;
  onSendAnswers: () => void;
  onRefresh: () => void;
  hasAnswers: boolean;
}

const FloatingActionButtons = ({ 
  selectedReviews, 
  reviews, 
  onGenerateAnswers, 
  onSendAnswers, 
  onRefresh, 
  hasAnswers 
}: FloatingActionButtonsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Get selected reviews data
  const selectedReviewsData = reviews.filter(review => selectedReviews.has(review.id));

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

  return (
    <div 
      className={`fixed bottom-6 right-6 flex flex-col items-end space-y-2 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
        <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Выбрано отзывов: {selectedReviews.size}
        </div>
        
        <Button 
          onClick={onGenerateAnswers} 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Сгенерировать ответы
        </Button>
        
        <Button 
          onClick={onSendAnswers} 
          disabled={!hasAnswers}
          size="sm"
          className="w-full bg-wb-secondary hover:bg-wb-accent"
        >
          <Send className="mr-2 h-4 w-4" />
          Отправить ответы
        </Button>
        
        <AutoResponder 
          selectedReviews={selectedReviewsData} 
          onSuccess={onRefresh} 
        />
      </div>
    </div>
  );
};

export default FloatingActionButtons;
