"""
snore_xgb.py
────────────────────────────────────────────────────────────────────────────
코골이 감지 파이프라인 - XGBoost 2클래스 버전

데이터 폴더 구조
  dataset_final/
    train/  snore/  *.wav
            non_snore/  *.wav
    val/    snore/  *.wav
            non_snore/  *.wav
    test/   snore/  *.wav
            non_snore/  *.wav

설치
  pip install xgboost librosa soundfile scikit-learn joblib numpy

사용법
  python snore_xgb.py train

  python snore_xgb.py predict --model_path models/snore_xgb_model.joblib \
                              --label_map_path models/label_map.json \
                              --audio_path sample.wav
────────────────────────────────────────────────────────────────────────────
"""

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import librosa
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from xgboost import XGBClassifier

# ──────────────────────────────────────────────────────────────────────────────
# 데이터 경로 설정
# ──────────────────────────────────────────────────────────────────────────────
BASE_DATA_DIR = Path("dataset_final")
TRAIN_DIR     = BASE_DATA_DIR / "train"
VAL_DIR       = BASE_DATA_DIR / "val"
TEST_DIR      = BASE_DATA_DIR / "test"
OUTPUT_DIR    = Path("models")  # FastAPI 서버가 로드하는 경로에 직접 저장

# 폴더명 → 클래스 인덱스 매핑
FOLDER_TO_LABEL = {
    "non_snore": 0,
    "snore":     1,
}

DISPLAY_LABEL = {
    "snore": "코골이 감지",
    "non_snore": "소음 (무시)",
}

# ──────────────────────────────────────────────────────────────────────────────
# 오디오 설정
# ──────────────────────────────────────────────────────────────────────────────
SAMPLE_RATE = 16000
CLIP_DURATION = 3.0
EXPECTED_SAMPLES = int(SAMPLE_RATE * CLIP_DURATION)
N_MELS = 128
N_FFT = 1024
HOP_LENGTH = 256


# ──────────────────────────────────────────────────────────────────────────────
# 오디오 유틸리티
# ──────────────────────────────────────────────────────────────────────────────
def load_audio(file_path: str, sr: int = SAMPLE_RATE) -> np.ndarray:
    audio, _ = librosa.load(file_path, sr=sr, mono=True)
    return audio


def pad_or_trim(audio: np.ndarray, target_length: int = EXPECTED_SAMPLES) -> np.ndarray:
    if len(audio) < target_length:
        audio = np.pad(audio, (0, target_length - len(audio)), mode="constant")
    elif len(audio) > target_length:
        audio = audio[:target_length]
    return audio


def split_audio(
    audio: np.ndarray,
    sr: int = SAMPLE_RATE,
    clip_duration: float = CLIP_DURATION,
    overlap: float = 0.5,
) -> List[np.ndarray]:
    clip_len = int(sr * clip_duration)
    stride = int(clip_len * (1.0 - overlap))

    clips = []
    if len(audio) <= clip_len:
        clips.append(pad_or_trim(audio, clip_len))
        return clips

    for start in range(0, len(audio) - clip_len + 1, stride):
        clips.append(pad_or_trim(audio[start:start + clip_len], clip_len))

    if (len(audio) - clip_len) % stride != 0:
        clips.append(pad_or_trim(audio[-clip_len:], clip_len))

    return clips


# ──────────────────────────────────────────────────────────────────────────────
# 피처 추출
# ──────────────────────────────────────────────────────────────────────────────
def audio_to_mel(audio: np.ndarray, sr: int = SAMPLE_RATE) -> np.ndarray:
    mel = librosa.feature.melspectrogram(
        y=audio,
        sr=sr,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        n_mels=N_MELS,
        power=2.0,
    )
    mel_db = librosa.power_to_db(mel, ref=np.max).astype(np.float32)
    mel_min, mel_max = mel_db.min(), mel_db.max()

    if mel_max - mel_min > 1e-8:
        mel_db = (mel_db - mel_min) / (mel_max - mel_min)
    else:
        mel_db = np.zeros_like(mel_db)

    return mel_db


def ensure_shape(mel: np.ndarray, target_shape: Tuple[int, int] = (128, 188)) -> np.ndarray:
    th, tw = target_shape
    h, w = mel.shape

    if h < th:
        mel = np.pad(mel, ((0, th - h), (0, 0)), mode="constant")
    elif h > th:
        mel = mel[:th, :]

    if w < tw:
        mel = np.pad(mel, ((0, 0), (0, tw - w)), mode="constant")
    elif w > tw:
        mel = mel[:, :tw]

    return mel


