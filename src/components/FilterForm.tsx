
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewListParams } from "@/types/wb";

const filterSchema = z.object({
  isAnswered: z.boolean().default(false),
  take: z.number().int().min(1).max(5000).default(100),
  skip: z.number().int().min(0).max(199990).default(0),
  order: z.enum(["dateAsc", "dateDesc"]).optional(),
  nmId: z.union([z.number().int().positive(), z.string().length(0)]).transform(val => 
    typeof val === "string" && val === "" ? undefined : (typeof val === "string" ? parseInt(val) : val)
  ).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

interface FilterFormProps {
  onFilterChange: (filters: ReviewListParams) => void;
  loading: boolean;
}

const FilterForm = ({ onFilterChange, loading }: FilterFormProps) => {
  // Создаем форму с начальными значениями
  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      isAnswered: false,
      take: 100,
      skip: 0,
      order: "dateDesc",
      nmId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    },
  });

  // Обработчик отправки формы
  const onSubmit = (values: z.infer<typeof filterSchema>) => {
    onFilterChange(values as ReviewListParams);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Фильтр отзывов</CardTitle>
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

              {/* Артикул */}
              <FormField
                control={form.control}
                name="nmId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Артикул (nmId)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите артикул"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : parseInt(e.target.value) || "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Кол-во отзывов */}
              <FormField
                control={form.control}
                name="take"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Кол-во отзывов</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5000}
                        placeholder="Кол-во отзывов"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Смещение */}
              <FormField
                control={form.control}
                name="skip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пропустить отзывов</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={199990}
                        placeholder="Пропустить отзывов"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Дата от */}
              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата от</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Дата от"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Дата до */}
              <FormField
                control={form.control}
                name="dateTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата до</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Дата до"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-wb-primary hover:bg-wb-primary/90"
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

export default FilterForm;
