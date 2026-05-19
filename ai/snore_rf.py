"""
snore_rf.py
────────────────────────────────────────────────────────────────────────────
코골이 감지 파이프라인 - Random Forest 2클래스 버전

raw_data 폴더 구조 (변경 금지)
  raw_data/
    0/   *.wav   → non_snore (소음·잡담)
    1/   *.wav   → snore     (코골이)

사용법
  python snore_rf.py train   --data_dir "C:/Users/smhrd1/OneDrive/Desktop/WEB/react/snore_rf/raw_data"
                             --output_dir artifacts

  python snore_rf.py predict --model_path artifacts/snore_rf_model.joblib
                             --label_map_path artifacts/label_map.json
                             --audio_path sample.wav
────────────────────────────────────────────────────────────────────────────
"""

# 필요한 라이브러리들을 임포트합니다.
import argparse  # 명령행 인자(CLI)를 처리하기 위한 라이브러리
import json      # JSON 데이터 형식을 처리하기 위한 라이브러리
from pathlib import Path  # 파일 및 디렉토리 경로를 객체로 다루기 위한 라이브러리
from typing import Dict, List, Tuple  # 코드 가독성을 위한 타입 힌팅 도구
from sklearn.metrics import classification_report, confusion_matrix

import joblib    # 머신러닝 모델을 파일로 저장하거나 불러올 때 사용
import librosa   # 오디오 신호 분석 및 처리 전문 라이브러리
import numpy as np # 수치 계산 및 다차원 배열 처리를 위한 라이브러리
from sklearn.ensemble import RandomForestClassifier # 랜덤 포레스트 알고리즘 구현체
from sklearn.metrics import classification_report, confusion_matrix # 모델 평가 지표 산출
from sklearn.model_selection import train_test_split # 데이터를 학습용과 테스트용으로 분할

# ──────────────────────────────────────────────────────────────────────────────
# 폴더명 → 클래스명 매핑 (숫자 폴더 고정)
# ──────────────────────────────────────────────────────────────────────────────
# 데이터가 저장된 폴더 번호를 의미 있는 라벨 이름으로 연결합니다.
FOLDER_TO_LABEL = {
    "0": "non_snore",  # 0번 폴더: 일반 소음이나 잡담
    "1": "snore",      # 1번 폴더: 코골이 소리
}

# 사용자에게 보여줄 최종 출력 텍스트 설정
DISPLAY_LABEL = {
    "snore":     "🔴 코골이 감지",
    "non_snore": "⚪ 소음 (무시)",
}

# ──────────────────────────────────────────────────────────────────────────────
# 오디오 설정
# ──────────────────────────────────────────────────────────────────────────────
SAMPLE_RATE      = 16000     # 오디오 샘플링 레이트 (1초당 샘플 수)
CLIP_DURATION    = 2.0       # 분석할 오디오 조각의 길이 (2초)
EXPECTED_SAMPLES = int(SAMPLE_RATE * CLIP_DURATION) # 2초 동안의 총 샘플 수 (32,000개)
N_MELS           = 128       # 멜 스펙트로그램의 주파수 밴드 수
N_FFT            = 1024      # FFT(고속 푸리에 변환)를 수행할 윈도우 크기
HOP_LENGTH       = 256       # 윈도우 이동 간격 (겹치는 정도 결정)


# ──────────────────────────────────────────────────────────────────────────────
# 오디오 유틸리티
# ──────────────────────────────────────────────────────────────────────────────
def load_audio(file_path: str, sr: int = SAMPLE_RATE) -> np.ndarray:
    """오디오 파일을 로드하고 모노(Mono) 채널로 변환하여 반환합니다."""
    audio, _ = librosa.load(file_path, sr=sr, mono=True)
    return audio


def pad_or_trim(audio: np.ndarray, target_length: int = EXPECTED_SAMPLES) -> np.ndarray:
    """오디오 길이가 목표 길이보다 짧으면 0으로 채우고(padding), 길면 자릅니다(trim)."""
    if len(audio) < target_length:
        # 뒤쪽에 부족한 만큼 0을 채움
        audio = np.pad(audio, (0, target_length - len(audio)), mode="constant")
    elif len(audio) > target_length:
        # 앞에서부터 목표 길이만큼만 슬라이싱
        audio = audio[:target_length]
    return audio


