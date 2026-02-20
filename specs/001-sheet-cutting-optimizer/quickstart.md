# Quickstart Guide: Sheet Cutting Optimizer

**Version**: 1.0.0  
**Last Updated**: 2026-02-14

## Overview

The Sheet Cutting Optimizer helps woodworkers minimize waste by calculating optimal cutting patterns from stock sheets. This guide will get you up and running in under 10 minutes.

## Prerequisites

- **Docker** (version 20.10+) and **Docker Compose** (version 2.0+)
- **Git** (for cloning the repository)
- **Web browser** (Chrome, Firefox, Safari - desktop or mobile)

*No Python or Node.js installation required - everything runs in Docker.*

## Quick Start (3 Steps)

### 1. Clone and Build

```bash
# Clone the repository
git clone https://github.com/your-org/woodcutter.git
cd woodcutter

# Build and start the Docker container
docker-compose up --build
```

**Expected output**:
```
✓ Container woodcutter-app-1 Started
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Open the Application

Navigate to: **http://localhost:8000**

You should see the Star Trek LCARS-themed interface.

### 3. Create Your First Cutting Plan

1. **Add Stock Sheets**:
   - Click "Add Stock Sheet"
   - Enter: Width 2400mm, Length 1200mm, Thickness 18mm
   - Label: "Plywood Sheet A"
   - Priority: Normal
   - Click "Save"

2. **Add Required Cuts**:
   - Click "Add Cut"
   - Enter: Width 800mm, Length 400mm, Thickness 18mm
   - Label: "Shelf A"
   - Quantity: 6
   - Click "Save"

3. **Optimize**:
   - Set Kerf Width: 3mm (default)
   - Click "Optimize Cutting Plan"
   - View the results: visual diagram showing all 6 pieces on 1 sheet

4. **Export** (optional):
   - Click "Print View" to see A4-formatted cutting instructions
   - Use browser print (Cmd/Ctrl + P) to print or save as PDF

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  User Browser (Desktop or Mobile)          │
│  - LCARS-themed UI (Tailwind CSS)          │
│  - JavaScript for interactivity            │
└───────────────┬─────────────────────────────┘
                │ HTTP/REST
                ▼
┌─────────────────────────────────────────────┐
│  FastAPI Backend (Python 3.11)              │
│  - REST API endpoints                       │
│  - Guillotine optimization algorithm        │
│  - Pydantic validation                      │
└───────────────┬─────────────────────────────┘
                │ SQLAlchemy ORM
                ▼
┌─────────────────────────────────────────────┐
│  SQLite Database (data/woodcutter.db)       │
│  - stock_sheets, required_cuts              │
│  - cutting_plans, plan_assignments          │
└─────────────────────────────────────────────┘
```

**All components run in a single Docker container for simplicity.**

---

## Development Workflow

### Running Tests

```bash
# Unit tests (optimizer algorithm)
docker-compose exec app pytest tests/unit -v

# Integration tests (API endpoints)
docker-compose exec app pytest tests/integration -v

# Contract tests (API schemas)
docker-compose exec app pytest tests/contract -v

# All tests with coverage
docker-compose exec app pytest --cov=app tests/
```

### Viewing Logs

```bash
# Follow application logs
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

### Database Access

```bash
# Access SQLite database
docker-compose exec app sqlite3 /app/data/woodcutter.db

# Example queries
sqlite> SELECT * FROM stock_sheets;
sqlite> SELECT * FROM cutting_plans ORDER BY created_at DESC LIMIT 5;
sqlite> .exit
```

### Hot Reload (Development)

The container is configured with volume mounts for hot reload:

```yaml
# docker-compose.yml includes:
volumes:
  - ./backend:/app/backend
  - ./frontend:/app/frontend
```

Edit files locally, and FastAPI will auto-reload. Refresh browser to see changes.

---

## API Documentation

### Interactive API Docs

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Example API Calls

#### Add Stock Sheet

```bash
curl -X POST http://localhost:8000/api/v1/stock \
  -H "Content-Type: application/json" \
  -d '{
    "width": 2400,
    "length": 1200,
    "thickness": 18,
    "label": "Plywood Sheet A",
    "priority": "normal"
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "width": 2400,
  "length": 1200,
  "thickness": 18,
  "label": "Plywood Sheet A",
  "priority": "normal",
  "created_at": "2026-02-14T21:30:00Z"
}
```

#### Add Required Cut

```bash
curl -X POST http://localhost:8000/api/v1/cuts \
  -H "Content-Type: application/json" \
  -d '{
    "width": 800,
    "length": 400,
    "thickness": 18,
    "label": "Shelf A",
    "quantity": 6
  }'
