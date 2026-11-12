"""Place this script alongside RESTORE.json and all numbered parts, then run it."""
import pathlib,json,hashlib
p=pathlib.Path(__file__).resolve().parent
for record in json.loads((p/'RESTORE.json').read_text()):
 dest=p/record['archive'];sha=hashlib.sha256()
 with dest.open('wb') as out:
  for part in record['parts']:
   data=(p/part['name']).read_bytes()
   assert len(data)==part['bytes'] and hashlib.sha256(data).hexdigest()==part['sha256'],part['name']
   out.write(data);sha.update(data)
 assert sha.hexdigest()==record['sha256'],str(dest)
 print('VERIFIED',dest)