def split_audio(
    audio: np.ndarray,
    sr: int = SAMPLE_RATE,
    clip_duration: float = CLIP_DURATION,
    overlap: float = 0.5,
) -> List[np.ndarray]:
    """긴 오디오 파일을 설정된 시간(2초) 단위로 겹치게(overlap) 나눕니다."""
    clip_len = int(sr * clip_duration) # 한 조각당 샘플 수
    stride   = int(clip_len * (1.0 - overlap)) # 다음 조각 시작까지 이동할 거리

    clips = []
    # 오디오 전체가 한 조각보다 짧은 경우
    if len(audio) <= clip_len:
        clips.append(pad_or_trim(audio, clip_len))
        return clips

    # 슬라이딩 윈도우 방식으로 조각내기
    for start in range(0, len(audio) - clip_len + 1, stride):
        clips.append(pad_or_trim(audio[start: start + clip_len], clip_len))

    # 마지막에 남은 부분이 있다면 끝부분을 기준으로 한 조각 추가
    if (len(audio) - clip_len) % stride != 0:
        clips.append(pad_or_trim(audio[-clip_len:], clip_len))

    return clips


# ──────────────────────────────────────────────────────────────────────────────
# 피처 추출 (특징량 추출)
# ──────────────────────────────────────────────────────────────────────────────
def audio_to_mel(audio: np.ndarray, sr: int = SAMPLE_RATE) -> np.ndarray:
    """오디오 데이터를 멜 스펙트로그램(이미지와 유사한 형태)으로 변환하고 정규화합니다."""
    # 멜 스펙트로그램 생성
    mel = librosa.feature.melspectrogram(
        y=audio, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH,
        n_mels=N_MELS, power=2.0,
    )
    # 파워 단위를 데시벨(dB) 단위로 변환
    mel_db = librosa.power_to_db(mel, ref=np.max).astype(np.float32)
    
    # 0~1 사이로 Min-Max 정규화 수행 (학습 효율 증대)
    mel_min, mel_max = mel_db.min(), mel_db.max()
    if mel_max - mel_min > 1e-8:
        mel_db = (mel_db - mel_min) / (mel_max - mel_min)
    else:
        mel_db = np.zeros_like(mel_db)
    return mel_db


def ensure_shape(mel: np.ndarray, target_shape: Tuple[int, int] = (128, 126)) -> np.ndarray:
    """추출된 멜 스펙트로그램의 크기를 항상 고정된 형태(128x126)로 맞춥니다."""
    th, tw = target_shape
    h,  w  = mel.shape
    # 높이(주파수 축) 패딩 또는 자르기
    if h < th:
        mel = np.pad(mel, ((0, th - h), (0, 0)), mode="constant")
    elif h > th:
        mel = mel[:th, :]
    # 너비(시간 축) 패딩 또는 자르기
    if w < tw:
        mel = np.pad(mel, ((0, 0), (0, tw - w)), mode="constant")
    elif w > tw:
        mel = mel[:, :tw]
    return mel


def extract_handcrafted(audio: np.ndarray, sr: int = SAMPLE_RATE) -> np.ndarray:
    """수동 설계 특징량(Handcrafted Features) 8개를 추출합니다."""
    # RMS: 음압(볼륨) 크기
    rms       = float(np.sqrt(np.mean(audio ** 2)))
    # ZCR: 소리의 거칠기(영교차율)
    zcr       = float(np.mean(librosa.feature.zero_crossing_rate(audio)))
    # Spectral Centroid: 소리의 무게 중심 (밝기 정도)
    centroid  = float(np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr)))
    # Spectral Rolloff: 고주파 분포도
    rolloff   = float(np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sr)))
    # Spectral Bandwidth: 주파수 대역폭
    bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr)))
    # MFCC 1~3: 목소리나 소리의 고유한 형태적 특징
    mfcc      = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=3).mean(axis=1).tolist()
    
    # 모든 특징을 하나의 리스트로 합쳐서 반환
    return np.array([rms, zcr, centroid, rolloff, bandwidth] + mfcc, dtype=np.float32)


