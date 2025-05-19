# SnipStash

A smart code snippet organizer for developers to save, categorize, and search code snippets.

## Features

- Save code snippets with syntax highlighting
- Automatic smart tagging based on code content
- Filter snippets by language, tags, or keywords
- Copy snippets to clipboard with usage tracking
- Organize snippets into folders
- Dark mode UI

## Project Structure

- `/frontend` - Next.js frontend application
- `/backend` - Node.js Express backend API

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- PostgreSQL database

### Backend Setup

```bash
cd backend
npm install
# Create a .env file with database connection details
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=snipstash
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your_jwt_secret
```

## License

MIT