def extract_handcrafted(audio: np.ndarray, sr: int = SAMPLE_RATE) -> np.ndarray:
    """수공예 피처 8개: RMS, ZCR, Centroid, Rolloff, Bandwidth, MFCC1~3"""
    rms = float(np.sqrt(np.mean(audio ** 2)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(audio)))
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr)))
    rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sr)))
    bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr)))
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=3).mean(axis=1).tolist()
    return np.array([rms, zcr, centroid, rolloff, bandwidth] + mfcc, dtype=np.float32)


def extract_feature_from_clip(audio: np.ndarray) -> np.ndarray:
    """mel flat(24064) + 수공예(8) = 24072 dim"""
    audio = pad_or_trim(audio)
    mel = ensure_shape(audio_to_mel(audio))
    flat = mel.reshape(-1).astype(np.float32)
    hand = extract_handcrafted(audio)
    return np.concatenate([flat, hand])


# ──────────────────────────────────────────────────────────────────────────────
# 데이터셋 빌더
# ──────────────────────────────────────────────────────────────────────────────
LABEL_MAP: Dict[int, str] = {v: k for k, v in FOLDER_TO_LABEL.items()}  # {0: "non_snore", 1: "snore"}

def build_dataset(split_dir: Path) -> Tuple[np.ndarray, np.ndarray]:
    X, y = [], []
    print(f"\n데이터 로딩: {split_dir}")
    print("─" * 40)

    for folder_name, label_idx in FOLDER_TO_LABEL.items():
        class_dir = split_dir / folder_name
        if not class_dir.exists():
            raise FileNotFoundError(f"폴더 없음: {class_dir}")

        wav_files = list(class_dir.glob("*.wav"))
        print(f"  {folder_name}/: {len(wav_files)}개")

        for wav in wav_files:
            try:
                audio = load_audio(str(wav))
                feature = extract_feature_from_clip(audio)
                X.append(feature)
                y.append(label_idx)
            except Exception as e:
                print(f"  [경고] {wav.name} / {e}")

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)

    if len(X) == 0:
        raise ValueError(f"wav 파일이 없습니다: {split_dir}")

    counts = {LABEL_MAP[k]: int(v) for k, v in zip(*np.unique(y, return_counts=True))}
    print(f"총 {len(X)}개 | 분포: {counts}")
    print("─" * 40)

    return X, y


# ──────────────────────────────────────────────────────────────────────────────
# 모델 정의 - XGBoost
# ──────────────────────────────────────────────────────────────────────────────
def make_model(scale_pos_weight: float = 1.0) -> XGBClassifier:
    return XGBClassifier(
        n_estimators=500,
        max_depth=4,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=2,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective="binary:logistic",
        eval_metric="logloss",
        tree_method="hist",
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        n_jobs=-1,
    )


