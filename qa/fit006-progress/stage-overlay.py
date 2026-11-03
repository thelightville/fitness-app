from pathlib import Path
import argparse,json,hashlib
p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);a=p.parse_args();root=Path(__file__).resolve().parent;m=json.loads((root/'manifest.json').read_text());source=Path(a.input).resolve();target=Path(a.output).resolve();assert source!=target and not target.exists();raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()==m['runtime_before_sha256'];patched=raw;pairs=[]
for prefix in ['query-block','renderer']:
 b=(root/(prefix+'-before.js')).read_bytes();c=(root/(prefix+'-after.js')).read_bytes();assert patched.count(b)==1;patched=patched.replace(b,c);pairs.append((b,c))
assert hashlib.sha256(patched).hexdigest()==m['runtime_candidate_sha256'];inverse=patched
for b,c in reversed(pairs):assert inverse.count(c)==1;inverse=inverse.replace(c,b)
assert inverse==raw;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(patched);target.chmod(0o600);print(json.dumps({'staged':True,'exact_inverse_verified':True,'sha256':m['runtime_candidate_sha256'],'live_operation':False}))
