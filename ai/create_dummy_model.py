import joblib
import json
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from pathlib import Path
import os

def create_dummy_model():
    # Change directory to the ai folder if not already there
    ai_dir = Path(__file__).parent.resolve()
    os.chdir(ai_dir)
    
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    model_path = models_dir / "snore_rf_model.joblib"
    label_map_path = models_dir / "label_map.json"
    
    # Feature dimension: 128 * 126 + 8 = 16136
    # We use a small number of samples for the dummy model
    X = np.random.rand(10, 16136).astype(np.float32)
    y = np.array([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])
    
    # Create and fit dummy model
    model = RandomForestClassifier(n_estimators=10, random_state=42)
    model.fit(X, y)
    
    # Save model
    joblib.dump(model, model_path)
    print(f"✅ Dummy model saved to {model_path}")
    
    # Save label map
    label_map = {0: "non_snore", 1: "snore"}
    with open(label_map_path, "w", encoding="utf-8") as f:
        json.dump(label_map, f, ensure_ascii=False, indent=2)
    print(f"✅ Label map saved to {label_map_path}")

if __name__ == "__main__":
    create_dummy_model()
