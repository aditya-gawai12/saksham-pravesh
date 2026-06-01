# Saksham Pravesh MHT CET Counseling Web Platform (MVP)
We don't just advise, we automate the entire counseling pipeline from student registration to college placement.

A Node.js & Express-based web platform designed to automate student registration for MHT CET engineering/pharmacy/nursing counseling, with manual payment verification and real-time announcement board controls.

## Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (Bootstrap 5 via CDN, custom dark HSL-based responsive stylesheet)
* **Backend:** Node.js with Express.js
* **Database:** MySQL
* **Authentication:** Custom session-based auth using `express-session` & `bcrypt` password hashing

---

## Folder Structure
```
saksham-pravesh/
│
├── config/
│   └── db.js               # MySQL connection setup (using mysql2/promise pool)
│
├── public/                 # Static assets
│   ├── css/
│   │   └── style.css       # Custom design stylesheet
│   └── js/
│       └── main.js         # Client-side form handlers & dashboard bindings
│
├── routes/                 # Express route controllers
│   ├── auth.js             # User login, registration, self and logout handlers
│   ├── student.js          # Student data and notices fetcher
│   └── admin.js            # Admin user fetcher, payment updates and notices creator
│
├── views/                  # HTML templates served via authenticated routes
│   ├── index.html          # Public landing page with testimonials
│   ├── login.html          # Sign In page
│   ├── register.html       # Student signup form
│   ├── student.html        # Secure student dashboard (notices/meeting links)
│   └── admin.html          # Secure administrator console (toggles/announcement publisher)
│
├── .env                    # System environmental credentials
├── .env.example            # Environment template config
├── package.json            # Application dependencies and execution scripts
├── schema.sql              # Database initialization and seeding script
└── README.md               # Setup and development instructions
```

---

## Installation & Setup Instructions

### Prerequisites
1. **Node.js:** Ensure Node.js (>= 18.0) is installed.
2. **MySQL:** Ensure a local MySQL server instance is running.

### 1. Database Configuration
1. Open your MySQL client (e.g., MySQL Workbench, Command Line, phpMyAdmin, or DBeaver).
2. Execute the queries inside [`schema.sql`](./schema.sql) to initialize the database and create tables.
   > **Note:** This automatically creates the `saksham_pravesh` database, `users` and `notices` tables, and inserts a seed administrator credential:
   > - **Admin Email:** `admin@sakshampravesh.com`
   > - **Admin Password:** `adminPassword123`

### 2. Environment Setup
1. Copy `.env.example` into a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your local database connection parameters:
   ```env
   PORT=3000
   SESSION_SECRET=your_secret_key_here
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=saksham_pravesh
   ```

### 3. Install Dependencies
Navigate to the directory and run:
```bash
npm install
```

### 4. Start Server
Run the local dev command to start the server:
```bash
npm run start
```
For automatic restart on file edits:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to browse the platform.

---

## Security Features & Authentication Flow
1. **Route Protection:** Direct request paths to `/student` and `/admin` check session validation middleware inside `server.js`. Unauthenticated users are redirected to `/login`.
2. **Role Restrictions:** Only users with `role === 'admin'` can access `/admin`. Non-admin users are automatically redirected back to `/student`.
3. **Password Security:** Student passwords are never stored in plain text. Registration hashes passwords via `bcrypt` with `10` salt rounds, and compares it upon login.
4. **SQL Injection Defense:** All database queries utilize parameterized prepared statements (via `mysql2`'s `db.execute()`) preventing query manipulation.
5. **Notice Restriction:** The `/api/student/dashboard` endpoint queries the database directly and returns counseling notices/meeting links only if the student's status is `'approved'`.
