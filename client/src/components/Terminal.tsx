import { useState, useRef, useEffect } from "react";
import { Send, TerminalSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Log {
  type: 'tx' | 'rx';
  message: string;
  timestamp: number;
}

interface TerminalProps {
  logs: Log[];
  onSend: (cmd: string) => void;
  isConnected: boolean;
}

export function Terminal({ logs, onSend, isConnected }: TerminalProps) {
  const [cmd, setCmd] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;
    onSend(cmd.toUpperCase());
    setCmd("");
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border border-border/50 rounded-lg overflow-hidden font-mono text-sm shadow-inner shadow-black/50 backdrop-blur-sm">
      <div className="p-2 border-b border-border/50 bg-card/30 flex items-center gap-2">
        <TerminalSquare className="w-4 h-4 text-primary" />
        <span className="text-xs uppercase tracking-widest text-primary/80">Monitor Serial K-Line</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1" ref={scrollRef}>
        {logs.length === 0 && (
          <div className="text-muted-foreground italic text-center py-10 opacity-50">
            Aguardando conexão...
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className={`flex gap-2 ${log.type === 'tx' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              px-3 py-1 rounded max-w-[80%] break-all
              ${log.type === 'tx' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-secondary/10 text-secondary border border-secondary/20'}
            `}>
              <span className="mr-2 opacity-50 text-[10px] uppercase">{log.type}</span>
              {log.message}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-2 border-t border-border/50 flex gap-2 bg-card/30">
        <Input 
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="Comando AT..."
          className="bg-background/50 border-border/50 font-mono text-primary placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
          disabled={!isConnected}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!isConnected || !cmd.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
