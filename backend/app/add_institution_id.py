import re

with open("d:/Studvisor/backend/app/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if '__tablename__ =' in line:
        # Check if next few lines already have institution_id
        already_has = False
        # Look ahead 5 lines
        idx = len(new_lines)
        for i in range(0, 5):
            if idx + i < len(lines) and 'institution_id' in lines[idx + i]:
                already_has = True
                break
        if not already_has:
            new_lines.append('    institution_id = Column(String, nullable=False, default="default", index=True)\n')

with open("d:/Studvisor/backend/app/models.py", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
