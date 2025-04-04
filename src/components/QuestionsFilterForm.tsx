
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface QuestionsFilterFormProps {
  onFilter: () => void;
}

const QuestionsFilterForm: React.FC<QuestionsFilterFormProps> = ({ onFilter }) => {
  return (
    <div className="flex flex-col md:flex-row gap-2 mb-4">
      <Input placeholder="Поиск по товару или вопросу" className="md:w-1/3" />
      <Select defaultValue="date">
        <SelectTrigger className="md:w-1/4">
          <SelectValue placeholder="Сортировка" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">По дате</SelectItem>
          <SelectItem value="product">По товару</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={onFilter}>Применить</Button>
    </div>
  );
};

export default QuestionsFilterForm;
