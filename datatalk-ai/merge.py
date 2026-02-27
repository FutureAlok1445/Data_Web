import os
import shutil

src_dir = r"C:\Users\Shubham Pawaskar\Downloads\Temp\Data_Web\datatalk-ai"
dest_dir = r"c:\py project sem 4\Data_Web\datatalk-ai"

exclude_dest_paths = [
    r"frontend\src\components\layout",
    r"frontend\src\pages",
    r"frontend\src\App.tsx",
    r"frontend\src\main.tsx",
    r"frontend\src\index.css",
    r"frontend\tailwind.config.js",
    r".git", 
    r"node_modules",
    r"backend\venv",
    r"frontend\dist"
]

def should_exclude(rel_path):
    # Normalize paths for comparison
    rel_path_norm = os.path.normpath(rel_path)
    for exc in exclude_dest_paths:
        exc_norm = os.path.normpath(exc)
        if rel_path_norm == exc_norm or rel_path_norm.startswith(exc_norm + os.sep):
            return True
    return False

copied_count = 0
for root, dirs, files in os.walk(src_dir):
    rel_root = os.path.relpath(root, src_dir)
    
    if should_exclude(rel_root) and rel_root != '.':
        continue
        
    dest_root = os.path.join(dest_dir, rel_root)
    if not os.path.exists(dest_root):
        os.makedirs(dest_root, exist_ok=True)
        
    for file in files:
        rel_path = os.path.relpath(os.path.join(root, file), src_dir)
        if should_exclude(rel_path):
            continue
            
        src_file = os.path.join(src_dir, rel_path)
        dest_file = os.path.join(dest_dir, rel_path)
        
        # Ensure destination directory exists before copying file
        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
        
        shutil.copy2(src_file, dest_file)
        copied_count += 1

print(f"Successfully copied {copied_count} files from Temp to local project, safely skipping layout files.")
