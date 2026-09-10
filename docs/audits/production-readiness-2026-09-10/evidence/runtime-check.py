from pathlib import Path
import json,os,subprocess,socket,time,urllib.request,urllib.error
root=Path.cwd();ev=root/'docs/audits/production-readiness-2026-09-10/evidence'
meta=json.loads((ev/'build-metadata.json').read_text());build=Path(meta['cwd'])
with socket.socket() as sock:
 sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
env=os.environ.copy();env['NEXT_TELEMETRY_DISABLED']='1';env['NODE_OPTIONS']='--require='+str(build/'audit-no-network.cjs')
cmd=['node',str(root/'node_modules/next/dist/bin/next'),'start','-H','127.0.0.1','-p',str(port)]
with (ev/'runtime-server.txt').open('w') as out:
 p=subprocess.Popen(cmd,cwd=build,env=env,stdout=out,stderr=subprocess.STDOUT)
 try:
  for i in range(100):
   try:
    with socket.create_connection(('127.0.0.1',port),timeout=.2):break
   except OSError: time.sleep(.05)
  rows=[]
  for route in ['/','/plate','/profile','/hall/not-a-hall','/hall/atrium']:
   t=time.monotonic()
   try: response=urllib.request.urlopen(f'http://127.0.0.1:{port}{route}',timeout=20)
   except urllib.error.HTTPError as e:response=e
   body=response.read().decode()
   rows.append({'route':route,'status':response.status,'elapsedMs':round((time.monotonic()-t)*1000),'headers':{k:v for k,v in response.headers.items() if k.lower() in ['content-security-policy','x-frame-options','x-content-type-options','referrer-policy','strict-transport-security','permissions-policy','cache-control','x-powered-by','content-type']},'menuUnavailableText':('could not be confirmed' in body or 'unavailable' in body),'hasAnalyticsScript':('insights' in body)})
  data={'command':cmd,'cwd':str(build),'scope':'Isolated production server; outbound fetch/http/https disabled, loopback inbound only','results':rows}
  (ev/'runtime-results.json').write_text(json.dumps(data,indent=2));print(json.dumps(data,indent=2))
 finally:
  p.terminate()
  try:p.wait(timeout=5)
  except subprocess.TimeoutExpired:p.kill();p.wait()
