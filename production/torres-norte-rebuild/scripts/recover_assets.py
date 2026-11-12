import pathlib,json,urllib.request,hashlib,concurrent.futures,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='https://raw.githubusercontent.com/cebx3001/realstate3d/6f73fe50c4bc85989d7f915d62c6a162d881d240/public/assets/exterior/382a1520/v1-streamed/'
jobs=[]
for a in ['grass_medium_02','periwinkle_plant','flower_heliophila','fern_02','wild_rooibos_bush']:
 d=json.loads((ROOT/'assets'/f'{a}.json').read_text())['blend']['2k']['blend']; folder=ROOT/'assets'/a
 jobs.append((d['url'],folder/(a+'.blend'),d.get('md5')))
 for name,v in d.get('include',{}).items():jobs.append((v['url'],folder/name,v.get('md5')))
d=json.loads((ROOT/'assets/kloppenheim_06_puresky.json').read_text())['hdri']['4k']['hdr'];jobs.append((d['url'],ROOT/'assets/sky.hdr',d['md5']))
meta=json.loads((ROOT/'references/lod-meta.json').read_text())
for name in meta['filenames']:
 for f in ['meta.json','means_l.webp','means_u.webp','quats.webp','scales.webp','sh0.webp','shN_centroids.webp','shN_labels.webp']:
  path=name.rsplit('/',1)[0]+'/'+f;jobs.append((BASE+path,ROOT/'references/gaussian'/path,None))
def fetch(j):
 url,p,md5=j;p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists():p.write_bytes(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'TorresNorteProduction/1.0'}),timeout=120).read())
 b=p.read_bytes()
 if md5 and hashlib.md5(b).hexdigest()!=md5:raise ValueError(str(p))
 return {'path':str(p.relative_to(ROOT)),'url':url,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'supplier_md5_verified':bool(md5)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 records=list(ex.map(fetch,jobs))
(ROOT/'assets_manifest.json').write_text(json.dumps(records,indent=2));print('VERIFIED',len(records),'files',sum(x['bytes'] for x in records),'bytes',flush=True)
shutil.copy('/tmp/codex-remote-attachments/01a166b7-b6df-7546-acdf-cbadaca0d0fc/7bc8c906-06eb-46c3-acb7-176290ccf9cb/1-840.jpg',ROOT/'references/840.jpg')
