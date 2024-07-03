## Description

This is the a starter template to build APIs using Koa and Postgres

## Local Development

### Database Setup
PostgreSQL is the only database used.

To set up the PostgreSQL database for the API server:

1. Start a PostgreSQL database server on your local machine

   The easiest way is to use the Docker PostgreSQL container.
   Run the following command to start the PostgreSQL container:

   ```bash
   docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
   ```

   Optionally, you can use Docker volumes to make the data persistent by adding the `-v` flag.

   ```bash
   docker volume create <volume-name>
   docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 -v <volume-name>:/var/lib/postgresql/data postgres
   ```

1. Run the `src/services/db/ddl.sql` script in this repo to create the tables.

   ```bash
   psql -h localhost -U postgres -d postgres -f src/services/db/ddl.sql
   ```

   You can also use a GUI tool like pgAdmin or DBeaver to run the script.

   This SQL script will create a database user named `appuser`. This is the user
   the application should connect to the database with, and has some restricted
   permissions to add an extra layer of security.

### API Server Setup

1. Run `npm install` to install the Node.js dependencies.
1. Ensure that the PostgreSQL server is running.
1. Run `npm run dev` to start the server in development mode.

The environment variables are stored in a `.env_dev` in the root directory.
It's got the common environment variables for development.
Edit the file to match your local setup.
