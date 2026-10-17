# TripNest — Luxury Travel & VIP Concierge Platform

Full-stack application featuring a React 19 + Tailwind CSS frontend, Express middleware proxy, and a Java Spring Boot 3.2 microservice backend.

---

## 🏛️ Project Sub-Module Division (Frontend, Backend & Database)

All 13 project sub-modules are organized directly within the repository root under [`frontend/`](./frontend), [`backend/`](./backend), and [`database/`](./database), corresponding to each team member's assigned module:

### 🎨 [Frontend Modules](./frontend) (7 Sub-Modules)
| # | Module Directory | Assigned Member | Feature Branch | Scope & Components |
|:---:|:---|:---|:---|:---|
| 1 | [`frontend/navya-auth-ui/`](./frontend/navya-auth-ui) | **Bashaboina Navya** | `feature/navya-auth-ui` | Authentication modals, sign-in/up tabs, session validation, logout modals |
| 2 | [`frontend/shravani-trip-dashboard/`](./frontend/shravani-trip-dashboard) | **Shravani Vishwa** | `feature/shravani-trip-dashboard` | Traveler analytics, admin metrics, booking count meters, My Trips overview |
| 3 | [`frontend/thripura-itinerary-ui/`](./frontend/thripura-itinerary-ui) | **Batraju Bala Thripura Sundhari** | `feature/thripura-itinerary-ui` | Day-by-day vacation itinerary builder, document export, custom day planner |
| 4 | [`frontend/husna-destination-ui/`](./frontend/husna-destination-ui) | **Shaik Husna Thahera** | `feature/husna-destination-ui` | Destination catalog, wonder details, destination modals, region filtering |
| 5 | [`frontend/meghana-budget-expenses-ui/`](./frontend/meghana-budget-expenses-ui) | **Anugandula Meghana** | `feature/meghana-budget-expenses-ui` | Trip budget tracker, category donut charts, planned vs actual spend |
| 6 | [`frontend/lasya-group-travel-ui/`](./frontend/lasya-group-travel-ui) | **Yaredla Lakshmi Lasya Reddy** | `feature/lasya-group-travel-ui` | Group travel collaboration, split-expense calculations, shared itineraries |
| 7 | [`frontend/sanjai-vault-booking-ui/`](./frontend/sanjai-vault-booking-ui) | **Sanjaikumar A** | `feature/sanjai-vault-booking-ui` | Digital document vault, hotel & excursion bookings, voucher management |

### ⚙️ [Backend Modules](./backend) (4 Sub-Modules)
| # | Module Directory | Assigned Member | Feature Branch | Scope & Components |
|:---:|:---|:---|:---|:---|
| 8 | [`backend/harsha-backend-api/`](./backend/harsha-backend-api) | **Harsha R** | `feature/harsha-backend-api` | Core Express routing, REST endpoints, Netlify serverless functions |
| 9 | [`backend/siddharth-auth-security/`](./backend/siddharth-auth-security) | **Siddharth Nayak** | `feature/siddharth-auth-security` | Session handling, JWT/token verification, CORS policies, role-based switching |
| 10 | [`backend/shreyas-trip-services/`](./backend/shreyas-trip-services) | **Shreyas** | `feature/shreyas-trip-services` | Itinerary generation engine, trip computation, geographical distance helpers |
| 11 | [`backend/sanket-notifications-ai/`](./backend/sanket-notifications-ai) | **Jagtap Sanket Machindra** | `feature/sanket-notifications-ai` | Gemini AI Concierge assistant service, Nodemailer automated notification dispatch |

### 🗄️ [Database Modules](./database) (2 Sub-Modules)
| # | Module Directory | Assigned Member | Feature Branch | Scope & Components |
|:---:|:---|:---|:---|:---|
| 12 | [`database/madhav-database-schema/`](./database/madhav-database-schema) | **Madhav Gorla** | `feature/madhav-database-schema` | PostgreSQL DDL table schemas, column migrations, entity data models |
| 13 | [`database/sravan-database-integration/`](./database/sravan-database-integration) | **Nuthamki Sravan Sathvik** | `feature/sravan-database-integration` | PostgreSQL connection pool, CRUD repositories, feature queries, analytics aggregations |

## 🚀 Quickstart: Run Everything with Only 2 Commands

