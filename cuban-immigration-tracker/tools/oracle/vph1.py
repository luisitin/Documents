# tools/oracle/vph1.py — VPH-1.1 reference oracle CORE (stdlib only; run with `python3 -I`).
# Copied VERBATIM from docs/planning/04-estimation-model.md Appendix A (WP2 step 1, 07 §6). Do not
# edit the code below: an estimator ADR or golden-value change needs an owner-approved edit of 04
# first (07 §10 rule 3; 04 EST-13). The case harness and the golden-file writer live in
# golden_cases.py, which is the ENTRY POINT (`npm run golden:check` / `golden:write`).
# Data: the 24 monthly "I-485 (Cuban)" rows Sep 2024 -> Aug 2026, docs/research/04-uscis-data-sources.md §1.1 [F].
import math, json, sys
ROWS_TXT = """2024-09 10833 13464 202 151425 97685 6.7
2024-10 17448 10807 299 157703 98392 8.9
2024-11 19892 7269 326 169727 101700 10.1
2024-12 20685 8663 309 181390 104912 8.8
2025-01 22880 10034 275 194437 106558 8.3
2025-02 24385 10984 298 207564 109059 8.2
2025-03 26187 8065 302 225208 114521 8.3
2025-04 27173 5662 282 246689 123202 8.5
2025-05 23881 3376 226 267090 136077 9.5
2025-06 21510 1647 277 286309 148186 11.6
2025-07 19354 2265 207 302775 167277 11.6
2025-08 13748 2784 190 312913 191660 11.7
2025-09 11152 3529 215 318763 212644 11.4
2025-10 9059 1954 186 323471 235832 12.9
2025-11 7265 2111 175 327987 254767 12.9
2025-12 8598 41 14 336589 274207 19.4
2026-01 7086 15 4 343656 291001 27.8
2026-02 4813 10 21 348318 302719 23.8
2026-03 3439 25 21 351423 312848 21.3
2026-04 2665 23 38 353450 321681 29.8
2026-05 1846 27 129 354649 329417 23.2
2026-06 1774 89 281 355371 336679 21.5
2026-07 1355 308 318 355379 342636 22.2
2026-08 1213 386 434 355520 345741 20.6"""   # ym received approved denied pending pendingOver6 avgMonths  [F doc 04 §1.1]
ROWS=[dict(zip(['ym','rec','app','den','pend','p6','avg'],[p[0]]+[int(x) for x in p[1:6]]+[float(p[6])])) for p in (l.split() for l in ROWS_TXT.splitlines())]

def init_pool(rows):
    f=rows[0]; return [[12.0,float(f['p6']),'legacy>6mo'],[3.0,float(f['pend']-f['p6']),'legacy<6mo']]
def remove(pool,C,beta):
    w=[v[1]*math.exp(beta*v[0]) for v in pool]; W=sum(w)
    for v,wi in zip(pool,w): v[1]=max(0.0,v[1]-C*wi/W)
def mean_age(pool,beta):
    w=[v[1]*math.exp(beta*v[0]) for v in pool]; W=sum(w)
    return sum(wi*v[0] for v,wi in zip(pool,w))/W
def reconstruct(rows,beta,targets=None):
    pool=init_pool(rows); err=0.0; scales=[]
    for r in rows[1:]:
        for v in pool: v[0]+=1
        pool.append([0.5,float(r['rec']),r['ym']])
        if targets is not None and r['ym'] in targets: err+=(mean_age(pool,beta)-r['avg'])**2
        remove(pool,r['app']+r['den'],beta)
        s=r['pend']/sum(v[1] for v in pool); scales.append(s)
        for v in pool: v[1]*=s
    return pool,err,scales
def fit_beta(rows):
    t=[r['ym'] for r in rows if r['app']+r['den']>=300][-3:]
    if len(t)<3: return 0.037
    sse=lambda b: reconstruct(rows,b,set(t))[1]
    lo,hi=0.0,0.3
    for _ in range(60):
        m1=lo+(hi-lo)/3; m2=hi-(hi-lo)/3
        if sse(m1)<sse(m2): hi=m2
        else: lo=m1
    return (lo+hi)/2
def ramp(a,b,n): return lambda k: a+(b-a)*min(k,n)/n
SCEN={'S0':(0.30,lambda k:800.0),'S1':(0.40,ramp(800,4600,12)),'S2':(0.15,ramp(800,9200,6)),'S3':(0.15,lambda k:0.0 if k<=6 else ramp(800,4600,12)(k-6))}
def project(pool0,label,beta,comp,m,H,receipts=1000.0,mfun=None,k0=2):
    pool=[v[:] for v in pool0]; u=next(v for v in pool if v[2]==label); S=[1.0]
    for k in range(1,H+1):
        for v in pool: v[0]+=1
        pool.append([0.5,receipts,'f%d'%k])
        C=comp(k); w=[v[1]*math.exp(beta*v[0]) for v in pool]; W=sum(w)
        mm=m*(mfun(k-k0) if mfun else 1.0)          # mfun(t) must return 1.0 for t <= 0
        h=min(0.95, C*math.exp(beta*u[0])/W*mm) if W>0 else 0.0
        for v,wi in zip(pool,w): v[1]=max(0.0,v[1]-C*wi/W)
        S.append(S[-1]*(1-h))
    return S
BG=[(0.5,0.25),(1.0,0.5),(2.0,0.25)]; OG=[(0.8,0.25),(1.0,0.5),(1.25,0.25)]
def grid(pool0,label,beta,m_office,H,k0,scen=SCEN,extra=[(1.0,1.0)],mfun=None):
    paths=[]
    for sid,(sw,comp) in scen.items():
        for bm,bw in BG:
            for om,ow in OG:
                for xm,xw in extra:
                    S=project(pool0,label,beta*bm,comp,m_office*om*xm,H,mfun=mfun,k0=k0)
                    paths.append(dict(sid=sid,prior=sw*bw*ow*xw,S=S))
    return paths
def mix(paths,k0):
    post=[p['prior']*p['S'][k0] for p in paths]; Z=sum(post); post=[x/Z for x in post]
    H=len(paths[0]['S'])-1
    S=[sum(pw*p['S'][k]/p['S'][k0] for pw,p in zip(post,paths)) for k in range(k0,H+1)]
    return S,post
def quant(S,q):
    for t in range(1,len(S)):
        if 1-S[t]>=q-1e-12: return t
    return None
def summary(S):
    return dict(p3=1-S[3],p6=1-S[6],p12=1-S[12],p18=1-S[18],p24=1-S[24],p36=1-S[36],p60=1-S[60],
                q10=quant(S,.1),q25=quant(S,.25),q50=quant(S,.5),q75=quant(S,.75),q90=quant(S,.9))
# Reference case: beta=fit_beta(ROWS); pool,_,_=reconstruct(ROWS,beta);
# S,post=mix(grid(pool,'2025-03',beta,1.0,74,2),2); summary(S) → T15.
# Milestone example (T18'): mfun=lambda t: 1.0 if t<1 else (0.0 if t<=3 else (1.5 if t<=6 else 1.0)).
# Structural band: extra=[(0.45,1.0)] and extra=[(2.4,1.0)].
# State mixture: per-office grid with m̂_o; weight ∝ pending_o * Σ prior·S(k0); mix the conditioned curves.
