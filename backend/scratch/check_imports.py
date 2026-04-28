import os
import re

def check_missing_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                # Check for Optional usage without import
                if "Optional" in content and "from typing import" not in content and "import typing" not in content:
                    print(f"Missing typing import in {path}")
                
                # Check for List usage without import
                if "List[" in content and "from typing import" not in content and "import typing" not in content:
                    print(f"Missing List import in {path}")

if __name__ == "__main__":
    check_missing_imports("c:/Users/ASUS/Learning/Personal/Studvisor-main/Studvisor-main/backend/api/routes")
