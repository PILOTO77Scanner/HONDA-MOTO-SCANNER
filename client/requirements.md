## Packages
recharts | For visualizing RPM/Speed history and session data
framer-motion | For smooth animations of gauge needles and page transitions
lucide-react | Icon set (already in base, but emphasizing usage)
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  mono: ["var(--font-mono)"],
  sans: ["var(--font-sans)"],
}
Bluetooth API usage requires HTTPS or localhost context.
ELM327 commands are simulated if Bluetooth is unavailable.
