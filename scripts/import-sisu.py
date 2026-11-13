"""Import historical offer metadata only; never ingest candidate records."""
import csv, io, json, urllib.request, hashlib
from pathlib import Path
REPO = 'maiakanegae/sisu-data'
COMMIT = '308fe33838aecf22634de68c52d8b05d9434bd40'
url = f'https://raw.githubusercontent.com/{REPO}/{COMMIT}/data/2025/scraping/grades.csv'
raw = urllib.request.urlopen(url).read()
rows = []
for r in csv.reader(io.StringIO(raw.decode()), delimiter=';'):
    for i in range(21, len(r), 5):
        if r[i] != 'Ampla concorrência': continue
        try:
            cut, bonus = float(r[i+2]), float(r[i+3])
            weights = [float(r[j]) for j in [12,11,10,13,14]]
            minimums = [float(r[j]) for j in [17,16,15,18,19]]
            minimum = float(r[20])
        except (ValueError, IndexError): continue
        if not 0 < cut <= 1000 or bonus != 0 or min(weights) < 0 or sum(weights) <= 0: continue
        rows.append(dict(id=r[0],course=r[1].strip().title(),degree=r[2],shift=r[3],campus=r[5].strip().title(),city=r[6],uf=r[7],institution=r[8].strip().title(),acronym=r[9],weights=weights,minimums=minimums,minimum=minimum,cutoff=cut,date=r[i+4][:10]))
assert len(rows) > 6000 and len(set(r['id'] for r in rows)) == len(rows)
data=dict(year=2025,mode='Ampla concorrência · sem bônus',source=url,mirror=f'https://github.com/{REPO}/tree/{COMMIT}',official='https://sisu.mec.gov.br/#/relatorio',sha256=hashlib.sha256(raw).hexdigest(),offers=rows)
Path('public/data/sisu-2025.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
Path('public/data/SISU-LICENSE.txt').write_bytes(urllib.request.urlopen(f'https://raw.githubusercontent.com/{REPO}/{COMMIT}/LICENSE').read())
print('Imported',len(rows),'offers;',len(set(x['acronym'] for x in rows)),'institutions;',len(set((x['city'],x['uf']) for x in rows)),'cities; bytes',Path('public/data/sisu-2025.json').stat().st_size)
