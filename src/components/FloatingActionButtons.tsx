
import React from "react";
import { Button } from "@/components/ui/button";
import { Reply, Archive, Trash2 } from "lucide-react";

export interface FloatingActionButtonsProps {
  selectedCount: number; // Added prop
  onReply?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  selectedCount = 0,
  onReply,
  onArchive,
  onDelete
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col md:flex-row gap-2">
      <Button
        variant="default"
        size="lg"
        className="rounded-full px-6 shadow-lg"
        onClick={onReply}
      >
        <Reply className="mr-2 h-4 w-4" />
        <span>Ответить ({selectedCount})</span>
      </Button>
      
      <Button
        variant="secondary"
        size="lg"
        className="rounded-full px-6 shadow-lg"
        onClick={onArchive}
      >
        <Archive className="mr-2 h-4 w-4" />
        <span>В архив</span>
      </Button>
      
      <Button
        variant="destructive"
        size="lg"
        className="rounded-full px-6 shadow-lg"
        onClick={onDelete}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>Удалить</span>
      </Button>
    </div>
  );
};

export default FloatingActionButtons;
