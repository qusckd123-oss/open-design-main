import { attributeKoreanLabel, composeBundleName, specificItemKoreanLabel } from "@/lib/korean-labels";

type SignalAttribute = {
  type: string;
  value: string;
};

export type SignalInterpretationInput = {
  specificItem: string;
  directAttributes: SignalAttribute[];
  bundleArticlePresence: number;
  bundleSourceSpread: number;
  independentEvidenceClusterCount: number;
};

export type SignalInterpretation = {
  signalName: string;
  observedFact: string;
  unknowns: string[];
  planningQuestion: string;
};

// CurrentSignalHero-only presentation fallbacks for live specificItem values
// that predate the shared Korean label map. Keeping them local prevents this
// focused change from altering the six secondary cards or any other route.
const leadSignalItemLabels: Record<string, string> = {
  CARDIGAN: "가디건",
  COAT: "코트",
  DENIM_JACKET: "데님 재킷",
  DOWN_JACKET: "다운 재킷",
  SHIRT: "셔츠",
  SHORTS: "쇼츠",
  SKIRT: "스커트",
  SWEATSHIRT: "스웨트셔츠",
  VARSITY_JACKET: "바시티 재킷",
  VEST: "베스트"
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function labelsForType(attributes: SignalAttribute[], type: string): string[] {
  return unique(attributes.filter((attribute) => attribute.type === type).map((attribute) => attributeKoreanLabel(attribute.value)));
}

function detailVariationUnknown(attributes: SignalAttribute[]): string | null {
  const details = attributes.filter((attribute) => attribute.type === "DETAIL");
  if (details.length === 0) return null;

  const values = new Set(details.map((attribute) => attribute.value));
  if (values.size === 1 && values.has("STRIPE")) return "스트라이프의 굵기·간격·방향";
  if (values.size === 1 && values.has("CHECK")) return "체크의 크기·배열";
  return `${unique(details.map((attribute) => attributeKoreanLabel(attribute.value))).join("·")}의 크기·배치 방식`;
}

function composeLeadSignalName(specificItem: string, attributes: SignalAttribute[]): string {
  const composed = composeBundleName(specificItem, attributes);
  const sharedLabel = specificItemKoreanLabel(specificItem);
  if (sharedLabel) return composed;

  const localLabel = leadSignalItemLabels[specificItem];
  if (!localLabel) return composed;
  const rawItem = specificItem.replaceAll("_", " ");
  return composed === rawItem ? localLabel : composed.endsWith(` ${rawItem}`) ? `${composed.slice(0, -rawItem.length)}${localLabel}` : composed;
}

/**
 * Presentation-only interpretation of a verified attribute bundle.
 *
 * FACT uses bundle-level direct-relation evidence only. UNKNOWN lists either
 * an execution detail that the observed attribute value does not establish,
 * or an important dimension absent from the exact bundle. PLANNING QUESTION
 * is deliberately a question for a human, never a recommendation or forecast.
 */
export function buildSignalInterpretation(input: SignalInterpretationInput): SignalInterpretation {
  const signalName = composeLeadSignalName(input.specificItem, input.directAttributes);
  const observedFact =
    `“${signalName}”의 아이템·속성 직접 관계가 ${input.bundleArticlePresence}개 기사에서 확인됐습니다. ` +
    `서로 다른 사례 기준 ${input.independentEvidenceClusterCount}건이 ${input.bundleSourceSpread}개 매체에서 관측됐습니다.`;

  const types = new Set(input.directAttributes.map((attribute) => attribute.type));
  const unknowns: string[] = [];
  const detailUnknown = detailVariationUnknown(input.directAttributes);
  if (detailUnknown) unknowns.push(detailUnknown);

  const materialLabels = labelsForType(input.directAttributes, "MATERIAL");
  if (materialLabels.length > 0) unknowns.push(`${materialLabels.join("·")}의 중량·조직·가공`);

  const colorLabels = labelsForType(input.directAttributes, "COLOR");
  if (colorLabels.length > 0) unknowns.push(`${colorLabels.join("·")}의 톤·배색·적용 면적`);

  const styleLabels = labelsForType(input.directAttributes, "STYLE");
  if (styleLabels.length > 0) unknowns.push(`${styleLabels.join("·")} 무드의 구체적인 착장 방식`);

  const silhouetteLabels = labelsForType(input.directAttributes, "SILHOUETTE");
  if (silhouetteLabels.length > 0) unknowns.push(`${silhouetteLabels.join("·")} 실루엣의 구체적인 비율·길이`);
  else unknowns.push("실루엣과 핏");

  if (!types.has("DETAIL")) unknowns.push("세부 디자인 구성");
  if (!types.has("MATERIAL") && !types.has("COLOR")) unknowns.push("소재·컬러 구성");
  else {
    if (!types.has("MATERIAL")) unknowns.push("소재와 조직감");
    if (!types.has("COLOR")) unknowns.push("컬러 구성");
  }
  if (!types.has("STYLE")) unknowns.push("스타일링 무드");
  unknowns.push("판매·수요 반응");

  return {
    signalName,
    observedFact,
    unknowns: unique(unknowns),
    planningQuestion: `“${signalName}” 조합을 다음 단계 상품 조사 대상으로 볼 것인가?`
  };
}
