import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCreateSession } from "@/hooks/use-sessions";

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
  dtcs: { code: string; description: string }[];
  logs: { type: 'tx' | 'rx', message: string, timestamp: number }[];
  deviceName: string;
  deviceModel: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearErrors: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<string>;
}

const BluetoothContext = createContext<BluetoothContextType | null>(null);

export function BluetoothProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isEcuConnected, setIsEcuConnected] = useState(false);
  const [deviceModel, setDeviceModel] = useState<string>("Desconhecido");
  const [dtcs, setDtcs] = useState<{ code: string; description: string }[]>([]);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [data, setData] = useState<OBDData>({ 
    rpm: 0, 
    speed: 0, 
    oilTemp: 0, 
    voltage: 0,
    tps: 0,
    map: 0,
    o2: 0,
    iat: 0
  });
  const [logs, setLogs] = useState<{ type: 'tx' | 'rx', message: string, timestamp: number }[]>([]);
  const { toast } = useToast();
  const createSession = useCreateSession();
  
  const simulationRef = useRef<NodeJS.Timeout | null>(null);
  const latestDataRef = useRef<OBDData>({ 
    rpm: 0, 
    speed: 0, 
    oilTemp: 0, 
    voltage: 0,
    tps: 0,
    map: 0,
    o2: 0,
    iat: 0
  });

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  const latestDeviceModelRef = useRef<string>("Desconhecido");
  useEffect(() => {
    latestDeviceModelRef.current = deviceModel;
  }, [deviceModel]);

  const addLog = useCallback((type: 'tx' | 'rx', message: string) => {
    setLogs(prev => [...prev.slice(-49), { type, message, timestamp: Date.now() }]);
  }, []);

  const handleResponse = useCallback((response: string) => {
    if (response.includes("41 0C")) { // RPM
      const clean = response.replace(/\s/g, '');
      const parts = clean.split("410C");
      if (parts.length > 1) {
        const hex = parts[1].substring(0, 4);
        const val = parseInt(hex, 16) / 4;
        if (!isNaN(val)) setData(prev => ({ ...prev, rpm: val }));
      }
    }
    if (response.includes("41 0D")) { // Speed
      const clean = response.replace(/\s/g, '');
      const parts = clean.split("410D");
      if (parts.length > 1) {
        const hex = parts[1].substring(0, 2);
        const val = parseInt(hex, 16);
        if (!isNaN(val)) setData(prev => ({ ...prev, speed: val }));
      }
    }
    if (response.includes("41 11")) { // TPS
      const clean = response.replace(/\s/g, '');
      const parts = clean.split("4111");
      if (parts.length > 1) {
        const hex = parts[1].substring(0, 2);
        const val = (parseInt(hex, 16) * 100) / 255;
        if (!isNaN(val)) setData(prev => ({ ...prev, tps: Math.round(val) }));
      }
    }
    if (response.includes("41 0B")) { // MAP
      const clean = response.replace(/\s/g, '');
      const parts = clean.split("410B");
      if (parts.length > 1) {
        const hex = parts[1].substring(0, 2);
        const val = parseInt(hex, 16);
        if (!isNaN(val)) setData(prev => ({ ...prev, map: val }));
      }
    }
    if (response.includes("41 14")) { // O2
      const clean = response.replace(/\s/g, '');
      const parts = clean.split("4114");
      if (parts.length > 1) {
        const hex = parts[1].substring(0, 2);
        const val = parseInt(hex, 16) * 0.005;
        if (!isNaN(val)) setData(prev => ({ ...prev, o2: parseFloat(val.toFixed(3)) }));
      }
    }
    if (response.includes("41 05")) { // Engine Temp (ECT)
      const clean = response.replace(/\s/g, '');
      const parts = clean.split("4105");
      if (parts.length > 1) {
        const hex = parts[1].substring(0, 2);
        const val = parseInt(hex, 16) - 40;
        if (!isNaN(val)) setData(prev => ({ ...prev, oilTemp: val }));
      }
    }
    if (response.includes("41 0F")) { // IAT
      const clean = response.replace(/\s/g, '');
      const parts = clean.split("410F");
      if (parts.length > 1) {
        const hex = parts[1].substring(0, 2);
        const val = parseInt(hex, 16) - 40;
        if (!isNaN(val)) setData(prev => ({ ...prev, iat: val }));
      }
    }
    if (response.includes("41 00")) { // Calibration / ID check
      // Try to extract VIN or Model Info if possible
    }
    if (response.includes("41 01")) { // DTC Count
      const parts = response.split(" ");
      const count = parseInt(parts[2], 16) & 0x7F;
      if (count > 0 && dtcs.length === 0) {
        // Mocking a DTC for simulation if it's simulation mode or real if we had 03
        if (!device) {
           setDtcs([{ code: "P0122", description: "TPS - Voltagem Baixa" }]);
        }
      } else if (count === 0) {
        setDtcs([]);
      }
    }
    if (response.includes("43 ")) { // DTC Response
      // Simplified DTC parsing for Honda
      const parts = response.split(" ");
      if (parts.length >= 4) {
        const code = `P${parts[1]}${parts[2]}`;
        setDtcs(prev => [...prev, { code, description: "Falha detectada no sistema" }]);
      }
    }
    if (response.includes("44")) { // Clear Response
      setDtcs([]);
      toast({ title: "Sucesso", description: "Códigos de erro apagados." });
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
        // Attempt to reconnect if write fails
        if (device.gatt?.connected === false) {
          onDisconnected();
        }
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
      if (device && isConnected) {
        const commands = ["01 0C", "01 0D", "01 11", "01 0B", "01 14", "01 0F", "01 05", "01 01", "AT RV"];
        for (const cmd of commands) {
          if (!isConnected) break;
          await sendCommand(cmd);
          await new Promise(r => setTimeout(r, 75)); // Slightly faster polling
        }
      }
    }, 1000);
  }, [device, isConnected, sendCommand]);

  const connect = async () => {
    try {
      if (!(navigator as any).bluetooth) {
        throw new Error("Seu navegador não suporta Bluetooth ou você não está em uma conexão segura (HTTPS).");
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID, ALT_SERVICE_UUID, "00001101-0000-1000-8000-00805f9b34fb", 0xfff0]
      });

      device.addEventListener('gattserverdisconnected', onDisconnected);

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Servidor GATT não encontrado");

      let service;
      try {
        service = await server.getPrimaryService(SERVICE_UUID);
      } catch (err) {
        try {
          service = await server.getPrimaryService(ALT_SERVICE_UUID);
        } catch (err2) {
          const services = await server.getPrimaryServices();
          service = services[0];
        }
      }

      if (!service) throw new Error("Serviço não encontrado");

      const characteristics = await service.getCharacteristics();
      const writeChar = characteristics.find(c => c.uuid.includes("fff2") || c.properties.write) || characteristics[0];
      const readChar = characteristics.find(c => c.uuid.includes("fff1") || c.properties.notify || c.properties.read) || characteristics[0];

      if (!writeChar || !readChar) throw new Error("Bluetooth characteristics not found");
      
      setCharacteristic(writeChar);
      setDevice(device);
      setIsConnected(true);

      if (readChar.properties.notify) {
        await readChar.startNotifications();
        readChar.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = new TextDecoder().decode(event.target.value);
          const lines = value.split(/[\r\n]+/).filter(l => l.trim().length > 0);
          for (const line of lines) {
            addLog('rx', line);
            handleResponse(line);
          }
        });
      }
      
      await sendCommand("AT Z");
      await new Promise(r => setTimeout(r, 1000));
      await sendCommand("AT D");
      await sendCommand("AT Z"); // Reset again to ensure clean state
      await new Promise(r => setTimeout(r, 1000));
      await sendCommand("AT E0"); // Echo off
      await sendCommand("AT L0"); // Linefeeds off
      await sendCommand("AT S0"); // Spaces off for faster parsing
      await sendCommand("AT ST 64"); // Increased timeout for slow ECUs
      await sendCommand("AT AT 1"); // Adaptive timing on
      await sendCommand("AT SP 0"); // Automatic protocol
      await new Promise(r => setTimeout(r, 500));

      // Attempt to wake up ECU
      await sendCommand("01 00");
      await new Promise(r => setTimeout(r, 200));
      
      let initResp = await sendCommand("01 00");
      let isEcuOk = initResp && !initResp.includes("NO DATA") && !initResp.includes("ERROR") && !initResp.includes("?");

      if (!isEcuOk) {
        await sendCommand("AT SP 5"); // Force ISO 14230-4 (KWP FAST)
        initResp = await sendCommand("01 00");
        isEcuOk = initResp && !initResp.includes("NO DATA");
      }

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

  const clearErrors = async () => {
    if (isConnected) {
      await sendCommand("04");
      if (!device) {
        setDtcs([]);
        toast({ title: "Sucesso", description: "Códigos de erro apagados (Simulado)." });
      }
    }
  };

  const onDisconnected = useCallback(() => {
    setIsConnected(false);
    setIsEcuConnected(false);
    setDevice(null);
    setCharacteristic(null);
    if (simulationRef.current) clearInterval(simulationRef.current);
    toast({
      title: "Bluetooth Desconectado",
      description: "A conexão com o adaptador ELM327 foi perdida.",
      variant: "destructive"
    });
  }, [toast]);

  const disconnect = useCallback(() => {
    // Auto-save session on disconnect
    if (isConnected) {
      createSession.mutate({
        name: `Sessão ${latestDeviceModelRef.current !== "Desconhecido" ? latestDeviceModelRef.current : "Honda"} ${new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
        adapterVersion: "ELM327 v2.1",
        protocol: "ISO 14230-4 KWP (Honda)",
        summary: { ...latestDataRef.current, dtcs }
      }, {
        onSuccess: () => {
          toast({ title: "Sessão Salva", description: "Dados registrados automaticamente no histórico." });
        }
      });
    }

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
    setData({ rpm: 0, speed: 0, oilTemp: 0, voltage: 0, tps: 0, map: 0, o2: 0, iat: 0 });
  }, [device, isConnected, createSession, toast]);

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
      dtcs,
      logs,
      deviceName: device?.name || (isConnected ? "Simulador ELM327" : "Desconectado"),
      deviceModel,
      connect,
      disconnect,
      clearErrors,
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
