import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
interface HeaderProps {
  unansweredCount: number;
  onRefresh: () => void;
}
const Header = ({
  unansweredCount,
  onRefresh
}: HeaderProps) => {
  const [openApiKey, setOpenApiKey] = useState<string>("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState<boolean>(false);
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpenApiKey(e.target.value);
  };
  const handleApiKeySave = () => {
    localStorage.setItem("openai_api_key", openApiKey);
    setIsApiKeyDialogOpen(false);
  };
  return <header className="bg-wb-primary text-white p-4 rounded-lg shadow-md mb-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Asterion</h1>
            <p className="text-gray-300 mt-1">
              Автоматизированная обработка отзывов Wildberries с помощью OpenAI
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 py-2 px-4 rounded-full">
              <span className="font-medium">Необработанных отзывов: </span>
              <span className="text-wb-secondary font-bold">{unansweredCount}</span>
            </div>
            
            <Button variant="outline" onClick={onRefresh} className="border-white/20 hover:bg-white/10 hover:text-white">
              Обновить
            </Button>

            <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white">
                  API ключ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Настройка API ключа OpenAI</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <p className="text-sm text-gray-500">
                    Введите свой API ключ OpenAI. Ключ будет сохранен только в вашем браузере и не будет передаваться на сервер.
                  </p>
                  <Input placeholder="sk-..." value={openApiKey} onChange={handleApiKeyChange} className="col-span-3" />
                  <Button onClick={handleApiKeySave} className="bg-wb-secondary hover:bg-wb-accent">
                    Сохранить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;