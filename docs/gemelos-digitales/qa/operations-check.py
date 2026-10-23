from playwright.sync_api import sync_playwright
from pathlib import Path
import json,sys,os,subprocess,base64,hashlib
out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/gemelos-operations');out.mkdir(parents=True,exist_ok=True)
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4174/gemelos-digitales/'
report={'url':base,'viewports':{}}
with sync_playwright() as p:
 launch={'executable_path':'/usr/bin/chromium','headless':True,'args':['--no-sandbox']}
 if base.startswith('https:') and os.environ.get('HTTPS_PROXY'):
  launch['proxy']={'server':os.environ['HTTPS_PROXY']}
 if base.startswith('https:') and os.environ.get('GEMELOS_BROWSER_CA'):
  pem=subprocess.run(['openssl','x509','-in',os.environ['GEMELOS_BROWSER_CA'],'-pubkey','-noout'],capture_output=True,check=True).stdout
  der=subprocess.run(['openssl','pkey','-pubin','-outform','DER'],input=pem,capture_output=True,check=True).stdout
  launch['args'].append('--ignore-certificate-errors-spki-list='+base64.b64encode(hashlib.sha256(der).digest()).decode())
 browser=p.chromium.launch(**launch)
 for label,w,h in [('desktop',1440,900),('mobile',390,844),('small',375,667),('tall',430,932),('tablet',820,1180)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=w<701,has_touch=w<701)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base,wait_until='networkidle');page.evaluate('document.fonts.ready')
  chapter=page.evaluate('GemelosStory.chapters.find(c=>c.id==="operacion")')
  phases=[]
  for t in [4,8.5,13,8.5]:
   page.evaluate('(y)=>scrollTo(0,y)',chapter['start']+(chapter['end']-chapter['start'])*t/chapter['duration'])
   page.wait_for_timeout(500)
   page.locator('#operacion img').evaluate('(img)=>{img.loading="eager";return img.decode()}')
   page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
   state=page.evaluate('''()=>{const s=document.querySelector('#operacion');const img=s.querySelector('img');const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};return {font:getComputedStyle(s.querySelector('.operations-track p')).fontSize,image:img.currentSrc,natural:[img.naturalWidth,img.naturalHeight],fit:getComputedStyle(img).objectFit,overflow:document.documentElement.scrollWidth>innerWidth,title:rect(s.querySelector('.display')),copy:rect(s.querySelector('.copy-track')),markers:[...s.querySelectorAll('.spatial-marker')].map(e=>({id:e.dataset.system,opacity:+getComputedStyle(e).opacity,rect:rect(e)})),paragraphs:[...s.querySelectorAll('.copy-step')].map(e=>({opacity:+getComputedStyle(e).opacity,text:e.innerText})),connectors:[...s.querySelectorAll('.system-leader')].map(e=>e.getAttribute('d'))}}''')
   phases.append({'time':t,**state})
   page.screenshot(path=str(out/f'{label}-{t}.png'))
   assert page.evaluate("document.elementFromPoint(100,200).closest('.scene')?.id")=='operacion'
   expected={4:0,8.5:1,13:2}[t]
   assert all(abs(v['opacity']-(1 if i==expected else 0))<.002 for i,v in enumerate(state['paragraphs']))
   assert float(state['font'][:-2])>=18
   assert not state['overflow'] and state['fit']=='contain'
   assert ('-mobile.webp' in state['image']) == (w<=700 or (w<=1100 and h>w))
   if t==13: assert all(m['opacity']==1 for m in state['markers'])
  assert phases[1]['markers']==phases[3]['markers'], 'El scroll inverso debe restaurar los indicadores'
  assert all(v['title']==phases[0]['title'] for v in phases), 'El titular debe conservar su posición'
  report['viewports'][label]={'phases':phases,'errors':errors}
  assert not errors
  page.close()
 for label,w,h,opts in [('reduced',390,844,{'reduced_motion':'reduce'}),('short',320,568,{}),('landscape',844,390,{})]:
  page=browser.new_page(viewport={'width':w,'height':h},**opts);page.goto(base,wait_until='networkidle');page.evaluate("GemelosStory.navigate('operacion',false)");page.wait_for_timeout(300)
  page.screenshot(path=str(out/f'{label}.png'))
  report[label]={'animated':page.evaluate('GemelosStory.animated'),'font':page.locator('#operacion .operations-track p').first.evaluate('e=>getComputedStyle(e).fontSize'),'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth')}
  assert not report[label]['animated'] and not report[label]['overflow'];page.close()
 browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'status':'passed','out':str(out),'viewports':list(report['viewports'])}))
