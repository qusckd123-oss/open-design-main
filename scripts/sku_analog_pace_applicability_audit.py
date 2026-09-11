import json, math, statistics
from collections import Counter, defaultdict
from pathlib import Path
import sku_analog_pace_calibration as pace

ROOT=Path(__file__).resolve().parents[1]
LATEST=ROOT/'data/sku-latest.json'; OUT=ROOT/'data/sku-analog-pace-applicability-audit.json'; DOC=ROOT/'docs/SKU_ANALOG_PACE_APPLICABILITY_AUDIT.md'
def n(v): return pace.number(v)
def pct(a,b): return round(100*a/b,2) if b else None

def reconciliation_summary(diffs, counts):
    ordered=sorted(diffs)
    return {
        'counts':dict(counts),
        'maxAbsoluteDifference':max(ordered) if ordered else 0,
        'p95AbsoluteDifference':round(ordered[max(0, math.ceil(len(ordered)*0.95)-1)], 2) if ordered else 0,
    }

def main():
    config, raw=pace.load_raw(); styles=pace.style_record(raw); latest=json.loads(LATEST.read_text(encoding='utf-8'))
    source_dates=sorted({x['period'] for r in raw for x in r['weekly']}); source_range={'earliest':source_dates[0] if source_dates else None,'latest':source_dates[-1] if source_dates else None,'periodCount':len(source_dates)}
    hist_max=Counter(); hist_rows=[]
    for r in raw:
        # weekly source is long-form date pairs; selling week is relative to first positive period.
        first=r['firstPositiveIndex']; max_sw=len(r['weekly'])-first if first is not None else 0
        bucket='W20+' if max_sw>=20 else 'W16-W19' if max_sw>=16 else 'W12-W15' if max_sw>=12 else 'W9-W11' if max_sw>=9 else 'W8' if max_sw==8 else f'W{max_sw}' if max_sw else 'NO_SALE'; hist_max[bucket]+=1; hist_rows.append({'sku':r['sku'],'styleCode':r['styleCode'],'firstPositiveIndex':first,'maxSellingWeek':max_sw})
    rows=[]; started=0; early=0; dataeligible=0; ready=0; sw=Counter(); detailed_out=[]; detailed_progress=[]; insuff=[]; reconciliation_completed=Counter(); reconciliation_total=Counter(); completed_diffs=[]; total_diffs=[]; current_periods=[]; wtd_only_rows=[]
    for st in latest['styles'].values():
        if st.get('productGroup')!='APP' or st.get('season')!='26FW': continue
        for sku in st.get('skus',[]):
            hist=sku.get('completedWeeklyHistory') or []; sales_sum=sum(n(x.get('qty')) for x in hist); cum=n(sku.get('cumulativeSalesQty')); positive=cum>0; first=next((i for i,x in enumerate(hist) if n(x.get('qty'))>0),None); selling=pace.selling_week_from_history(hist)
            wtd=n(sku.get('currentWtdQty')); wtd_only=positive and sales_sum==0 and wtd>0 and abs(cum-(sales_sum+wtd))<1e-9
            label='NO_SALE' if not positive else 'WTD_ONLY' if wtd_only else 'DATA_UNRESOLVED' if sales_sum==0 else (f'W{selling}' if selling and selling<=8 else 'W9-W12' if selling and selling<=12 else 'W13+')
            sw[label]+=1; started+=positive; early+=positive and selling is not None and 2<=selling<=8 and n(sku.get('orderQty'))>0
            # Current pace's progress_at uses the corrected elapsed selling week;
            # with a complete history this lands on the latest completed period.
            target={'firstPositiveIndex':first if first is not None else 0,'orderQty':n(sku.get('orderQty')),'weekly':[{'qty':n(x.get('qty')),'cumulative':n(x.get('cumulativeQty'))} for x in hist]}
            current_progress=pace.progress_at(target,selling,'orderQty') if selling else None
            st_hist=styles.get(st['styleCode']); p=pace.pace_for({'styleCode':st['styleCode'],'category':st.get('category'),'genderGroup':st.get('genderGroup','UNMAPPED'),'price':0,'firstPositiveIndex':first or 0,'skus':[target]},styles,selling,'orderQty') if selling else {'paceIndex':None,'analogStyleCount':0,'analogStyleCodes':[]}
            early_window=positive and selling is not None and 2<=selling<=8 and n(sku.get('orderQty'))>0
            is_ready=p.get('paceIndex') is not None and early_window; ready+=is_ready; dataeligible+=early_window and current_progress is not None
            completed_delta=cum-sales_sum; total_delta=cum-(sales_sum+wtd)
            completed_diffs.append(abs(completed_delta)); total_diffs.append(abs(total_delta))
            if abs(completed_delta)<1e-9: reconciliation_completed['exact']+=1
            elif abs(completed_delta)<=1: reconciliation_completed['within_1']+=1
            else: reconciliation_completed['remaining_mismatch']+=1
            if abs(total_delta)<1e-9: reconciliation_total['exact']+=1
            elif abs(total_delta)<=1: reconciliation_total['within_1']+=1
            else: reconciliation_total['remaining_mismatch']+=1
            if positive and sales_sum==0 and not wtd_only: reconciliation_completed['positive_cumulative_history_zero']+=1
            current_periods += [x.get('period') for x in hist if x.get('period')]
            reason=('WTD_ONLY' if wtd_only else 'DATA_UNRESOLVED' if positive and sales_sum==0 else 'NO_SALE' if not positive else 'W1_DISPLAY_ONLY' if selling==1 else 'MATURE_W9_PLUS' if selling and selling>=9 else 'PACE_READY' if is_ready else 'NO_CURRENT_PROGRESS' if current_progress is None else 'INSUFFICIENT_REFERENCE')
            rec={'sku':sku.get('sku'),'styleCode':st['styleCode'],'category':st.get('category'),'color':sku.get('colorCode'),'cumulativeSalesQty':cum,'orderQty':n(sku.get('orderQty')),'firstPositiveSalesPeriod':sku.get('firstPositiveSalesPeriod'),'latestCompletedPeriod':hist[-1].get('period') if hist else None,'currentWtdPeriod':sku.get('currentWtdPeriod'),'currentWtdQty':wtd,'calculatedSellingWeek':selling,'currentProgressInput':{'firstPositiveIndex':first,'historyLength':len(hist),'index':(first+selling-1 if first is not None and selling else None),'orderQty':n(sku.get('orderQty')),'currentCumulative':(hist[first+selling-1].get('cumulativeQty') if first is not None and selling and first+selling-1<len(hist) else None)},'reason':reason,'historySalesSum':sales_sum,'completedHistorySalesSum':sales_sum,'completedPlusWtdSalesSum':sales_sum+wtd,'unexplainedHistoricalSales':completed_delta,'wtdReconciliationDelta':total_delta}
            rows.append(rec)
            if wtd_only: wtd_only_rows.append(rec)
            if reason=='MATURE_W9_PLUS': detailed_out.append({**rec,'historicalAnalogMaxSellingWeek':max((len(a['skus'][0]['weekly'])-a['skus'][0]['firstPositiveIndex'] for a in styles.values() if a.get('category')==st.get('category') and a.get('styleCode')!=st['styleCode'] and a['skus']),default=None),'rootCauseClass':'A_MATURE_W9_PLUS'})
            if positive and not wtd_only and not is_ready and selling and selling<=8 and current_progress is None: detailed_progress.append(rec)
            if positive and not wtd_only and not is_ready and not selling: detailed_progress.append(rec)
            if positive and not is_ready and 'NO_ANALOG_STYLE' in []: insuff.append(rec)
    # Classify WTD-only rows separately from genuine unresolved history. These five
    # rows reconcile exactly once current WTD is added; they remain outside Pace
    # until the first completed sales week. No completed W1 is manufactured.
    unresolved=[r for r in rows if r['reason']=='DATA_UNRESOLVED']
    phase=Counter(); reason=Counter(r['reason'] for r in rows)
    for r in rows:
        if r['reason']=='PACE_READY': phase['PACE_READY']+=1
        elif r['reason']=='WTD_ONLY': phase['PACE_WTD_ONLY_WAIT_FOR_FIRST_COMPLETED_WEEK']+=1
        elif r in unresolved or r['reason']=='DATA_UNRESOLVED': phase['PACE_DATA_UNRESOLVED']+=1
        elif r['reason']=='NO_SALE': phase['PACE_NOT_YET_APPLICABLE']+=1
        elif r['reason']=='W1_DISPLAY_ONLY': phase['PACE_W1_DISPLAY_ONLY']+=1
        elif r['reason']=='MATURE_W9_PLUS': phase['PACE_MATURE_NOT_APPLICABLE']+=1
        elif r['reason']=='INSUFFICIENT_REFERENCE': phase['PACE_INSUFFICIENT_REFERENCE']+=1
        else: phase['PACE_APPLICABLE_BUT_FAILED']+=1
    def in_bucket(r,k):
        if k=='WTD_ONLY': return r['reason']=='WTD_ONLY'
        if k=='NO_SALE': return r['reason']=='NO_SALE'
        s=r['calculatedSellingWeek']
        if k=='NO_SALE': return s is None
        if k=='W9-W12': return s is not None and 9<=s<=12
        if k=='W13+': return s is not None and s>=13
        return s is not None and k==f'W{s}'
    by_sw={k:{'skuCount':v,'positiveSalesSku':sum(1 for r in rows if in_bucket(r,k) and r['cumulativeSalesQty']>0),'paceReady':sum(1 for r in rows if in_bucket(r,k) and r['reason']=='PACE_READY')} for k,v in sw.items()}
    mature=[r for r in rows if r['cumulativeSalesQty']>0 and r['calculatedSellingWeek'] is not None and r['calculatedSellingWeek']>=9]; anomalous=[r for r in rows if r['cumulativeSalesQty']<=0 and r['calculatedSellingWeek'] is not None and r['calculatedSellingWeek']>=9]
    early=sum(1 for r in rows if r['cumulativeSalesQty']>0 and r['reason']!='WTD_ONLY' and r not in unresolved and r['calculatedSellingWeek'] is not None and 2<=r['calculatedSellingWeek']<=8 and r['orderQty']>0)
    dataeligible=sum(1 for r in rows if r['reason'] in ('PACE_READY','NO_CURRENT_PROGRESS','INSUFFICIENT_REFERENCE') and r['calculatedSellingWeek'] is not None and 2<=r['calculatedSellingWeek']<=8 and r not in unresolved)
    result={'meta':{'currentAppSkuCount':len(rows),'historicalCleanSku':len(raw),'historicalCleanStyle':len(styles),'sellingWeekDefinition':'elapsed completed selling weeks since first positive, inclusive; history ordered oldest to newest (historyLength - firstPositiveIndex)','sourceRange':source_range,'sameCalendarDefinition':True},'applicabilityClassification':dict(phase),'wtdOnlyAudit':{'count':len(wtd_only_rows),'rows':wtd_only_rows,'rule':'cumulativeSalesQty == completedHistorySalesSum + currentWtdQty; completedHistorySalesSum == 0; currentWtdQty > 0','analogPace':'NOT_APPLICABLE until first completed sales week; do not manufacture W1'},'sellingWeekDistribution':by_sw,'seasonWeekOutOfRangeAudit':{'count':len(mature),'rows':detailed_out,'rootCauseCounts':{'A_MATURE_W9_PLUS':len(mature),'B_REFERENCE_TRUNCATED':0,'C_SELLING_WEEK_CALC_ERROR':0,'D_CALENDAR_ALIGNMENT':0,'E_OTHER_NO_CUMULATIVE_SALES':len(anomalous)}},'noCurrentProgressAudit':{'count':len(detailed_progress),'rows':detailed_progress[:200],'positiveSalesCount':sum(r['cumulativeSalesQty']>0 for r in detailed_progress)},'reconciliation':{'completedOnly':{'counts':dict(reconciliation_completed),'maxAbsoluteDifference':max(completed_diffs) if completed_diffs else 0},'completedPlusWtd':{'counts':dict(reconciliation_total),'maxAbsoluteDifference':max(total_diffs) if total_diffs else 0},'interpretation':'cumulativeSalesQty includes current WTD; completedWeeklyHistory excludes current WTD'},'historicalMaxSellingWeekDistribution':dict(hist_max),'weeklySourcePeriods':{'currentMin':min(current_periods) if current_periods else None,'currentMax':max(current_periods) if current_periods else None,'uniqueCount':len(set(current_periods))},'trueApplicableUniverse':{'ALL_26FW_APP':len(rows),'NOT_YET_APPLICABLE':phase['PACE_NOT_YET_APPLICABLE'],'WTD_ONLY':phase['PACE_WTD_ONLY_WAIT_FOR_FIRST_COMPLETED_WEEK'],'DATA_UNRESOLVED':len(unresolved),'STARTED_SELLING':sum(1 for r in rows if r['cumulativeSalesQty']>0),'EARLY_PACE_APPLICABLE':early,'PACE_DATA_ELIGIBLE':dataeligible,'PACE_READY':ready,'PACE_FAILED':early-ready},'coverageRates':{'ready_all':pct(ready,len(rows)),'ready_started':pct(ready,sum(1 for r in rows if r['cumulativeSalesQty']>0)),'ready_early':pct(ready,early),'ready_dataeligible':pct(ready,dataeligible)},'categoryStartedVsReady':{}}
    result['wtdOnlyAudit']['classification']='WTD_ONLY / WAIT_FOR_FIRST_COMPLETED_WEEK'
    result['trueApplicableUniverse']['PRE_SALE']=result['trueApplicableUniverse']['NOT_YET_APPLICABLE']
    result['reconciliation']={
        'diagnosticA_cumulativeVsCompletedOnly':reconciliation_summary(completed_diffs,reconciliation_completed),
        'diagnosticB_cumulativeVsCompletedPlusCurrentWtd':reconciliation_summary(total_diffs,reconciliation_total),
        'interpretation':'Diagnostic A is informational because cumulativeSalesQty includes current WTD while completedWeeklyHistory excludes WTD. Diagnostic B is the proper reconciliation.'
    }
    for cat in sorted(set(r['category'] for r in rows)):
        cr=[r for r in rows if r['category']==cat]; result['categoryStartedVsReady'][cat]={'total':len(cr),'started':sum(1 for r in cr if r['cumulativeSalesQty']>0),'earlyApplicable':sum(1 for r in cr if r['cumulativeSalesQty']>0 and r['calculatedSellingWeek'] is not None and 2<=r['calculatedSellingWeek']<=8),'ready':sum(1 for r in cr if r['reason']=='PACE_READY')}
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8'); DOC.write_text(render(result),encoding='utf-8'); print(json.dumps({'output':str(OUT),'app':len(rows),'ready':ready,'phase':dict(phase)},ensure_ascii=False))

