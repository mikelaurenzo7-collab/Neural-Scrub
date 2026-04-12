"""
Sentinel ML Predictor — v2

Reads JSON features from stdin, outputs JSON prediction to stdout.
Called by ml-adapter.ts as a subprocess.

Usage:
    echo '{"functionCount": 5, ...}' | python predict.py
"""

import json
import os
import sys

import joblib
import numpy as np


MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")


def main():
    if not os.path.exists(MODEL_PATH):
        # No trained model available — return null so rule engine is used
        print(json.dumps(None))
        sys.exit(0)

    try:
        features = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        print(json.dumps(None))
        sys.exit(0)

    clf = joblib.load(MODEL_PATH)

    feature_names = sorted(features.keys())
    X = np.array([[features[f] for f in feature_names]])

    prediction = clf.predict(X)[0]
    probabilities = clf.predict_proba(X)[0]
    confidence = float(max(probabilities))

    # Feature importance for this prediction
    importances = dict(zip(feature_names, clf.feature_importances_))

    result = {
        "model": prediction,
        "confidence": confidence,
        "feature_importance": importances,
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
