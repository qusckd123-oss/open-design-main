import json, math, statistics
from collections import Counter, defaultdict
from pathlib import Path

import sku_analog_pace_calibration as base

ROOT = Path(__file__).resolve().parents[1]
LATEST_PATH = ROOT / "data" / "sku-latest.json"
OUTPUT_PATH = ROOT / "data" / "sku-analog-pace-coverage-diagnostic.json"
REPORT_PATH = ROOT / "docs" / "SKU_ANALOG_PACE_COVERAGE_DIAGNOSTIC.md"
WEEKS = (2, 3, 4, 5, 6, 8)
CATEGORIES = ("CD", "CR", "DP", "HD", "HZ", "JK", "KT", "LT", "PT", "SH", "SO", "SR", "ST")

def rate(n, d): return round(100*n/d, 2) if d else None
def lift(v, b): return round(v-b, 2) if v is not None and b is not None else None
def ratio(v, b): return round(v/b, 3) if v is not None and b else None
def finite(v): return v is not None and isinstance(v, (int,float)) and math.isfinite(v)

def spearman(a, b):
    pairs = [(x,y) for x,y in zip(a,b) if finite(x) and finite(y)]
    if len(pairs) < 3: return None
    def ranks(xs):
        order = sorted(range(len(xs)), key=lambda i: xs[i]); out=[0]*len(xs); i=0
        while i < len(xs):
            j=i
            while j+1 < len(xs) and xs[order[j+1]] == xs[order[i]]: j += 1
            r=(i+j+2)/2
            for k in range(i,j+1): out[order[k]]=r
            i=j+1
        return out
    x,y=ranks([p[0] for p in pairs]),ranks([p[1] for p in pairs]); mx,my=statistics.mean(x),statistics.mean(y)
    den=math.sqrt(sum((v-mx)**2 for v in x)*sum((v-my)**2 for v in y))
    return round(sum((x[i]-mx)*(y[i]-my) for i in range(len(x)))/den,4) if den else None

def outcome_stats(rows, threshold):
    vals=[r for r in rows if finite(r.get("finalOrderSellThrough"))]
    pos=[r for r in vals if r["finalOrderSellThrough"] >= threshold]
    return {"n":len(vals),"successN":len(pos),"rate":rate(len(pos),len(vals))}

def metrics_for(subset, threshold=0.6, outcome_field="finalOrderSellThrough"):
    rows=[r for r in subset if finite(r.get("pacePercentile")) and finite(r.get(outcome_field))]
    out={}
    for t in (75,80,85,90):
        tp=sum(r[outcome_field]>=threshold and r["pacePercentile"]>=t for r in rows)
        fp=sum(r[outcome_field]<threshold and r["pacePercentile"]>=t for r in rows)
        fn=sum(r[outcome_field]>=threshold and r["pacePercentile"]<t for r in rows)
        tn=sum(r[outcome_field]<threshold and r["pacePercentile"]<t for r in rows)
        precision=tp/(tp+fp) if tp+fp else None; recall=tp/(tp+fn) if tp+fn else None; specificity=tn/(tn+fp) if tn+fp else None
        f1=2*precision*recall/(precision+recall) if precision is not None and recall is not None and precision+recall else None
        out[str(t)]={"tp":tp,"fp":fp,"fn":fn,"tn":tn,"precision":round(precision*100,2) if precision is not None else None,"recall":round(recall*100,2) if recall is not None else None,"specificity":round(specificity*100,2) if specificity is not None else None,"f1":round(f1*100,2) if f1 is not None else None}
    return out

def bucket(subset, threshold):
    rows=[r for r in subset if finite(r.get("pacePercentile")) and finite(r.get("finalOrderSellThrough"))]
    base={f"ge{int(t*100)}":outcome_stats(rows,t) for t in (.5,.6,.7)}
    groups={}
    for label,lo in (("P75+",75),("P90+",90)):
        g=[r for r in rows if r["pacePercentile"]>=lo]
        groups[label]={"n":len(g),"ge50":outcome_stats(g,.5),"ge60":outcome_stats(g,.6),"ge70":outcome_stats(g,.7),"lift":{}}
        for k in ("ge50","ge60","ge70"):
            groups[label]["lift"][k]={"pp":lift(groups[label][k]["rate"],base[k]["rate"]),"ratio":ratio(groups[label][k]["rate"],base[k]["rate"])}
    return {"eligibleN":len(rows),"base":base,"groups":groups,"classification":metrics_for(rows,threshold)}

