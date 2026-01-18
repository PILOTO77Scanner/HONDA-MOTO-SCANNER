import { motion } from "framer-motion";

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  warningThreshold?: number;
}

export function Gauge({ 
  value, 
  min, 
  max, 
  label, 
  unit, 
  color = "var(--primary)",
  warningThreshold 
}: GaugeProps) {
  // Calculate rotation (-90deg to 90deg usually, or 0 to 180)
  // Let's do a 240 degree gauge (-120 to +120)
  const percent = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const angle = -120 + (percent * 240);
  
  const isWarning = warningThreshold && value >= warningThreshold;
  const displayColor = isWarning ? "var(--destructive)" : color;

  return (
    <div className="relative w-full aspect-square flex flex-col items-center justify-center p-4">
      {/* SVG Container */}
      <div className="relative w-full h-full max-w-[250px] max-h-[250px]">
        {/* Background Arc */}
        <svg viewBox="0 0 100 100" className="w-full h-full transform rotate-90 filter drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="hsl(var(--card))"
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset="83" /* Leaves gap at bottom */
            strokeLinecap="butt"
            transform="rotate(120 50 50)"
          />
          {/* Active Arc */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={displayColor}
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * 0.66 * percent)} /* 0.66 is because circle is 240deg not 360 */
            strokeLinecap="round"
            transform="rotate(120 50 50)"
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 - (251.2 * 0.66 * percent) }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
            className="filter drop-shadow-[0_0_8px_var(--primary)]"
          />
        </svg>

        {/* Needle Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Inner Text */}
          <div className="flex flex-col items-center mt-6">
            <span className="text-4xl font-bold font-mono tracking-tighter" style={{ color: displayColor }}>
              {Math.round(value)}
            </span>
            <span className="text-xs uppercase text-muted-foreground font-semibold tracking-widest">{unit}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-[-1rem] text-center z-10">
        <h3 className="text-lg uppercase text-muted-foreground">{label}</h3>
      </div>
    </div>
  );
}
