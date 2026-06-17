# Ecommerce Dydalo

E-commerce platform built with Next.js and NestJS in a monorepo architecture.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: NestJS, Prisma
- **Database**: PostgreSQL
- **Monorepo**: Turborepo, pnpm workspaces
- **UI Components**: shadcn/ui

## Project Structure

```
ecommerce-dydalo/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend API
├── packages/
│   ├── ui/           # Shared UI components
│   ├── eslint-config/ # Shared ESLint configurations
│   └── typescript-config/ # Shared TypeScript configurations
└── turbo.json        # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter web dev
pnpm --filter api dev

# Build all apps
pnpm build

# Lint all apps
pnpm lint
```

## License

Private - All rights reserved
