import os
import filecmp

dir1 = r"c:\py project sem 4\Data_Web\datatalk-ai"
dir2 = r"C:\Users\Shubham Pawaskar\Downloads\Temp\Data_Web\datatalk-ai"

with open('compare_results.txt', 'w') as f:
    def compare_dirs(d1, d2, ignore=['node_modules', '.git', '__pycache__', 'dist', 'build', '.env']):
        if not os.path.exists(d1) or not os.path.exists(d2):
            return
        dcmp = filecmp.dircmp(d1, d2, ignore=ignore)
        for file in dcmp.right_only:
            f.write(f"NEW: {os.path.relpath(os.path.join(d2, file), dir2)}\n")
        for file in dcmp.diff_files:
            f.write(f"MODIFIED: {os.path.relpath(os.path.join(d2, file), dir2)}\n")
        for sub in dcmp.common_dirs:
            compare_dirs(os.path.join(d1, sub), os.path.join(d2, sub), ignore)
            
    compare_dirs(dir1, dir2)