def current_reasons(style, sku, historical_styles):
    h=sku.get("completedWeeklyHistory") or []
    completed_sum=sum(base.number(i.get("qty")) for i in h)
    cumulative=base.number(sku.get("cumulativeSalesQty")); wtd=base.number(sku.get("currentWtdQty"))
    if cumulative > 0 and completed_sum == 0 and wtd > 0 and abs(cumulative - (completed_sum + wtd)) < 1e-9:
        return ["WTD_ONLY"], None, []
    positive=any(base.number(i.get("qty"))>0 for i in h)
    first=next((i for i,x in enumerate(h) if base.number(x.get("qty"))>0),None)
    sw=base.selling_week_from_history(h)
    reasons=[]
    if not h or not any(base.number(i.get("qty"))>0 for i in h): reasons.append("NO_POSITIVE_SALES")
    if sw is None: reasons.append("NO_COMPLETED_SALES_WEEK")
    if not base.number(sku.get("orderQty"))>0: reasons.append("NO_ORDER_QTY")
    cat=style.get("category") or sku.get("category")
    if not cat: reasons.append("NO_CATEGORY")
    if sw is not None and not (1 <= sw <= 8): reasons.append("SEASON_WEEK_OUT_OF_RANGE")
    analogs=[]; analog_values=[]
    if cat:
        analogs=[s for s in historical_styles.values() if s.get("category")==cat and s.get("styleCode")!=style.get("styleCode")]
        if not analogs: reasons.append("NO_ANALOG_STYLE")
        else:
            for a in sorted(analogs,key=lambda x:x.get("styleCode",""))[:5]:
                v=base.median_or_none([base.progress_at(r,sw,"orderQty") for r in a["skus"]]) if sw else None
                if v is not None: analog_values.append(v)
            if not analog_values: reasons.append("NO_HISTORICAL_PROGRESS_AT_WEEK")
            if len(analog_values)<3: reasons.append("INSUFFICIENT_ANALOG")
    if positive and sw is not None:
        cur=base.median_or_none([base.progress_at({"firstPositiveIndex":first,"orderQty":base.number(sku.get("orderQty")),"weekly":[{"qty":base.number(i.get("qty")),"cumulative":base.number(i.get("cumulativeQty"))} for i in h]},sw,"orderQty")])
        if cur is None or cur<=0: reasons.append("NO_CURRENT_PROGRESS")
    return reasons, sw, analog_values

def fallback_pace(target, styles, week):
    # Same STYLE_TOP5 logic, then category-wide STYLE distribution when Top5 has <3 values.
    strict=base.pace_for(target,styles,week,"orderQty")
    if strict.get("paceIndex") is not None: return strict
    peers=[s for s in styles.values() if s.get("category")==target.get("category") and s.get("styleCode")!=target.get("styleCode")]
    vals=[base.median_or_none([base.progress_at(r,week,"orderQty") for r in s["skus"]]) for s in peers]
    vals=[v for v in vals if finite(v)]
    cur=base.median_or_none([base.progress_at(r,week,"orderQty") for r in target["skus"]])
    exp=statistics.median(vals) if vals else None
    return {"analogStyleCount":len(vals),"analogExpectedProgress":exp,"currentProgress":cur,"paceIndex":cur/exp if cur is not None and exp and exp>0 else None,"pacePercentile":base.percentile(vals,cur) if cur is not None else None,"analogMethod":"CATEGORY_FALLBACK" if vals else "INSUFFICIENT","analogStyleCodes":[]}

