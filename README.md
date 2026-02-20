# Sheet Cutting Optimizer

A web-based tool that helps woodworkers minimise waste when cutting stock sheets. Enter your available sheets and required cuts, and the optimizer calculates the best layout using a guillotine-cut algorithm. Runs as a single Docker container.

## Features

- ✂️ **Guillotine Optimization** — First Fit Decreasing algorithm with kerf-aware placement
- 📊 **Visual Cutting Diagrams** — SVG diagrams with numbered badges, callout labels, and viewport cropping
- 📦 **Stock Sheet Quantity** — Define multiple identical sheets; each is packed independently
- ⚠️ **Unplaced Cuts** — Best-effort optimization flags cuts that don't fit with clear reasons
- 🗄️ **Storage Carry-Over** — Send unused sheets to storage; they auto-load in your next project
- 🖨️ **Print Export** — A4-formatted cutting instructions for the workshop
- 🐳 **Docker Ready** — Single-command build and deploy

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2+

### Option A — Run from Docker Hub (recommended)

Create a `docker-compose.yml`:

```yaml
services:
  app:
    image: ashleykingscote/woodcutter:latest
    container_name: woodcutter-app
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:////app/data/woodcutter.db
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
```

Then run:

```bash
docker compose up -d
```

### Option B — Build from source

```bash
git clone https://github.com/meatalhead/woodcutter.git
cd woodcutter
docker compose up --build -d
```

The included `docker-compose.yml` builds locally and volume-mounts the source for development.

---

The app is now running at **http://localhost:8000**.

To stop:

```bash
docker compose down
```

### Rebuild After Code Changes

Python (backend) changes require a container restart:

```bash
docker compose down && docker compose up --build -d
```

Frontend changes (HTML/JS/CSS) are volume-mounted and take effect on page reload — no rebuild needed.

## Usage

1. **Add Stock Sheets** — Label, dimensions (W × L × thickness in mm), quantity, priority
2. **Add Required Cuts** — Label, dimensions, thickness (must match a stock sheet), quantity
3. **Set Kerf Width** — Blade thickness in mm (default 3mm)
4. **Optimize** — Click "Optimize Cutting Plan"
5. **Review Results** — Sheets used, cuts placed, visual diagrams, any unplaced cuts
6. **Storage** — Send unused sheets to storage; click "New Project" to start fresh with stored sheets pre-loaded

## Architecture

```
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI route handlers
│   │   ├── models/         # SQLAlchemy models (SQLite)
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   └── services/       # Optimizer engine, cutting service
│   └── requirements.txt
├── frontend/
│   └── static/
│       ├── index.html      # Single-page app (Tailwind CSS)
│       └── js/
│           ├── app.js      # Application logic, API calls, state
│           └── diagram.js  # SVG cutting diagram renderer
├── Dockerfile              # Multi-stage Python 3.11 build
├── docker-compose.yml      # Container orchestration
└── specs/                  # Feature specifications
```

| Layer    | Tech                          |
|----------|-------------------------------|
| Backend  | Python 3.11, FastAPI, SQLAlchemy, SQLite |
| Frontend | Vanilla JS, Tailwind CSS (CDN) |
| Infra    | Docker, docker-compose        |

## Development

### View Logs

```bash
docker compose logs -f app
```

### Run Tests

```bash
docker compose exec app pytest
```

### API Documentation

While the container is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Configuration

| Setting        | Default | Range      |
|----------------|---------|------------|
| Kerf width     | 3 mm    | 0–10 mm   |
| Dimensions     | —       | 0.1–10,000 mm |
| Sheet quantity | 1       | 1+         |

## Data Persistence

The SQLite database is stored at `./data/woodcutter.db` on the host (volume-mounted). Your stock sheets and cuts persist across container restarts. Storage carry-over uses browser `localStorage`.