def extract_feature_from_clip(audio: np.ndarray) -> np.ndarray:
    """멜 스펙트로그램(1차원으로 펼침)과 수동 설계 특징량을 하나로 합칩니다 (총 16135차원)."""
    audio = pad_or_trim(audio) # 길이 맞춤
    mel   = ensure_shape(audio_to_mel(audio)) # 멜 스펙트로그램 추출 및 크기 고정
    flat  = mel.reshape(-1).astype(np.float32) # 2차원 멜 데이터를 1차원으로 변환
    hand  = extract_handcrafted(audio) # 8개의 물리적 특징 추출
    # 두 특징 데이터를 옆으로 길게 이어 붙임
    return np.concatenate([flat, hand])


# ──────────────────────────────────────────────────────────────────────────────
# 데이터셋 빌더 (숫자 폴더 구조 로드)
# ──────────────────────────────────────────────────────────────────────────────
def build_dataset(data_dir: str) -> Tuple[np.ndarray, np.ndarray, Dict[int, str]]:
    """지정된 디렉토리의 파일을 읽어 학습용 데이터셋(X: 특징, y: 정답)을 생성합니다."""
    root = Path(data_dir)

    # 필수 폴더(0, 1) 존재 여부 확인
    for folder in FOLDER_TO_LABEL:
        if not (root / folder).exists():
            raise FileNotFoundError(
                f"폴더를 찾을 수 없습니다: {root / folder}\n"
                f"경로를 확인하세요: {root}"
            )

    # 정수 라벨(0, 1)과 문자열 이름 매핑
    label_map: Dict[int, str] = {
        int(folder): class_name
        for folder, class_name in FOLDER_TO_LABEL.items()
    }

    X, y = [], []
    print(f"\n데이터 로딩 경로: {root}")
    print("─" * 40)

    # 각 폴더를 순회하며 데이터 처리
    for folder, class_name in sorted(FOLDER_TO_LABEL.items()):
        class_dir = root / folder
        wav_files = list(class_dir.glob("*.wav"))
        print(f"  폴더 {folder}/ ({class_name}): {len(wav_files)}개")

        for wav in wav_files:
            try:
                audio   = load_audio(str(wav)) # 파일 읽기
                feature = extract_feature_from_clip(audio) # 특징 추출
                X.append(feature) # 데이터 목록에 추가
                y.append(int(folder)) # 정답(라벨) 추가
            except Exception as e:
                print(f"  [경고] 파일 처리 실패: {wav.name} / {e}")

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)

    # 클래스별 데이터 개수 출력
    counts = {label_map[k]: int(v) for k, v in zip(*np.unique(y, return_counts=True))}
    print(f"\n총 샘플: {len(X)}개")
    print(f"클래스 분포: {counts}")
    print("─" * 40)
    return X, y, label_map


# ──────────────────────────────────────────────────────────────────────────────
# 모델 정의
# ──────────────────────────────────────────────────────────────────────────────
def make_model() -> RandomForestClassifier:
    """랜덤 포레스트 분류기 설정을 정의합니다."""
    return RandomForestClassifier(
        n_estimators=300,        # 결정 트리 개수 (많을수록 성능이 안정되나 속도는 느려짐)
        max_depth=None,          # 트리의 최대 깊이 (제한 없음)
        min_samples_split=4,     # 노드를 나누기 위한 최소 샘플 수
        min_samples_leaf=2,      # 리프 노드가 되기 위한 최소 샘플 수
        max_features="sqrt",     # 각 노드 분할 시 고려할 피처 개수
        class_weight="balanced", # 데이터 불균형 시 가중치 자동 조절
        oob_score=True,          # 학습 과정에서 내부 검증(Out-of-Bag) 수행
        n_jobs=-1,               # 모든 CPU 코어 사용 (병렬 처리)
        random_state=42,         # 결과 재현성을 위한 고정 난수 값
        verbose=1,               # 학습 진행 상황 출력
    )


