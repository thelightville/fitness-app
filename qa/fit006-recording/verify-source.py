from pathlib import Path
import json,hashlib,subprocess,re,sys
root=Path(__file__).resolve().parents[2];m=json.loads((root/'qa/fit006-recording/manifest.json').read_text());sha=sys.argv[1];assert re.fullmatch('[a-f0-9]{40}',sha);git=lambda *a:subprocess.check_output(['git','-C',str(root),*a],text=True).strip();assert git('rev-parse','HEAD')==sha;git('merge-base','--is-ancestor',m['repository_base'],sha);assert not git('status','--porcelain','--untracked-files=normal');changed=set(git('diff','--name-only',m['repository_base'],sha).splitlines());assert changed<=set(m['allowed_changes']);
for name,digest in m['expected'].items():
 p=root/name;assert p.is_file()and not p.is_symlink();assert hashlib.sha256(p.read_bytes()).hexdigest()==digest,name
pkg=json.loads((root/'qa/fit006-recording/package.json').read_text());assert not pkg.get('scripts');assert pkg['devDependencies']=={'typescript':'5.3.3'};print(json.dumps({'source':sha,'pinned_inputs':len(m['expected']),'clean_ancestry_diff_hashes':True,'app_or_cms_loaded':False}))
