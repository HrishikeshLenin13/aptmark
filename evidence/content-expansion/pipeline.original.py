#!/usr/bin/env python3
"""Resumable transaction-based generation/review/export CLI. No publication by generation."""
import argparse, collections, hashlib, json, sqlite3, sys, time, re
from pathlib import Path
from datetime import datetime, timezone
from taxonomy import SKILLS, BY_ID, coverage_plan
from math_generators import FAMILIES, make
from reading_generators import make_reading
ROOT=Path(__file__).resolve().parents[1]
CONTENT=ROOT/'content'; DB=CONTENT/'candidates.sqlite'; EPOCH='2026-10-18T00:00:00Z'

def canonical(q):
    fields={k:q.get(k) for k in ('stem','passage','options','correctAnswer','table','diagram','explanation','steps')}
    return json.dumps(fields,sort_keys=True,ensure_ascii=False)

def problem_hash(q):
    return hashlib.sha256(json.dumps({k:q.get(k) for k in ('stem','passage','table','diagram')},sort_keys=True,ensure_ascii=False).encode()).hexdigest()

def validate(q):
    errors=[]
    for f in ('id','skill','stem','correctAnswer','explanation','steps','contentHash','source','license','family','seed'):
        if q.get(f) is None or q.get(f)=='' or q.get(f)==[]: errors.append('missing:'+f)
    if q.get('skill') not in BY_ID: errors.append('unknown-skill')
    opts=q.get('options',[])
    if q.get('type')=='mcq':
        if len(opts)!=4 or len(set(opts))!=4 or any(not str(o).strip() for o in opts): errors.append('option-count-or-duplicate')
        if opts.count(q.get('correctAnswer'))!=1: errors.append('answer-key')
        if q.get('section')=='math':
            from sympy import Rational
            try:
                if len({Rational(x) for x in opts})!=4: errors.append('equivalent-options')
            except Exception: pass  # Explicit verbal reasoning family has nonnumeric options.
    if q.get('section')=='rw' and len((q.get('passage') or '').split())<20: errors.append('short-passage-review')
    if q.get('contentHash')!=hashlib.sha256(canonical(q).encode()).hexdigest(): errors.append('hash-mismatch')
    if q.get('license')!='CC0-1.0-original': errors.append('license')
    if q.get('publicationStatus')=='published' and (q.get('editorialStatus')!='approved' or not q.get('reviewer') or not q.get('reviewNotes')): errors.append('unreviewed-publication')
    return errors

def wrap(raw,skill,family,seed):
    meta=BY_ID[skill]; q=dict(raw)
    q.update(id=f'{skill}-{seed:08d}',schemaVersion=1,contentVersion=1,section=meta['section'],domain=meta['domain'],skill=skill,subskill=family,type='mcq',passageType='self-contained-hypothetical' if meta['section']=='rw' else 'math',acceptedResponses=[],difficultyCalibration='provisional-uncalibrated',estimatedSeconds=80 if meta['section']=='math' else 65,family=family,generatorVersion='1.0.0',seed=seed,source='Folio deterministic original generator / '+family,license='CC0-1.0-original',editorialStatus='pending',publicationStatus='candidate',reviewer=None,reviewNotes=None,createdAt=EPOCH,updatedAt=EPOCH,similarityCluster=family,misconceptionTags=['unsupported-inference'] if meta['section']=='rw' else ['procedure-error'],accessibility={'textAlternative':(raw.get('diagram') or {}).get('alt'),'mathFormat':'latex-delimited','tableHeaders':bool(raw.get('table'))},calibration={'model':'Rasch-1PL-provisional','difficulty':{'easy':-1,'medium':0,'hard':1}[raw['difficulty']],'n':0,'standardError':None},generationCostUSD=0)
    if meta['section']=='math' and seed%4==0 and raw['verification']!='logical-template-requires-editorial-review':
        q['type']='spr'; q['options']=[]; q['acceptedResponses']=[q['correctAnswer']]
    q['distractorExplanations']={v:('This is the keyed response. '+q['explanation'] if v==q['correctAnswer'] else 'This response does not satisfy the question. Compare it with the verified reasoning: '+q['explanation']) for v in q['options']}
    q['hints']=[f'Which relationship or rule connects the given information to {meta["name"].lower()}?', q['steps'][0]]
    q['contentHash']=hashlib.sha256(canonical(q).encode()).hexdigest()
    q['problemHash']=problem_hash(q)
    q['validationResults']={'structural':not validate(q),'answerCheck':raw['verification'],'educationalValidity':'human-review-required'}
    return q

def connect():
    CONTENT.mkdir(exist_ok=True)
    db=sqlite3.connect(DB)
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, skill TEXT, hash TEXT UNIQUE, family TEXT, data TEXT)')
    db.execute('CREATE TABLE IF NOT EXISTS checkpoints (skill TEXT PRIMARY KEY, next_seed INTEGER)')
    db.execute('CREATE TABLE IF NOT EXISTS failures (skill TEXT, seed INTEGER, reason TEXT)')
    return db

