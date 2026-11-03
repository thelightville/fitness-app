from pathlib import Path
import tempfile,json,subprocess,shutil,sys,os
source=Path(__file__).resolve().parents[3];policy=json.loads((source/'qa/fit006-progress/manifest.json').read_text());passed=0
with tempfile.TemporaryDirectory(prefix='fit005-source-')as temp:
 root=Path(temp).resolve();assert root.parent==Path(tempfile.gettempdir()).resolve()and root.name.startswith('fit005-source-')
 def git(*a):return subprocess.check_output(['git','-C',str(root),'-c','core.hooksPath='+str(root/'empty-hooks'),'-c','commit.gpgsign=false','-c','user.name=QA Fixture','-c','user.email=qa-fixture@example.invalid',*a],stderr=subprocess.PIPE,text=True).strip()
 def commit():git('add','.');git('commit','-m','Synthetic source fixture');return git('rev-parse','HEAD')
 def check(head,success=False):
  r=subprocess.run([sys.executable,str(root/'qa/fit006-progress/verify-source.py'),head],capture_output=True);assert(r.returncode==0)==success
 git('init','-b','fixture');(root/'.gitignore').write_text('empty-hooks/\n');(root/'empty-hooks').mkdir()
 for name in policy['expected']:
  f=root/name;f.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source/name,f)
 base=commit();m=dict(policy,repository_base=base);mp=root/'qa/fit006-progress/manifest.json';mp.write_text(json.dumps(m));head=commit();check(head,True);passed+=1
 check(base);passed+=1
 target=root/'qa/fit006-progress/README.md';raw=target.read_bytes();target.write_bytes(raw+b'dirty');check(head);passed+=1;target.write_bytes(raw)
 (root/'unknown.txt').write_text('fixture');check(head);passed+=1;(root/'unknown.txt').unlink()
 (root/'application-change.txt').write_text('fixture');h=commit();check(h);passed+=1;(root/'application-change.txt').unlink();commit()
 target.write_bytes(raw+b'changed');h=commit();check(h);passed+=1;target.write_bytes(raw);commit()
 m['repository_base']='0'*40;mp.write_text(json.dumps(m));h=commit();check(h);passed+=1;m['repository_base']=base;mp.write_text(json.dumps(m));commit()
 pkg=root/'qa/fit006-progress/package.json';old=pkg.read_bytes();v=json.loads(old);v['scripts']={'postinstall':'do-not-execute'};pkg.write_text(json.dumps(v));import hashlib;m['expected']=dict(m['expected']);m['expected']['qa/fit006-progress/package.json']=hashlib.sha256(pkg.read_bytes()).hexdigest();mp.write_text(json.dumps(m));h=commit();check(h);passed+=1
print(json.dumps({'passed':passed,'real_disposable_Git':True,'no_app_tooling_or_network':True}))
