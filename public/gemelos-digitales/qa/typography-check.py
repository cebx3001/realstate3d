"""Verifica la posición tipográfica, el centro de giro y la reversibilidad real."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, shutil, sys

url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173/gemelos-digitales/'
out = Path(sys.argv[2] if len(sys.argv) > 2 else '/tmp/gemelos-typography')
out.mkdir(parents=True, exist_ok=True)
report = {}
with sync_playwright() as p:
    launch = {'headless': True, 'args': ['--no-sandbox']}
    if shutil.which('chromium'):
        launch['executable_path'] = shutil.which('chromium')
    browser = p.chromium.launch(**launch)
    for label, width, height in [('desktop', 1440, 900), ('mobile', 390, 844)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.goto(url, wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        chapters = page.evaluate('GemelosStory.chapters')
        results = []
        for chapter in chapters:
            baseline = None
            for fraction in [0, .025, .05, .08, .12, .16, .25, .45, .65, .85, .95, .08, 0]:
                page.evaluate('(y)=>scrollTo(0,y)', chapter['start'] + (chapter['end'] - chapter['start']) * fraction)
                page.wait_for_timeout(45)
                state = page.evaluate('''(id)=>[...document.querySelectorAll(`#${id} .char`)].map(e=>({
                    layout:[e.offsetLeft,e.offsetTop,e.offsetWidth,e.offsetHeight,getComputedStyle(e).letterSpacing],
                    x:+gsap.getProperty(e,'x'),y:+gsap.getProperty(e,'y'),
                    rz:+gsap.getProperty(e,'rotationZ'),sx:+gsap.getProperty(e,'scaleX'),sy:+gsap.getProperty(e,'scaleY'),
                    origin:getComputedStyle(e).transformOrigin.split(' ').slice(0,2).map(parseFloat),
                    width:parseFloat(getComputedStyle(e).width),height:parseFloat(getComputedStyle(e).height)
                }))''', chapter['id'])
                layout = [e['layout'] for e in state]
                if baseline is None:
                    baseline = layout
                assert layout == baseline, f"Cambio de layout: {label}/{chapter['id']}/{fraction}"
                assert all(e['x']==0 and e['y']==0 and e['rz']==0 and e['sx']==1 and e['sy']==1 for e in state), f"Transformación prohibida: {chapter['id']}"
                assert all(abs(e['origin'][0]-e['width']/2)<.01 and abs(e['origin'][1]-e['height']/2)<.01 for e in state), 'El giro debe estar centrado'
                if chapter['id'] == 'portada' and fraction in [.05, .45, .85]:
                    page.screenshot(path=str(out/f'{label}-type-{fraction}.png'))
            results.append({'scene': chapter['id'], 'characters': len(baseline), 'samples': 13, 'fixed_layout': True, 'xy_zero': True, 'centered_rotation': True})
        # La construcción del titular de cada panel empieza después de colocar el panel.
        methods = next(x for x in chapters if x['id']=='metodos')
        for i in range(3):
            boxes = []
            for t in [3.1+i*5.6, 3.5+i*5.6, 4.2+i*5.6]:
                page.evaluate('(y)=>scrollTo(0,y)', methods['start']+(methods['end']-methods['start'])*t/19)
                page.wait_for_timeout(45)
                boxes.append(page.locator(f'[data-method="{i}"] h3').bounding_box())
            assert boxes[0] == boxes[1] == boxes[2], f'Titular de panel en movimiento: {label}/{i}'
        report[label] = results
        page.close()
    browser.close()
(out/'typography.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps({'status':'passed','viewports':list(report),'samples_per_scene':13,'constraints':'x=0, y=0, rotationZ=0, scale=1, immutable layout, centered local perspective'},ensure_ascii=False))
