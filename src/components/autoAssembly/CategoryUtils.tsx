
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Droplets, Shirt, Paperclip } from "lucide-react";
import { ProductCategory } from "@/types/wb";

// Utility for getting category display elements
export const getCategoryDisplay = (category?: ProductCategory) => {
  switch (category) {
    case ProductCategory.PERFUME:
      return {
        icon: <Droplets className="h-4 w-4" />,
        badge: <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 flex items-center gap-1">
                <Droplets className="h-3 w-3" /> {category}
              </Badge>
      };
    case ProductCategory.CLOTHING:
      return {
        icon: <Shirt className="h-4 w-4" />,
        badge: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1">
                <Shirt className="h-3 w-3" /> {category}
              </Badge>
      };
    case ProductCategory.MISC:
    default:
      return {
        icon: <Paperclip className="h-4 w-4" />,
        badge: <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 flex items-center gap-1">
                <Paperclip className="h-3 w-3" /> {category || "Мелочёвка"}
              </Badge>
      };
  }
};

// Utility for rendering cargo type badge
export const renderCargoTypeBadge = (cargoType: number, cargoTypes: { id: number; name: string }[]) => {
  const type = cargoTypes.find(t => t.id === cargoType);
  
  switch (cargoType) {
    case 0:
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        {type?.name || "Обычный"}
      </Badge>;
    case 1:
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
        {type?.name || "Крупногабаритный"}
      </Badge>;
    case 2:
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
        {type?.name || "Тяжеловесный"}
      </Badge>;
    default:
      return <Badge variant="outline">Неизвестно</Badge>;
  }
};
