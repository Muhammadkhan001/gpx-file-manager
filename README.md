# GPX File Management System

A full-stack web application for uploading, managing, editing, searching, and downloading GPX waypoint data. The application parses GPX/XML files, stores waypoint information in a PostgreSQL database, and dynamically adapts to new waypoint attributes by updating the database schema when required.

## Features

- Upload and parse multiple GPX/XML files
- Automatically extract waypoint data
- Dynamic database schema synchronization for new GPX tags
- Store waypoint and file metadata in PostgreSQL
- View all stored waypoint records
- Display selected database columns
- Edit waypoint information directly from the interface
- Search waypoint data by keyword
- Search files by group and date
- Download reconstructed GPX files from database records
- Delete single or multiple files with checkbox selection
- Automatic cleanup of related waypoint records

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL

## Project Structure

```text
gpx-file-management-system/
│
├── index.html
├── index.js
├── style.css
├── package.json
├── package-lock.json
│
├── gpx-backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── .gitignore
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Muhammadkhan001/gpx-file-manager.git
cd gpx-file-manager
```

### 2. Install dependencies

Frontend:

```bash
npm install
```

Backend:

```bash
cd gpx-backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `gpx-backend` directory.

Example:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=gpxdashboard
```

### 4. Create the PostgreSQL database

Create a database named:

```text
gpxdashboard
```

Create the required `files` and `waypoints` tables before running the application.

### 5. Start the backend server

```bash
cd gpx-backend
node server.js
```

### 6. Run the frontend

Open `index.html` in your browser.

## Project Highlights

- Dynamic database schema updates for newly discovered GPX tags
- GPX reconstruction from stored database records
- Batch upload and deletion support
- Editable waypoint records
- Search and filtering capabilities
- Automatic database cleanup for deleted files

## Repository

```
git clone https://github.com/Muhammadkhan001/gpx-file-manager.git
```
