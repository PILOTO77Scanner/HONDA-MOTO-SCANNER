import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// UUIDs for ELM327 / OBDII adapters (Standard Serial Port Profile)
const SERVICE_UUID = "00001101-0000-1000-8000-00805f9b34fb";
const ALT_SERVICE_UUID = 0xfff0;
const READ_CHAR_UUID = 0xfff1;
const WRITE_CHAR_UUID = 0xfff2;

interface OBDData {
  rpm: number;
  speed: number;
  oilTemp: number;
  voltage: number;
  tps: number;
  map: number;
  o2: number;
  iat: number;
}

interface BluetoothContextType {
  isConnected: boolean;
  isEcuConnected: boolean;
  data: OBDData;
  logs: { type: 'tx' | 'rx', message: string, timestamp: number }[];
  deviceName: string;
  deviceModel: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCommand: (cmd: string) => Promise<string>;
}

const BluetoothContext = createContext<BluetoothContextType | null>(null);

export function BluetoothProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isEcuConnected, setIsEcuConnected] = useState(false);
  const [deviceModel, setDeviceModel] = useState<string>("Desconhecido");
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [data, setData] = useState<OBDData>({ 
    rpm: 0, 
    speed: 0, 
    oilTemp: 0, 
    voltage: 12.4,
    tps: 0,
    map: 0,
    o2: 0,
    iat: 0
  });
  const [logs, setLogs] = useState<{ type: 'tx' | 'rx', message: string, timestamp: number }[]>([]);
  const { toast } = useToast();
  
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: 'tx' | 'rx', message: string) => {
    setLogs(prev => [...prev.slice(-49), { type, message, timestamp: Date.now() }]);
  }, []);

  const handleResponse = useCallback((response: string) => {
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
    if (response.includes("41 11")) { // TPS
      const parts = response.split(" ");
      const val = (parseInt(parts[2], 16) * 100) / 255;
      if (!isNaN(val)) setData(prev => ({ ...prev, tps: Math.round(val) }));
    }
    if (response.includes("41 0B")) { // MAP
      const parts = response.split(" ");
      const val = parseInt(parts[2], 16);
      if (!isNaN(val)) setData(prev => ({ ...prev, map: val }));
    }
    if (response.includes("41 14")) { // O2
      const parts = response.split(" ");
      const val = parseInt(parts[2], 16) * 0.005;
      if (!isNaN(val)) setData(prev => ({ ...prev, o2: parseFloat(val.toFixed(3)) }));
    }
    if (response.includes("41 00")) { // Calibration / ID check
      // Try to extract VIN or Model Info if possible
    }
    if (response.includes("09 02")) { // VIN
      const vin = response.split(" ").slice(2).map(hex => String.fromCharCode(parseInt(hex, 16))).join("");
      if (vin.length > 5) {
        // Basic Honda VIN mapping
        let model = "Honda";
        if (vin.startsWith("9C2")) model = "Honda (Brasil)";
        if (vin.includes("KC")) model = "Honda CG 150/160";
        if (vin.includes("KD")) model = "Honda CB 250/300";
        setDeviceModel(model);
      }
    }
  }, []);

  const sendCommand = useCallback(async (cmd: string): Promise<string> => {
    addLog('tx', cmd);
    
    if (device && characteristic) {
      try {
        const encoder = new TextEncoder();
        await characteristic.writeValue(encoder.encode(cmd + "\r"));
        return ""; 
      } catch (err) {
        console.error("Write error:", err);
        return "ERROR";
      }
    }

    if (!device && isConnected) {
      return new Promise((resolve) => {
        setTimeout(() => {
            let response = "NODATA";
            if (cmd === "AT Z") response = "ELM327 v2.1";
            if (cmd === "AT SP 5") response = "OK";
            if (cmd === "01 0C") response = `41 0C ${Math.floor(data.rpm * 4).toString(16).toUpperCase().padStart(4, '0')}`;
            if (cmd === "01 0D") response = `41 0D ${data.speed.toString(16).toUpperCase()}`;
            if (cmd === "01 11") response = `41 11 ${Math.floor((data.tps * 255) / 100).toString(16).toUpperCase()}`;
            if (cmd === "01 0B") response = `41 0B ${data.map.toString(16).toUpperCase()}`;
            if (cmd === "01 14") response = `41 14 ${Math.floor(data.o2 / 0.005).toString(16).toUpperCase()}`;
            if (cmd === "01 0F") response = `41 0F ${(data.iat + 40).toString(16).toUpperCase()}`;
            if (cmd === "AT RV") response = `${data.voltage.toFixed(1)}V`;
            
            addLog('rx', response);
            handleResponse(response);
            resolve(response);
        }, 100);
      });
    }
    return "";
  }, [device, characteristic, isConnected, data.rpm, data.speed, addLog, handleResponse]);

  const startPolling = useCallback(() => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    
    simulationRef.current = setInterval(async () => {
      if (device) {
        await sendCommand("01 0C"); // RPM
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("01 0D"); // Speed
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("01 11"); // TPS
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("01 0B"); // MAP
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("01 14"); // O2
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("01 0F"); // IAT
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("01 05"); // Engine Temp
        await new Promise(r => setTimeout(r, 100));
        await sendCommand("AT RV"); // Voltage
      } else {
        setData(prev => ({
          rpm: Math.floor(Math.max(1200, Math.min(14000, prev.rpm + (Math.random() * 500 - 200)))),
          speed: Math.floor(Math.max(0, Math.min(299, prev.speed + (Math.random() * 15 - 5)))),
          oilTemp: Math.floor(Math.min(130, Math.max(70, prev.oilTemp + (Math.random() * 2 - 1)))),
          voltage: 13.8 + (Math.random() * 0.4 - 0.2),
          tps: Math.floor(Math.random() * 100),
          map: 30 + Math.floor(Math.random() * 70),
          o2: 0.1 + (Math.random() * 0.8),
          iat: 25 + Math.floor(Math.random() * 15)
        }));
      }
    }, 1000);
  }, [device, sendCommand]);

  const connect = async () => {
    try {
      if (!(navigator as any).bluetooth) {
        toast({
          title: "Modo de Simulação Ativo",
          description: "Bluetooth não detectado. Usando dados simulados.",
        });
        setIsConnected(true);
        startPolling();
        return;
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }, { services: [ALT_SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID, ALT_SERVICE_UUID]
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT Server not found");

      let service;
      try {
        service = await server.getPrimaryService(SERVICE_UUID);
      } catch {
        service = await server.getPrimaryService(ALT_SERVICE_UUID);
      }

      if (!service) throw new Error("Service not found");

      const characteristics = await service.getCharacteristics();
      const writeChar = characteristics.find(c => c.uuid === WRITE_CHAR_UUID) || characteristics[0];
      const readChar = characteristics.find(c => c.uuid === READ_CHAR_UUID) || characteristics[0];

      if (!writeChar || !readChar) throw new Error("Bluetooth characteristics not found");
      
      setCharacteristic(writeChar);
      setDevice(device);
      setIsConnected(true);

      if (readChar.properties.notify) {
        await readChar.startNotifications();
        readChar.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = new TextDecoder().decode(event.target.value);
          addLog('rx', value);
          handleResponse(value);
        });
      }
      
      await sendCommand("AT Z");
      await new Promise(r => setTimeout(r, 1000));
      await sendCommand("AT E0");
      await sendCommand("AT L0");
      await sendCommand("AT SP 5");
      await new Promise(r => setTimeout(r, 500));
      
      const initResp = await sendCommand("01 00");
      let isEcuOk = initResp && !initResp.includes("NO DATA") && !initResp.includes("ERROR") && !initResp.includes("?");
      
      if (!isEcuOk) {
        await sendCommand("AT SH 81 10 F1");
        const hondaInit = await sendCommand("21 01");
        isEcuOk = hondaInit && !hondaInit.includes("NO DATA");
      }
      
      setIsEcuConnected(isEcuOk);
      
      if (isEcuOk) {
        // Request VIN for model identification
        await sendCommand("09 02");
      }
      
      toast({
        title: isEcuOk ? "Honda Conectada" : "Adaptador Conectado",
        description: isEcuOk 
          ? `Protocolo KWP2000 Ativo em ${device.name}`
          : `Conectado ao ${device.name}, mas sem resposta da ECU. Verifique a ignição.`,
        variant: isEcuOk ? "default" : "destructive"
      });

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

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setDevice(null);
    setCharacteristic(null);
    setIsConnected(false);
    setIsEcuConnected(false);
    setData({ rpm: 0, speed: 0, oilTemp: 0, voltage: 12.4 });
  }, [device]);

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  return (
    <BluetoothContext.Provider value={{
      isConnected,
      isEcuConnected,
      data,
      logs,
      deviceName: device?.name || (isConnected ? "Simulador ELM327" : "Desconectado"),
      deviceModel,
      connect,
      disconnect,
      sendCommand
    }}>
      {children}
    </BluetoothContext.Provider>
  );
}

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error("useBluetooth must be used within a BluetoothProvider");
  }
  return context;
};
