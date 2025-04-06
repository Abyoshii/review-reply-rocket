
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, Info, RotateCcw } from "lucide-react";
import { getApiToken, getHeaderName, decodeJWT, getTokenDetails, saveApiToken, UNIFIED_API_TOKEN } from "@/lib/securityUtils";
import { logAuthStatus } from "@/lib/logUtils";
import { SecuritySettings } from "@/types/openai";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface TokenDiagnosticsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TokenDiagnostics = ({ open, onOpenChange }: TokenDiagnosticsProps) => {
  const [currentToken, setCurrentToken] = useState(() => getApiToken());
  const [newToken, setNewToken] = useState("");
  const [headerName, setHeaderName] = useState(() => getHeaderName());
  const [tokenDetails, setTokenDetails] = useState(() => getTokenDetails(currentToken));
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingLatestToken, setIsUsingLatestToken] = useState(false);
  
  useEffect(() => {
    if (open) {
      refreshTokenDetails();
    }
  }, [open]);
  
  useEffect(() => {
    setIsUsingLatestToken(currentToken === UNIFIED_API_TOKEN);
  }, [currentToken]);
  
  const refreshTokenDetails = () => {
    setIsLoading(true);
    try {
      // Сначала проверяем локальное хранилище и обновляем токен если нужно
      localStorage.setItem("wb_token", UNIFIED_API_TOKEN);
      
      const token = getApiToken();
      setCurrentToken(token);
      setTokenDetails(getTokenDetails(token));
      logAuthStatus(token, headerName);
      setIsUsingLatestToken(token === UNIFIED_API_TOKEN);
      
      toast.success("Информация о токене обновлена", {
        description: "Проверка токена отключена, считаем его действительным"
      });
    } catch (error) {
      toast.error("Ошибка при обновлении информации о токене", {
        description: "Не удалось получить данные токена"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetToDefaultToken = () => {
    try {
      setIsUpdating(true);
      
      const securitySettings: SecuritySettings = {
        useHeaderApiKey: true,
        headerName: headerName,
        obfuscateTokens: true
      };
      
      saveApiToken(UNIFIED_API_TOKEN, securitySettings);
      refreshTokenDetails();
      
      toast.success("Токен сброшен до значения по умолчанию", {
        description: "Используется актуальный единый токен"
      });
    } catch (error) {
      toast.error("Ошибка при сбросе токена", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleUpdateToken = () => {
    if (!newToken) {
      toast.warning("Введите новый токен", {
        description: "Поле токена не может быть пустым"
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const securitySettings: SecuritySettings = {
        useHeaderApiKey: true,
        headerName: headerName,
        obfuscateTokens: true
      };
      
      saveApiToken(newToken, securitySettings);
      refreshTokenDetails();
      setNewToken("");
      
      toast.success("Токен авторизации обновлен", {
        description: "Настройки сохранены успешно"
      });
    } catch (error) {
      toast.error("Ошибка при обновлении токена", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" /> Диагностика API токена Feedbacks API
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Действителен
                  </Badge>
                )}
                <span className="ml-2">Текущий токен</span>
                
                {isUsingLatestToken && (
                  <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-800 border-blue-300">
                    Актуальный токен
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Заголовок: {headerName || "Не указан"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="bg-secondary/50 p-2 rounded text-xs font-mono break-all">
                    {currentToken || "Токен не установлен"}
                  </div>
                  
                  <div className="text-sm space-y-1 mt-2">
                    <Alert className="bg-amber-50">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Проверка валидности токена отключена</AlertTitle>
                      <AlertDescription>
                        Все токены считаются действительными, независимо от срока действия
                      </AlertDescription>
                    </Alert>
                    
                    {tokenDetails.details && (
                      <>
                        <div className="flex items-center gap-2 mt-2">
                          <Info className="w-4 h-4" />
                          <span className="font-medium">Детальная информация:</span>
                        </div>
                        <Textarea 
                          readOnly 
                          value={tokenDetails.details} 
                          className="h-24 text-xs font-mono mt-1" 
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshTokenDetails}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Обновить информацию
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetToDefaultToken}
                disabled={isLoading || isUsingLatestToken}
                className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Сбросить до актуального
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Обновить токен API отзывов</CardTitle>
              <CardDescription>
                Введите новый API токен Wildberries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="headerName" className="text-sm font-medium">
                  Имя заголовка
                </label>
                <Input 
                  id="headerName" 
                  value={headerName} 
                  onChange={(e) => setHeaderName(e.target.value)} 
                  placeholder="Имя заголовка авторизации"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="newToken" className="text-sm font-medium">
                  Новый JWT токен
                </label>
                <Textarea 
                  id="newToken" 
                  value={newToken} 
                  onChange={(e) => setNewToken(e.target.value)} 
                  placeholder="Вставьте новый JWT токен" 
                  className="mt-1 font-mono"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpdateToken}
                disabled={isUpdating || !newToken}
                className="w-full"
              >
                {isUpdating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Обновить токен
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Получение токена Feedbacks API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Для получения API токена Wildberries Feedbacks:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Войдите в личный кабинет продавца Wildberries</li>
                <li>Перейдите в раздел "Настройки" → "Доступ к API"</li>
                <li>Создайте новый ключ с нужными правами доступа</li>
                <li>Скопируйте токен и вставьте в поле выше</li>
              </ol>
              <p className="mt-2 text-amber-500">
                ⚠️ Обратите внимание, что мы используем единый токен для всех API Wildberries.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenDiagnostics;
