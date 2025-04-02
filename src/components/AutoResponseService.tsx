
import { useState, useEffect, useRef } from "react";
import { AutoResponderSettings } from "@/types/openai";
import { WbAPI, OpenAIAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { WbReview } from "@/types/wb";
import { Bot, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface AutoResponseServiceProps {
  isActive: boolean;
  settings: AutoResponderSettings;
  interval: number;
  onStatusUpdate: (status: {
    isRunning: boolean;
    lastCheck: Date | null;
    processedCount: number;
    successCount: number;
    failedCount: number;
  }) => void;
  onDeactivate: () => void;
}

const AutoResponseService = ({
  isActive,
  settings,
  interval,
  onStatusUpdate,
  onDeactivate
}: AutoResponseServiceProps) => {
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const isProcessingRef = useRef(false);

  // Report status to parent component
  useEffect(() => {
    onStatusUpdate({
      isRunning: isActive,
      lastCheck,
      processedCount,
      successCount,
      failedCount
    });
  }, [isActive, lastCheck, processedCount, successCount, failedCount, onStatusUpdate]);

  // Reset counters when service is deactivated
  useEffect(() => {
    if (!isActive) {
      setProcessedCount(0);
      setSuccessCount(0);
      setFailedCount(0);
    }
  }, [isActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
      }
    };
  }, []);

  // Manage the timer based on active state
  useEffect(() => {
    if (isActive) {
      // Initial check when activated
      performCheck();

      // Set up the interval timer for subsequent checks
      checkTimerRef.current = setInterval(() => {
        performCheck();
      }, interval * 60 * 1000);

      return () => {
        if (checkTimerRef.current) {
          clearInterval(checkTimerRef.current);
          checkTimerRef.current = null;
        }
      };
    } else if (checkTimerRef.current) {
      clearInterval(checkTimerRef.current);
      checkTimerRef.current = null;
    }
  }, [isActive, interval, settings]);

  const performCheck = async () => {
    if (isProcessingRef.current) {
      console.log("Already processing, skipping this check");
      return;
    }

    try {
      isProcessingRef.current = true;
      console.log("Performing automatic check for new reviews...");
      setLastCheck(new Date());

      // Get unanswered reviews
      const response = await WbAPI.getReviews({
        isAnswered: false,
        take: settings.maxReviewsPerRequest,
        skip: 0,
        order: "dateDesc",
        hasText: true // Only get reviews with text
      });

      if (!response.data || !response.data.feedbacks || !Array.isArray(response.data.feedbacks)) {
        console.error("Invalid response format from API", response);
        toast({
          title: "Ошибка автоответчика",
          description: "Некорректный ответ API при получении отзывов",
          variant: "destructive"
        });
        return;
      }

      const unansweredReviews = response.data.feedbacks;
      
      if (unansweredReviews.length === 0) {
        console.log("No unanswered reviews found");
        return;
      }

      console.log(`Found ${unansweredReviews.length} unanswered reviews`);
      toast({
        title: "Автоответчик",
        description: `Найдено ${unansweredReviews.length} отзывов без ответа. Начинаю обработку...`,
      });

      let processed = 0;
      let success = 0;
      let failed = 0;

      // Process reviews one by one to avoid rate limiting
      for (const review of unansweredReviews) {
        try {
          if (!isActive) break; // Stop if deactivated mid-processing
          
          // Skip reviews without text
          if (!review.text && !review.pros && !review.cons) {
            console.log(`Skipping review ${review.id} with no text`);
            continue;
          }
          
          // Generate answer
          const reviewText = [
            review.text || "",
            review.pros ? `Плюсы: ${review.pros}` : '',
            review.cons ? `Минусы: ${review.cons}` : ''
          ].filter(Boolean).join('\n');
          
          console.log(`Generating answer for review ${review.id}`);
          
          const answerResponse = await OpenAIAPI.generateAnswer({
            reviewText,
            reviewId: review.id,
            productName: review.productName || review.productDetails?.productName
          });
          
          console.log(`Answer generated for review ${review.id}, sending to WB`);
          
          // Send answer to Wildberries
          await WbAPI.sendAnswer({
            id: review.id,
            text: answerResponse.answer
          });
          
          console.log(`Answer sent for review ${review.id}`);
          success++;

          // Notify of successful send
          toast({
            title: "Автоответ отправлен",
            description: `Успешно обработан отзыв для товара: ${review.productName || review.productDetails?.productName || "Без названия"}`,
            variant: "default"
          });
          
        } catch (error) {
          console.error(`Error processing review ${review.id}:`, error);
          failed++;
          
          toast({
            title: "Ошибка обработки отзыва",
            description: `Не удалось обработать отзыв ${review.id}`,
            variant: "destructive"
          });
        }
        
        processed++;
        // Update counters
        setProcessedCount(prev => prev + 1);
        setSuccessCount(prev => prev + success);
        setFailedCount(prev => prev + failed);
        
        // Delay between reviews to avoid API rate limits
        if (processed < unansweredReviews.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Final summary notification
      if (processed > 0) {
        toast({
          title: "Автоответчик: результаты",
          description: `Обработано: ${processed}, Успешно: ${success}, Ошибок: ${failed}`,
          variant: success > 0 ? "default" : "destructive"
        });
      }

    } catch (error) {
      console.error("Auto-response service error:", error);
      toast({
        title: "Ошибка автоответчика",
        description: "Произошла ошибка при работе автоответчика",
        variant: "destructive"
      });
    } finally {
      isProcessingRef.current = false;
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default AutoResponseService;
