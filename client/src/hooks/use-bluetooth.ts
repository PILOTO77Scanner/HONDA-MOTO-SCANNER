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
  oilTemp: number;
  voltage: number;
}

export function useBluetooth() {
  const [isConnected, setIsConnected] = useState(false);
  const [isEcuConnected, setIsEcuConnected] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [data, setData] = useState<OBDData>({ rpm: 0, speed: 0, oilTemp: 0, voltage: 12.4 });
  const [logs, setLogs] = useState<{ type: 'tx' | 'rx', message: string, timestamp: number }[]>([]);
  const { toast } = useToast();
  
  // Mock simulation interval
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: 'tx' | 'rx', message: string) => {
    setLogs(prev => [...prev.slice(-49), { type, message, timestamp: Date.now() }]);
  }, []);

  const connect = async () => {
    try {
      if (!(navigator as any).bluetooth) {
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

      const device = await (navigator as any).bluetooth.requestDevice({
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
      const characteristics = await service.getCharacteristics();
      const writeChar = characteristics.find(c => c.uuid === WRITE_CHAR_UUID) || characteristics[0];
      const readChar = characteristics.find(c => c.uuid === READ_CHAR_UUID) || characteristics[0];

      if (!writeChar || !readChar) throw new Error("Bluetooth characteristics not found");
      
      setCharacteristic(writeChar);
      setDevice(device);
      setIsConnected(true);

      // Setup notifications for reading
      if (readChar.properties.notify) {
        await readChar.startNotifications();
        readChar.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = new TextDecoder().decode(event.target.value);
          addLog('rx', value);
          handleResponse(value);
        });
      }
      
      // Initialize ELM327 for Honda (KWP2000 Fast Init)
      await sendCommand("AT Z");     // Reset
      await new Promise(r => setTimeout(r, 1000));
      await sendCommand("AT E0");    // Echo off
      await sendCommand("AT L0");    // Linefeeds off
      await sendCommand("AT SP 5");  // Protocol 5 (ISO 14230-4 KWP Fast Init)
      await new Promise(r => setTimeout(r, 500));
      
      // ECU Handshake - Try to get some data to confirm ECU is talking
      const initResp = await sendCommand("01 00"); // Standard OBD check
      if (initResp && !initResp.includes("NO DATA") && !initResp.includes("ERROR") && !initResp.includes("?")) {
        setIsEcuConnected(true);
      } else {
        // Try Honda specific init if standard fails
        await sendCommand("AT SH 81 10 F1"); // Set Header for Honda
        const hondaInit = await sendCommand("21 01");
        if (hondaInit && !hondaInit.includes("NO DATA")) {
          setIsEcuConnected(true);
        }
      }
      
      toast({
        title: isEcuConnected ? "Honda Conectada" : "Adaptador Conectado",
        description: isEcuConnected 
          ? `Protocolo KWP2000 Ativo em ${device.name}`
          : `Conectado ao ${device.name}, mas sem resposta da ECU. Verifique a ignição.`,
        variant: isEcuConnected ? "default" : "destructive"
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
    setIsEcuConnected(false);
    setData({ rpm: 0, speed: 0, oilTemp: 0, voltage: 0 });
  };

  const handleResponse = (response: string) => {
    // Basic parser for OBD responses
    if (response.includes("41 0C")) { // RPM
      const parts = response.split(" ");
      const val = parseInt(parts[2] + parts[3], 16) / 4;
      if (!isNaN(val)) setData(prev => ({ ...prev, rpm: val }));
    }
    if (response.includes("41 0D")) { // Speed
      const parts = response.split(" ");
      const val = parseInt(parts[2], 16);
      if (!isNaN(val)) setData(prev => ({ ...prev, speed: val }));
    }
  };

  const sendCommand = async (cmd: string): Promise<string> => {
    addLog('tx', cmd);
    
    if (device && characteristic) {
      try {
        const encoder = new TextEncoder();
        await characteristic.writeValue(encoder.encode(cmd + "\r"));
        // The response will come via notifications
        return ""; 
      } catch (err) {
        console.error("Write error:", err);
        return "ERROR";
      }
    }

    // In a real app, we would write to the characteristic here
    // For now, we just simulate the response logic if in sim mode
    if (!device && isConnected) {
      return new Promise((resolve) => {
        setTimeout(() => {
            let response = "NODATA";
            if (cmd === "AT Z") response = "ELM327 v2.1";
            if (cmd === "AT SP 5") response = "OK";
            if (cmd === "01 0C") response = `41 0C ${Math.floor(data.rpm * 4).toString(16).toUpperCase().padStart(4, '0')}`;
            if (cmd === "01 0D") response = `41 0D ${data.speed.toString(16).toUpperCase()}`;
            
            addLog('rx', response);
            handleResponse(response);
            resolve(response);
        }, 100);
      });
    }
    return "";
  };

  const startSimulation = () => {
    simulationRef.current = setInterval(() => {
      setData(prev => {
        // Randomize slightly - Moto high RPM
        const newRpm = Math.max(1200, Math.min(14000, prev.rpm + (Math.random() * 500 - 200)));
        const newSpeed = Math.max(0, Math.min(299, prev.speed + (Math.random() * 15 - 5)));
        const newTemp = Math.min(130, Math.max(70, prev.oilTemp + (Math.random() * 2 - 1)));
        
        return {
          rpm: Math.floor(newRpm),
          speed: Math.floor(newSpeed),
          oilTemp: Math.floor(newTemp),
          voltage: 13.8 + (Math.random() * 0.4 - 0.2)
        };
      });
    }, 1000);
  };
  
  const startPolling = () => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    
    simulationRef.current = setInterval(async () => {
      if (!isConnected) return;
      
      if (device) {
        await sendCommand("01 0C"); // RPM
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("01 0D"); // Speed
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("01 05"); // Oil Temp (Standard Coolant PID used as proxy)
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("AT RV"); // Voltage
      } else {
        // Simulation mode
        setData(prev => {
          const newRpm = Math.max(1200, Math.min(14000, prev.rpm + (Math.random() * 500 - 200)));
          const newSpeed = Math.max(0, Math.min(299, prev.speed + (Math.random() * 15 - 5)));
          const newTemp = Math.min(130, Math.max(70, prev.oilTemp + (Math.random() * 2 - 1)));
          
          return {
            rpm: Math.floor(newRpm),
            speed: Math.floor(newSpeed),
            oilTemp: Math.floor(newTemp),
            voltage: 13.8 + (Math.random() * 0.4 - 0.2)
          };
        });
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  return { connect, disconnect, isConnected, isEcuConnected, data, sendCommand, logs, deviceName: device?.name || "Simulador ELM327" };
}
