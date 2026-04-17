# temporal-typescript-agents

Four-demo AI agents workshop in TypeScript using the Anthropic SDK and Temporal.

The demo progression mirrors the `python-agent-demo` repo:

| Demo | File | What it shows |
|------|------|---------------|
| 1 | `demo1-raw.ts` | Raw agentic loop — plain while loop, no Temporal. Kill it mid-run, everything is lost. |
| 2 | `demo2-workflow.ts` | Explicit Temporal workflow. Restart the worker mid-run — the workflow resumes. |
| 3 | `demo3-clean.ts` | Clean tool registry dispatch. Same durability, no if/else chain. |
| 4 | `demo4-hitl.ts` | Human in the loop. The agent pauses and asks the user a question via signal/query. |

## Prerequisites

- Docker and Docker Compose
- An Anthropic API key

## Quick start

```bash
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env

docker compose up --build
```

Services that start:
- Temporal dev server — `localhost:7233`
- Temporal UI — `http://localhost:8080`
- Network Control Panel — `http://localhost:5000`
- Agent worker (auto-starts Demo 2/3/4 workflow processing)

## Running the demos

### Demo 1 — raw loop (no Temporal)

```bash
docker compose exec agent npx ts-node demo1-raw.ts "What are the weather alerts in California?"
```

Press `Ctrl+C` mid-run. Everything is lost. That's the point.

### Demo 2 — explicit Temporal workflow

Terminal 1 — worker is already running via Docker Compose.

Terminal 2:
```bash
docker compose exec agent npx ts-node starter2.ts "What are the weather alerts in Texas?"
```

While it runs, `docker compose restart agent`. The workflow resumes from where it left off.

### Demo 3 — clean dispatch

```bash
docker compose exec agent npx ts-node starter3.ts "What are the weather alerts in Florida?"
```

Open `demo3-clean.ts` alongside `demo2-workflow.ts`. The loop is identical — only the tool dispatch changed.

### Demo 4 — human in the loop

```bash
docker compose exec -it agent npx ts-node starter4.ts "Should I worry about weather near me?"
```

The agent will ask you which state you're in. While it's waiting, check the Temporal UI — the workflow shows as Running with no executing activities. Answer the question in the terminal; the workflow resumes.

## Network Control Panel

Open `http://localhost:5000` to toggle external service access mid-demo:

| Toggle | Blocks |
|--------|--------|
| Anthropic (Claude) | `api.anthropic.com` |
| NWS Weather Alerts | `api.weather.gov` |
| Nominatim Geocoding | `nominatim.openstreetmap.org` |

Toggle an API off while a workflow is running — watch the activity fail and Temporal retry it automatically. Toggle it back on — the next retry succeeds.

## Running locally without Docker

```bash
cd agent
npm install

# Terminal 1: Temporal dev server
temporal server start-dev

# Terminal 2: worker
npm run worker

# Terminal 3: run a demo
npm run demo1
npx ts-node starter2.ts "What are the weather alerts in California?"
```

Note: without Docker, the proxy is not active and API toggles won't work.

## Project structure

```
temporal-typescript-agents/
├── docker-compose.yml
├── .env.example
├── agent/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tools.ts          # TOOLS and TOOLS_HITL — Claude tool definitions
│   ├── activities.ts     # Temporal activities: callLLM + tool activities
│   ├── demo1-raw.ts      # Raw loop (no Temporal)
│   ├── demo2-workflow.ts # Explicit workflow with if/else dispatch
│   ├── demo3-clean.ts    # Clean registry dispatch
│   ├── demo4-hitl.ts     # HITL workflow (signals + queries)
│   ├── worker.ts         # Registers all workflows and activities
│   ├── starter2.ts       # Start Demo 2 workflow
│   ├── starter3.ts       # Start Demo 3 workflow
│   └── starter4.ts       # Start Demo 4 HITL workflow (handles stdin)
└── proxy/
    ├── Dockerfile
    ├── entrypoint.sh     # Generates CA cert, starts mitmproxy + Flask
    ├── toggle_addon.py   # mitmproxy addon: reads state.json, blocks services
    ├── controlpanel.py   # Flask app: REST API + serves UI
    └── static/index.html # Control panel UI
```
