
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface QuestionsTableProps {
  questions: any[];
  loading: boolean;
  onRefresh: () => void;
}

const QuestionsTable: React.FC<QuestionsTableProps> = ({ questions, loading, onRefresh }) => {
  return (
    <div>
      {loading ? (
        <div className="text-center py-10">Загрузка вопросов...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-10">Нет вопросов для отображения</div>
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
            {questions.map((question, index) => (
              <TableRow key={index}>
                <TableCell>{question.date || "Н/Д"}</TableCell>
                <TableCell>{question.productName || "Н/Д"}</TableCell>
                <TableCell>{question.question || "Н/Д"}</TableCell>
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

export default QuestionsTable;
