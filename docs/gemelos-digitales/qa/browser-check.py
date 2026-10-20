from playwright.sync_api import sync_playwright
from pathlib import Path
import json,sys,os,shutil
import subprocess,hashlib,base64

out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/gemelos-qa');out.mkdir(parents=True,exist_ok=True)
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4173/gemelos-digitales/'
report={'url':base,'viewports':{}}
with sync_playwright() as p:
    launch={'headless':True,'args':['--no-sandbox']}
    if shutil.which('chromium'): launch['executable_path']=shutil.which('chromium')
    if base.startswith('https://') and os.environ.get('HTTPS_PROXY'): launch['proxy']={'server':os.environ['HTTPS_PROXY']}
    # Confianza efímera y específica para el proxy de un entorno administrado.
    # Nunca modifica el almacén de certificados ni desactiva globalmente TLS.
    if base.startswith('https://') and os.environ.get('GEMELOS_BROWSER_CA'):
        pem=subprocess.run(['openssl','x509','-in',os.environ['GEMELOS_BROWSER_CA'],'-pubkey','-noout'],capture_output=True,check=True).stdout
        der=subprocess.run(['openssl','pkey','-pubin','-outform','DER'],input=pem,capture_output=True,check=True).stdout
        pin=base64.b64encode(hashlib.sha256(der).digest()).decode()
        launch['args'].append('--ignore-certificate-errors-spki-list='+pin)
    browser=p.chromium.launch(**launch)
    for label,width,height in [('desktop',1440,900),('mobile',390,844)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=label=='mobile',has_touch=label=='mobile')
        errors=[];requests=[];bad=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:requests.append(r.url))
        page.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        page.goto(base,wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        page.screenshot(path=str(out/f'{label}-initial.png'))
        chapters=page.evaluate('GemelosStory.chapters')
        entry={'errors':errors,'bad_responses':bad,'chapters':len(chapters),'initial_3d_requests':[u for u in requests if any(x in u for x in ['/viewers/','.sog','v1-streamed','/inventory/'])],'screens':[]}
        for chapter in chapters:
            ratio={'portada':.36,'concepto':.3,'ventas':.27,'metodos':.24,'demostracion':.42,'construccion':.74,'operacion':.76,'contacto':.58}[chapter['id']]
            page.evaluate('(y)=>window.scrollTo(0,y)',chapter['start']+(chapter['end']-chapter['start'])*ratio)
            page.wait_for_timeout(180)
            page.locator(f"#{chapter['id']} img").evaluate_all('(imgs)=>imgs.forEach(img=>img.loading="eager")')
            page.wait_for_function('(id)=>[...document.querySelectorAll(`#${id} img`)].every(i=>i.complete&&i.naturalWidth>0)',arg=chapter['id'])
            page.screenshot(path=str(out/f"{label}-{chapter['id']}.png"))
            entry['screens'].append({'scene':chapter['id'],'horizontal_overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth'),'display':page.locator(f"#{chapter['id']} .display").bounding_box()})
        methods=next(x for x in chapters if x['id']=='metodos')
        for i,t in enumerate([4,10,16]):
            page.evaluate('(y)=>scrollTo(0,y)',methods['start']+(methods['end']-methods['start'])*t/19)
            page.wait_for_timeout(90)
            page.screenshot(path=str(out/f'{label}-metodos-{i+1}.png'))
        # Every construction plateau: images and text have to match in both directions.
        chapter=next(x for x in chapters if x['id']=='construccion')
        entry['construction']=[]
        for index,t in enumerate([4.4,9.1,13.8,18.5,13.8,9.1,4.4]):
            page.evaluate('(y)=>scrollTo(0,y)',chapter['start']+(chapter['end']-chapter['start'])*t/25)
            page.wait_for_timeout(90)
            if index<4: page.screenshot(path=str(out/f'{label}-construccion-{index+1}.png'))
            entry['construction'].append(page.evaluate('''()=>({images:[...document.querySelectorAll('.build-image')].map(e=>({opacity:getComputedStyle(e).opacity,clip:getComputedStyle(e).clipPath})),text:[...document.querySelectorAll('.build-copy .copy-step')].map(e=>+getComputedStyle(e).opacity)})'''))
        # Fixed-scroll transforms must remain exactly stable.
        page.evaluate("GemelosStory.navigate('portada',false)")
        page.wait_for_timeout(100)
        before=page.locator('#portada .char').evaluate_all('(els)=>els.map(e=>getComputedStyle(e).transform)')
        page.wait_for_timeout(500)
        after=page.locator('#portada .char').evaluate_all('(els)=>els.map(e=>getComputedStyle(e).transform)')
        entry['scroll_stable']=before==after
        entry['tour_href']=page.locator('#demostracion .tour-link').get_attribute('href')
        entry['contact_href']=page.locator('.contact-link').get_attribute('href')
        entry['all_images_loaded']=page.locator('.scene img').evaluate_all('(imgs)=>imgs.every(i=>i.complete&&i.naturalWidth>0)')
        page.locator('.motion-toggle').click()
        entry['pause_returns_to_static']=page.evaluate('!GemelosStory.animated && !document.body.classList.contains("motion-ready")')
        page.locator('.motion-toggle').click()
        entry['resume_works']=page.evaluate('GemelosStory.animated && GemelosStory.chapters.length===8')
        report['viewports'][label]=entry
        page.close()
    page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
    page.goto(base,wait_until='networkidle')
    report['reduced_motion']={'animated':page.evaluate('GemelosStory.animated'),'pinned':page.locator('.pin-spacer').count(),'headings':page.locator('h1,h2').count(),'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth')}
    page.screenshot(path=str(out/'mobile-reduced-motion.png'))
    page.close()
    page=browser.new_page(viewport={'width':390,'height':844},java_script_enabled=False)
    page.goto(base,wait_until='networkidle')
    report['no_javascript']={'headings':page.locator('h1,h2').count(),'body_text':len(page.locator('main').inner_text()),'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth')}
    page.close()
    browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
for label,result in report['viewports'].items():
    assert not result['errors'] and not result['bad_responses'], f'{label}: errores de recursos o JavaScript'
    assert not result['initial_3d_requests'], 'Carga 3D antes de entrar al tour'
    assert all(not s['horizontal_overflow'] for s in result['screens']), 'Desbordamiento horizontal'
    assert result['scroll_stable'] and result['pause_returns_to_static'] and result['resume_works'], 'Movimiento inconsistente'
assert not report['reduced_motion']['animated']
assert report['no_javascript']['headings']==8
print(json.dumps({'status':'passed','url':base,'screenshots':str(out),'viewports':list(report['viewports'])},ensure_ascii=False))
