# Standard OIDN denoising of actual Cycles output; raw render retained.
import sys
sys.path.insert(0,'/workspace/oidn-python')
import oidn,numpy as np
from PIL import Image
from pathlib import Path
p=Path(__file__).resolve().parents[1];a=np.array(Image.open(p/'renders/architecture_004_study.png').convert('RGB')).astype(np.float32)/255.;out=np.zeros_like(a);h,w=a.shape[:2];d=oidn.NewDevice();oidn.CommitDevice(d);f=oidn.NewFilter(d,'RT');oidn.SetSharedFilterImage(f,'color',a,oidn.FORMAT_FLOAT3,w,h);oidn.SetSharedFilterImage(f,'output',out,oidn.FORMAT_FLOAT3,w,h);oidn.CommitFilter(f);oidn.ExecuteFilter(f);print(oidn.GetDeviceError(d));Image.fromarray((np.clip(out,0,1)*255).astype('uint8')).save(p/'renders/architecture_004_preview.png');oidn.ReleaseFilter(f);oidn.ReleaseDevice(d)
