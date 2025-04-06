
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewListParams } from "@/types/wb";
import { Filter, Star } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface FilterFormProps {
  onFilterChange: (filters: ReviewListParams) => void;
  loading: boolean;
}

const FilterForm = ({ onFilterChange, loading }: FilterFormProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [order, setOrder] = useState<string>("dateDesc");
  const [reviewCount, setReviewCount] = useState<number>(100);
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filters: ReviewListParams = {
      take: reviewCount,
      skip: 0,
      order: order as "dateAsc" | "dateDesc" | "ratingAsc" | "ratingDesc"
    };

    if (dateRange?.from) {
      filters.dateFrom = dateRange.from.toISOString().split('T')[0];
    }

    if (dateRange?.to) {
      filters.dateTo = dateRange.to.toISOString().split('T')[0];
    }

    if (ratingFilter !== "all") {
      filters.ratingFilter = ratingFilter;
    }

    onFilterChange(filters);
  };

  const handleCountChange = (count: number) => {
    setReviewCount(count);
    
    // Автоматически применяем фильтр при изменении количества отзывов
    const filters: ReviewListParams = {
      take: count,
      skip: 0,
      order: order as "dateAsc" | "dateDesc" | "ratingAsc" | "ratingDesc"
    };

    if (dateRange?.from) {
      filters.dateFrom = dateRange.from.toISOString().split('T')[0];
    }

    if (dateRange?.to) {
      filters.dateTo = dateRange.to.toISOString().split('T')[0];
    }

    if (ratingFilter !== "all") {
      filters.ratingFilter = ratingFilter;
    }

    onFilterChange(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-4">
      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <label
            htmlFor="dateRange"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Период
          </label>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        <div>
          <label
            htmlFor="order"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Сортировка
          </label>
          <Select
            value={order}
            onValueChange={setOrder}
          >
            <SelectTrigger
              id="order"
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <SelectValue placeholder="Выберите сортировку" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800">
              <SelectItem value="dateDesc">Сначала новые</SelectItem>
              <SelectItem value="dateAsc">Сначала старые</SelectItem>
              <SelectItem value="ratingDesc">По убыванию рейтинга</SelectItem>
              <SelectItem value="ratingAsc">По возрастанию рейтинга</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="ratingFilter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Рейтинг
          </label>
          <Select
            value={ratingFilter}
            onValueChange={setRatingFilter}
          >
            <SelectTrigger
              id="ratingFilter"
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <SelectValue placeholder="Фильтр по рейтингу" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800">
              <SelectItem value="all">Все рейтинги</SelectItem>
              <SelectItem value="5" className="flex items-center">
                Только 5 <Star className="ml-1 h-3 w-3 fill-amber-400 text-amber-400" />
              </SelectItem>
              <SelectItem value="4" className="flex items-center">
                Только 4 <Star className="ml-1 h-3 w-3 fill-amber-400 text-amber-400" />
              </SelectItem>
              <SelectItem value="3" className="flex items-center">
                Только 3 <Star className="ml-1 h-3 w-3 fill-amber-400 text-amber-400" />
              </SelectItem>
              <SelectItem value="2" className="flex items-center">
                Только 2 <Star className="ml-1 h-3 w-3 fill-amber-400 text-amber-400" />
              </SelectItem>
              <SelectItem value="1" className="flex items-center">
                Только 1 <Star className="ml-1 h-3 w-3 fill-amber-400 text-amber-400" />
              </SelectItem>
              <SelectItem value="positive">Положительные (4–5 ⭐)</SelectItem>
              <SelectItem value="negative">Отрицательные (1–2 ⭐)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Количество отзывов:
          </label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={reviewCount === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => handleCountChange(30)}
              className={`transition-all duration-300 hover:scale-105 active:scale-95 ${reviewCount === 30 ? "bg-wb-secondary hover:bg-wb-accent" : ""}`}
            >
              30
            </Button>
            <Button
              type="button"
              variant={reviewCount === 50 ? "default" : "outline"}
              size="sm"
              onClick={() => handleCountChange(50)}
              className={`transition-all duration-300 hover:scale-105 active:scale-95 ${reviewCount === 50 ? "bg-wb-secondary hover:bg-wb-accent" : ""}`}
            >
              50
            </Button>
            <Button
              type="button"
              variant={reviewCount === 100 ? "default" : "outline"}
              size="sm"
              onClick={() => handleCountChange(100)}
              className={`transition-all duration-300 hover:scale-105 active:scale-95 ${reviewCount === 100 ? "bg-wb-secondary hover:bg-wb-accent" : ""}`}
            >
              100
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="bg-wb-accent hover:bg-wb-accent/80 dark:bg-purple-700 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Filter className="mr-2 h-4 w-4" />
          {loading ? "Применение..." : "Применить фильтры"}
        </Button>
      </div>
    </form>
  );
};

export default FilterForm;
