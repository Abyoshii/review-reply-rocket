
import { useState } from "react";
import { WbQuestion, PhotoLink, WbQuestionAnswerRequest } from "@/types/wb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { WbAPI } from "@/lib/api";
import { Calendar, User, ArrowUpRight, MessageSquare, CheckCircle, Eye, X } from "lucide-react";

interface QuestionsTableProps {
  questions: WbQuestion[];
  loading: boolean;
  onRefresh: () => void;
}

const QuestionsTable = ({ questions, loading, onRefresh }: QuestionsTableProps) => {
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [processingQuestions, setProcessingQuestions] = useState<Set<string>>(new Set());

  // Компактное форматирование даты
  const formatDateCompact = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/(\d{2})\.(\d{2})\.(\d{2}), (\d{2}):(\d{2})/, '$1.$2.$3, $4:$5');
    } catch (error) {
      console.error("Ошибка форматирования даты:", error);
      return dateString;
    }
  };

  const handleAnswerTextChange = (questionId: string, text: string) => {
    setAnswerText(prev => ({ ...prev, [questionId]: text }));
  };

  const handleQuestion = async (questionId: string, actionType: "answer" | "edit" | "decline" | "markViewed") => {
    if ((actionType === "answer" || actionType === "edit") && !answerText[questionId]) {
      toast.error("Введите текст ответа");
      return;
    }

    setProcessingQuestions(prev => new Set(prev).add(questionId));

    try {
      const request: WbQuestionAnswerRequest = {
        id: questionId,
        type: actionType
      };

      if (actionType === "answer" || actionType === "edit") {
        request.text = answerText[questionId];
      }

      await WbAPI.handleQuestion(request);
      
      toast.success(
        actionType === "answer" ? "Ответ успешно отправлен" :
        actionType === "edit" ? "Ответ успешно отредактирован" :
        actionType === "decline" ? "Вопрос отклонен" :
        "Вопрос отмечен как просмотренный"
      );
      
      onRefresh();
      
      // Очистим поле ввода после успешного действия
      if (actionType === "answer" || actionType === "edit") {
        setAnswerText(prev => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
      }
    } catch (error) {
      console.error(`Error ${actionType} question:`, error);
      toast.error(`Ошибка при выполнении действия. Проверьте консоль для деталей.`);
    } finally {
      setProcessingQuestions(prev => {
        const updated = new Set(prev);
        updated.delete(questionId);
        return updated;
      });
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8 dark:text-gray-300 transition-colors duration-300">Загрузка вопросов...</div>
      ) : !Array.isArray(questions) || questions.length === 0 ? (
        <div className="text-center py-8 dark:text-gray-300 transition-colors duration-300">Нет вопросов для отображения</div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id} className={`p-4 shadow-sm dark:bg-gray-700 dark:text-white transition-colors duration-300 ${question.answer ? 'border-l-4 border-green-500' : ''}`}>
              <div className="flex flex-col space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline" className="flex items-center gap-1 dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                    <Calendar size={14} /> {formatDateCompact(question.createdDate)}
                  </Badge>
                  
                  {question.userName && (
                    <Badge variant="outline" className="flex items-center gap-1 dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                      <User size={14} /> {question.userName}
                    </Badge>
                  )}
                  
                  {question.wasViewed && (
                    <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                      Просмотрен
                    </Badge>
                  )}
                  
                  {question.answer && (
                    <Badge className="bg-green-500 dark:bg-green-600 transition-colors duration-300 flex items-center gap-1">
                      <CheckCircle size={14} /> ОТВЕЧЕННЫЙ ВОПРОС
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-sm bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded dark:text-gray-200 transition-colors duration-300">
                        Артикул: {question.productDetails?.supplierArticle || 'Н/Д'}
                      </span>
                      {question.productDetails?.brandName && (
                        <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                          {question.productDetails.brandName}
                        </Badge>
                      )}
                      {question.productDetails?.nmId && (
                        <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300 transition-colors duration-300">
                          NM: {question.productDetails.nmId}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg dark:text-white transition-colors duration-300">
                      {question.productDetails?.productName || 'Название товара отсутствует'}
                    </h3>
                  </div>
                  
                  {Array.isArray(question.photoLinks) && question.photoLinks.length > 0 && question.photoLinks[0].miniSize && (
                    <div className="w-20 h-20 rounded overflow-hidden border dark:border-gray-600 transition-colors duration-300 flex-shrink-0">
                      <a href={question.photoLinks[0].fullSize} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <img src={question.photoLinks[0].miniSize} alt="Фото товара" className="w-full h-full object-cover" />
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="border-l-4 border-wb-light dark:border-purple-500 pl-3 py-1 bg-gray-50 dark:bg-gray-800 rounded transition-colors duration-300">
                  <div className="text-gray-700 dark:text-gray-300 transition-colors duration-300 mb-2">
                    <p className="font-medium flex items-center gap-1 mb-1">
                      <MessageSquare size={14} /> Вопрос клиента:
                    </p>
                    <p className="whitespace-pre-line">
                      {question.text || "Текст вопроса отсутствует"}
                    </p>
                  </div>
                </div>
                
                {question.answer && question.answer.text && (
                  <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <p className="font-medium text-green-700 dark:text-green-400 mb-1">Ответ:</p>
                    <p className="text-gray-700 dark:text-gray-300">{question.answer.text}</p>
                  </div>
                )}
                
                {!question.answer ? (
                  <div className="mt-3 space-y-2">
                    <Textarea 
                      placeholder="Введите ответ на вопрос..."
                      value={answerText[question.id] || ""}
                      onChange={(e) => handleAnswerTextChange(question.id, e.target.value)}
                      className="min-h-24 dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-colors duration-300"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      {!question.wasViewed && (
                        <Button
                          variant="outline"
                          onClick={() => handleQuestion(question.id, "markViewed")}
                          disabled={processingQuestions.has(question.id)}
                          className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          <Eye size={16} className="mr-1" /> 
                          {processingQuestions.has(question.id) ? "Обработка..." : "Отметить просмотренным"}
                        </Button>
                      )}
                      
                      <Button
                        className="bg-wb-secondary hover:bg-wb-accent dark:bg-purple-700 dark:hover:bg-purple-800 transition-colors duration-300"
                        onClick={() => handleQuestion(question.id, "answer")}
                        disabled={!answerText[question.id] || processingQuestions.has(question.id)}
                      >
                        <CheckCircle size={16} className="mr-1" />
                        {processingQuestions.has(question.id) ? "Отправка..." : "Ответить на вопрос"}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={() => handleQuestion(question.id, "decline")}
                        disabled={processingQuestions.has(question.id)}
                      >
                        <X size={16} className="mr-1" />
                        {processingQuestions.has(question.id) ? "Обработка..." : "Отклонить вопрос"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {question.answer.editable && (
                      <>
                        <Textarea 
                          placeholder="Введите новый ответ на вопрос..."
                          value={answerText[question.id] || ""}
                          onChange={(e) => handleAnswerTextChange(question.id, e.target.value)}
                          className="min-h-24 dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-colors duration-300"
                        />
                        
                        <Button
                          className="bg-wb-secondary hover:bg-wb-accent dark:bg-purple-700 dark:hover:bg-purple-800 transition-colors duration-300"
                          onClick={() => handleQuestion(question.id, "edit")}
                          disabled={!answerText[question.id] || processingQuestions.has(question.id)}
                        >
                          {processingQuestions.has(question.id) ? "Сохранение..." : "Редактировать ответ"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsTable;