Open your terminal or VS Code in the project root folder and execute:

### Step 1: Install Dependencies
```bash
npm i
```

### Step 2: Start Both Frontend and Java Backend
```bash
npm run dev
```

That's it! When you run `npm run dev`:
1. **Frontend & Web Server**: Boots up at `http://localhost:3000` (React 19 + Vite 6 + Express API gateway).
2. **Java Spring Boot Backend**: Automatically detected and launched concurrently in the background on port `8080` (Spring Boot 3.2 JPA REST Controller).
3. **Automatic Delegation & Proxy**: All REST API calls (`POST /api/trips`, `DELETE /api/trips/:id`, `GET /api/trips`) are automatically forwarded to the Java Spring Boot service when active.
4. **Fallback Resilience**: If Java is not installed or still starting up, the integrated high-speed database engine handles requests without errors.
5. **Unified Terminal**: Both Node.js and Java Spring Boot logs are color-coded and piped to your single VS Code terminal. Pressing `Ctrl + C` cleanly terminates both processes together.

---

## ☕ Java Requirements (Optional for Spring Boot execution)
To run the Java Spring Boot service alongside the Node server:
- **Java 17+** (OpenJDK, Temurin, or Oracle JDK)
- **Maven** (`mvn` in PATH or the included `mvnw`/`mvnw.cmd` wrapper)

*(If Java is not installed, the application automatically runs in full-stack mode on port 3000).*

---

## 📁 Project Architecture

```text
├── backend-java/               # Java Spring Boot 3.2 Microservice
│   ├── pom.xml                 # Maven configuration (Spring Boot, JPA, H2, PostgreSQL)
│   ├── mvnw & mvnw.cmd         # Maven Wrappers for Linux/macOS & Windows
│   └── src/main/java/...       # TripController, TripService, Trip entity, TripRepository
├── server/
│   ├── javaLauncher.ts         # Concurrent Java backend process orchestrator & proxy
│   ├── db.ts                   # Database persistence (PostgreSQL / local JSON store)
│   ├── ai.ts                   # Gemini 2.5 Flash luxury concierge integration
│   └── email.ts                # OTP authentication & welcome mailer
├── server.ts                   # Express server entry point & reverse proxy
├── app.ts                      # Modular Express app & API routing engine
├── netlify/
│   └── functions/api.ts        # Serverless Express API adapter for Netlify Functions
├── netlify.toml                # Netlify build, SPA routing, and API proxy configuration
├── src/                        # React 19 Frontend application
└── package.json                # Project dependencies and 2-command dev scripts
```

---

## 🌐 Deploy to Netlify

TripNest is pre-configured for seamless deployment to [Netlify](https://www.netlify.com).

### Deployment Architecture
- **Frontend**: React 19 + Vite 6 Single Page Application built to `dist/`, served via Netlify's global edge CDN.
- **Backend**: Express API endpoints (`/api/*`) run serverlessly through Netlify Functions (`netlify/functions/api.ts`).
- **SPA Routing**: Automatic redirects (`/*` -> `/index.html`) handled by `netlify.toml` and `public/_redirects`.

### Option A: Deploy via GitHub / GitLab / Bitbucket
1. Push your repository to GitHub.
2. In Netlify Dashboard, select **Add new site** > **Import an existing project**.
3. Select your repository. Netlify will auto-detect settings from [netlify.toml](file:///c:/Users/ADMIN/Downloads/Tripnest%20Review/netlify.toml):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. In **Site Configuration > Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `DATABASE_URL`: Your Neon PostgreSQL connection string (recommended for cloud persistence)
   - `APP_URL`: Your Netlify site URL (e.g. `https://your-site.netlify.app`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: *(Optional)* Google OAuth credentials
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: *(Optional)* Email delivery
5. Click **Deploy Site**!

### Option B: Deploy via Netlify CLI
```bash
# 1. Login to Netlify (one-time)
npx netlify login

# 2. Initialize and deploy
npx netlify init

# 3. Deploy to production
npx netlify deploy --prod
```

For full details and troubleshooting, see [NETLIFY_DEPLOYMENT.md](file:///c:/Users/ADMIN/Downloads/Tripnest%20Review/NETLIFY_DEPLOYMENT.md).

