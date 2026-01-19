import { Gauge } from "@/components/Gauge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBluetooth } from "@/hooks/use-bluetooth";
import { Bluetooth, BluetoothOff, Save, Power } from "lucide-react";
import { useCreateSession } from "@/hooks/use-sessions";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { isConnected, isEcuConnected, connect, disconnect, data, deviceName, deviceModel } = useBluetooth();
  const createSession = useCreateSession();
  const { toast } = useToast();

  const handleSaveSession = () => {
    if (!isConnected) return;
    
    createSession.mutate({
      name: `Sessão ${deviceModel !== "Desconhecido" ? deviceModel : "Honda"} ${new Date().toLocaleTimeString()}`,
      adapterVersion: "ELM327 v2.1",
      protocol: "ISO 14230-4 KWP (Honda)",
      summary: data
    }, {
      onSuccess: () => {
        toast({ title: "Sessão Salva", description: "Dados registrados no histórico com sucesso." });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header / Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/50 p-4 rounded-lg border border-border/50 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl md:text-3xl text-glow">Honda Moto Scanner <span className="text-xs align-top opacity-50 font-sans tracking-normal">v1.2</span></h1>
          {isEcuConnected && (
            <div className="text-primary font-bold text-sm mt-1 animate-pulse">
              Moto Identificada: {deviceModel}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`} />
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                ELM: {isConnected ? "OK" : "OFF"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isEcuConnected ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`} />
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                ECU: {isEcuConnected ? "OK" : "OFF"}
              </span>
            </div>
            {deviceName && isConnected && (
              <span className="text-[10px] text-primary font-mono uppercase truncate max-w-[100px]">
                {deviceName}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {!isConnected ? (
            <Button onClick={connect} className="flex-1 sm:flex-none variant-cyber" variant="cyber">
              <Bluetooth className="w-4 h-4 mr-2" />
              Conectar
            </Button>
          ) : (
            <>
              <Button onClick={handleSaveSession} variant="secondary" className="flex-1 sm:flex-none" disabled={createSession.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {createSession.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button onClick={disconnect} variant="destructive" className="flex-1 sm:flex-none">
                <Power className="w-4 h-4 mr-2" />
                Parar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* RPM - Big Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-card/40 border-primary/20 hover:border-primary/50 transition-colors backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <Gauge 
            value={data.rpm} 
            min={0} 
            max={15000} 
            label="Rotações" 
            unit="RPM" 
            warningThreshold={12000}
          />
        </Card>

        {/* Oil Temp */}
        <Card className="bg-card/40 border-primary/20 hover:border-primary/50 transition-colors backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <Gauge 
            value={data.oilTemp} 
            min={40} 
            max={150} 
            label="Temp. Óleo" 
            unit="°C" 
            color="var(--accent)"
            warningThreshold={125}
          />
        </Card>

        {/* TPS Gauge */}
        <Card className="bg-card/40 border-primary/20 hover:border-primary/50 transition-colors backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <Gauge 
            value={data.tps} 
            min={0} 
            max={100} 
            label="Borboleta (TPS)" 
            unit="%" 
            color="var(--primary)"
          />
        </Card>

        {/* MAP Gauge */}
        <Card className="bg-card/40 border-primary/20 hover:border-primary/50 transition-colors backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <Gauge 
            value={data.map} 
            min={0} 
            max={200} 
            label="Pressão (MAP)" 
            unit="kPa" 
            color="var(--secondary)"
          />
        </Card>

        {/* O2 Gauge */}
        <Card className="bg-card/40 border-primary/20 hover:border-primary/50 transition-colors backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <Gauge 
            value={data.o2} 
            min={0} 
            max={1.2} 
            label="Sonda Lambda (O2)" 
            unit="V" 
            color="var(--accent)"
          />
        </Card>

        {/* Speed */}
        <Card className="bg-card/40 border-primary/20 hover:border-primary/50 transition-colors backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <Gauge 
            value={data.speed} 
            min={0} 
            max={240} 
            label="Velocidade" 
            unit="KM/H" 
            color="var(--secondary)"
          />
        </Card>
      </div>

      {/* Secondary Data Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card/30 p-4 rounded border border-border/30 flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase">Bateria</span>
          <span className="text-xl font-mono text-primary font-bold">{data.voltage.toFixed(1)} V</span>
        </div>
        <div className="bg-card/30 p-4 rounded border border-border/30 flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase">Ar Adm. (IAT)</span>
          <span className="text-xl font-mono text-primary font-bold">{data.iat} °C</span>
        </div>
        <div className="bg-card/30 p-4 rounded border border-border/30 flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase">Carga Motor</span>
          <span className="text-xl font-mono text-primary font-bold">{Math.min(100, Math.round((data.map / 105) * 100))}%</span>
        </div>
        <div className="bg-card/30 p-4 rounded border border-border/30 flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase">Protocolo</span>
          <span className="text-xl font-mono text-primary font-bold text-xs truncate w-full text-center">
            {isConnected ? "KWP2000" : "---"}
          </span>
        </div>
      </div>
    </div>
  );
}
