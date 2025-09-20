# E-commerce Portfolio Project

## Overview

This is a full-stack e-commerce web application built as a portfolio project. The application demonstrates modern web development practices with a React frontend, Express.js backend, and PostgreSQL database. It features user authentication, product catalog, shopping cart functionality, and order processing with a simulated payment system.

The application is designed to showcase proficiency in building scalable, production-ready web applications with proper separation of concerns, clean architecture, and modern UI/UX patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component system for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for robust form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Session Management**: Express-session with PostgreSQL session store
- **Password Security**: Scrypt-based password hashing with salt
- **API Design**: RESTful API endpoints with proper HTTP status codes and error handling

### Database Layer
- **Database**: PostgreSQL for reliable, ACID-compliant data storage
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema**: Well-normalized relational schema with proper foreign key constraints

### Security & Authentication
- **Password Security**: Crypto module with scrypt for secure password hashing
- **Session Management**: Secure session storage in PostgreSQL
- **Authentication Flow**: Traditional session-based authentication with Passport.js
- **Route Protection**: Middleware-based route protection for authenticated endpoints

### Development & Build Process
- **Development**: Hot module replacement with Vite dev server
- **Build**: Separate client and server builds with ESBuild for server bundling
- **Type Checking**: Shared TypeScript configuration across client, server, and shared modules
- **Code Organization**: Monorepo structure with shared schema and types

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Connection Pooling**: @neondatabase/serverless for efficient database connections

### UI & Design System
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Pre-built component library based on Radix UI primitives
- **Lucide React**: Icon library for consistent iconography

### Authentication & Security
- **Passport.js**: Authentication middleware with local strategy
- **bcrypt**: Alternative password hashing library (available but scrypt is used)
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store

### Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Development Tools
- **TypeScript**: Static type checking across the entire stack
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for server code
- **Drizzle Kit**: Database migration and introspection tools

### Replit Integration
- **@replit/vite-plugin-cartographer**: Development environment integration
- **@replit/vite-plugin-dev-banner**: Development mode indicators
- **@replit/vite-plugin-runtime-error-modal**: Enhanced error reporting