import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// UUIDs for ELM327 / OBDII adapters (Standard Serial Port Profile)
const SERVICE_UUID = "00001101-0000-1000-8000-00805f9b34fb";
// Sometimes 0xfff0 is used for BLE OBD dongles
const ALT_SERVICE_UUID = 0xfff0;
const READ_CHAR_UUID = 0xfff1;
const WRITE_CHAR_UUID = 0xfff2;

interface OBDData {
  rpm: number;
  speed: number;
  coolantTemp: number;
  voltage: number;
}

export function useBluetooth() {
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [data, setData] = useState<OBDData>({ rpm: 0, speed: 0, coolantTemp: 0, voltage: 12.4 });
  const [logs, setLogs] = useState<{ type: 'tx' | 'rx', message: string, timestamp: number }[]>([]);
  const { toast } = useToast();
  
  // Mock simulation interval
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: 'tx' | 'rx', message: string) => {
    setLogs(prev => [...prev.slice(-49), { type, message, timestamp: Date.now() }]);
  }, []);

  const connect = async () => {
    try {
      if (!navigator.bluetooth) {
        // Fallback to simulation mode
        console.warn("Web Bluetooth API not available, starting simulation");
        toast({
          title: "Modo de Simulação Ativo",
          description: "Bluetooth não detectado. Usando dados simulados.",
          variant: "default",
        });
        startSimulation();
        setIsConnected(true);
        return;
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [SERVICE_UUID] },
          { services: [ALT_SERVICE_UUID] }
        ],
        optionalServices: [SERVICE_UUID, ALT_SERVICE_UUID]
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT Server not found");

      // Attempt to find service
      let service;
      try {
        service = await server.getPrimaryService(SERVICE_UUID);
      } catch {
        service = await server.getPrimaryService(ALT_SERVICE_UUID);
      }

      if (!service) throw new Error("Service not found");

      // For standard serial, we might need write/notify characteristics
      // Simplified for this demo - assuming a generic read/write structure
      // Real ELM327 BLE implementation is complex and varies by dongle
      
      setDevice(device);
      setIsConnected(true);
      
      // Initialize ELM327
      await sendCommand("AT Z");     // Reset
      await sendCommand("AT SP 0");  // Auto protocol
      
      toast({
        title: "Conectado",
        description: `Conectado a ${device.name}`,
      });

      // Start polling loop
      startPolling();

    } catch (error) {
      console.error(error);
      toast({
        title: "Erro de Conexão",
        description: error instanceof Error ? error.message : "Falha ao conectar",
        variant: "destructive",
      });
    }
  };

  const disconnect = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setDevice(null);
    setIsConnected(false);
    setData({ rpm: 0, speed: 0, coolantTemp: 0, voltage: 0 });
  };

  const sendCommand = async (cmd: string) => {
    addLog('tx', cmd);
    
    // In a real app, we would write to the characteristic here
    // For now, we just simulate the response logic if in sim mode
    if (!device && isConnected) {
        // Simulation logic response
        setTimeout(() => {
            let response = "NODATA";
            if (cmd === "AT Z") response = "ELM327 v2.1";
            if (cmd === "AT SP 0") response = "OK";
            if (cmd === "01 0C") response = `41 0C ${Math.floor(data.rpm * 4).toString(16).toUpperCase()}`; // Mock RPM hex
            if (cmd === "01 0D") response = `41 0D ${data.speed.toString(16).toUpperCase()}`; // Mock Speed hex
            
            addLog('rx', response);
        }, 100);
    }
  };

  const startSimulation = () => {
    simulationRef.current = setInterval(() => {
      setData(prev => {
        // Randomize slightly
        const newRpm = Math.max(800, Math.min(7000, prev.rpm + (Math.random() * 200 - 100)));
        const newSpeed = Math.max(0, Math.min(220, prev.speed + (Math.random() * 10 - 4)));
        const newTemp = Math.min(110, Math.max(80, prev.coolantTemp + (Math.random() * 2 - 1)));
        
        return {
          rpm: Math.floor(newRpm),
          speed: Math.floor(newSpeed),
          coolantTemp: Math.floor(newTemp),
          voltage: 13.8 + (Math.random() * 0.4 - 0.2)
        };
      });
    }, 1000);
  };
  
  const startPolling = () => {
     // In real app, setInterval to send 01 0C, 01 0D, etc.
  }

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  return { connect, disconnect, isConnected, data, sendCommand, logs, deviceName: device?.name || "Simulador ELM327" };
}
