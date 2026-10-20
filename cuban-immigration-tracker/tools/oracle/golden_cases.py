import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.dont_write_bytecode = True  # noqa: E401,E702 — `python3 -I` implies -P (04 EST-13; 07 WP2 step 2); no __pycache__ in the repo
import vph1  # noqa: E402  — the Appendix A core, copied verbatim from 04-estimation-model.md

"""
tools/oracle/golden_cases.py — ENTRY POINT of the VPH-1.1 reference oracle (07 WP2 steps 2–3b).

    python3 -I tools/oracle/golden_cases.py --write packages/estimator/golden/vph1.golden.json
    python3 -I tools/oracle/golden_cases.py --check packages/estimator/golden/vph1.golden.json

The harness adds to the Appendix A core (vph1.py) everything 04 §4–§7 specifies, so that it can
write every row of 04 §9: the milestone multipliers (`mfun`, §4), the special modes (post-interview,
post-expedite, interview scheduled; §4 / ADR-EST-14), the state mixture (§5.3), the structural
extras (§7), the observation-model likelihood update with the S0–S2 sub-mass floor (§6.2–§6.3) and
the deterministic alert composition (§6.3). It mirrors packages/estimator/src (the TypeScript port)
rule for rule; the TS tests compare against the file this script writes (± 5e-4 on probabilities,
exact on quantiles and days; 04 §9.1).

EST-13 precedence: every number written in 04 §9 (and §3.1, §3.2, §5.3, §6.2, §7) is encoded below
in DOC_EXPECTED, at the precision the document prints it. `--write` and `--check` both verify the
computed values against DOC_EXPECTED first; on any disagreement the script prints ESCALATE and
exits 2 WITHOUT writing: the owner must approve an edit of 04 §9 before the golden file changes.
`--check` then recomputes the golden file and fails on any difference > 1e-6 (04 §9.1, CI).

Stdlib only (07 §3.3). Deterministic: no clock, no randomness; JSON is written with a fixed key
order, so the same inputs give a byte-identical file.
"""
import argparse  # noqa: E402
import datetime  # noqa: E402
import json  # noqa: E402
import math  # noqa: E402

TODAY = '2026-10-20'          # 04 §9.1 fixture date
DAYS_PER_MONTH = 30.4375      # 04 EST-10
HORIZON = 72                  # 04 EST-5
FIRST_MODEL_MONTH = '2024-09' # 04 EST-1 (the Aug 2024 file is missing; doc 04 §1.0)
NOID_DAYS = 30 + 3            # 04 §4 (30 days + 3 mail; doc 14 §4; PA-2026-05)
RFE_DAYS = 84                 # 04 §4 (≤ 12 weeks; PA-2026-05; doc 14 §4)

# ── dates (UTC-free ISO arithmetic) ──────────────────────────────────────────────────────────

def _d(s): return datetime.date.fromisoformat(s)
def days_between(a, b): return (_d(b) - _d(a)).days
def add_days(s, n): return (_d(s) + datetime.timedelta(days=n)).isoformat()
def ym(s): return s[:7]
def months_between(a, b):  # whole months from YearMonth a to YearMonth b
    return (int(b[:4]) - int(a[:4])) * 12 + (int(b[5:7]) - int(a[5:7]))
