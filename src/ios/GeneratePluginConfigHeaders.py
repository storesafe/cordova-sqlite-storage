import os
from os.path import join, normpath

for root, dirs, files in os.walk('../common'):
    for name in files:
        print("<header-file src=\"src" + normpath(join(root, name)).replace("\\", "/")[2:] + "\" />")