# ──────────────────────────────────────────────────────────────────────────────
# 학습 파이프라인
# ──────────────────────────────────────────────────────────────────────────────
def train_pipeline():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=== Train ===")
    X_tr, y_tr = build_dataset(TRAIN_DIR)
    print("=== Val ===")
    X_val, y_val = build_dataset(VAL_DIR)
    print("=== Test ===")
    X_te, y_te = build_dataset(TEST_DIR)

    neg_count = int(np.sum(y_tr == 0))
    pos_count = int(np.sum(y_tr == 1))
    scale_pos_weight = neg_count / max(pos_count, 1)

    model = make_model(scale_pos_weight=scale_pos_weight)

    print("\n[학습 시작] XGBoost 학습 중...")
    print(f"scale_pos_weight: {scale_pos_weight:.4f}")

    model.fit(
        X_tr,
        y_tr,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    train_acc = model.score(X_tr, y_tr)
    val_acc   = model.score(X_val, y_val)
    test_acc  = model.score(X_te, y_te)

    print("\n" + "=" * 40)
    print(f"  학습 정확도   (Train): {train_acc:.4f}")
    print(f"  검증 정확도   (Val)  : {val_acc:.4f}")
    print(f"  테스트 정확도 (Test) : {test_acc:.4f}")
    print("=" * 40)

    gap = train_acc - test_acc
    if gap > 0.1:
        print(f"과적합 의심 (차이: {gap:.4f})")
    else:
        print(f"과적합 크지 않음 (차이: {gap:.4f})")

    y_pred = model.predict(X_te)
    y_prob = model.predict_proba(X_te)

    target_names = [LABEL_MAP[i] for i in sorted(LABEL_MAP)]
    report = classification_report(y_te, y_pred, target_names=target_names, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_te, y_pred)

    print("\n" + classification_report(y_te, y_pred, target_names=target_names, zero_division=0))
    print(f"Confusion Matrix:\n{cm}")

    joblib.dump(model, OUTPUT_DIR / "snore_xgb_model.joblib")

    with open(OUTPUT_DIR / "label_map.json", "w", encoding="utf-8") as f:
        json.dump({str(k): v for k, v in LABEL_MAP.items()}, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_DIR / "classification_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    np.save(OUTPUT_DIR / "confusion_matrix.npy", cm)
    np.save(OUTPUT_DIR / "test_probabilities.npy", y_prob)

    print(f"\n모델 저장 완료 → {OUTPUT_DIR / 'snore_xgb_model.joblib'}")


# ──────────────────────────────────────────────────────────────────────────────
# 코골이 강도 스코어링
# ──────────────────────────────────────────────────────────────────────────────
def score_intensity(snore_prob: float, rms: float, repeat_score: float) -> float:
    vol = min(rms / 0.1, 1.0)
    return round(0.5 * snore_prob + 0.3 * vol + 0.2 * repeat_score, 4)


# ──────────────────────────────────────────────────────────────────────────────
# 추론 파이프라인
# ──────────────────────────────────────────────────────────────────────────────
def predict_single_file(model_path: str, label_map_path: str, audio_path: str):
    model = joblib.load(model_path)

    with open(label_map_path, "r", encoding="utf-8") as f:
        label_map: Dict[int, str] = {int(k): v for k, v in json.load(f).items()}

    rev_map = {v: k for k, v in label_map.items()}
    snore_idx = rev_map.get("snore")

    audio = load_audio(audio_path)
    clips = split_audio(audio, overlap=0.5)
    results = []
    snore_history: List[bool] = []

    for seg_idx, clip in enumerate(clips):
        feature = extract_feature_from_clip(clip).reshape(1, -1)
        probs = model.predict_proba(feature)[0]
        pred_idx = int(model.predict(feature)[0])
        pred_label = label_map[pred_idx]
        is_noise = pred_label == "non_snore"

        snore_prob = float(probs[snore_idx]) if snore_idx is not None else 0.0

        snore_history.append(not is_noise)
        if len(snore_history) > 3:
            snore_history.pop(0)
        repeat_score = sum(snore_history) / len(snore_history)

        rms = float(np.sqrt(np.mean(clip ** 2)))
        intensity = None
        if not is_noise:
            intensity = score_intensity(snore_prob, rms, repeat_score)

        results.append({
            "segment": seg_idx,
            "predicted": pred_label,
            "display": DISPLAY_LABEL.get(pred_label, pred_label),
            "ignored": is_noise,
            "snore_prob": round(snore_prob, 4),
            "rms": round(rms, 6),
            "intensity": intensity,
            "severe": (not is_noise) and (intensity is not None) and (intensity >= 0.7),
        })

    snore_results = [r for r in results if not r["ignored"]]
    total_seg = len(results)
    snore_seg = len(snore_results)
    severe_seg = sum(1 for r in snore_results if r["severe"])

    summary = {
        "총_세그먼트": total_seg,
        "코골이_세그먼트": snore_seg,
        "소음_세그먼트": total_seg - snore_seg,
        "심각_세그먼트": severe_seg,
        "코골이_감지": "코골이 있음" if snore_seg > 0 else "코골이 없음",
        "코골이_비율": round(snore_seg / max(total_seg, 1), 4),
        "심각_비율": round(severe_seg / max(snore_seg, 1), 4),
        "세그먼트_상세": results,
    }

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return summary


# ──────────────────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="XGBoost 코골이/소음 2클래스 감지")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("train", help="모델 학습 (경로: dataset_final/train|val|test/snore|non_snore)")

    pp = sub.add_parser("predict", help="오디오 파일 예측")
    pp.add_argument("--model_path", required=True, help="snore_xgb_model.joblib 경로")
    pp.add_argument("--label_map_path", required=True, help="label_map.json 경로")
    pp.add_argument("--audio_path", required=True, help="예측할 .wav 파일 경로")

    args = parser.parse_args()

    if args.command == "train":
        train_pipeline()
    elif args.command == "predict":
        predict_single_file(args.model_path, args.label_map_path, args.audio_path)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
