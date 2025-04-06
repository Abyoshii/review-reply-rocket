
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import { ThemeProvider } from "./components/ThemeProvider";
import { SidebarProvider } from "./components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import Index from "./pages/Index";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";
import AutoAssembly from "./pages/AutoAssembly";
import { useState } from "react";

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
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <Header 
                unansweredCount={unansweredCount}
                unansweredQuestionsCount={unansweredQuestionsCount}
                onRefresh={handleRefresh}
              />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/auto-assembly" element={<AutoAssembly />} />
                  <Route path="/supplies" element={<NotFound />} />
                  <Route path="/boxes" element={<NotFound />} />
                  <Route path="/passes" element={<NotFound />} />
                  <Route path="/settings" element={<NotFound />} />
                  <Route path="/help" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
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
