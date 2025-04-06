
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionListParams } from "@/types/wb";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState } from "react";

const filterSchema = z.object({
  isAnswered: z.boolean().default(false),
  take: z.number().int().min(1).max(5000).default(100),
  skip: z.number().int().min(0).max(199990).default(0),
  order: z.enum(["dateAsc", "dateDesc"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

interface QuestionsFilterFormProps {
  onFilterChange: (filters: QuestionListParams) => void;
  loading: boolean;
}

const QuestionsFilterForm = ({ onFilterChange, loading }: QuestionsFilterFormProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Создаем форму с начальными значениями
  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      isAnswered: false,
      take: 100,
      skip: 0,
      order: "dateDesc",
      dateFrom: undefined,
      dateTo: undefined,
    },
  });

  // Обработчик отправки формы
  const onSubmit = (values: z.infer<typeof filterSchema>) => {
    onFilterChange(values as QuestionListParams);
  };

  // Handle take value change
  const handleTakeChange = (value: string) => {
    form.setValue("take", parseInt(value));
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    
    // Update form values
    if (range?.from) {
      const fromDate = range.from.toISOString().split('T')[0];
      form.setValue("dateFrom", fromDate);
    } else {
      form.setValue("dateFrom", undefined);
    }
    
    if (range?.to) {
      const toDate = range.to.toISOString().split('T')[0];
      form.setValue("dateTo", toDate);
    } else {
      form.setValue("dateTo", undefined);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Фильтр вопросов</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Фильтр по ответу */}
              <FormField
                control={form.control}
                name="isAnswered"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                    <FormLabel>Имеют ответ</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:animate-pulse"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Сортировка */}
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сортировка</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выбрать сортировку" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dateDesc">Сначала новые</SelectItem>
                        <SelectItem value="dateAsc">Сначала старые</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Количество вопросов как переключатели */}
              <FormField
                control={form.control}
                name="take"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество вопросов</FormLabel>
                    <FormControl>
                      <ToggleGroup 
                        type="single" 
                        value={field.value.toString()} 
                        onValueChange={handleTakeChange}
                        className="justify-start"
                      >
                        <ToggleGroupItem value="30" className="transition-all duration-300 data-[state=on]:animate-pulse">30</ToggleGroupItem>
                        <ToggleGroupItem value="50" className="transition-all duration-300 data-[state=on]:animate-pulse">50</ToggleGroupItem>
                        <ToggleGroupItem value="100" className="transition-all duration-300 data-[state=on]:animate-pulse">100</ToggleGroupItem>
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Диапазон дат */}
              <FormItem className="col-span-full sm:col-span-2">
                <FormLabel>Период</FormLabel>
                <DateRangePicker 
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                />
              </FormItem>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-wb-primary hover:bg-wb-primary/90 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {loading ? "Загрузка..." : "Применить фильтры"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default QuestionsFilterForm;
