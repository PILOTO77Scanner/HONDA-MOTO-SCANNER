import { Terminal } from "@/components/Terminal";
import { useBluetooth } from "@/hooks/use-bluetooth";

export default function TerminalPage() {
  const { isConnected, sendCommand, logs } = useBluetooth();

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col gap-4 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl text-glow">Terminal K-Line</h1>
      <p className="text-muted-foreground text-sm">
        Envie comandos AT/HEX diretamente para o adaptador ELM327. Use com cuidado.
      </p>
      
      <div className="flex-1 min-h-0">
        <Terminal 
          logs={logs} 
          onSend={sendCommand} 
          isConnected={isConnected} 
        />
      </div>
    </div>
  );
}
