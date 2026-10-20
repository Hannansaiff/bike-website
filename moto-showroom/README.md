# RevZone Motors – Motorcycle Showroom Management System (Demo)

A complete motorcycle dealership platform: a premium public website and a separate
admin dashboard, built with **React + Vite** (frontend) and **Python FastAPI** (backend).

> **Demo phase:** no database. All data is realistic *sample* data held in backend
> memory and **resets whenever the backend restarts**. Brands, models, specifications,
> customers, chassis/engine numbers and transactions are fictional.

```
moto-showroom/
├── backend/            FastAPI API (in-memory demo data)
│   ├── app/main.py     App, CORS, error handling, router registration
│   ├── app/config.py   Settings (env-overridable)
│   ├── app/core/       Store, errors, helpers
│   ├── app/repositories/  Repository interfaces + in-memory implementation
│   ├── app/services/   Business rules (catalogue, inventory, bookings, sales…)
│   ├── app/routers/    REST endpoints
│   ├── app/schemas/    Pydantic request models
│   └── app/mock_data/seed.py   The single source of initial sample data
└── frontend/           React + Vite + Tailwind + Framer Motion + Recharts
    └── src/
        ├── lib/        API client, service layer, formatting, validation
        ├── context/    Site content, auth (demo), favourites/compare, toasts
        ├── hooks/      useApi, useForm, useDebounce
        ├── components/ ui/ (shared), public/, admin/ (CrudPage, charts, tables)
        ├── layouts/    PublicLayout, AdminLayout
        └── pages/      public/ and admin/
```

## Requirements

- Python 3.10+ (3.11/3.12 recommended)
- Node.js 18+ (20 LTS recommended)

## Run on Windows (PowerShell)

### 1. Backend (terminal 1)

```powershell
cd moto-showroom\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

If PowerShell blocks the activate script, run once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 2. Frontend (terminal 2)

```powershell
cd moto-showroom\frontend
npm install
npm run dev
```

Optional: `Copy-Item .env.example .env` to change the API URL (default `http://localhost:8000/api`).

## Deploy to Vercel

The root `vercel.json` configures the frontend and FastAPI backend as services
under one Vercel project and one public domain. Import the GitHub repository in
Vercel and set the project **Root Directory** to `moto-showroom` (the directory
containing this README and `vercel.json`). Vercel then builds both services and
routes `/api/*` to FastAPI and all other paths to the React SPA. The frontend
defaults to the same-origin `/api` in production; local development continues to
use `http://localhost:8000/api`.

Vercel Hobby is intended for personal, non-commercial use and is subject to usage
limits. This is a demo: its backend data is in memory, so writes may be lost or
inconsistent across serverless instances and restarts. Authentication is not real
security, and the API is publicly accessible. Do not use this deployment with real
customer data or for production operations.

### URLs

| What | URL |
|---|---|
| Public website | http://localhost:5173 |
| Admin panel | http://localhost:5173/admin/login |
| API base | http://localhost:8000/api |
| Swagger API docs | http://localhost:8000/docs |

Production build of the frontend: `npm run build` then `npm run preview`.

## Demo logins (demonstration only)

**Admin panel** – password for every staff account: `admin123`

| Email | Role |
|---|---|
| admin@demo-showroom.pk | Owner / Admin (all modules) |
| manager@demo-showroom.pk | Manager |
| sales@demo-showroom.pk | Sales Representative |
| inventory@demo-showroom.pk | Inventory Manager |

**Customer account** – any seeded customer, e.g. `ahmed.1@example.com` / `demo1234`, or register a new one.

## What's included

**Public site:** animated hero with tachometer, featured / new / best-selling / electric /
scooter / pre-owned sections, brands, offers, banners, testimonials, FAQs; full catalogue
with search, filters (category, brand, price, cc, fuel, condition, year, availability),
sorting, pagination, active-filter chips and reset; category pages; product pages with
gallery, specs, offers and related bikes; compare 2–3 bikes; favourites; booking workflow
(test ride / showroom visit / purchase enquiry) with validation and booking reference;
booking tracking; contact form; demo customer accounts with booking, test-ride, purchase
and enquiry history.

**Admin (`/admin`):** dashboard (live stats, charts, low stock, upcoming test rides, recent
activity, date range); CRUD for motorcycles, categories, brands, offers, gallery, banners,
testimonials, FAQs, staff, customers, enquiries; bookings with status workflow, notes,
reschedule and status history; inventory (per model, individual units with fictional
chassis/engine numbers, reserve/release, add stock, history, low-stock alerts); sales with
simulated payments, invoice preview/print, archive and reversal (never deleted); website
content manager; reports (sales, inventory, bookings, customers, popularity) with print;
activity log; settings; light/dark theme; reset demo data.

## Business rules

- **Bike vs stock vs booking vs sale are separate.** A booking never changes stock.
  Staff reserve units in Inventory; only recording a sale marks a unit sold.
- A sold unit can't be sold again (checked under a lock). Reversing a sale returns the
  unit to stock and marks the payment refunded; the sale stays in history.
- Booking status transitions are enforced (e.g. completed/rejected/cancelled are final).
  Booking dates can't be in the past, are limited to 90 days ahead and to showroom hours.
- Displayed availability is derived from units: available, reserved, sold out, out of
  stock, discontinued, upcoming.
- Offer status (active / scheduled / expired / inactive) is computed from dates on every
  request. One pricing function drives the card, product page and default sale discount.
- Deleting categories/brands in use, bikes with sales, and customers with purchases is
  blocked with a clear message (deactivate / discontinue instead).

## Demo limitations

- In-memory data – everything resets when the backend restarts (or via *Reset demo data*).
- Authentication is **demo only**: API endpoints are not protected; the admin token is not
  verified; roles only shape the admin menu (frontend). Customer passwords use unsalted SHA-256.
- Images are URLs (sample photos from Unsplash with a local fallback). No file uploads.
- Favourites, compare list, sessions and theme are stored in the browser (localStorage).
- The map is a labelled placeholder until a Google Maps embed URL is set in Admin → Content.
- Activity logs are not tamper-proof and do not survive restarts.

## Connecting a real database later (e.g. PostgreSQL)

Services only talk to repositories (`app/repositories/base.py`). To move to PostgreSQL:

1. Add `sqlalchemy`, `psycopg[binary]` and `alembic`; define tables mirroring the seed records.
2. Implement `SqlRepository` classes with the same methods (`all`, `get`, `find`, `first`,
   `add`, `update`, `remove`) and a `DocumentRepository` for content/settings (a JSONB table).
3. Swap the instances at the bottom of `repositories/base.py`; wrap sales creation in a DB
   transaction with `SELECT … FOR UPDATE` on the unit row instead of the in-process lock.
4. Move filtering/pagination into SQL queries for large catalogues.
5. Migrate `mock_data/seed.py` into a one-off seed script.

## Before production

Secure password hashing (bcrypt/argon2), signed expiring tokens or sessions, backend
authorization per role on every endpoint, rate limiting on public forms, strict input
validation, persistent image storage (S3/Cloudinary), database-backed audit logs, HTTPS,
restricted CORS origins, and real payment-gateway integration if online payments are needed.
