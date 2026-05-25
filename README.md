# 🐼 Kozam (코잠) - 스마트 코골이 모니터링 및 분석 시스템

> **"당신의 더 나은 아침을 위해, 코잠이 수면의 질을 디자인합니다."**

Kozam은 사용자의 수면 중 코골이 패턴을 실시간으로 감지하고 분석하여, 최적의 수면 환경을 제안하는 **종합 수면 케어 솔루션**입니다. AI 기반의 정확한 코골이 판별과 LLM을 통한 맞춤형 피드백으로 건강한 수면 습관 형성을 돕습니다.

---

## ✨ 핵심 기능

### 1. 🎤 실시간 코골이 모니터링 (AI-Powered)
- **정밀한 감지**: Librosa와 Scikit-learn(Random Forest)을 활용하여 수면 중 소리를 분석하고 코골이 발생 여부를 실시간으로 판별합니다.
- **스마트 알람**: 코골이가 일정 수준 이상 지속될 경우, 수면 방해를 최소화하면서도 자세 변화를 유도하는 스마트 알람 기능을 제공합니다.

### 2. 📊 맞춤형 수면 리포트 (LLM Analysis)
- **심층 분석**: 수면 시간, 코골이 빈도, 알람 발생 횟수 등을 종합하여 수면 품질을 수치화합니다.
- **AI 어드바이저**: 수집된 데이터를 바탕으로 LLM(OpenAI 등)이 개인별 맞춤형 개선 팁과 상세 피드백을 생성합니다.

### 3. 🗓️ 수면 히스토리 관리
- **시각화 데이터**: 과거 수면 기록을 그래프로 한눈에 파악할 수 있어, 수면 패턴을 파악할 수 있습니다.

---

## 🛠 기술 스택

### Frontend
- **Framework**: React 19 (Vite)
- **State/Routing**: React Router, AuthContext
- **Animation**: Framer Motion
- **Icons**: Lucide-React

### Backend
- **Runtime**: Node.js (Express)
- **Database**: MySQL (mysql2)
- **Auth**: JWT (JSON Web Token), Passport
- **Docs**: Swagger UI

### AI Service
- **Framework**: FastAPI (Python)
- **Audio Processing**: Librosa
- **Machine Learning**: Scikit-learn (Random Forest Model)
- **Dependencies**: NumPy, Joblib

---

## 🚀 설치 및 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/2026-SMHRD-KDT-HealthCare-5/smhrd_kozam.git
cd smhrd_kozam
```

### 2. 패키지 설치
이 프로젝트는 루트 디렉토리에서 모든 종속성을 한 번에 관리할 수 있습니다.

```bash
# 전체 종속성 설치 (Client & Server)
npm install

# AI 서비스 종속성 설치
cd ai
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 3. 환경 변수 설정
`server/` 및 `client/` 디렉토리에 `.env` 파일을 생성하고 필요한 설정(DB 정보, API Key 등)을 입력합니다.

### 4. 실행
루트 디렉토리에서 다음 명령어를 실행하면 Client, Server, AI Service가 동시에 구동됩니다.
```bash
npm start
```

---

## 📂 프로젝트 구조

```text
├── ai/                 # Python AI Service (FastAPI)
│   ├── models/         # 학습된 ML 모델 (snore_rf_model.joblib)
│   └── routers/        # 코골이 예측 API
├── client/             # React Frontend (Vite)
│   └── src/
│       ├── api/        # API 통신 모듈
│       ├── components/ # 공용 UI 컴포넌트
│       └── pages/      # 주요 화면 (Monitoring, MyPage, History)
├── server/             # Node.js Backend (Express)
│   └── src/
│       ├── controllers/# 비즈니스 로직
│       └── routes/     # API 라우팅
└── docs/               # API 명세 및 프로젝트 문서
```

---

## 🤝 기여 방법

Kozam의 발전에 기여하고 싶으신가요? 언제든지 환영합니다!

1. 저장소를 포크(Fork)합니다.
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`).
3. 변경 사항을 커밋(Commit)합니다 (`git commit -m 'Add some AmazingFeature'`).
4. 브랜치에 푸시(Push)합니다 (`git push origin feature/AmazingFeature`).
5. Pull Request를 생성합니다.

---

## 📄 라이선스

이 프로젝트는 **ISC License**를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 📮 문의

- **Repository**: [GitHub Issues](https://github.com/2026-SMHRD-KDT-HealthCare-5/smhrd_kozam/issues)
- **Project Link**: [https://github.com/2026-SMHRD-KDT-HealthCare-5/smhrd_kozam](https://github.com/2026-SMHRD-KDT-HealthCare-5/smhrd_kozam)
