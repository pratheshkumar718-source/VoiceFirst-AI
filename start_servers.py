import os
import sys
import time
import subprocess
import urllib.request
import socket

ROOT = os.path.dirname(os.path.abspath(__file__))
PYTHON_EXE = os.path.join(ROOT, "backend", "venv", "Scripts", "python.exe")
FRONTEND_DIR = os.path.join(ROOT, "frontend")

DETACHED = 0x00000008 | 0x00000200

def kill_port(port):
    try:
        out = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode()
        for line in out.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5 and "LISTENING" in parts:
                pid = parts[-1]
                print(f"Killing process {pid} on port {port}")
                subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
    except Exception:
        pass

def is_port_open(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect(('127.0.0.1', port))
        s.close()
        return True
    except Exception:
        return False

# 1. Kill old processes on 8000 & 5173
print("Cleaning up old processes on ports 8000 & 5173...")
kill_port(8000)
kill_port(5173)
time.sleep(1)

# 2. Launch FastAPI detached
backend_log = open(os.path.join(ROOT, "backend.log"), "w")
backend_cmd = [
    PYTHON_EXE,
    "-m", "uvicorn",
    "app.main:app",
    "--host", "0.0.0.0",
    "--port", "8000",
    "--app-dir", "backend"
]
print("Launching detached FastAPI backend...")
subprocess.Popen(
    backend_cmd,
    cwd=ROOT,
    stdout=backend_log,
    stderr=subprocess.STDOUT,
    creationflags=DETACHED,
    close_fds=True
)

# 3. Launch Vite detached
frontend_log = open(os.path.join(ROOT, "frontend.log"), "w")
frontend_cmd = "cmd.exe /c npx vite --host 0.0.0.0 --port 5173"
print("Launching detached Vite dev server...")
subprocess.Popen(
    frontend_cmd,
    cwd=FRONTEND_DIR,
    stdout=frontend_log,
    stderr=subprocess.STDOUT,
    creationflags=DETACHED,
    close_fds=True
)

# 4. Wait for both to be ready
print("Waiting for servers to become ready...")
for attempt in range(15):
    time.sleep(1)
    b_ok = is_port_open(8000)
    f_ok = is_port_open(5173)
    print(f"Check {attempt + 1}: Backend(8000)={b_ok}, Frontend(5173)={f_ok}")
    if b_ok and f_ok:
        print("Both servers are online and detached successfully!")
        sys.exit(0)

print("Warning: Timed out waiting for ports.")
sys.exit(1)

