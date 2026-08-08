@echo off
cd /d "c:\Users\Durga Prasad\OneDrive\Desktop\x\pata-ai\backend"
.venv\Scripts\python.exe -c "
import asyncio
import httpx
import time

async def run():
    url = 'http://127.0.0.1:8000/api/v1/resolve'
    payload = {'address': 'Opposite Ganesh Temple Kothapet Hyderabad'}
    start = time.time()
    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=payload, timeout=20.0)
        latency = (time.time() - start) * 1000
        print('Status:', r.status_code)
        print('Latency:', round(latency, 2), 'ms')
        if r.status_code == 200:
            print('Parsed components:', r.json().get('parsed_components'))

asyncio.run(run())
"
