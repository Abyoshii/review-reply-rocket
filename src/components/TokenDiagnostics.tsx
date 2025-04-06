
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, Info } from "lucide-react";
import { getApiToken, getHeaderName, decodeJWT, getTokenDetails, saveApiToken } from "@/lib/securityUtils";
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
  
  const refreshTokenDetails = () => {
    setIsLoading(true);
    try {
      const token = getApiToken();
      setCurrentToken(token);
      setTokenDetails(getTokenDetails(token));
      logAuthStatus(token, headerName);
      
      toast.success("Информация о токене обновлена", {
        description: "Токен успешно проверен"
      });
    } catch (error) {
      toast.error("Ошибка при обновлении информации о токене", {
        description: "Не удалось получить данные токена"
      });
    } finally {
      setIsLoading(false);
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
            <Shield className="w-5 h-5" /> Диагностика API токена
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          {/* Статус текущего токена */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  tokenDetails.isValid ? (
                    tokenDetails.isExpired ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Просрочен
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Действителен
                      </Badge>
                    )
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Недействителен
                    </Badge>
                  )
                )}
                <span className="ml-2">Текущий токен</span>
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
                  
                  {tokenDetails.isValid ? (
                    <div className="text-sm space-y-1 mt-2">
                      {tokenDetails.expiresAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {tokenDetails.isExpired ? (
                              <span className="text-destructive font-semibold">
                                Истек: {tokenDetails.expiresAt.toLocaleDateString()} {tokenDetails.expiresAt.toLocaleTimeString()}
                              </span>
                            ) : (
                              <span>
                                Действителен до: {tokenDetails.expiresAt.toLocaleDateString()} {tokenDetails.expiresAt.toLocaleTimeString()}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {tokenDetails.category !== undefined && (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>Категория токена: {tokenDetails.category}</span>
                        </div>
                      )}
                      
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
                  ) : (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Данные токена не получены</AlertTitle>
                      <AlertDescription>
                        Токен отсутствует или имеет неверный формат
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={refreshTokenDetails}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Обновить информацию
              </Button>
            </CardFooter>
          </Card>
          
          {/* Предупреждения и рекомендации */}
          {!isLoading && tokenDetails.isExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Токен просрочен!</AlertTitle>
              <AlertDescription>
                Ваш API токен истек. Обновите токен, чтобы продолжить использование API.
              </AlertDescription>
            </Alert>
          )}
          
          {!isLoading && !tokenDetails.isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Недействительный токен</AlertTitle>
              <AlertDescription>
                Токен имеет неверный формат или не может быть декодирован. Установите корректный JWT токен.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Форма ввода нового токена */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Обновить токен</CardTitle>
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
          
          {/* Советы по получению токена */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Получение токена</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Для получения API токена Wildberries:
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