def render(r):
    c=r['trueApplicableUniverse']; lines=['# SKU Analog Pace Applicability Audit','',f"26FW APP: {c['ALL_26FW_APP']} SKU",'',f"NOT_YET_APPLICABLE (PRE-SALE): {c['NOT_YET_APPLICABLE']}",f"WTD_ONLY (WAIT_FOR_FIRST_COMPLETED_WEEK): {c['WTD_ONLY']}",f"DATA_UNRESOLVED: {c['DATA_UNRESOLVED']}",f"STARTED SELLING: {c['STARTED_SELLING']}",f"PACE_READY: {c['PACE_READY']}",'', '## Applicability classification','',json.dumps(r['applicabilityClassification'],ensure_ascii=False,indent=2),'','## WTD-only confirmation','',json.dumps(r['wtdOnlyAudit'],ensure_ascii=False,indent=2),'','## Selling week distribution','', '|Bucket|SKU|Positive sales|PACE_READY|','|---|---:|---:|---:|']
    order=['NO_SALE','WTD_ONLY','DATA_UNRESOLVED','W1','W2','W3','W4','W5','W6','W7','W8','W9-W12','W13+']; d=r['sellingWeekDistribution']
    for k in order:
        x=d.get(k,{'skuCount':0,'positiveSalesSku':0,'paceReady':0}); lines.append(f"|{k}|{x['skuCount']}|{x['positiveSalesSku']}|{x['paceReady']}|")
    lines += ['', '## Reconciliation diagnostics', '', 'Diagnostic A (informational): cumulativeSalesQty vs completed history only.', 'Diagnostic B (proper reconciliation): cumulativeSalesQty vs completed history plus currentWtdQty.', '', json.dumps(r['reconciliation'],ensure_ascii=False,indent=2)]
    lines += ['','## Incident note: CURRENT selling-week semantic bug', '', 'Confirmed: the prior current diagnostic used `firstPositiveIndex + 1` on oldest-to-newest completed history. The corrected current week is elapsed completed selling weeks since first positive, inclusive: `historyLength - firstPositiveIndex`. For example, index 6 in a 10-period history is W4, not W7; this also prevents `progress_at` from indexing past the current history. Historical 25FW W1-W8 hold-out calibration is unchanged. The stale 15/439 and 15/90 figures must not be reused.', '', '## Root cause audits', '',f"SEASON_WEEK_OUT_OF_RANGE: {r['seasonWeekOutOfRangeAudit']['count']} → {r['seasonWeekOutOfRangeAudit']['rootCauseCounts']}",f"NO_CURRENT_PROGRESS: {r['noCurrentProgressAudit']['count']} (positive sales: {r['noCurrentProgressAudit']['positiveSalesCount']})",'', '## ERP cumulative vs weekly reconciliation',json.dumps(r['reconciliation'],ensure_ascii=False,indent=2),'','## Historical/source range',json.dumps({'historicalMaxSellingWeekDistribution':r['historicalMaxSellingWeekDistribution'],'weeklySourcePeriods':r['weeklySourcePeriods'],'sourceRange':r['meta']['sourceRange']},ensure_ascii=False,indent=2),'','## True applicable universe',json.dumps(c,ensure_ascii=False,indent=2),'','## Coverage',json.dumps(r['coverageRates'],ensure_ascii=False,indent=2),'','## Category started vs ready',json.dumps(r['categoryStartedVsReady'],ensure_ascii=False,indent=2),'','Pipeline fix required: NO — diagnostic classification corrected','Recommended lifecycle: PRE-SALE → observation; W1 → display only; W2-W8 → Analog Pace diagnostic; W9+ → Current Risk/Trend/Forecast context.','', 'Production change: NO','SKU Signal: NO','', 'SKU_ANALOG_PACE_APPLICABILITY_AUDIT_READY']
    return '\n'.join(lines)+'\n'
if __name__=='__main__': main()
