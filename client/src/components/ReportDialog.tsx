import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, ClipboardList, Activity, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScanSession } from "@shared/schema";

interface ReportDialogProps {
  session: ScanSession;
  trigger?: React.ReactNode;
}

export function ReportDialog({ session, trigger }: ReportDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  const summary = session.summary as any || {};

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="w-4 h-4" />
            Relatório
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle>Relatório de Diagnóstico</DialogTitle>
        </DialogHeader>

        <div id="printable-report" className="bg-white text-black p-8 rounded-lg shadow-sm print:shadow-none print:p-0">
          {/* Header do Relatório */}
          <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary uppercase tracking-tighter flex items-center gap-2">
                <ShieldCheck className="w-8 h-8" />
                Honda Diagnostic
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Relatório Técnico de Diagnóstico OBDII</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">Sessão #{session.id}</p>
              <p className="text-sm">
                {session.startedAt ? format(new Date(session.startedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
              </p>
            </div>
          </div>

          {/* Informações Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-muted/30 p-4 rounded-md print:bg-slate-50">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Moto / Cliente</p>
              <p className="font-semibold">{session.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Protocolo</p>
              <p className="font-semibold">{session.protocol || "ISO 14230-4 (KWP)"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Adaptador</p>
              <p className="font-semibold">{session.adapterVersion || "ELM327 v2.1"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status Final</p>
              <p className="font-semibold text-green-600">Concluído</p>
            </div>
          </div>

          {/* Parâmetros de Diagnóstico */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
              <Activity className="w-5 h-5 text-primary" />
              Parâmetros do Motor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground font-medium">Rotação do Motor (RPM)</span>
                <span className="font-mono font-bold">{summary.rpm || "N/A"} RPM</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground font-medium">Velocidade da Roda</span>
                <span className="font-mono font-bold">{summary.speed || "N/A"} km/h</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground font-medium">Temperatura do Óleo/Coolant</span>
                <span className="font-mono font-bold">{summary.oilTemp || "N/A"} °C</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground font-medium">Voltagem da Bateria</span>
                <span className="font-mono font-bold">{summary.voltage?.toFixed(1) || "N/A"} V</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground font-medium">Posição da Borboleta (TPS)</span>
                <span className="font-mono font-bold">{summary.tps || "N/A"} %</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground font-medium">Tempo de Injeção</span>
                <span className="font-mono font-bold">{summary.injectionTime || "N/A"} ms</span>
              </div>
            </div>
          </div>

          {/* Códigos de Falha */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Códigos de Falha (DTC)
            </h2>
            {summary.dtcs?.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2 border">Código</th>
                    <th className="p-2 border">Descrição</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.dtcs.map((dtc: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2 border font-mono font-bold">{dtc.code}</td>
                      <td className="p-2 border">{dtc.description}</td>
                      <td className="p-2 border text-red-600 font-bold">Ativo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                Nenhum código de falha detectado no sistema da ECU.
              </div>
            )}
          </div>

          {/* Rodapé do Relatório */}
          <div className="mt-16 border-t pt-8 flex justify-between items-end">
            <div className="text-sm text-muted-foreground">
              <p>Relatório gerado automaticamente pelo sistema Honda Diagnostic.</p>
              <p>© 2026 Oficina Técnica Autorizada</p>
            </div>
            <div className="w-48 text-center border-t border-black pt-2">
              <p className="text-xs uppercase font-bold">Assinatura Técnico</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 no-print">
          <Button variant="outline" className="gap-2" onClick={() => {/* Download PDF logic if needed */}}>
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button className="gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
