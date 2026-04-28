import sys

with open('v4.css', 'r') as f:
    c = f.read()

c = c.replace("\\'", "'")
if c.endswith("\\n\\n"):
    c = c[:-4] + "\n\n"

with open('v4.css', 'w') as f:
    f.write(c)