```

#### Optimize Cutting Plan

```bash
curl -X POST http://localhost:8000/api/v1/plans/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "kerf_width": 3.0
  }'
```

**Response**:
```json
{
  "id": "660f9500-f39c-52e5-b827-557766551111",
  "created_at": "2026-02-14T21:35:00Z",
  "kerf_width": 3.0,
  "total_waste": 1056000,
  "sheets_used": 1,
  "utilization_percent": 78.5,
  "assignments": [
    {
      "id": "770fa600-g40d-63f6-c938-668877662222",
      "sheet": { ... },
      "cut": { ... },
      "x_position": 0,
      "y_position": 0,
      "rotation": 0,
      "sequence_number": 1
    }
  ]
}
```

---

## Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=sqlite:///./data/woodcutter.db

# Server
HOST=0.0.0.0
PORT=8000
RELOAD=true  # Development only

# CORS (if needed for separate frontend)
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Kerf Width Defaults

Modify `backend/app/config.py`:

```python
class Settings:
    DEFAULT_KERF_WIDTH: float = 3.0  # mm
    MIN_KERF_WIDTH: float = 0.0
    MAX_KERF_WIDTH: float = 10.0
```

---

## Troubleshooting

### Port 8000 Already in Use

```bash
# Option 1: Stop the conflicting process
lsof -ti:8000 | xargs kill -9

# Option 2: Change the port in docker-compose.yml
ports:
  - "8080:8000"  # Use port 8080 instead
```

### Database Locked Error

```bash
# Stop all containers
docker-compose down

# Remove database lock
rm data/woodcutter.db-shm data/woodcutter.db-wal

# Restart
docker-compose up
```

### LCARS Theme Not Loading

Check browser console for errors. Ensure:
- `frontend/static/css/lcars-theme.css` exists
- Tailwind CSS is compiled (should happen during Docker build)
- Browser cache cleared (Cmd/Ctrl + Shift + R)

### Optimization Takes Too Long

If optimization exceeds 5 seconds:
- Reduce number of cuts (try ≤50 cuts for testing)
- Check for extremely large stock sheets (≥5000mm)
- Review logs for algorithm performance: `docker-compose logs app | grep "optimizer"`

---

## Mobile Access

### Local Network Access

1. Find your computer's local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr IPv4
   ```

2. Update docker-compose.yml to allow external access:
   ```yaml
   ports:
     - "0.0.0.0:8000:8000"  # Allow external connections
   ```

3. On mobile, navigate to: `http://<YOUR_IP>:8000`
   Example: `http://192.168.1.10:8000`

### Mobile Testing Tips

- **Touch targets**: All buttons are minimum 44px (constitution requirement)
- **Responsive**: Test both portrait and landscape orientations
- **Print**: Mobile browsers support print-to-PDF for cutting instructions
- **Offline**: Session storage persists data during temporary disconnections

---

## Next Steps

1. **Add More Features** (Future Enhancements):
   - Save/load projects (beyond session storage)
   - Export to CSV or JSON
   - Multi-user support with authentication
   - Advanced optimization options (grain direction, nested cuts)

2. **Customize LCARS Theme**:
   - Edit `frontend/static/css/lcars-theme.css`
   - Modify Tailwind config in `frontend/tailwind.config.js`
   - Experiment with LCARS color variations

3. **Optimize Performance**:
   - Implement caching for repeated optimizations
   - Add background job queue for large cutting plans (Celery)
   - Profile algorithm with `cProfile` for bottlenecks

4. **Deploy to Production**:
   - Use `docker-compose -f docker-compose.prod.yml up -d`
   - Set `RELOAD=false` in production environment
   - Add reverse proxy (Nginx) for SSL/TLS
   - Configure database backups (daily SQLite file copies)

---

## Support

- **Documentation**: See `docs/` directory for detailed guides
- **API Reference**: http://localhost:8000/docs (when running)
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions for questions

---

## License

See LICENSE file in repository root.
