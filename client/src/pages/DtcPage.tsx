import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useBluetooth } from "@/hooks/use-bluetooth";
import { useToast } from "@/hooks/use-toast";

interface DtcCode {
  code: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export default function DtcPage() {
  const { isConnected, sendCommand } = useBluetooth();
  const [codes, setCodes] = useState<DtcCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleReadCodes = async () => {
    if (!isConnected) {
      toast({ title: "Erro", description: "Conecte ao scanner primeiro.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    // Simulate reading logic
    try {
      await sendCommand("03"); // Mode 03 - Request Trouble Codes
      
      // Simulate delay
      setTimeout(() => {
        // Mock result
        setCodes([
          { code: "P0300", description: "Falha de ignição aleatória/múltipla detectada", severity: "high" },
          { code: "P0113", description: "Entrada alta no circuito do sensor de temperatura do ar de admissão", severity: "medium" }
        ]);
        setIsLoading(false);
      }, 1500);
      
    } catch (e) {
      setIsLoading(false);
    }
  };

  const clearCodes = () => {
    setCodes([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl text-glow flex items-center gap-3">
          <AlertTriangle className="text-accent" />
          Diagnóstico DTC
        </h1>
        <Button onClick={handleReadCodes} disabled={isLoading || !isConnected} variant="cyber">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Lendo..." : "Ler Códigos"}
        </Button>
      </div>

      <div className="grid gap-4">
        {codes.length === 0 && !isLoading && (
          <Card className="p-12 flex flex-col items-center justify-center text-muted-foreground bg-card/20 border-border/50 border-dashed">
            <CheckCircle2 className="w-12 h-12 mb-4 text-green-500/50" />
            <h3 className="text-lg font-bold">Nenhum código lido</h3>
            <p className="text-sm">Clique em "Ler Códigos" para iniciar o diagnóstico.</p>
          </Card>
        )}

        {codes.map((dtc, idx) => (
          <Card key={idx} className="p-4 border-l-4 bg-card/40 backdrop-blur border-t-0 border-b-0 border-r-0" 
                style={{ borderLeftColor: dtc.severity === 'high' ? 'var(--destructive)' : 'var(--accent)' }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-mono font-bold text-foreground mb-1">{dtc.code}</h3>
                <p className="text-muted-foreground">{dtc.description}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                dtc.severity === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-accent/20 text-accent'
              }`}>
                {dtc.severity === 'high' ? 'Crítico' : 'Atenção'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
