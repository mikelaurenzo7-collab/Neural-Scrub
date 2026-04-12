"""
Sentinel ML Trainer — v2

Trains a RandomForestClassifier on labeled diff features to predict
which AI model generated a given code change.

Usage:
    python train.py --data labeled_features.csv --output model.pkl

CSV format:
    Each row is one file's features (see feature-schema.json).
    The last column must be 'label' with values: claude, gpt, gemini, copilot, cursor, windsurf, devin
"""

import argparse
import sys

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split


def main():
    parser = argparse.ArgumentParser(description="Train Sentinel ML classifier")
    parser.add_argument("--data", required=True, help="Path to labeled CSV")
    parser.add_argument("--output", default="model.pkl", help="Output model path")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split ratio")
    args = parser.parse_args()

    df = pd.read_csv(args.data)

    if "label" not in df.columns:
        print("Error: CSV must have a 'label' column", file=sys.stderr)
        sys.exit(1)

    feature_cols = [c for c in df.columns if c != "label"]
    X = df[feature_cols]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight="balanced",
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred))

    # Feature importance
    importances = dict(zip(feature_cols, clf.feature_importances_))
    print("\nTop features:")
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1])[:10]:
        print(f"  {feat}: {imp:.4f}")

    joblib.dump(clf, args.output)
    print(f"\nModel saved to {args.output}")


if __name__ == "__main__":
    main()
