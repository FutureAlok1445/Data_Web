import os
dir2 = r"C:\Users\Shubham Pawaskar\Downloads\Temp\Data_Web\datatalk-ai"
dir1 = r"c:\py project sem 4\Data_Web\datatalk-ai"

with open('temp_list.txt', 'w', encoding='utf-8') as f:
    for root, dirs, files in os.walk(dir2):
        if 'node_modules' in root.split(os.sep) or '.git' in root.split(os.sep) or 'dist' in root.split(os.sep): continue
        for file in files:
            rel = os.path.relpath(os.path.join(root, file), dir2)
            f.write(f"TEMP HAS: {rel}\n")

with open('local_list.txt', 'w', encoding='utf-8') as f:
    for root, dirs, files in os.walk(dir1):
        if 'node_modules' in root.split(os.sep) or '.git' in root.split(os.sep) or 'dist' in root.split(os.sep): continue
        for file in files:
            rel = os.path.relpath(os.path.join(root, file), dir1)
            f.write(f"LOCAL HAS: {rel}\n")