# ──────────────────────────────────────────────────────────────────────────────
# 학습 파이프라인
# ──────────────────────────────────────────────────────────────────────────────
def train_pipeline(data_dir: str, output_dir: str):
    """전체 학습 프로세스(데이터 로드 -> 분할 -> 학습 -> 평가 -> 저장)를 관리합니다."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    # 1. 데이터셋 빌드
    X, y, label_map = build_dataset(data_dir)

    # 2. 데이터 분할: 학습(70%) / 검증(15%) / 테스트(15%)
    X_tr, X_tmp, y_tr, y_tmp = train_test_split(
        X, y, test_size=0.3, stratify=y, random_state=42)
    X_val, X_te, y_val, y_te = train_test_split(
        X_tmp, y_tmp, test_size=0.5, stratify=y_tmp, random_state=42)

    # 학습 데이터와 검증 데이터를 합쳐서 최종 모델 학습 (RF는 OOB로 내부 검증 가능)
    X_fit = np.concatenate([X_tr, X_val], axis=0)
    y_fit = np.concatenate([y_tr, y_val], axis=0)

    # 3. 모델 생성 및 학습
    model = make_model()
    print("\n[학습 시작] Random Forest 학습 중...")
    model.fit(X_fit, y_fit)

    # 4. 성능 측정 (정확도)
    train_acc = model.score(X_fit, y_fit)
    oob_acc   = model.oob_score_
    test_acc  = model.score(X_te, y_te)

    print("\n" + "=" * 40)
    print(f"  학습 정확도   (Train)  : {train_acc:.4f}")
    print(f"  OOB 정확도   (내부검증): {oob_acc:.4f}")
    print(f"  테스트 정확도 (Test)   : {test_acc:.4f}")
    print("=" * 40)

    # 과적합(Overfitting) 발생 여부 체크
    gap = train_acc - test_acc
    if gap > 0.1:
        print(f"⚠️  과적합 의심 (차이: {gap:.4f})")
        print("   → n_estimators 줄이기 or max_depth 제한 권장")
    else:
        print(f"✅ 과적합 없음 (차이: {gap:.4f})")

    # 5. 상세 평가 보고서 생성
    y_pred = model.predict(X_te)
    y_prob = model.predict_proba(X_te)

    target_names = [label_map[i] for i in sorted(label_map)]
    report = classification_report(
        y_te, y_pred, target_names=target_names, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_te, y_pred)

    print("\n" + classification_report(y_te, y_pred, target_names=target_names, zero_division=0))
    print(f"Confusion Matrix:\n{cm}")

    # 6. 특징 중요도(Feature Importance) 확인 (수동 피처 위주)
    hand_names = ["rms", "zcr", "centroid", "rolloff", "bandwidth", "mfcc1", "mfcc2", "mfcc3"]
    mel_dim    = 128 * 126
    hand_imp   = model.feature_importances_[mel_dim:]
    print("\n[수공예 피처 중요도]")
    for name, imp in zip(hand_names, hand_imp):
        print(f"  {name}: {imp:.6f}")

    # 7. 아티팩트(결과물) 저장
    joblib.dump(model, out / "snore_rf_model.joblib") # 학습된 모델 저장
    with open(out / "label_map.json", "w", encoding="utf-8") as f:
        json.dump({str(k): v for k, v in label_map.items()}, f, ensure_ascii=False, indent=2) # 라벨 정보 저장
    with open(out / "classification_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2) # 평가 결과 저장
    np.save(out / "confusion_matrix.npy", cm) # 혼동 행렬 저장
    np.save(out / "test_probabilities.npy", y_prob) # 테스트 예측 확률 저장

    print(f"\n✅ 모델 저장 완료 → {out}/snore_rf_model.joblib")


# ──────────────────────────────────────────────────────────────────────────────
# 코골이 강도 스코어링
# ──────────────────────────────────────────────────────────────────────────────
def score_intensity(snore_prob: float, rms: float, repeat_score: float) -> float:
    """코골이 확률, 볼륨(RMS), 반복 발생 정도를 종합하여 '심각도' 점수를 계산합니다."""
    # 볼륨 정규화 (최대 1.0)
    vol = min(rms / 0.1, 1.0)
    # 가중 합산: 확률(50%) + 볼륨(30%) + 반복도(20%)
    return round(0.5 * snore_prob + 0.3 * vol + 0.2 * repeat_score, 4)


# ──────────────────────────────────────────────────────────────────────────────
# 추론 파이프라인 (실제 예측)
# ──────────────────────────────────────────────────────────────────────────────
def predict_single_file(model_path: str, label_map_path: str, audio_path: str):
    """개별 오디오 파일을 불러와 구간별로 코골이 여부를 진단합니다."""
    # 저장된 모델과 라벨 정보 로드
    model = joblib.load(model_path)
    with open(label_map_path, "r", encoding="utf-8") as f:
        label_map: Dict[int, str] = {int(k): v for k, v in json.load(f).items()}

    rev_map   = {v: k for k, v in label_map.items()}
    snore_idx = rev_map.get("snore") # 'snore' 클래스의 인덱스 번호 확인

    # 오디오 로드 및 2초 단위 분할
    audio         = load_audio(audio_path)
    clips         = split_audio(audio, overlap=0.5)
    results       = []
    snore_history: List[bool] = [] # 반복 감지 점수 계산을 위한 기록용 리스트

    # 각 조각(세그먼트)마다 예측 수행
    for seg_idx, clip in enumerate(clips):
        feature    = extract_feature_from_clip(clip).reshape(1, -1)
        probs      = model.predict_proba(feature)[0] # 각 클래스별 확률
        pred_idx   = int(model.predict(feature)[0]) # 예측된 클래스 번호
        pred_label = label_map[pred_idx] # 예측된 라벨명 (snore/non_snore)
        is_noise   = (pred_label == "non_snore")

        # 코골이 확률값 추출
        snore_prob = float(probs[snore_idx]) if snore_idx is not None else 0.0

        # 최근 3개 조각 중 코골이가 있었는지 기록 (반복성 확인)
        snore_history.append(not is_noise)
        if len(snore_history) > 3:
            snore_history.pop(0)
        repeat_score = sum(snore_history) / len(snore_history)

        # 볼륨 및 강도 점수 계산
        rms       = float(np.sqrt(np.mean(clip ** 2)))
        intensity = None
        if not is_noise:
            intensity = score_intensity(snore_prob, rms, repeat_score)

        # 현재 구간의 상세 정보 저장
        results.append({
            "segment":    seg_idx,
            "predicted":  pred_label,
            "display":    DISPLAY_LABEL.get(pred_label, pred_label),
            "ignored":    is_noise,
            "snore_prob": round(snore_prob, 4),
            "rms":        round(rms, 6),
            "intensity":  intensity,
            "severe":     (not is_noise) and (intensity is not None) and (intensity >= 0.7),
        })

    # 전체 파일에 대한 통계 요약
    snore_results = [r for r in results if not r["ignored"]]
    total_seg     = len(results)
    snore_seg     = len(snore_results)
    severe_seg    = sum(1 for r in snore_results if r["severe"])

    summary = {
        "총_세그먼트":     total_seg,
        "코골이_세그먼트": snore_seg,
        "소음_세그먼트":   total_seg - snore_seg,
        "심각_세그먼트":   severe_seg,
        "코골이_감지":    "🔴 코골이 있음" if snore_seg > 0 else "✅ 코골이 없음",
        "코골이_비율":    round(snore_seg / max(total_seg, 1), 4),
        "심각_비율":     round(severe_seg / max(snore_seg, 1), 4),
        "세그먼트_상세":  results,
    }

    # 결과를 JSON 형태로 깔끔하게 출력
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return summary


# ──────────────────────────────────────────────────────────────────────────────
# 메인 실행부 (CLI 설정)
# ──────────────────────────────────────────────────────────────────────────────
def main():
    """사용자의 입력을 받아 학습(train) 또는 예측(predict) 모드를 실행합니다."""
    parser = argparse.ArgumentParser(description="Random Forest 코골이/소음 2클래스 감지")
    sub    = parser.add_subparsers(dest="command")

    # train 명령어 설정
    tp = sub.add_parser("train", help="모델 학습")
    tp.add_argument(
        "--data_dir", required=True,
        help="raw_data 폴더 경로 (0/, 1/ 하위 폴더 포함)"
    )
    tp.add_argument("--output_dir", default="artifacts", help="모델 저장 폴더 (기본: artifacts)")

    # predict 명령어 설정
    pp = sub.add_parser("predict", help="오디오 파일 예측")
    pp.add_argument("--model_path",     required=True, help="snore_rf_model.joblib 경로")
    pp.add_argument("--label_map_path", required=True, help="label_map.json 경로")
    pp.add_argument("--audio_path",     required=True, help="예측할 .wav 파일 경로")

    args = parser.parse_args()
    
    # 입력된 명령어에 따라 해당 함수 실행
    if args.command == "train":
        train_pipeline(args.data_dir, args.output_dir)
    elif args.command == "predict":
        predict_single_file(args.model_path, args.label_map_path, args.audio_path)
    else:
        # 명령어가 없으면 도움말 출력
        parser.print_help()


# 스크립트가 직접 실행될 때만 main() 호출
if __name__ == "__main__":
    main()
