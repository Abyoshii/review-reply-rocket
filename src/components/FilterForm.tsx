
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FilterFormProps {
  onFilter: () => void;
}

const FilterForm: React.FC<FilterFormProps> = ({ onFilter }) => {
  return (
    <div className="flex flex-col md:flex-row gap-2 mb-4">
      <Input placeholder="Поиск по товару или отзыву" className="md:w-1/3" />
      <Select defaultValue="all">
        <SelectTrigger className="md:w-1/4">
          <SelectValue placeholder="Рейтинг" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все оценки</SelectItem>
          <SelectItem value="5">5 звезд</SelectItem>
          <SelectItem value="4">4 звезды</SelectItem>
          <SelectItem value="3">3 звезды</SelectItem>
          <SelectItem value="2">2 звезды</SelectItem>
          <SelectItem value="1">1 звезда</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="date">
        <SelectTrigger className="md:w-1/4">
          <SelectValue placeholder="Сортировка" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">По дате</SelectItem>
          <SelectItem value="rating">По рейтингу</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={onFilter}>Применить</Button>
    </div>
  );
};

export default FilterForm;