def add_months(a, n):
    t = int(a[:4]) * 12 + int(a[5:7]) - 1 + n
    return '%04d-%02d' % (t // 12, t % 12 + 1)
def end_of_month(a):
    nxt = _d(add_months(a, 1) + '-01')
    return (nxt - datetime.timedelta(days=1)).isoformat()
def months_ceil(days): return math.ceil(days / DAYS_PER_MONTH)    # EST-10
def months_since(days): return math.floor(days / DAYS_PER_MONTH)  # EST-10

# ── lognormal (04 §4; T10) ───────────────────────────────────────────────────────────────────

def lognormal_cdf(t, median, sigma):
    if t <= 0: return 0.0
    return 0.5 * (1.0 + math.erf((math.log(t) - math.log(median)) / (sigma * math.sqrt(2.0))))

POST_INTERVIEW = (3.0, 0.857)   # 04 §4, doc 08 §7.5 [S′], low confidence [I]
POST_EXPEDITE = (2.0, 0.857)    # 04 §4, doc 15 §9.3 [I]

# ── scenarios (04 §6.1, anchored at 2026-08) and alert rules (04 §6.3) ───────────────────────

ANCHOR = '2026-08'
SCENARIOS = [
    dict(id='S0', prior=0.30, path=dict(kind='flat', level=800), anchorMonth=ANCHOR, likelihoodUpdated=True),
    dict(id='S1', prior=0.40, path=dict(kind='ramp', **{'from': 800}, to=4600, months=12), anchorMonth=ANCHOR, likelihoodUpdated=True),
    dict(id='S2', prior=0.15, path=dict(kind='ramp', **{'from': 800}, to=9200, months=6), anchorMonth=ANCHOR, likelihoodUpdated=True),
    dict(id='S3', prior=0.15, path=dict(kind='freezeThen', freezeMonths=6, then='S1'), anchorMonth=ANCHOR, likelihoodUpdated=False),
]
SIDS = ['S0', 'S1', 'S2', 'S3']
ALERT_RULES = {
    'DORCAS_AFFIRMED': [dict(scenario='S3', factor=1 / 3, condition='always')],
    'DORCAS_REVERSED': [dict(scenario='S3', factor=3, condition='redEagleNotProtecting'), dict(scenario='S3', factor=1.5, condition='redEagleProtects')],
    'FIRST_CIR_STAY_BENEFITS_HOLD': [dict(scenario='S3', factor=3, condition='redEagleNotProtecting'), dict(scenario='S3', factor=1.5, condition='redEagleProtects')],
    'RED_EAGLE_DISSOLVED': [dict(scenario='S3', factor=2, condition='dorcasPending')],
    'NEW_HOLD_MEMO_CUBA': [dict(scenario='S3', factor=3, condition='always')],
    'AAUP_RELIEF_DENIAL_POLICY': [],
}
LIT_TODAY = dict(dorcas='vacatur_in_force_appeal_pending', piInForce=True)   # 04 §6.3 "Today"
OBSERVATION = dict(sigma=0.30, tempering=0.5, floorLevel=50, weightFloor=0.02)  # 04 §6.2

def completions_path(sdef, offset, defs=SCENARIOS):
    """04 §6.1: completions(k) for k months after dataThrough; offset = months(anchor → dataThrough)."""
    p = sdef['path']
    if p['kind'] == 'flat':
        lvl = float(p['level']); return lambda k: lvl
    if p['kind'] == 'ramp':
        a, b, n = float(p['from']), float(p['to']), p['months']
        return lambda k: a + (b - a) * min(max(offset + k, 0), n) / n
    then = completions_path(next(s for s in defs if s['id'] == p['then']), offset, defs)
    f = p['freezeMonths']
    return lambda k: 0.0 if k <= f else then(k - f)   # re-anchored at dataThrough (04 §6.1)

def _norm(w):
    z = sum(w.values()); return {k: v / z for k, v in w.items()}

def active_alerts(alerts, today):
    """04 §6.3 step 2: published, date ≤ today, not expired, not superseded by a later published alert."""
    pub = [a for a in alerts if a['status'] == 'published' and a['date'] <= today]
    live = [a for a in pub if a.get('expires') is None or a['expires'] >= today]
    out = []
    for a in live:
        sup = any(a['id'] in b.get('supersedes', []) and (b['date'], b['id']) > (a['date'], a['id']) for b in pub)
        if not sup: out.append(a)
    return sorted(out, key=lambda a: (a['date'], a['id']))

def scenario_weights(alerts, observed, flags, lit, today, obs=OBSERVATION, defs=SCENARIOS, rules=ALERT_RULES):
    """04 §6.3 (mirrors packages/estimator/src/weights.ts). flags=None → case-independent part."""
    w = {s['id']: s['prior'] for s in defs}
    trace = []
    act = active_alerts(alerts, today)
    fired = set(r for a in act for r in a.get('ruleIds', []))
    # Effective litigation state: an active alert for the event overrides a lagging curated state, so
    # DORCAS_REVERSED + RED_EAGLE_DISSOLVED never compound past ×3 (04 §6.3 rule table note).
    dorcas_pending = lit['dorcas'] == 'vacatur_in_force_appeal_pending' and not (fired & {'DORCAS_REVERSED', 'DORCAS_AFFIRMED'})
    pi = lit['piInForce'] and 'RED_EAGLE_DISSOLVED' not in fired
    protects = flags is not None and bool(flags['redEagleAppearsInClass']) and pi
    cond = dict(always=True, dorcasPending=dorcas_pending, redEagleProtects=protects,
                redEagleNotProtecting=flags is not None and not protects)
    for a in act:
        for rid in a.get('ruleIds', []):
            for e in rules.get(rid, []):
                if cond[e.get('condition', 'always')]:
                    before = dict(w); w[e['scenario']] *= e['factor']; w = _norm(w)
                    trace.append(dict(reason='alert_rule', ruleId=rid, alertId=a['id'], before=before, after=dict(w)))
    upd = [s for s in defs if s['likelihoodUpdated']]
    anchor = min(s['anchorMonth'] for s in upd)
    lam, sig, fl, wf = obs['tempering'], obs['sigma'], obs['floorLevel'], obs['weightFloor']
    for r in sorted(observed, key=lambda r: r['ym']):
        if r['ym'] <= anchor: continue
        C = r['app'] + r['den']
        before = dict(w)
        fixed = sum(w[s['id']] for s in defs if not s['likelihoodUpdated'])
        sub = {}
        for s in upd:
            mu = completions_path(s, 0, defs)(months_between(s['anchorMonth'], r['ym']))
            z = (math.log(max(C, fl)) - math.log(max(mu, fl))) / sig
            sub[s['id']] = w[s['id']] * math.exp(-0.5 * lam * z * z)          # (i)
        sub = _norm(sub)                                                     # (ii)
        sub = {k: max(v, wf) for k, v in sub.items()}                        # (iii)
        sub = _norm(sub)                                                     # (iv)
        for k, v in sub.items(): w[k] = v * (1 - fixed)                      # (v)
        trace.append(dict(reason='likelihood', observedMonth=r['ym'], observedCompletions=C, before=before, after=dict(w)))
    return w, trace

# ── office multipliers (EST-11) ──────────────────────────────────────────────────────────────
# FY26 Q2 / Q3 "Humanitarian-based" column of the I-485 by-office workbook, doc 04 §1.3 [F]
# (approvals, pending); the same numbers are in packages/data-schemas/test/fixtures/sample-handbuilt.
OFFICE_STATS = {   # code: (state, [(fy, q, approved, pending), …])
    'HIA': ('FL', [(2026, 2, 2, 36682), (2026, 3, 1, 37486)]),
    'KND': ('FL', [(2026, 2, 10, 40256), (2026, 3, 25, 41248)]),
    'MIA': ('FL', [(2026, 2, 6, 20401), (2026, 3, 21, 20662)]),
    'TAM': ('FL', [(2026, 2, 33, 33514), (2026, 3, 84, 34695)]),
    'HOU': ('TX', [(2026, 2, 38, 32749), (2026, 3, 24, 34665)]),
}
KAPPA_OFFICE, CLAMP = 50.0, (0.5, 2.0)

def shrink(y, r, kappa=KAPPA_OFFICE, clamp=CLAMP):
    return min(clamp[1], max(clamp[0], (kappa + y * r) / (kappa + y)))

def office_multipliers(stats=OFFICE_STATS):
    ys = {c: float(sum(q[2] for q in v[1])) for c, v in stats.items()}
    es = {c: sum(q[3] for q in v[1]) / len(v[1]) for c, v in stats.items()}
    rG = sum(ys.values()) / sum(es.values())
    out = {}
    for c in stats:
        r = (ys[c] / es[c]) / rG
        out[c] = dict(completions=ys[c], avgPending=es[c], raw=r, shrunk=shrink(ys[c], r))
    return out, dict(y=sum(ys.values()), E=sum(es.values()), rG=rG)

# ── pool, grid, mixture ──────────────────────────────────────────────────────────────────────
BETA_GRID = [(0.5, 0.25), (1.0, 0.5), (2.0, 0.25)]    # EST-4 (= vph1.BG)
OFFICE_GRID = [(0.8, 0.25), (1.0, 0.5), (1.25, 0.25)] # EST-4 (= vph1.OG)

def grid_annotated(pool, label, beta, m_office, H, k0, weights, offset=0, extra=((1.0, 1.0),), mfun=None):
    """vph1.grid with the EST-4 loop order, keeping each path's grid coordinates (for drivers)."""
    paths = []
    for s in SCENARIOS:
        comp = completions_path(s, offset)
        for bm, bw in BETA_GRID:
            for om, ow in OFFICE_GRID:
                for xm, xw in extra:
                    S = vph1.project(pool, label, beta * bm, comp, m_office * om * xm, H, mfun=mfun, k0=k0)
                    paths.append(dict(sid=s['id'], betaMult=bm, officeMult=om, extraMult=xm,
                                      prior=weights[s['id']] * bw * ow * xw, S=S))
    return paths

def mix_paths(paths, k0, transform=None):
    """EST-6: posterior ∝ prior·S(k0); S_c(t) = Σ post·S(k0+t)/S(k0), t = 0..72 (then the mode transform)."""
    post = [p['prior'] * p['S'][k0] for p in paths]
    Z = sum(post); post = [x / Z for x in post]
    curves = [[p['S'][k0 + t] / p['S'][k0] for t in range(HORIZON + 1)] for p in paths]
    if transform: curves = [transform(c) for c in curves]
    S = [sum(pw * c[t] for pw, c in zip(post, curves)) for t in range(HORIZON + 1)]
    return S, post, curves

def quantiles(S):
    return dict(q10=vph1.quant(S, .1), q25=vph1.quant(S, .25), q50=vph1.quant(S, .5), q75=vph1.quant(S, .75), q90=vph1.quant(S, .9))

def p_within(S):
    return {('m%d' % t): 1 - S[t] for t in (3, 6, 12, 18, 24, 36, 60)}

def by_date(S, today, dates):
    """EST-9: P(by end of month M) = 1 − S_c(months from ym(today) to M)."""
    return [dict(date=dd, p=1 - S[max(0, min(HORIZON, months_between(ym(today), ym(dd))))]) for dd in dates]

def driver_shares(paths, post, curves):
    """04 §8 item 6: main-effect variance shares of per-path P(≤12) under the posterior weights."""
    p = [1 - c[12] for c in curves]
    mean = sum(w * x for w, x in zip(post, p))
    var = sum(w * (x - mean) ** 2 for w, x in zip(post, p))
    out = {}
    for name, key in (('scenario', 'sid'), ('beta', 'betaMult'), ('office', 'officeMult')):
        groups = {}
        for path, w, x in zip(paths, post, p):
            g = groups.setdefault(path[key], [0.0, 0.0]); g[0] += w; g[1] += w * x
        out[name] = 0.0 if var <= 0 else sum(W * (sx / W - mean) ** 2 for W, sx in groups.values() if W > 0) / var
    return out

# ── milestones (04 §4) ───────────────────────────────────────────────────────────────────────

def _latest(ms, key, dated=True):
    c = [m for m in ms if m['key'] == key and (m.get('date') is not None or not dated)]
    c.sort(key=lambda m: m.get('date') or '')
    return c[-1] if c else None

def milestone_mult(case, today):
    """Queue-mode milestoneMult(t) (t ≥ 1 months after today) and the `delays` record (04 §4)."""
    ms = case['milestones']; terms = []; delays = {}
    has = lambda k: any(m['key'] == k for m in ms)
    for nk, rk, dflt in (('rfe', 'rfe_response', RFE_DAYS), ('noid', 'noid_response', NOID_DAYS)):
        n = _latest(ms, nk)
        if n is None: continue
        resp = [m for m in ms if m['key'] == rk and (m.get('date') is None or m['date'] >= n['date'])]
        if resp:
            x = max((m['date'] for m in resp if m.get('date')), default=None)
            if x is not None:
                left = 3 - months_since(days_between(x, today))
                terms.append(lambda t, L=left: 1.5 if t <= L else 1.0)
            continue
        due = (n.get('meta') or {}).get('dueDate') or add_days(n['date'], dflt)
        if due > today:
            z = months_ceil(days_between(today, due))
            terms.append(lambda t, Z=z: 0.0 if t <= Z else (1.5 if t <= Z + 3 else 1.0))
            delays['rfeZeroUntil'] = max(delays.get('rfeZeroUntil', due), due)
        else:
            delays['assumedResponseAt'] = max(delays.get('assumedResponseAt', due), due)
            delays['nonResponseRisk'] = True
            left = 3 - months_since(days_between(due, today))
            terms.append(lambda t, L=left: 1.5 if t <= L else 1.0)
    md = _latest(ms, 'mandamus')
    if md is not None:
        left = 4 - months_since(days_between(md['date'], today))
        terms.append(lambda t, L=left: 1.3 if t <= L else 1.0)
    if not has('biometrics') and not has('ead_c9') and days_between(case['receipt'], today) / DAYS_PER_MONTH > 4:
        terms.append(lambda t: 0.7)
    if not terms: return None, delays
    def mfun(t):
        if t < 1: return 1.0
        v = 1.0
        for f in terms: v *= f(t)
        return v
    return mfun, delays

def mode_of(case, today):
    """04 §4 precedence: decided > no_estimate > post_interview > post_expedite > interview_scheduled > queue."""
    ms = case['milestones']
    if any(m['key'] == 'decision' for m in ms): return ('decided', None)
    if case['channel'] in ('I220A', 'EWI', 'CONDITIONAL_PAROLE_236'): return ('no_estimate', None)
    iv = _latest(ms, 'interview', dated=False)
    notice = _latest(ms, 'interview_notice', dated=False)
    sched = ((notice or {}).get('meta') or {}).get('scheduledFor')
    if iv is not None:
        start = iv.get('date') or (sched if sched and sched <= today else today)
        if start <= today: return ('post_interview', start)
    ex = [m for m in ms if m['key'] == 'expedite_outcome' and (m.get('meta') or {}).get('outcome') == 'granted']
    if ex:
        start = max((m.get('date') or today) for m in ex)
        if start <= today: return ('post_expedite', start)
    if sched:
        if sched > today: return ('interview_scheduled', sched)
        return ('post_interview', sched)
    return ('queue', None)

def lognormal_curve(start, today, median, sigma):
    s = days_between(start, today) / DAYS_PER_MONTH
    Fs = lognormal_cdf(s, median, sigma)
    return [(1 - lognormal_cdf(s + t, median, sigma)) / (1 - Fs) for t in range(HORIZON + 1)]

def interview_transform(tD):
    """ADR-EST-14: S(t) = S_q(t) for t < t_D; S_q(t_D)·(1 − F(t − t_D)) for t ≥ t_D."""
    med, sig = POST_INTERVIEW
    return lambda c: [c[t] if t < tD else c[tD] * (1 - lognormal_cdf(t - tD, med, sig)) for t in range(HORIZON + 1)]

# ── one estimate (mirrors packages/estimator/src/estimate.ts for the golden cases) ────────────

BETA = vph1.fit_beta(vph1.ROWS)
POOL, _SSE, _SCALES = vph1.reconstruct(vph1.ROWS, BETA)
DATA_THROUGH = vph1.ROWS[-1]['ym']
MULTS, _GROUP = office_multipliers()
# The office FIXTURE of 04 §5.3 / T16 uses the key-facts §3 multipliers as printed (3 dp; "Estimator
# defaults": HIA 0.947, KND 0.829, MIA 0.963, TAM 1.936, HOU 1.140). EST-11: these ARE the shrunk
# m̂_o (never shrink twice). T6 checks that EST-11 on the doc 04 §1.3 rows reproduces them.
FIXTURE_MULTS = {'HIA': 0.947, 'KND': 0.829, 'MIA': 0.963, 'TAM': 1.936, 'HOU': 1.140}

def k_origin(today): return months_between(DATA_THROUGH, ym(today))

def vintage_label(receipt):
    """§3.3: the receipt month's vintage; up to FIRST_MODEL_MONTH → legacy (≥ 6 months old then → >6mo)."""
    m = ym(receipt)
    if m > FIRST_MODEL_MONTH: return m   # the origin month's receipts are inside its pending total
    return 'legacy>6mo' if months_between(m, FIRST_MODEL_MONTH) >= 6 else 'legacy<6mo'

def dec31s(today):
    y = int(today[:4]); return ['%d-12-31' % (y + i) for i in range(3)]

def run(case, today, weights, m_office, extra=((1.0, 1.0),), mfun=None, transform=None, offices=None):
    k0 = k_origin(today); H = k0 + HORIZON; label = vintage_label(case['receipt'])
    if offices is None:
        paths = grid_annotated(POOL, label, BETA, m_office, H, k0, weights, extra=extra, mfun=mfun)
        S, post, curves = mix_paths(paths, k0, transform)
        return S, post, curves, paths, None
    allp, owner = [], []
    for code, pend, m in offices:
        ps = grid_annotated(POOL, label, BETA, m, H, k0, weights, extra=extra, mfun=mfun)
        tot = sum(o[1] for o in offices)
        for p in ps: p['prior'] *= pend / tot; owner.append(code)
        allp += ps
    S, post, curves = mix_paths(allp, k0, transform)
    pi = {}
    for c, w in zip(owner, post): pi[c] = pi.get(c, 0.0) + w
    return S, post, curves, allp, pi

def estimate_case(case, today=TODAY, alerts=(), lit=LIT_TODAY, flags=None, bands=True, extra_dates=()):
    mode, start = mode_of(case, today)
    if mode in ('decided', 'no_estimate'): return dict(kind=mode)
    w, trace = scenario_weights(list(alerts), [], flags if flags is not None else dict(redEagleAppearsInClass=case.get('inClass', True)), lit, today)
    mfun, delays = milestone_mult(case, today) if mode in ('queue', 'interview_scheduled') else (None, {})
    has_ead = any(m['key'] == 'ead_c9' for m in case['milestones'])
    offices = None; m_office = 1.0; basis = 'national'
    if case.get('office'):
        m_office = FIXTURE_MULTS.get(case['office'], 1.0); basis = 'office'
    elif case.get('state') and bands:
        offices = [(c, v[1][-1][3], FIXTURE_MULTS.get(c, 1.0)) for c, v in OFFICE_STATS.items() if v[0] == case['state'] and v[1][-1][3] > 0]
        offices.sort(key=lambda o: -o[1])
        if len(offices) > 8:
            rest = offices[8:]; offices = offices[:8] + [('OTHER', sum(o[1] for o in rest), 1.0)]
        basis = 'state_mixture' if offices else 'national'
        if not offices: offices = None
    out = dict(kind='estimate', mode=mode, k0=k_origin(today), weights=w, weightTrace=trace, delays=delays, office=dict(basis=basis))
    if mode in ('post_interview', 'post_expedite'):
        med, sig = POST_INTERVIEW if mode == 'post_interview' else POST_EXPEDITE
        S = lognormal_curve(start, today, med, sig)
        p12 = 1 - S[12]
        out.update(survival=S, pWithin=p_within(S), quantiles=quantiles(S), byDate=by_date(S, today, dec31s(today) + list(extra_dates)),
                   perScenario=[], policyBand12=[p12, p12], structuralBand12=[p12, p12], drivers=dict(scenario=0.0, beta=0.0, office=0.0))
        return out
    transform = interview_transform(months_ceil(days_between(today, start))) if mode == 'interview_scheduled' else None
    S, post, curves, paths, pi = run(case, today, w, m_office, mfun=mfun, transform=transform, offices=offices)
    per = []
    for sid in SIDS:
        idx = [i for i, p in enumerate(paths) if p['sid'] == sid]
        pw = sum(post[i] for i in idx)
        Ss = [sum(post[i] * curves[i][t] for i in idx) / pw for t in range(HORIZON + 1)]
        per.append(dict(id=sid, weight=w[sid], posteriorWeight=pw, p12=1 - Ss[12], q50=vph1.quant(Ss, .5)))
    out.update(survival=S, pWithin=p_within(S), quantiles=quantiles(S), byDate=by_date(S, today, dec31s(today) + list(extra_dates)),
               perScenario=per, policyBand12=[min(p['p12'] for p in per), max(p['p12'] for p in per)],
               drivers=driver_shares(paths, post, curves))
    if pi is not None: out['office']['stateWeights'] = pi
    if bands:
        ext = (0.45, 2.4) if has_ead else (0.5, 2.0)   # 04 §7 extremes
        p = [1 - run(case, today, w, m_office, extra=((x, 1.0),), mfun=mfun, transform=transform, offices=offices)[0][12] for x in ext]
        out['structuralBand12'] = [min(p), max(p)]
    else:
        out['structuralBand12'] = [1 - S[12], 1 - S[12]]
    return out

# ── the reference case and its twins (04 §9.2) ───────────────────────────────────────────────

def M(key, date, gran='day', **meta):
    m = dict(key=key, date=date, granularity=gran)
    if meta: m['meta'] = meta
    return m

T15_CASE = dict(channel='CHNV', receipt='2025-03-15', receiptGranularity='day', state=None, office=None, inClass=True,
                milestones=[M('biometrics', '2025-07-15', 'month'), M('ead_c9', '2025-09-15', 'month')])

def twin(**kw):
    c = json.loads(json.dumps(T15_CASE)); c.update({k: v for k, v in kw.items() if k != 'add' and k != 'drop'})
    c['milestones'] = [m for m in c['milestones'] if m['key'] not in kw.get('drop', ())] + list(kw.get('add', ()))
    return c

CASES = {
    'T15': T15_CASE,
    'T16_TAM': twin(office='TAM'), 'T16_HOU': twin(office='HOU'), 'T16_MIA': twin(office='MIA'),
    'T16_HIA': twin(office='HIA'), 'T16_KND': twin(office='KND'),
    'T17': twin(receipt='2025-10-15', milestones=[M('biometrics', '2025-12-15', 'month')]),  # vintage only (no 0.7 rule)
    'T18p': twin(add=[M('rfe', '2026-10-01')]),
    'T18b': twin(add=[M('rfe', '2026-09-01'), M('rfe_response', '2026-10-10')]),
    'T18c': twin(add=[M('mandamus', '2026-10-01')]),
    'T18d': twin(add=[M('rfe', '2026-06-01')]),
    'T23': twin(drop=('ead_c9',)),
    'T23b': twin(drop=('ead_c9', 'biometrics')),
    'T24': twin(channel='CBP_ONE'),
    'T27': twin(add=[M('interview_notice', '2026-10-15', scheduledFor='2026-12-15')]),
    'T28': twin(add=[M('interview', '2026-09-20')]),
    'T29': twin(add=[M('expedite_request', '2026-10-01'), M('expedite_outcome', '2026-10-10', outcome='granted')]),
    'T30_FL4': twin(state='FL'),
    'T26_I220A': twin(channel='I220A'),
}

# ── adjudicable days (EST-12; for WP3 and the TS property tests) ─────────────────────────────

REGIMES = [  # key facts §3: R1 Davidson memo; R3 PM-602-0192 (end-exclusive overlaps)
    dict(id='R1', start='2025-02-14', end='2025-06-09', altOps='2025-06-25', appliesTo={'CHNV', 'FRP_CFRP', 'U4U'}),
    dict(id='R3', start='2025-12-02', end='2026-06-12', altOps='2026-07-16', appliesTo={'ALL_CUBAN'}),
]

def clock(channel, receipt, today, ends='default'):
    days = days_between(receipt, today); holds = []
    for r in REGIMES:
        if not (r['appliesTo'] & {'ALL_CUBAN', channel}): continue
        end = r['end'] if ends == 'default' else r['altOps']
        a, b = max(receipt, r['start']), min(end, today)
        if a < b: days -= days_between(a, b); holds.append(r['id'])
    return days, holds

# ── DOC_EXPECTED: the numbers printed in 04 (EST-13) ─────────────────────────────────────────
# (path, printed value as a string, optional absolute tolerance). The default tolerance is half a
# unit of the last printed digit. None = null quantile; ints are exact.
DOC_EXPECTED = [
    ('T1.h1', '0.0022502'), ('T1.S12', '0.9730'),
    ('T2.h1to6max', '0.0', 0.0), ('T2.S6', '1', 0.0),
    ('T3.S_2025_03_24', '0.99966'), ('T3.S_legacy_12', '0.39291'),
    ('T4.Sc12', '0.89755'), ('T4.Sc10', '0.92072'),
    ('T5.posterior.S0', '0.3006', 1e-4), ('T5.posterior.S1', '0.3998', 1e-4), ('T5.posterior.S2', '0.1487', 1e-4), ('T5.posterior.S3', '0.1509', 1e-4),
    ('T6.HIA.raw', '0.055'), ('T6.HIA.shrunk', '0.947'), ('T6.TAM.shrunk', '1.936'), ('T6.clampHigh', '2', 0.0), ('T6.clampLow', '0.5', 0.0),
    ('T6.group.y', '244', 0.0), ('T6.group.E', '166179', 0.0),
    ('T7.S3', '0.8333'), ('T7.S5', '0.6667'), ('T7.S8', '0.4444'), ('T7.S12', '0', 1e-12), ('T8.S8given5', '0.6667'), ('T9.uniform', '0.375', 1e-12), ('T9.point', '0', 1e-12),
    ('T10.F1', '0.0999'), ('T10.F3', '0.5000'), ('T10.F6', '0.7907'), ('T10.F9', '0.9001'), ('T10.cond3given3', '0.5814'),
    ('T11.calendar', '584', 0.0), ('T11.r1', '86', 0.0), ('T11.r3', '192', 0.0), ('T11.adjudicable', '306', 0.0), ('T11.altOps', '256', 0.0),
    ('T12.c820', '433.56'), ('T12.c4600', '77.29'), ('T12.c6524_25', '54.49'), ('T12.c9200', '38.64'), ('T12.c16876', '21.07'),
    ('T13.sum', '355520', 1.0), ('T13.count', '25', 0.0), ('T13.min', '1210.8'), ('T13.mar2025', '23096.5'), ('T13.older', '175220.8'),
    ('T14.beta', '0.037391', 1e-5),
    ('cases.T15.pWithin.m3', '0.01484'), ('cases.T15.pWithin.m6', '0.03665'), ('cases.T15.pWithin.m12', '0.09229'), ('cases.T15.pWithin.m18', '0.15517'),
    ('cases.T15.pWithin.m24', '0.22050'), ('cases.T15.pWithin.m36', '0.35453'), ('cases.T15.pWithin.m60', '0.55396'),
    ('cases.T15.quantiles.q10', 13), ('cases.T15.quantiles.q25', 27), ('cases.T15.quantiles.q50', 54), ('cases.T15.quantiles.q75', None), ('cases.T15.quantiles.q90', None),
    ('cases.T15.byDate.2026-12-31', '0.00906'), ('cases.T15.byDate.2027-03-31', '0.02884'), ('cases.T15.byDate.2027-06-30', '0.05366'),
    ('cases.T15.byDate.2027-12-31', '0.11271'), ('cases.T15.byDate.2028-12-31', '0.24265'),
    ('cases.T15.perScenario.S0.p12', '0.02325'), ('cases.T15.perScenario.S0.q50', None), ('cases.T15.perScenario.S1.p12', '0.10054'), ('cases.T15.perScenario.S1.q50', 46),
    ('cases.T15.perScenario.S2.p12', '0.25970'), ('cases.T15.perScenario.S2.q50', 22), ('cases.T15.perScenario.S3.p12', '0.04289'), ('cases.T15.perScenario.S3.q50', 51),
    ('cases.T15.policyBand12.0', '0.02325'), ('cases.T15.policyBand12.1', '0.25970'),
    ('cases.T15.drivers.scenario', '0.94135'), ('cases.T15.drivers.office', '0.02796'), ('cases.T15.drivers.beta', '0.00920'),
    ('cases.T15.structuralBand12.0', '0.04352'), ('cases.T15.structuralBand12.1', '0.19801'),
    ('cases.T23.structuralBand12.0', '0.04815'), ('cases.T23.structuralBand12.1', '0.17021'),
    ('T15d.kappaMixture.p12', '0.1006'), ('T15d.kappaMixture.q50', 53),
    ('cases.T16_TAM.pWithin.m12', '0.16559'), ('cases.T16_TAM.quantiles.q50', 36), ('cases.T16_HOU.pWithin.m12', '0.10399'), ('cases.T16_HOU.quantiles.q50', 50),
    ('cases.T16_MIA.pWithin.m12', '0.08915'), ('cases.T16_MIA.quantiles.q50', 55), ('cases.T16_HIA.pWithin.m12', '0.08779'), ('cases.T16_HIA.quantiles.q50', 55),
    ('cases.T16_KND.pWithin.m12', '0.07761'), ('cases.T16_KND.quantiles.q50', 59),
    ('cases.T17.pWithin.m12', '0.07152'), ('cases.T17.quantiles.q50', 62),
    ('cases.T18p.pWithin.m3', '0.0', 0.0), ('cases.T18p.pWithin.m6', '0.03347'), ('cases.T18p.pWithin.m12', '0.08942'), ('cases.T18p.quantiles.q50', 54),
    ('cases.T18p.delays.rfeZeroUntil', '2026-12-24'),
    ('cases.T18b.pWithin.m3', '0.02215'), ('cases.T18b.pWithin.m12', '0.09852'), ('cases.T18b.quantiles.q50', 53),
    ('cases.T18c.pWithin.m3', '0.01924'), ('cases.T18c.pWithin.m12', '0.09773'), ('cases.T18c.quantiles.q50', 53),
    ('cases.T18d.delays.assumedResponseAt', '2026-08-24'), ('cases.T18d.delays.nonResponseRisk', True),
    ('T19.adjudicable', '392', 0.0), ('T20.tripDate', '2026-11-15'), ('T21.adjudicable', '392', 0.0),
    ('T22.calendar', '622', 0.0), ('T22.adjudicable', '430', 0.0), ('T22.oneYearWarning', False),
    ('cases.T23b.pWithin.m3', '0.01042'), ('cases.T23b.pWithin.m6', '0.02590'), ('cases.T23b.pWithin.m12', '0.06619'), ('cases.T23b.pWithin.m24', '0.16437'),
    ('cases.T23b.pWithin.m36', '0.28154'), ('cases.T23b.quantiles.q10', 17), ('cases.T23b.quantiles.q25', 34), ('cases.T23b.quantiles.q50', 64),
    ('cases.T27.pWithin.m3', '0.10809'), ('cases.T27.pWithin.m6', '0.63479'), ('cases.T27.pWithin.m12', '0.92070'), ('cases.T27.quantiles.q50', 5),
    ('T28.s', '0.98563'), ('cases.T28.pWithin.m3', '0.59010'), ('cases.T28.pWithin.m6', '0.82060'), ('cases.T28.pWithin.m12', '0.95165'),
    ('T29.s', '0.32854'), ('cases.T29.pWithin.m3', '0.71895'), ('cases.T29.pWithin.m6', '0.90895'), ('cases.T29.pWithin.m12', '0.98279'),
    ('cases.T30_FL4.office.stateWeights.HIA', '0.2799'), ('cases.T30_FL4.office.stateWeights.KND', '0.3082'),
    ('cases.T30_FL4.office.stateWeights.MIA', '0.1543'), ('cases.T30_FL4.office.stateWeights.TAM', '0.2576'),
    ('cases.T30_FL4.pWithin.m12', '0.1049'), ('cases.T30_FL4.quantiles.q50', 51),
    ('T30.averagedMultiplier', '1.169'), ('T30.averagedP12', '0.1064'),
    ('T25.memberS3Factor', '1.5', 1e-12), ('T25.nonMemberS3Factor', '3', 1e-12), ('T32.s3Factor', '3', 1e-12),
    ('T6sigma.sd', '0.298'), ('T6sigma.n', '9', 0.0), ('T6sigma.sigma', '0.30', 1e-12),
] + [('T31.C%d.%s' % (c, s), v, 1e-4) for c, row in (
    (600, ('0.5292', '0.3040', '0.0167', '0.15')), (820, ('0.4114', '0.4216', '0.0169', '0.15')),
    (1100, ('0.2891', '0.5105', '0.0504', '0.15')), (1500, ('0.1655', '0.5194', '0.1651', '0.15')),
    (2200, ('0.0533', '0.3397', '0.4570', '0.15')), (3000, ('0.0169', '0.1564', '0.6767', '0.15'))) for s, v in zip(SIDS, row)]

def _get(obj, path):
    cur = obj
    for part in path.split('.'):
        if isinstance(cur, list):
            if part.isdigit():
                cur = cur[int(part)]
            else:
                cur = next(x for x in cur if x.get('id') == part or x.get('date') == part)
                if 'date' in cur and 'p' in cur: cur = cur['p']
        else:
            cur = cur[part]
    return cur

def verify_doc(golden):
    bad = []
    for e in DOC_EXPECTED:
        path, want = e[0], e[1]
        try:
            got = _get(golden, path)
        except (KeyError, StopIteration, IndexError, TypeError) as ex:
            bad.append('%s: missing (%r)' % (path, ex)); continue
        if want is None or isinstance(want, bool) or isinstance(want, int):
            if got != want: bad.append('%s: oracle %r, 04 says %r' % (path, got, want))
            continue
        if isinstance(got, str):
            if got != want: bad.append('%s: oracle %r, 04 says %r' % (path, got, want))
            continue
        dec = len(want.split('.')[1]) if '.' in want else 0
        tol = e[2] if len(e) > 2 else 0.5 * 10 ** (-dec) + 1e-12
        if abs(got - float(want)) > tol: bad.append('%s: oracle %.8g, 04 says %s (tol %g)' % (path, got, want, tol))
    return bad

# ── crowd utilities (v1.1; T7–T9) ────────────────────────────────────────────────────────────

def kaplan_meier(data):
    times = sorted(set(t for t, e in data if e))
    S, out = 1.0, []
    for t in times:
        n = sum(1 for x, _ in data if x >= t); dd = sum(1 for x, e in data if x == t and e)
        S *= 1 - dd / n; out.append((t, n, dd, S))
    return out

def km_at(km, t):
    s = 1.0
    for x, _, _, v in km:
        if x <= t: s = v
    return s

def crps(F, y):
    return sum((F[k] - (1.0 if y <= k + 1 else 0.0)) ** 2 for k in range(len(F)))

# ── assemble ─────────────────────────────────────────────────────────────────────────────────

def build():
    g = {}
    g['meta'] = dict(
        model='VPH-1.1', generatedBy='tools/oracle/golden_cases.py (core: tools/oracle/vph1.py = 04 Appendix A)',
        spec='docs/planning/04-estimation-model.md §9', today=TODAY, dataThrough=DATA_THROUGH, horizon=HORIZON,
        tolerances=dict(probability=5e-4, quantile=0, days=0, oracleCheck=1e-6),
        note='SAMPLE/TEST DATA: inputs are the official 24 monthly rows (doc 04 §1.1 [F]) and FY26 Q2-Q3 office rows (doc 04 §1.3 [F]); outputs are model results, not official figures.')
    g['inputs'] = dict(
        rows=[dict(ym=r['ym'], received=r['rec'], approved=r['app'], denied=r['den'], pending=r['pend'], pendingOver6=r['p6'], avgMonths=r['avg']) for r in vph1.ROWS],
        officeStats=[dict(officeCode=c, state=v[0], quarter=dict(fy=q[0], q=q[1]), approved=q[2], pending=q[3]) for c, v in OFFICE_STATS.items() for q in v[1]],
        scenarios=SCENARIOS, alertRules=[dict(ruleId=k, effects=v) for k, v in ALERT_RULES.items()],
        fixtureMultipliers=FIXTURE_MULTS, observation=OBSERVATION, litigationToday=LIT_TODAY, regimes=[dict(r, appliesTo=sorted(r['appliesTo'])) for r in REGIMES],
        grids=dict(beta=BETA_GRID, office=OFFICE_GRID), kappaOffice=KAPPA_OFFICE, clampOffice=list(CLAMP))
    k0 = k_origin(TODAY); H = k0 + HORIZON
    # T1–T4 (single paths)
    s1 = vph1.project(POOL, '2025-03', 0.0, lambda k: 800.0, 1.0, 12, receipts=0.0)
    g['T1'] = dict(h1=1 - s1[1], S12=s1[12], S=s1)
    s3 = vph1.project(POOL, '2025-03', BETA, completions_path(SCENARIOS[3], 0), 1.0, H)
    g['T2'] = dict(h1to6max=max(1 - s3[k] / s3[k - 1] for k in range(1, 7)), S6=s3[6])
    a = vph1.project(POOL, '2025-03', 1.0, completions_path(SCENARIOS[1], 0), 1.0, 24)
    b = vph1.project(POOL, 'legacy>6mo', 1.0, completions_path(SCENARIOS[1], 0), 1.0, 12)
    g['T3'] = dict(S_2025_03_24=a[24], S_legacy_12=b[12])
    s4 = vph1.project(POOL, '2025-03', BETA, completions_path(SCENARIOS[1], 0), 1.0, H)
    g['T4'] = dict(Sc12=s4[k0 + 12] / s4[k0], Sc10=s4[12] / s4[k0], S=s4)
    # cases
    g['cases'] = {}
    for name, c in CASES.items():
        res = estimate_case(c, extra_dates=('2027-03-31', '2027-06-30') if name == 'T15' else ())
        g['cases'][name] = dict(case=c, **res)
    # Appendix A cross-check of the TS-shaped harness against the verbatim core (T15)
    S_core, post_core = vph1.mix(vph1.grid(POOL, '2025-03', BETA, 1.0, H, k0), k0)
    assert max(abs(x - y) for x, y in zip(S_core, g['cases']['T15']['survival'])) < 1e-12, 'harness ≠ Appendix A core'
    T15 = g['cases']['T15']
    g['T5'] = dict(posterior={p['id']: p['posteriorWeight'] for p in T15['perScenario']}, sum=sum(p['posteriorWeight'] for p in T15['perScenario']))
    # T6 office shrink + clamp
    g['T6'] = dict(HIA=MULTS['HIA'], TAM=MULTS['TAM'], multipliers=MULTS, group=_GROUP,
                   clampHigh=shrink(1e9, 5.0), clampLow=shrink(1e9, 0.1))
    # T6sigma (04 §6.2): SD of Δ ln C between consecutive non-hold months
    def hold_month(m):
        a0, a1 = m + '-01', add_days(end_of_month(m), 1)
        return any(max(a0, r['start']) < min(a1, r['end']) for r in REGIMES)
    diffs = []
    for r0, r1 in zip(vph1.ROWS, vph1.ROWS[1:]):
        if months_between(r0['ym'], r1['ym']) == 1 and not hold_month(r0['ym']) and not hold_month(r1['ym']):
            diffs.append(math.log(r1['app'] + r1['den']) - math.log(r0['app'] + r0['den']))
    mu = sum(diffs) / len(diffs); sd = math.sqrt(sum((x - mu) ** 2 for x in diffs) / (len(diffs) - 1))
    g['T6sigma'] = dict(n=len(diffs), sd=sd, sigma=max(0.25, round(sd, 2)))
    # T7–T9
    km = kaplan_meier([(3, 1), (5, 1), (5, 0), (8, 1), (10, 0), (12, 1)])
    g['T7'] = dict(S3=km_at(km, 3), S5=km_at(km, 5), S8=km_at(km, 8), S12=km_at(km, 12), riskSets=[x[1] for x in km])
    g['T8'] = dict(S8given5=km_at(km, 8) / km_at(km, 5))
    g['T9'] = dict(uniform=crps([0.25, 0.5, 0.75, 1.0], 2), point=crps([0.0, 0.0, 1.0, 1.0], 3))
    # T10
    m3, s = POST_INTERVIEW
    g['T10'] = dict(F1=lognormal_cdf(1, m3, s), F3=lognormal_cdf(3, m3, s), F6=lognormal_cdf(6, m3, s), F9=lognormal_cdf(9, m3, s),
                    cond3given3=(lognormal_cdf(6, m3, s) - lognormal_cdf(3, m3, s)) / (1 - lognormal_cdf(3, m3, s)))
    # T11, T19, T21, T22 (clock; WP3 owns clockFor, these are cross-checks)
    cal = days_between('2025-03-15', TODAY)
    d_def, h_def = clock('CHNV', '2025-03-15', TODAY); d_alt, _ = clock('CHNV', '2025-03-15', TODAY, 'altOps')
    g['T11'] = dict(calendar=cal, r1=days_between('2025-03-15', '2025-06-09'), r3=days_between('2025-12-02', '2026-06-12'),
                    adjudicable=d_def, altOps=d_alt, holds=h_def)
    g['T19'] = dict(adjudicable=clock('VISA', '2025-03-15', TODAY)[0])
    g['T21'] = dict(adjudicable=clock('CBP_ONE', '2025-03-15', TODAY)[0], r1='not_applied_low_confidence')
    g['T22'] = dict(calendar=days_between('2025-02-05', TODAY), adjudicable=clock('CBP_ONE', '2025-02-05', TODAY)[0],
                    oneYearWarning='2025-02-05' < add_days('2024-02-01', 366))
    # T12 Little's law (months = pending / completions per month)
    P = vph1.ROWS[-1]['pend']
    g['T12'] = {'c820': P / 820, 'c4600': P / 4600, 'c6524_25': P / (78291 / 12), 'c9200': P / 9200, 'c16876': P / 16876}
    # T13, T14
    mar = next(v for v in POOL if v[2] == '2025-03')
    g['T13'] = dict(sum=sum(v[1] for v in POOL), count=len(POOL), min=min(v[1] for v in POOL), minScale=min(_SCALES), maxScale=max(_SCALES),
                    mar2025=mar[1], mar2025Age=mar[0], older=sum(v[1] for v in POOL if v[0] > mar[0]),
                    meanAge=sum(v[0] * v[1] for v in POOL) / sum(v[1] for v in POOL),
                    pool=[dict(label=v[2], age=v[0], n=v[1]) for v in POOL], scales=_SCALES)
    t = [r['ym'] for r in vph1.ROWS if r['app'] + r['den'] >= 300][-3:]
    sse = lambda bb: vph1.reconstruct(vph1.ROWS, bb, set(t))[1]
    g['T14'] = dict(beta=BETA, targets=t, sse=sse(BETA), sse0=sse(0.0), sse008=sse(0.08))
    # T15d κ mixture (diagnostic, 04 §7)
    paths = grid_annotated(POOL, '2025-03', BETA, 1.0, H, k0, {s['id']: s['prior'] for s in SCENARIOS}, extra=((0.5, 0.25), (1.0, 0.5), (2.0, 0.25)))
    Sk, _, _ = mix_paths(paths, k0)
    g['T15d'] = dict(kappaMixture=dict(p12=1 - Sk[12], q50=vph1.quant(Sk, .5)))
    # T20 guard trip date: first day with today − end(2026-08) > 75 days
    eom = end_of_month(DATA_THROUGH); trip = add_days(eom, 76)
    g['T20'] = dict(endOfLatestMonth=eom, tripDate=trip, t20bPass=dict(monthly='2026-08', quarterEnd='2026-06'),
                    t20bTrip=dict(monthly='2026-10', quarterEnd='2026-06', months=['2026-07', '2026-08', '2026-09', '2026-10']))
    # T25 / T32 alert composition
    dr = dict(id='2026-10-01-dorcas-reversed', date='2026-10-01', status='published', ruleIds=['DORCAS_REVERSED'])
    pri = {s['id']: s['prior'] for s in SCENARIOS}
    fac = lambda w: (w['S3'] / (1 - w['S3'])) / (pri['S3'] / (1 - pri['S3']))
    wm, trm = scenario_weights([dr], [], dict(redEagleAppearsInClass=True), LIT_TODAY, TODAY)
    wn, trn = scenario_weights([dr], [], dict(redEagleAppearsInClass=False), LIT_TODAY, TODAY)
    g['T25'] = dict(alert=dr, memberWeights=wm, nonMemberWeights=wn, memberS3Factor=fac(wm), nonMemberS3Factor=fac(wn), memberTrace=trm, nonMemberTrace=trn)
    today32 = '2026-12-01'
    a1 = dict(id='2026-11-02-dorcas-reversed', date='2026-11-02', status='published', ruleIds=['DORCAS_REVERSED'])
    a2 = dict(id='2026-11-09-red-eagle-dissolved', date='2026-11-09', status='published', ruleIds=['RED_EAGLE_DISSOLVED'])
    lit32 = dict(dorcas='reversed', piInForce=False)
    w32, tr32 = scenario_weights([a2, a1], [], dict(redEagleAppearsInClass=True), lit32, today32)
    w32lag, tr32lag = scenario_weights([a2, a1], [], dict(redEagleAppearsInClass=False), LIT_TODAY, today32)
    retracted = dict(a1, status='retracted')
    sup = dict(id='2026-11-20-correction', date='2026-11-20', status='published', supersedes=[a1['id']])
    expired = dict(a1, expires='2026-11-30')
    g['T32'] = dict(today=today32, alerts=[a2, a1], litigation=lit32, weights=w32, s3Factor=fac(w32), trace=tr32,
                    laggingStateNonMember=dict(litigation=LIT_TODAY, weights=w32lag, s3Factor=fac(w32lag), trace=tr32lag),
                    retracted=dict(alerts=[retracted], weights=scenario_weights([retracted], [], dict(redEagleAppearsInClass=False), LIT_TODAY, today32)[0]),
                    superseded=dict(alerts=[a1, sup], weights=scenario_weights([a1, sup], [], dict(redEagleAppearsInClass=False), LIT_TODAY, today32)[0]),
                    expired=dict(alerts=[expired], weights=scenario_weights([expired], [], dict(redEagleAppearsInClass=False), LIT_TODAY, today32)[0]),
                    traceOrder=[x['alertId'] for x in tr32])
    # ledger order: alerts given out of order are applied and traced in (date, id) order
    o1 = dict(id='2026-11-10-new-hold-memo-cuba', date='2026-11-10', status='published', ruleIds=['NEW_HOLD_MEMO_CUBA'])
    o2 = dict(id='2026-11-03-dorcas-affirmed', date='2026-11-03', status='published', ruleIds=['DORCAS_AFFIRMED'])
    o3 = dict(id='2026-11-03-aaup-relief', date='2026-11-03', status='published', ruleIds=['AAUP_RELIEF_DENIAL_POLICY'])
    wo, tro = scenario_weights([o1, o3, o2], [], None, LIT_TODAY, today32)
    g['T32']['order'] = dict(alerts=[o1, o3, o2], weights=wo, traceOrder=[x['alertId'] for x in tro], trace=tro)
    # T30 contrast: averaged multiplier (ruled out, 04 §5.3)
    fl = [(c, v[1][-1][3], FIXTURE_MULTS[c]) for c, v in OFFICE_STATS.items() if v[0] == 'FL']
    mbar = sum(p * m for _, p, m in fl) / sum(p for _, p, _ in fl)
    Sbar = mix_paths(grid_annotated(POOL, '2025-03', BETA, mbar, H, k0, pri), k0)[0]
    g['T30'] = dict(averagedMultiplier=mbar, averagedP12=1 - Sbar[12])
    # T31 likelihood update after the Sep 2026 CSV, by observed C_Sep
    g['T31'] = {}
    for C in (600, 820, 1100, 1500, 2200, 3000):
        w, tr = scenario_weights([], [dict(ym='2026-09', app=C, den=0)], None, LIT_TODAY, TODAY)
        g['T31']['C%d' % C] = dict(w, trace=tr)
    g['T28'] = dict(s=days_between('2026-09-20', TODAY) / DAYS_PER_MONTH)
    g['T29'] = dict(s=days_between('2026-10-10', TODAY) / DAYS_PER_MONTH)
    # predictive completions (v1.1 ledger, 04 §10.1): next 6 months after dataThrough, prior weights
    g['ledger'] = [dict(ym=add_months(DATA_THROUGH, j), components=[dict(sid=s['id'], weight=pri[s['id']], mu=math.log(max(completions_path(s, 0)(j), 50.0)), sigma=0.30) for s in SCENARIOS]) for j in range(1, 7)]
    return g

def _cmp(a, b, path, out, tol=1e-6):
    if isinstance(a, dict) and isinstance(b, dict):
        if list(a.keys()) != list(b.keys()): out.append('%s: keys differ' % path); return
        for k in a: _cmp(a[k], b[k], path + '.' + k, out, tol)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b): out.append('%s: length %d vs %d' % (path, len(a), len(b))); return
        for i, (x, y) in enumerate(zip(a, b)): _cmp(x, y, '%s[%d]' % (path, i), out, tol)
    elif isinstance(a, bool) or isinstance(b, bool) or a is None or b is None or isinstance(a, str) or isinstance(b, str):
        if a != b: out.append('%s: %r vs %r' % (path, a, b))
    elif isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if abs(a - b) > tol: out.append('%s: %r vs %r' % (path, a, b))
    else:
        out.append('%s: type %s vs %s' % (path, type(a).__name__, type(b).__name__))

