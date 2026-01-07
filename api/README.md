# WhiteRabbit API - Project Guide
>Guide for Python First-Timers

## Activation & Dependency Installation
### 1. Activate .venv
Prefer to have `pyenv` installed before start working on development.

```bash
#When Activating project's virtual env
source .venv/bin/activate

#When you wish to deactivate simply run,
deactivate
```

### 2. Install Project Dependencies
Read `pyproject.toml` file for all dependencies needed for this project

```bash
pip install -e .
```

Congratulations! You are all set up for running this project!

## Dev Server

### 1. Running FastAPI Dev Server
```bash
fastapi dev src/main.py

#if fastapi fails, run this
uvicorn src.main:app --reload
```

### 2. Reading the Swagger Docs Page (Auto-Generated)

>Access from localhost:8000/docs

## Env .env.example
### 1. `ORIGIN_URL` Frontend URL for CORS