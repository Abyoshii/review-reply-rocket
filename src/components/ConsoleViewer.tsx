
import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Trash2, ArrowDownCircle, Eye, EyeOff, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  id: number;
  time: string;
  type: 'log' | 'error' | 'warn' | 'info';
  content: string[];
}

const ConsoleViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'warnings'>('all');
  const [errorCount, setErrorCount] = useState(0);
  const [warnCount, setWarnCount] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const logCounter = useRef(0);
  
  const formatLogContent = (args: any[]): string[] => {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    });
  };
  
  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      const newLog: LogEntry = {
        id: ++logCounter.current,
        time: new Date().toLocaleTimeString(),
        type: 'log',
        content: formatLogContent(args)
      };
      setLogs(prev => [...prev, newLog]);
    };

    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      const newLog: LogEntry = {
        id: ++logCounter.current,
        time: new Date().toLocaleTimeString(),
        type: 'error',
        content: formatLogContent(args)
      };
      setLogs(prev => [...prev, newLog]);
      setErrorCount(prev => prev + 1);
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      const newLog: LogEntry = {
        id: ++logCounter.current,
        time: new Date().toLocaleTimeString(),
        type: 'warn',
        content: formatLogContent(args)
      };
      setLogs(prev => [...prev, newLog]);
      setWarnCount(prev => prev + 1);
    };

    console.info = (...args: any[]) => {
      originalConsole.info(...args);
      const newLog: LogEntry = {
        id: ++logCounter.current,
        time: new Date().toLocaleTimeString(),
        type: 'info',
        content: formatLogContent(args)
      };
      setLogs(prev => [...prev, newLog]);
    };

    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      scrollToBottom();
    }
  }, [logs, isVisible]);

  const clearLogs = () => {
    setLogs([]);
    setErrorCount(0);
    setWarnCount(0);
  };
  
  const downloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.time}] [${log.type.toUpperCase()}] ${log.content.join(' ')}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'errors') return log.type === 'error';
    if (activeTab === 'warnings') return log.type === 'warn';
    return true;
  });

  const toggleConsole = () => setIsVisible(prev => !prev);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={toggleConsole} 
          className="flex items-center gap-2 shadow-lg"
        >
          <Terminal className="w-4 h-4" />
          <span>Консоль</span>
          {(errorCount > 0 || warnCount > 0) && (
            <div className="flex gap-1">
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errorCount}
                </Badge>
              )}
              {warnCount > 0 && (
                <Badge variant="warning" className="text-xs bg-yellow-500">
                  {warnCount}
                </Badge>
              )}
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg h-1/3 min-h-[250px]">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <h2 className="text-sm font-medium">Консоль</h2>
          <div className="flex gap-1">
            {errorCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                Ошибок: {errorCount}
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500">
                Предупреждений: {warnCount}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={scrollToBottom}
            title="Прокрутить вниз"
          >
            <ArrowDownCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={downloadLogs}
            title="Скачать логи"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={clearLogs}
            title="Очистить логи"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleConsole}
            title="Скрыть консоль"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <div className="px-4">
          <TabsList className="mb-2">
            <TabsTrigger value="all">Все логи ({logs.length})</TabsTrigger>
            <TabsTrigger value="errors">Ошибки ({errorCount})</TabsTrigger>
            <TabsTrigger value="warnings">Предупреждения ({warnCount})</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab} className="m-0">
          <ScrollArea className="h-[calc(33vh-80px)] max-h-[calc(100vh-350px)] min-h-[170px]" ref={logContainerRef}>
            <div className="p-4 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Логи отсутствуют
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`mb-1 ${
                      log.type === 'error'
                        ? 'text-red-500'
                        : log.type === 'warn'
                        ? 'text-yellow-500'
                        : log.type === 'info'
                        ? 'text-blue-500'
                        : 'text-foreground'
                    }`}
                  >
                    <span className="text-muted-foreground">[{log.time}]</span>{' '}
                    {log.content.map((content, i) => (
                      <pre 
                        key={i} 
                        className="whitespace-pre-wrap break-all inline-block"
                      >
                        {i > 0 ? ' ' : ''}{content}
                      </pre>
                    ))}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsoleViewer;
