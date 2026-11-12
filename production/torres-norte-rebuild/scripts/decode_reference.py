import pathlib,json,numpy as np
from PIL import Image
P=pathlib.Path(__file__).resolve().parents[1];points=[];colors=[]
for d in sorted((P/'references/gaussian').glob('3_*')):
 m=json.loads((d/'meta.json').read_text());n=m['count']
 def im(f):return np.array(Image.open(d/f).convert('RGBA')).reshape(-1,4)[:n]
 lo,hi=im('means_l.webp'),im('means_u.webp');q=(lo[:,:3].astype(float)+256*hi[:,:3].astype(float))/65535
 v=np.array(m['means']['mins'])+q*(np.array(m['means']['maxs'])-m['means']['mins']);v=np.sign(v)*np.expm1(abs(v))
 c=im('sh0.webp');rgb=np.clip(.5+.28209479177*np.array(m['sh0']['codebook'])[c[:,:3]],0,1)
 keep=c[:,3]>50;points.append(v[keep]);colors.append(rgb[keep])
a=np.concatenate(points);c=np.concatenate(colors);b=a[:,[0,2,1]].copy();b[:,2]*=-1
np.savez_compressed(P/'references/reference_points.npz',xyz=b,rgb=c)
# Orthographic evidence from decoded original; no invented architecture.
for name,axes in [('front',(0,2)),('side',(1,2)),('top',(0,1))]:
 from PIL import ImageDraw
 im=Image.new('RGB',(1600,1600),(210,215,220));xy=b[:,axes];mn=xy.min(0);mx=xy.max(0);s=1480/max(mx-mn);uv=(xy-mn)*s+60;uv[:,1]=1600-uv[:,1]
 ar=np.array(im);u=uv.astype(int);ok=(u>=0).all(1)&(u<1600).all(1);ar[u[ok,1],u[ok,0]]=(c[ok]*255).astype('uint8');Image.fromarray(ar).save(P/'references'/f'scan_{name}.png')
print('Decoded',len(b),'points bounds',b.min(0),b.max(0))
