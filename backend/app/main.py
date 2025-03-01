from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import ml, auth
from app.core.config import settings
from fastapi import Request

app = FastAPI(title=settings.PROJECT_NAME)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175", 
        "http://localhost:5176", 
        "http://localhost:5177", 
        "http://localhost:5178", 
        "http://localhost:5179", 
        "http://localhost:5180"
    ],  # Allow frontend origins on various ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    try:
        if request.method in ["POST", "PUT", "PATCH"]:
            request_data = await request.json()
            print(f"Request data: {request_data}")
    except Exception:
        pass  # Ignore errors for requests without JSON bodies
    response = await call_next(request)
    return response

# Register routers
app.include_router(ml.router, prefix="/api/v1/ml")
app.include_router(auth.router, prefix="/api/v1/auth")

@app.get("/")
async def root():
    return {"message": "Expense Tracker API is running"}