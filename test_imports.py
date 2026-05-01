print("Starting imports...")
import sys
import os

print("Importing FastAPI...")
from fastapi import FastAPI
print("Importing main app...")
try:
    from backend.main import app
    print("Success!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Failed: {e}")
