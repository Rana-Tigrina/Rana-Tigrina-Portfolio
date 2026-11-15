"""Run a model script in headless Blender and wait for it to finish.

    python tools/blender.py tools/models/frog.py

Blender is started in the background with factory settings, so it never touches a
Blender window you have open. The Store install only exposes `blender-launcher`, which
detaches, so the script's result is written to a log file that this waits for.
"""
import os
import subprocess
import sys
import tempfile
import time

LAUNCHER = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WindowsApps\blender-launcher.exe")
WRAPPER = """import runpy, traceback
try:
    runpy.run_path({script!r}, run_name="__main__")
    open({log!r}, "w").write("ok")
except Exception:
    open({log!r}, "w").write(traceback.format_exc())
"""

script = os.path.abspath(sys.argv[1])
log = os.path.join(tempfile.gettempdir(), "kuan-blender.log")
if os.path.exists(log):
    os.remove(log)

# The launcher mangles multi-line arguments, so the wrapper goes in a file.
wrapper = os.path.join(tempfile.gettempdir(), "kuan-blender-run.py")
with open(wrapper, "w", encoding="utf8") as f:
    f.write(WRAPPER.format(script=script, log=log))
subprocess.Popen([LAUNCHER, "-b", "--factory-startup", "--python", wrapper])

for _ in range(360):  # up to 3 minutes
    if os.path.exists(log):
        result = open(log).read()
        print(result)
        sys.exit(0 if result == "ok" else 1)
    time.sleep(0.5)
sys.exit("Blender did not finish in 3 minutes")
