import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { BluetoothProvider } from "@/hooks/BluetoothContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import DtcPage from "@/pages/DtcPage";
import TerminalPage from "@/pages/TerminalPage";
import HistoryPage from "@/pages/HistoryPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dtc" component={DtcPage} />
      <Route path="/terminal" component={TerminalPage} />
      <Route path="/history" component={HistoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BluetoothProvider>
          <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
            <Navigation />
            <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden p-4 pb-24 md:pb-4 md:p-6 lg:p-8 scroll-smooth">
              <div className="max-w-7xl mx-auto h-full">
                <Router />
              </div>
            </main>
            <Toaster />
          </div>
        </BluetoothProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
