export type ImportType = "SALES" | "MARKET";

export const salesFieldLabels = {
  productCode: "Product Code",
  productName: "Product Name",
  periodDate: "Period Date",
  brand: "Brand",
  category: "Category",
  season: "Season",
  gender: "Gender",
  imageUrl: "Image URL",
  itemType: "Item Type",
  subItemType: "Sub Item Type",
  fit: "Fit",
  mainColor: "Main Color",
  subColor: "Sub Color",
  material: "Material",
  graphicType: "Graphic Type",
  detail: "Detail",
  style: "Style",
  salesQty: "Sales Qty",
  salesAmount: "Sales Amount",
  stockQty: "Stock Qty",
  orderQty: "Order Qty",
  sellThroughRate: "Sell Through",
  discountRate: "Discount Rate",
  normalSalesRate: "Normal Sales Rate",
  onlineSalesQty: "Online Sales Qty",
  storeSalesQty: "Store Sales Qty"
} as const;

export const marketFieldLabels = {
  source: "Source",
  externalProductId: "External Product ID",
  url: "URL",
  brand: "Brand",
  productName: "Product Name",
  periodDate: "Period Date",
  rank: "Rank",
  rankingCategory: "Ranking Category",
  audienceSegment: "Audience Segment",
  category: "Category",
  imageUrl: "Image URL",
  itemType: "Item Type",
  subItemType: "Sub Item Type",
  fit: "Fit",
  mainColor: "Main Color",
  subColor: "Sub Color",
  material: "Material",
  graphicType: "Graphic Type",
  detail: "Detail",
  style: "Style",
  gender: "Gender",
  price: "Price",
  salePrice: "Sale Price",
  discountRate: "Discount Rate",
  reviewCount: "Review Count",
  likeCount: "Like Count"
} as const;

export type SalesImportField = keyof typeof salesFieldLabels;
export type MarketImportField = keyof typeof marketFieldLabels;
export type ImportField = SalesImportField | MarketImportField;

export const importFieldAliases: Record<ImportType, Record<string, string[]>> = {
  SALES: {
    productCode: ["productcode", "product code", "style", "style no", "sku", "품번", "상품코드", "품목코드", "스타일", "스타일코드"],
    productName: ["productname", "product name", "product", "name", "상품명", "품명", "상품"],
    periodDate: ["perioddate", "period date", "date", "일자", "날짜", "기간", "주차", "기준일", "판매일"],
    brand: ["brand", "brandname", "브랜드"],
    category: ["category", "카테고리", "복종", "아이템군"],
    season: ["season", "시즌"],
    gender: ["gender", "성별", "라인"],
    imageUrl: ["imageurl", "image url", "image", "이미지", "이미지url"],
    itemType: ["itemtype", "item type", "아이템", "아이템타입", "대분류"],
    subItemType: ["subitemtype", "sub item type", "세부아이템", "상세아이템", "상품유형"],
    fit: ["fit", "핏"],
    mainColor: ["maincolor", "main color", "color", "컬러", "메인컬러", "색상"],
    subColor: ["subcolor", "sub color", "서브컬러"],
    material: ["material", "소재"],
    graphicType: ["graphictype", "graphic type", "graphic", "그래픽", "그래픽타입"],
    detail: ["detail", "디테일"],
    style: ["style", "스타일"],
    salesQty: ["salesqty", "sales qty", "qty", "판매수량", "실판매수량", "판매량", "수량"],
    salesAmount: ["salesamount", "sales amount", "amount", "매출", "매출액", "판매금액"],
    stockQty: ["stockqty", "stock qty", "stock", "재고", "재고수량", "현재고"],
    orderQty: ["orderqty", "order qty", "order", "발주", "발주수량", "입고수량"],
    sellThroughRate: ["sellthroughrate", "sell through", "sell-through", "판매율", "소진율"],
    discountRate: ["discountrate", "discount rate", "discount", "할인율"],
    normalSalesRate: ["normalsalesrate", "normal sales rate", "정상판매율", "정상율"],
    onlineSalesQty: ["onlinesalesqty", "online sales qty", "온라인판매", "온라인판매수량"],
    storeSalesQty: ["storesalesqty", "store sales qty", "매장판매", "오프라인판매", "매장판매수량"]
  },
  MARKET: {
    source: ["source", "site", "platform", "channel", "소스", "채널", "마켓", "플랫폼"],
    externalProductId: ["externalproductid", "external product id", "productid", "goodsno", "goods id", "상품id", "외부상품id"],
    url: ["url", "link", "producturl", "상품url", "상품링크", "링크"],
    brand: ["brand", "brandname", "브랜드"],
    productName: ["productname", "product name", "product", "name", "상품명", "품명", "상품"],
    periodDate: ["perioddate", "period date", "date", "일자", "날짜", "기간", "주차", "기준일"],
    rank: ["rank", "ranking", "순위", "현재순위", "랭킹"],
    rankingCategory: ["rankingcategory", "ranking category", "rankcategory", "rank category", "카테고리랭킹", "랭킹카테고리"],
    audienceSegment: ["audiencesegment", "audience segment", "target", "segment", "agegroup", "age group", "타겟", "세그먼트", "연령"],
    category: ["category", "카테고리", "복종", "아이템군"],
    imageUrl: ["imageurl", "image url", "image", "이미지", "이미지url"],
    itemType: ["itemtype", "item type", "아이템", "아이템타입", "대분류"],
    subItemType: ["subitemtype", "sub item type", "세부아이템", "상세아이템", "상품유형"],
    fit: ["fit", "핏"],
    mainColor: ["maincolor", "main color", "color", "컬러", "메인컬러", "색상"],
    subColor: ["subcolor", "sub color", "서브컬러"],
    material: ["material", "소재"],
    graphicType: ["graphictype", "graphic type", "graphic", "그래픽", "그래픽타입"],
    detail: ["detail", "디테일"],
    style: ["style", "스타일"],
    gender: ["gender", "성별", "라인"],
    price: ["price", "정가", "가격"],
    salePrice: ["saleprice", "sale price", "판매가", "할인가", "최종가"],
    discountRate: ["discountrate", "discount rate", "discount", "할인율"],
    reviewCount: ["reviewcount", "review count", "reviews", "리뷰", "리뷰수"],
    likeCount: ["likecount", "like count", "likes", "좋아요", "좋아요수"]
  }
};

export function fieldsForType(type: ImportType) {
  return type === "SALES" ? salesFieldLabels : marketFieldLabels;
}

export function suggestColumnMapping(type: ImportType, columns: string[]) {
  const aliases = importFieldAliases[type];
  return Object.fromEntries(
    Object.entries(aliases).map(([field, candidates]) => {
      const matched = columns.find((column) => candidates.includes(normalizeColumnName(column)));
      return [field, matched ?? ""];
    })
  ) as Record<string, string>;
}

function normalizeColumnName(value: string) {
  return value.trim().toLowerCase().replace(/[\s_./()\-]/g, "");
}
