
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Bot, Play, Pause } from "lucide-react";
import AutoResponseSettings from "@/components/AutoResponseSettings";
import AutoResponseService from "@/components/AutoResponseService";
import { AutoResponderSettings } from "@/types/openai";

interface HeaderAutoResponseProps {
  onRefresh: () => void;
}

const HeaderAutoResponse = ({ onRefresh }: HeaderAutoResponseProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAutoResponseActive, setIsAutoResponseActive] = useState(false);
  const [autoResponseSettings, setAutoResponseSettings] = useState<AutoResponderSettings | null>(null);
  const [autoResponseInterval, setAutoResponseInterval] = useState<number>(15);
  const [serviceStatus, setServiceStatus] = useState({
    isRunning: false,
    lastCheck: null as Date | null,
    processedCount: 0,
    successCount: 0,
    failedCount: 0
  });

  // Load saved auto-response state
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("auto_response_active");
      if (savedState === "true") {
        const savedSettings = localStorage.getItem("auto_response_settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setAutoResponseSettings(parsed.settings);
          setAutoResponseInterval(parsed.interval);
          setIsAutoResponseActive(true);
        }
      }
    } catch (e) {
      console.error("Failed to load auto response state", e);
    }
  }, []);

  // Save auto-response state when it changes
  useEffect(() => {
    try {
      localStorage.setItem("auto_response_active", isAutoResponseActive ? "true" : "false");
    } catch (e) {
      console.error("Failed to save auto response state", e);
    }
  }, [isAutoResponseActive]);

  const handleStartAutoResponse = (settings: AutoResponderSettings, interval: number) => {
    setAutoResponseSettings(settings);
    setAutoResponseInterval(interval);
    setIsAutoResponseActive(true);
    setSettingsOpen(false);
    
    toast({
      title: "Автоответчик запущен",
      description: `Будет проверять отзывы каждые ${interval} минут`,
    });
  };

  const handleStopAutoResponse = () => {
    setIsAutoResponseActive(false);
    setSettingsOpen(false);
    
    toast({
      title: "Автоответчик остановлен",
      description: `Автоматические ответы отключены`,
    });
  };

  const handleToggleAutoResponse = () => {
    if (isAutoResponseActive) {
      handleStopAutoResponse();
    } else {
      setSettingsOpen(true);
    }
  };

  const formatTimeSince = (date: Date | null) => {
    if (!date) return "никогда";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec} сек. назад`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} мин. назад`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ч. назад`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн. назад`;
  };

  return (
    <>
      <Button
        variant="nav"
        size="navIcon"
        onClick={handleToggleAutoResponse}
        className={`relative text-white rounded-md ${isAutoResponseActive ? 'bg-purple-800/50 hover:bg-purple-700/80' : ''}`}
        title={isAutoResponseActive ? "Остановить автоответчик" : "Запустить автоответчик"}
      >
        {isAutoResponseActive ? (
          <>
            <Bot size={20} className="text-purple-300 animate-pulse" />
            <Badge className="absolute -top-1 -right-1 bg-green-500 text-[10px] px-1 min-w-4 h-4 flex items-center justify-center">
              {serviceStatus.processedCount}
            </Badge>
          </>
        ) : (
          <Bot size={20} />
        )}
      </Button>
      
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <AutoResponseSettings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onStartAutoResponse={handleStartAutoResponse}
          onStopAutoResponse={handleStopAutoResponse}
          isAutoResponseActive={isAutoResponseActive}
        />
      </Dialog>
      
      {isAutoResponseActive && autoResponseSettings && (
        <AutoResponseService
          isActive={isAutoResponseActive}
          settings={autoResponseSettings}
          interval={autoResponseInterval}
          onStatusUpdate={setServiceStatus}
          onDeactivate={handleStopAutoResponse}
        />
      )}
    </>
  );
};

export default HeaderAutoResponse;
