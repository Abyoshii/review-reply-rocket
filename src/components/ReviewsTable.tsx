
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export interface ReviewsTableProps {
  reviews: any[];
  loading: boolean;
  onRefresh: () => void;
  selectedReviews?: any[];  // Added missing prop
  onSelectReview?: (reviewId: number, isSelected: boolean) => void;  // Added missing prop
  onSelectAll?: (ids: number[]) => void;  // Added missing prop
}

const ReviewsTable: React.FC<ReviewsTableProps> = ({ 
  reviews, 
  loading, 
  onRefresh, 
  selectedReviews = [], 
  onSelectReview = () => {}, 
  onSelectAll = () => {} 
}) => {
  return (
    <div>
      {loading ? (
        <div className="text-center py-10">Загрузка отзывов...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10">Нет отзывов для отображения</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead>Вопрос</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review, index) => (
              <TableRow key={index}>
                <TableCell>{review.date || "Н/Д"}</TableCell>
                <TableCell>{review.productName || "Н/Д"}</TableCell>
                <TableCell>{review.question || "Н/Д"}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={onRefresh}>Ответить</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ReviewsTable;
