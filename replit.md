# Honda Moto Scanner

## Overview

Honda Moto Scanner is a web-based OBD-II diagnostic tool designed for Honda motorcycles. It connects to ELM327 Bluetooth adapters to read real-time vehicle data (RPM, speed, coolant temperature, voltage), retrieve and clear diagnostic trouble codes (DTCs), and provide a raw terminal interface for sending AT/HEX commands directly to the adapter. The application includes session history tracking with PostgreSQL persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for gauge needle animations and page transitions
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful endpoints defined in shared/routes.ts with Zod validation
- **Development**: Vite dev server with HMR proxied through Express

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: shared/schema.ts defines tables using Drizzle's pgTable
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Connection**: node-postgres Pool with DATABASE_URL environment variable

### Key Design Patterns
- **Shared Types**: Schema and route definitions in /shared are imported by both client and server
- **API Contract**: Routes defined with Zod schemas for input validation and response typing
- **Storage Abstraction**: DatabaseStorage class implements IStorage interface for data access
- **Component Library**: shadcn/ui components in client/src/components/ui/ with CVA variants

### Bluetooth/OBD Integration
- **Protocol**: Web Bluetooth API for ELM327 adapter connection
- **Fallback**: Simulation mode when Bluetooth unavailable (development/non-HTTPS)
- **Communication**: K-Line serial protocol simulation for Honda motorcycles

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: Session storage (available but sessions not currently implemented)

### Frontend Libraries
- **Radix UI**: Accessible primitive components (dialogs, dropdowns, tooltips, etc.)
- **Recharts**: Data visualization for historical session data
- **date-fns**: Date formatting with Portuguese (Brazil) locale support
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend bundling with React plugin
- **esbuild**: Server bundling for production builds
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner for Replit environment