def generate(total):
    db=connect(); targets=coverage_plan(total,'math'); inserted=0; start=time.monotonic()
    for skill,target in targets.items():
        have=db.execute('SELECT count(*) FROM candidates WHERE skill=?',(skill,)).fetchone()[0]
        row=db.execute('SELECT next_seed FROM checkpoints WHERE skill=?',(skill,)).fetchone(); cursor=row[0] if row else 1
        attempts=0
        while have<target:
            seed=cursor; cursor+=1; attempts+=1
            if attempts>target*100+1000: raise RuntimeError(f'Generator exhausted: {skill}, have={have}, need={target}')
            family=FAMILIES[skill][(seed-1)%len(FAMILIES[skill])]
            try:
                raw=make(family,seed)
                if raw is None: continue
                q=wrap(raw,skill,family,seed); errors=validate(q)
                if errors: raise ValueError(','.join(errors))
                change=db.execute('INSERT OR IGNORE INTO candidates VALUES (?,?,?,?,?)',(q['id'],skill,q['problemHash'],family,json.dumps(q,ensure_ascii=False))).rowcount
                have+=change; inserted+=change
            except Exception as e:
                db.execute('INSERT INTO failures VALUES (?,?,?)',(skill,seed,str(e)))
            if cursor%25==0:
                db.execute('INSERT OR REPLACE INTO checkpoints VALUES (?,?)',(skill,cursor)); db.commit()
        db.execute('INSERT OR REPLACE INTO checkpoints VALUES (?,?)',(skill,cursor)); db.commit()
        print(f'{skill}: {have}/{target}',flush=True)
    for s in SKILLS:
        if s['section']!='rw': continue
        for i in range(5):
            q=wrap(make_reading(s['id'],i),s['id'],'rw-'+s['id'],i+1); errors=validate(q)
            if errors: raise ValueError((q['id'],errors))
            db.execute('INSERT OR IGNORE INTO candidates VALUES (?,?,?,?,?)',(q['id'],q['skill'],q['problemHash'],q['family'],json.dumps(q,ensure_ascii=False)))
    db.commit(); export_all(db); print(json.dumps({'insertedMath':inserted,'seconds':round(time.monotonic()-start,2)})); report(db)

def export_all(db):
    rows=[json.loads(row[0]) for row in db.execute('SELECT data FROM candidates ORDER BY id')]
    dest=CONTENT/'bank.json'; temp=dest.with_suffix('.tmp'); temp.write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))); temp.replace(dest)
    (CONTENT/'taxonomy.json').write_text(json.dumps(SKILLS,indent=2))
    report(db)

def report(db):
    rows=[json.loads(r[0]) for r in db.execute('SELECT data FROM candidates')]
    summary={'schemaVersion':1,'generated':len(rows),'structurallyValidated':sum(not validate(q) for q in rows),'approved':sum(q['editorialStatus']=='approved' for q in rows),'published':sum(q['publicationStatus']=='published' for q in rows),'rejected':sum(q['editorialStatus']=='rejected' for q in rows),'sections':dict(collections.Counter(q['section'] for q in rows)),'families':len({q['family'] for q in rows}),'clusters':dict(collections.Counter(q['family'] for q in rows)),'difficulty':dict(collections.Counter(q['difficulty'] for q in rows)),'skills':dict(collections.Counter(q['skill'] for q in rows)),'target':10000,'estimatedGenerationCostUSD':0,'calibration':'uncalibrated','exactProblemDuplicates':len(rows)-len({problem_hash(q) for q in rows}),'note':'Structural validation is not educational approval. No candidates count toward the 10,000 published target.'}
    (CONTENT/'manifests/inventory.json').write_text(json.dumps(summary,indent=2)); print(json.dumps({k:v for k,v in summary.items() if k not in ('clusters','skills')},indent=2)); return summary

def main():
    p=argparse.ArgumentParser(); sub=p.add_subparsers(dest='cmd',required=True)
    g=sub.add_parser('generate'); g.add_argument('--math',type=int,default=4500)
    v=sub.add_parser('validate'); v.add_argument('--replay',action='store_true'); sub.add_parser('report'); sub.add_parser('dedupe')
    e=sub.add_parser('export-approved'); e.add_argument('--output',required=True)
    s=sub.add_parser('sample'); s.add_argument('--count',type=int,default=20); s.add_argument('--seed',type=int,default=2026)
    args=p.parse_args()
    if args.cmd=='generate': return generate(args.math)
    db=connect(); rows=[json.loads(r[0]) for r in db.execute('SELECT data FROM candidates ORDER BY id')]
    if args.cmd=='validate':
        failures=[{'id':q['id'],'errors':validate(q)} for q in rows if validate(q)]
        if args.replay:
            for q in rows:
                raw=make(q['family'],q['seed']) if q['section']=='math' else make_reading(q['skill'],q['seed']-1)
                expected=wrap(raw,q['skill'],q['family'],q['seed'])
                if expected['contentHash']!=q['contentHash']: failures.append({'id':q['id'],'errors':['replay-mismatch']})
        print(json.dumps({'checked':len(rows),'replayed':len(rows) if args.replay else 0,'failures':failures})); sys.exit(bool(failures))
    if args.cmd=='report': report(db)
    if args.cmd=='dedupe': print(json.dumps({'exactDuplicates':len(rows)-len({problem_hash(q) for q in rows}),'templateClusters':dict(collections.Counter(q['family'] for q in rows)),'semanticSimilarity':'not-implemented; template clusters explicitly reported'}))
    if args.cmd=='export-approved': Path(args.output).write_text(json.dumps([q for q in rows if q['publicationStatus']=='published' and not validate(q)],indent=2))
    if args.cmd=='sample':
        import random
        print(json.dumps(random.Random(args.seed).sample(rows,min(args.count,len(rows))),indent=2))
if __name__=='__main__': main()
