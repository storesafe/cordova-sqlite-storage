import os
from os.path import join, normpath

for root, dirs, files in os.walk('../common'):
    for name in files:
        headerFile = normpath(join(root, name)).replace("\\", "/")[2:]
        targetDir = normpath(root).replace("\\", "/")[3:]
        print("<header-file src=\"src" + headerFile + "\" target-dir=\"" + targetDir + "\"/>")