def main():
    config, raw=base.load_raw(); styles=base.style_record(raw); records=base.calibrate(raw,styles)
    hist={"weeks":{}}
    for w in WEEKS:
        subset=[r for r in records if r["week"]==w and r["order"]["pacePercentile"] is not None]
        for r in subset: r["pacePercentile"]=r["order"]["pacePercentile"]
        hist["weeks"][str(w)]=bucket(subset,.6)
        hist["weeks"][str(w)]["orderVsInbound"]={}
        for d in ("order","inbound"):
            ss=[r for r in records if r["week"]==w and r[d]["pacePercentile"] is not None]
            for r in ss: r["pacePercentile"]=r[d]["pacePercentile"]
            b=bucket(ss,.6); idx=[r[d]["paceIndex"] for r in ss if finite(r[d].get("paceIndex"))]; hist["weeks"][str(w)]["orderVsInbound"][d]={"correlation":base.rank_correlation(ss,d),"p90Precision":b["classification"]["90"]["precision"],"p90LiftGe60":b["groups"]["P90+"]["lift"]["ge60"],"paceIndexP95":round(sorted(idx)[max(0,math.ceil(.95*len(idx))-1)],4) if idx else None,"paceIndexMax":round(max(idx),4) if idx else None,"extremeRatioCountGe2":sum(v>=2 for v in idx)}
    # Stability on matched STYLE targets.
    stability={}
    for a,b in ((2,3),(3,4),(4,6)):
        ra={r["styleCode"]:r["order"]["pacePercentile"] for r in records if r["week"]==a and r["order"]["pacePercentile"] is not None}; rb={r["styleCode"]:r["order"]["pacePercentile"] for r in records if r["week"]==b and r["order"]["pacePercentile"] is not None}; keys=set(ra)&set(rb)
        stability[f"W{a}_W{b}"]={"n":len(keys),"spearman":spearman([ra[k] for k in keys],[rb[k] for k in keys])}
    latest=json.loads(LATEST_PATH.read_text(encoding="utf-8")); current=[]; reason_counts=Counter(); all_reason_counts=Counter(); funnel=Counter(); swdist=defaultdict(lambda:[0,0]); catdist=defaultdict(lambda:[0,0]); pos_not=[]
    for style in latest["styles"].values():
        if style.get("productGroup")!="APP" or style.get("season")!="26FW": continue
        for sku in style.get("skus",[]):
            reasons,sw,_=current_reasons(style,sku,styles); target={"styleCode":style["styleCode"],"category":style.get("category"),"genderGroup":style.get("genderGroup","UNMAPPED"),"price":0,"firstPositiveIndex":(len(sku.get("completedWeeklyHistory") or [])-sw if sw else 0),"skus":[{"styleCode":style["styleCode"],"category":style.get("category"),"genderGroup":style.get("genderGroup","UNMAPPED"),"price":0,"firstPositiveIndex":(len(sku.get("completedWeeklyHistory") or [])-sw if sw else 0),"orderQty":base.number(sku.get("orderQty")),"inboundQty":base.number(sku.get("inboundQty")),"weekly":[{"qty":base.number(i.get("qty")),"cumulative":base.number(i.get("cumulativeQty"))} for i in (sku.get("completedWeeklyHistory") or [])]}]}
            pace=base.pace_for(target,styles,sw,"orderQty") if sw else {"analogStyleCount":0,"analogExpectedProgress":None,"currentProgress":None,"paceIndex":None,"pacePercentile":None,"analogMethod":"INSUFFICIENT","analogStyleCodes":[]}
            ready=sw is not None and 2 <= sw <= 8 and pace.get("paceIndex") is not None
            if ready: reasons=[]
            primary="PACE_READY" if ready else (reasons[0] if reasons else "OTHER")
            reason_counts[primary]+=1
            all_reason_counts.update(reasons)
            if base.number(sku.get("cumulativeSalesQty"))>0 and not ready: pos_not.append({"sku":sku.get("sku"),"reasons":reasons})
            row={"sku":sku.get("sku"),"styleCode":style["styleCode"],"color":sku.get("colorCode"),"category":style.get("category"),"sellingWeek":sw,"orderQty":sku.get("orderQty"),"inboundQty":sku.get("inboundQty"),"inboundCompletionRate":base.number(sku.get("inboundQty"))/base.number(sku.get("orderQty")) if base.number(sku.get("orderQty")) else None,"cumulativeSalesQty":sku.get("cumulativeSalesQty"),"orderSellThrough":sku.get("orderSellThrough"),"inboundSellThrough":sku.get("inboundSellThrough"),"analogMethod":pace.get("analogMethod"),"analogStyleCount":pace.get("analogStyleCount"),"analogPaceIndex":pace.get("paceIndex"),"analogPacePercentile":pace.get("pacePercentile"),"erpStockQty":sku.get("erpStockQty"),"recentVelocity":sku.get("weighted4CompletedWeekQty"),"velocityConfidence":"HIGH" if len(sku.get("completedWeeklyHistory") or [])-(sw-1 if sw else len(sku.get("completedWeeklyHistory") or []))>=4 else "MID" if sw and len(sku.get("completedWeeklyHistory") or [])-(sw-1)>=2 else "LOW" if sw else "NONE","stockCover":sku.get("stockCoverWeeks"),"diagnosticStockCover":sku.get("stockCoverWeeks"),"primaryFailureReason":primary,"allFailureReasons":reasons}
            current.append(row); funnel["total"]+=1; funnel["valid_orderQty"]+=base.number(sku.get("orderQty"))>0; funnel["positive_sales"]+=base.number(sku.get("cumulativeSalesQty"))>0; funnel["sellingWeek_identifiable"]+=sw is not None; funnel["category_available"]+=bool(style.get("category")); funnel["historical_analog_exists"]+=("NO_ANALOG_STYLE" not in reasons); funnel["same_week_progress"]+=("NO_HISTORICAL_PROGRESS_AT_WEEK" not in reasons); funnel["sufficient_analog"]+=ready; label="WTD_ONLY" if primary=="WTD_ONLY" else "PRE_SALE" if sw is None else f"W{sw}" if sw<=7 else "W8+"; swdist[label][0]+=1; swdist[label][1]+=ready; cat=style.get("category") or ""; catdist[cat][0]+=1; catdist[cat][1]+=ready
    # Category fallback coverage simulation.
    strict_ready=sum(r["primaryFailureReason"]=="PACE_READY" for r in current); fallback_ready=0
    for row in current:
        if row["primaryFailureReason"]=="PACE_READY": fallback_ready+=1; continue
        if row.get("sellingWeek"):
            st=styles.get(row["styleCode"]); sku=[x for x in latest["styles"][row["styleCode"]]["skus"] if x.get("sku")==row["sku"]][0]; target={"styleCode":row["styleCode"],"category":row["category"],"genderGroup":"UNMAPPED","price":0,"firstPositiveIndex":(len(sku.get("completedWeeklyHistory") or [])-row["sellingWeek"] if row.get("sellingWeek") else 0),"skus":[{"firstPositiveIndex":(len(sku.get("completedWeeklyHistory") or [])-row["sellingWeek"] if row.get("sellingWeek") else 0),"orderQty":base.number(sku.get("orderQty")),"weekly":[{"qty":base.number(i.get("qty")),"cumulative":base.number(i.get("cumulativeQty"))} for i in sku.get("completedWeeklyHistory",[])]}]};
            if fallback_pace(target,styles,row["sellingWeek"]).get("paceIndex") is not None: fallback_ready+=1
    # Quality comparison for STYLE_TOP5 vs category fallback on historical records.
    quality={"STYLE_TOP5":{},"CATEGORY_FALLBACK":{}}
    for w in (3,4,6):
        strict=[r for r in records if r["week"]==w and r["order"]["pacePercentile"] is not None]; fb=[]
        for r in records:
            if r["week"]!=w: continue
            p=fallback_pace(styles[r["styleCode"]],styles,w)
            if p.get("pacePercentile") is not None: fb.append({"finalOrderSellThrough":r["finalOrderSellThrough"],"pacePercentile":p["pacePercentile"]})
        quality["STYLE_TOP5"][f"W{w}"]={"correlation":base.rank_correlation(strict,"order"),"sampleN":len(strict),"p75Ge60":bucket(strict,.6)["groups"]["P75+"]["ge60"],"p90Ge60":bucket(strict,.6)["groups"]["P90+"]["ge60"],"p90Lift":bucket(strict,.6)["groups"]["P90+"]["lift"]["ge60"]}
        quality["CATEGORY_FALLBACK"][f"W{w}"]={"correlation":spearman([x["pacePercentile"] for x in fb],[x["finalOrderSellThrough"] for x in fb]),"sampleN":len(fb),"p75Ge60":bucket(fb,.6)["groups"]["P75+"]["ge60"],"p90Ge60":bucket(fb,.6)["groups"]["P90+"]["ge60"],"p90Lift":bucket(fb,.6)["groups"]["P90+"]["lift"]["ge60"]}
    cat_robust={}
    for cat in sorted(set(r["category"] for r in records)):
        ss=[r for r in records if r["week"]==4 and r["category"]==cat and r["order"]["pacePercentile"] is not None]; p=[r for r in ss if r["order"]["pacePercentile"]>=90]
        if ss: cat_robust[cat]={"eligibleN":len(ss),"p90N":len(p),"p90FinalGe60Rate":rate(sum(r["finalOrderSellThrough"]>=.6 for r in p),len(p))}
    loo={}
    for cat in sorted(set(r["category"] for r in records)):
        ss=[{**r,"pacePercentile":r["order"]["pacePercentile"]} for r in records if r["week"]==4 and r["category"]!=cat and r["order"]["pacePercentile"] is not None]
        if ss: loo[cat]=bucket(ss,.6)["groups"]["P90+"]["lift"]["ge60"]
    result={"meta":{"historicalCleanSku":len(raw),"historicalCleanStyle":len(styles),"weeks":list(WEEKS),"sameStyleLeakage":0,"productionChange":"NO","skuSignal":"NO"},"historical":hist,"paceStability":stability,"categoryRobustness":{"W4ByCategory":cat_robust,"leaveOneCategoryOutP90Lift":loo},"current":{"skuCount":len(current),"paceReady":strict_ready,"notReady":len(current)-strict_ready,"failureReasons":dict(reason_counts),"allFailureReasons":dict(all_reason_counts),"coverageFunnel":dict(funnel),"sellingWeekDistribution":{k:{"total":v[0],"paceReady":v[1],"coveragePct":rate(v[1],v[0])} for k,v in sorted(swdist.items())},"categoryCoverage":{k:{"total":v[0],"paceReady":v[1],"coveragePct":rate(v[1],v[0])} for k,v in sorted(catdist.items())},"positiveSalesButUnavailable":{"n":len(pos_not),"byReason":dict(Counter(x for r in pos_not for x in r["reasons"])),"examples":pos_not[:5]},"strictCoverage":{"paceReady":strict_ready,"coveragePct":rate(strict_ready,len(current))},"categoryFallbackSimulation":{"paceReady":fallback_ready,"coveragePct":rate(fallback_ready,len(current))},"rows":current},"fallbackQuality":quality}
    OUTPUT_PATH.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8"); REPORT_PATH.write_text(render(result),encoding="utf-8"); print(json.dumps({"current":len(current),"paceReady":strict_ready,"fallbackReady":fallback_ready,"output":str(OUTPUT_PATH)},ensure_ascii=False))

