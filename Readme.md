# Backend Starter Template

A robust and type-safe API starter template built with Koa.js and PostgreSQL.

## Key Features

- **Type-safe API Development**: End-to-end type safety using TypeScript and Zod for validation
- **API Request/Response Validation**: Automatic validation of request parameters, query strings, bodies, and responses
- **Structured Error Handling**: Consistent API error responses with proper status codes
- **File Upload Support**: Built-in file upload handling with validation
- **Database Integration**: PostgreSQL client with transaction support and schema validation
- **Environment Configuration**: Type-safe environment variable handling with validation
- **Middleware Architecture**: Modular middleware for cross-cutting concerns
- **Logging**: Structured logging with Winston

## Technical Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: [Koa.js](https://koajs.com/)
- **Database**: PostgreSQL with the [pg](https://node-postgres.com/) client
- **Validation**: [Zod](https://zod.dev/) for schema validation
- **Logging**: Winston for structured logging

## Getting Started

### Database Setup

PostgreSQL is the database used in this template.

1. **Start a PostgreSQL database**

   Using Docker (recommended):

   ```bash
   docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
   ```

   For persistent data storage:

   ```bash
   docker volume create postgres_data
   docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres
   ```

2. **Initialize database schema**

   Run the DDL script to create necessary tables:

   ```bash
   psql -h localhost -U postgres -d postgres -f src/services/db/ddl.sql
   ```

   This creates a restricted database user `appuser` for the application to use.

### API Server Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy the template environment file:

   ```bash
   cp .env.template .env
   ```

   Update the variables in `.env` to match your setup:

3. **Start the development server**

   ```bash
   npm run dev
   ```

   This starts the server with hot reloading enabled.

## Project Structure

```
src/
├── apibase.ts         # Core API abstractions and type-safe handler system
├── server.ts          # Main application entry point
├── middlewares/       # Koa middleware components
│   ├── apiConventions.ts  # API response standardization
│   └── reqLogger.ts       # Request logging
├── routes/            # API endpoint definitions
│   ├── health.ts      # Health check endpoints
│   └── index.ts       # Route aggregation
└── services/          # Core business logic and external dependencies
    ├── config.ts      # Environment configuration
    ├── logger.ts      # Logging service
    └── db/            # Database-related components
        ├── client.ts  # PostgreSQL client with type-safe query execution
        └── ddl.sql    # Database schema definitions
```

## Creating New Endpoints

The template provides a type-safe API handler system. Here's a basic example:

```typescript
// Example endpoint
endpt(
  "/users/:id",
  GET,
  apihandler({
    paramsSchema: { id: z.string() },
    querySchema: { includeDetails: z.boolean().optional() },
    respSchema: {
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
    },
    errSchema: { message: z.string() },
    handler: async ({ params, query }) => {
      // Implementation goes here
      return resp(200, "User retrieved successfully", {
        id: params.id,
        name: "John",
        email: "john@example.com",
      })
    },
  }),
)
```

## Building for Production

```bash
npm run build
```

This creates a production-ready build in the `dist` directory.
