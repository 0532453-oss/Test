# Service-Flex-Website

This is the marketing website for FlexDesk.

## Getting Started

We're using Next.js with Postgres for the database.

1. Copy the .env.example file to .env and fill in the values.

2. Run the migrations:

```bash
npm run database:migrate
```

3. Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Or to build in prod:

```bash
npm run build
npm run start
```
