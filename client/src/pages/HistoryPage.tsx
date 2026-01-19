import { useSessions } from "@/hooks/use-sessions";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar, Clock, Activity, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReportDialog } from "@/components/ReportDialog";

export default function HistoryPage() {
  const { data: unsortedSessions, isLoading } = useSessions();
  
  const sessions = unsortedSessions ? [...unsortedSessions].sort((a, b) => 
    new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
  ) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl text-glow">Histórico de Sessões</h1>
      
      <div className="grid gap-4">
        {!sessions?.length ? (
          <div className="text-center text-muted-foreground py-10">
            Nenhuma sessão gravada ainda.
          </div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="p-4 bg-card/40 border-border/50 hover:bg-card/60 transition-colors cursor-default group backdrop-blur-sm">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-primary group-hover:text-glow transition-all">{session.name}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {session.startedAt ? new Date(session.startedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : '-'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.startedAt ? new Date(session.startedAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {session.protocol || "Unknown"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-4">
                  <div className="text-right mr-4">
                      <span className="block text-xs uppercase text-muted-foreground">Versão Adaptador</span>
                      <span className="font-mono text-sm">{session.adapterVersion}</span>
                  </div>
                  <ReportDialog session={session} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
