import urllib.request
import json
import sys

def test_url(url, method='GET', data=None):
    try:
        body = json.dumps(data).encode('utf-8') if data else None
        headers = {'Content-Type': 'application/json'} if data else {}
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=5) as res:
            status = res.status
            content = res.read()
            size = len(content)
            print(f"[SUCCESS] {method} {url} -> HTTP {status} ({size} bytes)")
            return True
    except Exception as e:
        print(f"[FAIL] {method} {url} -> {e}")
        return False

print("=== 1. Testing Frontend Static Assets ===")
test_url('http://localhost:5173/')
test_url('http://localhost:5173/assets/code-bg.mp4')
test_url('http://localhost:5173/assets/code-bg-poster.jpg')
test_url('http://localhost:5173/favicon.svg')

print("\n=== 2. Testing Dev Server API Proxy & Backend APIs ===")
test_url('http://localhost:5000/api/health')
test_url('http://localhost:5173/api/health')
test_url('http://localhost:5000/api/codebase/demo', method='POST', data={})
test_url('http://localhost:5173/api/codebase/demo', method='POST', data={})
test_url('http://localhost:5000/api/debug/root-cause', method='POST', data={'error': '500 key error', 'targetFile': 'src/repositories/userRepository.js'})
test_url('http://localhost:5000/api/impact/analyze', method='POST', data={'targetFile': 'src/repositories/userRepository.js', 'proposedDiff': 'patch'})
test_url('http://localhost:5000/api/verify/run', method='POST', data={'command': 'devtwin-verify all'})
test_url('http://localhost:5173/api/verify/run', method='POST', data={'command': 'devtwin-verify all'})
test_url('http://localhost:5000/api/security/scan', method='POST', data={})
