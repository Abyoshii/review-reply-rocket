
import React from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  showValue?: boolean;
  showBadge?: boolean;
  size?: "sm" | "md" | "lg";
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  showValue = true, 
  showBadge = false,
  size = "md" 
}) => {
  const stars = [];
  const maxRating = 5;

  // Определяем цвет и тип рейтинга
  const getRatingType = (rating: number): { type: "positive" | "neutral" | "negative", color: string } => {
    if (rating >= 4) return { type: "positive", color: "text-green-500 fill-green-500" };
    if (rating >= 3) return { type: "neutral", color: "text-amber-500 fill-amber-500" };
    return { type: "negative", color: "text-red-500 fill-red-500" };
  };

  const { type, color } = getRatingType(rating);
  
  // Настройка размера звезд в зависимости от пропса size
  const getStarSize = () => {
    switch (size) {
      case "sm": return 12;
      case "lg": return 20;
      default: return 16;
    }
  };

  const starSize = getStarSize();

  // Генерация звездочек
  for (let i = 1; i <= maxRating; i++) {
    stars.push(
      <Star 
        key={i} 
        size={starSize} 
        className={cn(
          i <= rating ? color : "text-gray-300",
          "transition-all duration-200"
        )}
      />
    );
  }

  // Получение текста для бейджа на основе типа рейтинга
  const getBadgeText = () => {
    switch (type) {
      case "positive": return "Хороший";
      case "neutral": return "Нейтральный";
      case "negative": return "Плохой";
    }
  };

  // Получение класса для бейджа на основе типа рейтинга
  const getBadgeClass = () => {
    switch (type) {
      case "positive": return "bg-green-500 hover:bg-green-600";
      case "neutral": return "bg-amber-500 hover:bg-amber-600";
      case "negative": return "bg-red-500 hover:bg-red-600";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {stars}
        {showValue && (
          <span className={cn("ml-1 text-sm font-medium", color.split(' ')[0])}>
            {rating}
          </span>
        )}
      </div>
      
      {showBadge && (
        <Badge className={getBadgeClass()}>
          {getBadgeText()}
        </Badge>
      )}
    </div>
  );
};

export default RatingStars;
