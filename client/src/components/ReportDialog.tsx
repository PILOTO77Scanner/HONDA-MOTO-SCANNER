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
          <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black uppercase tracking-tighter flex items-center gap-2">
                <ShieldCheck className="w-8 h-8" />
                Honda Diagnostic
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-medium">Relatório Técnico - Modelos Honda (CG/CB/XRE 150-300cc)</p>
            </div>
            <div className="text-right text-black">
              <p className="font-bold text-lg">Sessão #{session.id}</p>
              <p className="text-sm">
                {session.startedAt ? new Date(session.startedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : '-'}
              </p>
            </div>
          </div>

          {/* Informações Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-gray-50 p-4 rounded-md border border-gray-200">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Moto / Cliente</p>
              <p className="font-bold text-black">{session.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Protocolo</p>
              <p className="font-bold text-black">{session.protocol || "ISO 14230-4 (KWP)"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Adaptador</p>
              <p className="font-bold text-black">{session.adapterVersion || "ELM327 v2.1"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Status Final</p>
              <p className="font-bold text-black uppercase">Concluído</p>
            </div>
          </div>

          {/* Parâmetros de Diagnóstico */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b-2 border-black pb-2 text-black">
              <Activity className="w-5 h-5" />
              Parâmetros do Motor
            </h2>
            <div className="grid grid-cols-1 gap-y-1">
              {/* Header da Tabela */}
              <div className="grid grid-cols-3 bg-gray-100 p-2 font-bold text-[10px] uppercase border border-gray-300">
                <span>Sensor / Parâmetro</span>
                <span className="text-center">Leitura Atual</span>
                <span className="text-right">Padrão de Fábrica</span>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 py-2 px-2 items-center">
                <span className="text-gray-700 font-medium text-sm">Rotação do Motor</span>
                <span className="font-mono font-bold text-black text-center">{summary.rpm || "0"} RPM</span>
                <span className="text-gray-500 text-right text-xs">1.300 - 1.600 RPM (Lenta)</span>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 py-2 px-2 items-center">
                <span className="text-gray-700 font-medium text-sm">Posição Borboleta (TPS)</span>
                <span className="font-mono font-bold text-black text-center">{summary.tps || "0"} %</span>
                <span className="text-gray-500 text-right text-xs">0.0% - 0.5% (Fechada)</span>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 py-2 px-2 items-center">
                <span className="text-gray-700 font-medium text-sm">Pressão Coletor (MAP)</span>
                <span className="font-mono font-bold text-black text-center">{summary.map || "0"} kPa</span>
                <span className="text-gray-500 text-right text-xs">24 - 38 kPa (Lenta)</span>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 py-2 px-2 items-center">
                <span className="text-gray-700 font-medium text-sm">Temperatura Motor (EOT/ECT)</span>
                <span className="font-mono font-bold text-black text-center">{summary.oilTemp || "0"} °C</span>
                <span className="text-gray-500 text-right text-xs">70°C - 110°C (Operação)</span>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 py-2 px-2 items-center">
                <span className="text-gray-700 font-medium text-sm">Voltagem Bateria</span>
                <span className="font-mono font-bold text-black text-center">{summary.voltage?.toFixed(1) || "0"} V</span>
                <span className="text-gray-500 text-right text-xs">12.4V (Desl) / 14.5V (Carga)</span>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 py-2 px-2 items-center">
                <span className="text-gray-700 font-medium text-sm">Sonda Lambda (O2)</span>
                <span className="font-mono font-bold text-black text-center">{summary.o2 || "0"} V</span>
                <span className="text-gray-500 text-right text-xs">0.1V - 1.0V (Ciclando)</span>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 py-2 px-2 items-center">
                <span className="text-gray-700 font-medium text-sm">Tempo de Injeção</span>
                <span className="font-mono font-bold text-black text-center">{summary.injectionTime || "1.8"} ms</span>
                <span className="text-gray-500 text-right text-xs">1.2 - 3.2 ms (Variável)</span>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 py-2 px-2 items-center">
                <span className="text-gray-700 font-medium text-sm">Temp. Ar Adm. (IAT)</span>
                <span className="font-mono font-bold text-black text-center">{summary.iat || "0"} °C</span>
                <span className="text-gray-500 text-right text-xs">10°C - 50°C (Ambiente)</span>
              </div>
            </div>
          </div>

          {/* Códigos de Falha */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b-2 border-black pb-2 text-black">
              <ClipboardList className="w-5 h-5" />
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
          <Button className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Imprimir Relatório / Salvar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
