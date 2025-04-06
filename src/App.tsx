
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import { ThemeProvider } from "./components/ThemeProvider";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarRail } from "./components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import Index from "./pages/Index";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";
import AutoAssembly from "./pages/AutoAssembly";
import Passes from "./pages/Passes";
import Supplies from "./pages/Supplies";
import Boxes from "./pages/Boxes";
import { useState } from "react";
import { Button } from "./components/ui/button";
import { Menu } from "lucide-react";

function App() {
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [unansweredQuestionsCount, setUnansweredQuestionsCount] = useState(0);

  const handleRefresh = () => {
    // This is a placeholder function for the onRefresh prop
    // The actual refresh logic is handled in the Index component
    console.log("Refresh requested from App level");
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <Router>
        <SidebarProvider defaultOpen={false}>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <Header 
                unansweredCount={unansweredCount}
                unansweredQuestionsCount={unansweredQuestionsCount}
                onRefresh={handleRefresh}
              />
              <main className="flex-1 relative">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/auto-assembly" element={<AutoAssembly />} />
                  <Route path="/supplies" element={<Supplies />} />
                  <Route path="/trbx/:supplyId" element={<Boxes />} />
                  <Route path="/boxes" element={<Supplies />} />
                  <Route path="/passes" element={<Passes />} />
                  <Route path="/settings" element={<NotFound />} />
                  <Route path="/help" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                {/* Прозрачная кнопка для открытия/закрытия навигации */}
                <div className="fixed z-50 left-0 top-1/2 transform -translate-y-1/2">
                  <SidebarTrigger>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="bg-transparent hover:bg-gray-200/30 dark:hover:bg-gray-800/30 backdrop-blur-sm rounded-r-full rounded-l-none border-l-0 shadow-lg h-16 w-8"
                    >
                      <Menu className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </Button>
                  </SidebarTrigger>
                </div>
              </main>
              <Toaster />
            </div>
          </div>
        </SidebarProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