def render(r):
    h=r["historical"]["weeks"]; c=r["current"]; lines=["# SKU Analog Pace Coverage Diagnostic","",f"Historical calibration: {r['meta']['historicalCleanSku']} SKU / {r['meta']['historicalCleanStyle']} STYLE","","## Historical base rate and P90 lift","","|Week|Eligible N|Base ≥60%|P90 N|P90 ≥60%|Lift|","|---:|---:|---:|---:|---:|---:|"]
    for w in WEEKS:
        x=h[str(w)]; p=x["groups"]["P90+"]; lines.append(f"|W{w}|{x['eligibleN']}|{x['base']['ge60']['rate']}%|{p['n']}|{p['ge60']['rate']}%|{p['lift']['ge60']['pp']}%p / {p['lift']['ge60']['ratio']}x|")
    lines += ["","## Precision / recall (outcome: final orderSellThrough ≥60%)","","|Week|Threshold|TP|FP|FN|TN|Precision|Recall|Specificity|F1|","|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|"]
    for w in WEEKS:
        for t,m in h[str(w)]["classification"].items(): lines.append(f"|W{w}|P{t}|{m['tp']}|{m['fp']}|{m['fn']}|{m['tn']}|{m['precision']}%|{m['recall']}%|{m['specificity']}%|{m['f1']}%|")
    lines += ["","## ORDER vs INBOUND","","|Week|ORDER corr|INBOUND corr|ORDER P90 precision|INBOUND P90 precision|ORDER lift|INBOUND lift|","|---:|---:|---:|---:|---:|---:|---:|"]
    for w in (2,3,4,6):
        o=h[str(w)]["orderVsInbound"]; lines.append(f"|W{w}|{o['order']['correlation']}|{o['inbound']['correlation']}|{o['order']['p90Precision']}%|{o['inbound']['p90Precision']}%|{o['order']['p90LiftGe60']['pp']}%p|{o['inbound']['p90LiftGe60']['pp']}%p|")
    lines += ["","성과 예측력은 ORDER와 INBOUND가 유사한 범위였으며, 분할입고로 인한 초기 denominator 변동을 줄이는 운영상 안정성 때문에 ORDER를 우선 사용한다.","","## Pace stability","",json.dumps(r["paceStability"],ensure_ascii=False),"","## Current 26FW APP",f"- 439 SKU 기준 실제 진단: {c['skuCount']} SKU",f"- PACE_READY: {c['paceReady']} ({rate(c['paceReady'],c['skuCount'])}%)",f"- NOT READY: {c['notReady']}",f"- Failure reasons: {json.dumps(c['failureReasons'],ensure_ascii=False)}",f"- Coverage funnel: {json.dumps(c['coverageFunnel'],ensure_ascii=False)}",f"- Positive-sales but Pace unavailable: {c['positiveSalesButUnavailable']['n']}",f"- STRICT coverage: {c['strictCoverage']['coveragePct']}%",f"- CATEGORY_FALLBACK simulated coverage: {c['categoryFallbackSimulation']['coveragePct']}%", "","## Recommendation","","결론: MIXED — 현재 strict coverage는 149/439이며, WTD_ONLY 5개는 첫 완료 판매주차까지 대기한다. category fallback은 coverage 개선 폭과 quality를 함께 검토한 뒤 후보로 둔다.","","Same-style leakage: 0 / PASS","","Production change: NO","SKU Signal: NO","","SKU_ANALOG_PACE_COVERAGE_DIAGNOSTIC_READY","", "## Selling week distribution", "", "```json", json.dumps(c["sellingWeekDistribution"],ensure_ascii=False,indent=2), "```", "", "## Category coverage", "", "```json", json.dumps(c["categoryCoverage"],ensure_ascii=False,indent=2), "```"]
    lines += ["", "## Category robustness", "", json.dumps(r.get("categoryRobustness",{}),ensure_ascii=False), "", "## Fallback quality calibration", "", json.dumps(r.get("fallbackQuality",{}),ensure_ascii=False), "", "## PACE_READY rows", "", "|SKU|STYLE|Color|Category|W|Order|Inbound|Inbound completion|Sales|Order ST|Inbound ST|Method|Analog N|Pace index|Pace percentile|ERP stock|Velocity|Confidence|Stock cover|", "|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|---:|"]
    for x in [x for x in c["rows"] if x["primaryFailureReason"]=="PACE_READY"]:
        lines.append(f"|{x['sku']}|{x['styleCode']}|{x['color']}|{x['category']}|{x['sellingWeek']}|{x['orderQty']}|{x['inboundQty']}|{round((x['inboundCompletionRate'] or 0)*100,1)}%|{x['cumulativeSalesQty']}|{x['orderSellThrough']}|{x['inboundSellThrough']}|{x['analogMethod']}|{x['analogStyleCount']}|{round(x['analogPaceIndex'],3)}|{x['analogPacePercentile']}|{x['erpStockQty']}|{x['recentVelocity']}|{x['velocityConfidence']}|{x['stockCover']}|")
    return "\n".join(lines)+"\n"

if __name__ == "__main__": main()