def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1] if __doc__ else None)
    g_ = ap.add_mutually_exclusive_group(required=True)
    g_.add_argument('--write', metavar='FILE'); g_.add_argument('--check', metavar='FILE')
    a = ap.parse_args(argv)
    golden = json.loads(json.dumps(build()))   # normalize tuples → lists exactly as written
    bad = verify_doc(golden)
    if bad:
        print('ESCALATE (04 EST-13): the oracle disagrees with numbers written in 04-estimation-model.md §9.')
        print('Do NOT regenerate the golden file; ask the owner to approve an edit of 04 first.')
        for b in bad: print('  - ' + b)
        return 2
    text = json.dumps(golden, indent=1, ensure_ascii=False) + '\n'
    if a.write:
        os.makedirs(os.path.dirname(os.path.abspath(a.write)), exist_ok=True)
        with open(a.write, 'w', encoding='utf-8') as f: f.write(text)
        print('golden: wrote %s (%d bytes; %d doc values verified)' % (a.write, len(text.encode('utf-8')), len(DOC_EXPECTED)))
        return 0
    try:
        with open(a.check, encoding='utf-8') as f: committed = json.load(f)
    except FileNotFoundError:
        print('golden: %s not found (run golden:write)' % a.check); return 1
    diffs = []; _cmp(golden, committed, '$', diffs)
    if diffs:
        print('golden: %d difference(s) > 1e-6 between the oracle and %s:' % (len(diffs), a.check))
        for d in diffs[:50]: print('  - ' + d)
        return 1
    print('golden: OK — %s matches the oracle (tol 1e-6); %d doc values verified (EST-13)' % (a.check, len(DOC_EXPECTED)))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
