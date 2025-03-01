@echo off
echo Testing Backend API...

cd backend
python -m venv .venv
call .venv\Scripts\activate
pip install -r requirements.txt
pip install requests
python test_api.py

pause 