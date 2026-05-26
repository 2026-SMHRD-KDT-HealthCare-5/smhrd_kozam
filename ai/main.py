import sys
import io
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import predict

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

app = FastAPI(title="kozam AI Server")

# CORS 설정 (필요한 경우)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(predict.router, prefix="/api/ai", tags=["predict"])

@app.get("/")
def read_root():
    return {"message": "hi, kozam AI server is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
