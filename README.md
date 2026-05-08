# Kozam (코잠) - Snoring Monitoring & Analysis System

Kozam은 사용자의 수면 질 개선을 돕기 위해 코골이 패턴을 모니터링, 기록 및 분석하도록 설계된 종합 솔루션입니다. 이 시스템은 웹 기반 기록조회, 데이터 관리를 위한 백엔드 서버, 그리고 코골이 감지 및 분석을 위한 AI 서비스로 구성됩니다.

## 🚀 Project Overview

이 프로젝트는 크게 네 가지 구성 요소로 나뉩니다.
- **Client**: 사용자 상호 작용 및 데이터 시각화를 위한 React 기반 웹 애플리케이션
- **Server**: 비즈니스 로직 및 데이터베이스 상호 작용을 처리하는 Node.js/Express 백엔드
- **AI Service**: 오디오 데이터를 처리하고 코골이 패턴을 예측하는 Python/FastAPI 서비스
- **Database**: 사용자 프로필, 코골이 기록 및 분석 기록을 저장하는 SQL 기반 저장소

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Planned)

### Backend
- **Runtime**: Node.js
- **Framework**: Express

### AI Service
- **Language**: Python 3.x
- **Framework**: FastAPI
- **Libraries**: Scikit-learn, Librosa, NumPy (Planned)

### Database
- **Type**: MySQL

---

## 📁 Project Structure

```text
C:\Users\smhrd1\project_kozam\
├── ai/                 # Python AI Service (FastAPI)
│   ├── models/         # Pre-trained ML/DL models
│   ├── routers/        # API endpoints for predictions
│   ├── services/       # Core AI logic and processing
│   └── main.py         # AI service entry point
├── client/             # React Frontend (Vite)
│   ├── src/
│   │   ├── api/        # API client modules
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom hooks
│   │   ├── pages/      # Application views
│   │   └── utils/      # Utility functions
│   └── package.json
├── server/             # Node.js Backend (Express)
│   ├── src/
│   │   ├── controllers/# Request handlers
│   │   ├── middlewares/# Authentication middleware
│   │   ├── models/     # Database models
│   │   ├── routes/     # API routes
│   │   └── app.js      # Server entry point
└── database/           # Database scripts
    ├── schema.sql      # Database structure
    └── seed.sql        # Initial test data
```

---

## ⚙️ Installation & Setup

### 1. Database Setup
1. MySQL 데이터베이스 서버를 실행합니다.
2. 필요한 테이블을 생성하기 위해 스키마 스크립트를 실행합니다.
   ```bash
   # Using mysql client example
   mysql -u your_user -p your_db_name < database/schema.sql
   ```
3. (선택) 시드 데이터를 로드합니다.
   ```bash
   mysql -u your_user -p your_db_name < database/seed.sql
   ```

### 2. AI Service Setup
1. `ai` 디렉토리로 이동합니다.
   ```bash
   cd ai
   ```
2. 가상 환경을 생성하고 필요한 패키지를 설치합니다.
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. AI 서비스를 시작합니다.
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Backend Server Setup
1. `server` 디렉토리로 이동합니다.
   ```bash
   cd server
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. `.env` 파일에 환경 변수를 설정합니다.
4. 서버 시작합니다.
   ```bash
   npm start
   ```

### 4. Client Setup
1. `client` 디렉토리로 이동합니다.
   ```bash
   cd client
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. 개발 서버를 시작합니다.
   ```bash
   npm run dev
   ```

---

## 💡 Usage & Features (Planned)

### User Management
- 프로필 관리 및 모니터링 관련 환경 설정

### Snore Monitoring
- 웹 인터페이스를 통한 코골이 소리 녹음
- 설정된 기준에 따라 코골이 피드백

### History & Analysis
- 시각화된 과거 코골이 데이터 확인
- AI기반 수면 패턴 파악 및 개선 정보 피드백

---

## 🧪 Examples

### AI Prediction Endpoint
**POST** `/predict`
- **Request Body**: Binary audio data or path to audio file.
- **Response**:
  ```json
  {
    "segmentStart": "202605071200",
    "segmentDuration": 3,
    "isSnoring": true,
    "confidence": 0.92,
    "lastAlert": "202605071300"
  }
  ```

---