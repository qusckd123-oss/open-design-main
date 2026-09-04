/**
 * WACKYWILLY 27SS 품평 Google Form 카테고리별 자동 생성 스크립트
 *
 * 전체 182개 품번을 한 번에 만들면 Apps Script 실행 제한에 걸릴 수 있어
 * 카테고리별 폼을 하나씩 생성하도록 분리한 버전입니다.
 *
 * 사용법:
 * 1. Code.gs 전체를 이 파일 내용으로 교체
 * 2. 저장
 * 3. 상단 함수 선택에서 create_UNISEX_JK 같은 카테고리 함수를 하나 선택
 * 4. 실행
 * 5. 실행 로그의 RESPONDENT_URL을 복사
 * 6. 다음 카테고리 함수도 같은 방식으로 반복
 */

const STYLE_DATA = [
  {
    "line": "UNISEX",
    "category": "JK",
    "styleNo": "SWA2701JK001",
    "itemName": "그래픽 면 바시티 자켓",
    "imageUrl": "",
    "rrp": 239000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "JK",
    "styleNo": "SWA2701JK002",
    "itemName": "체크 후드 자켓",
    "imageUrl": "",
    "rrp": 159000,
    "fit": "스탠다드핏",
    "description": "면 100%체크 원단 활용한 후드집업 자켓\n밑단 스트링 실루엣 조절, 소매단 벨크로 실루엣 조절 가능\n투웨이 앞지퍼\n앞판 와키윌리 IP활용한 자수 아트웍 포인트"
  },
  {
    "line": "UNISEX",
    "category": "JK",
    "styleNo": "SWA2701JK003",
    "itemName": "빈티지 코튼 후드 점퍼(워싱)_충전재O (30~40수)",
    "imageUrl": "",
    "rrp": 159000,
    "fit": "오버핏",
    "description": "면40수 원단 활용 가먼트 솔트 워싱 한 자연스럽고 빈티지한 컬러감 포인트\n앞판 와키윌리 런닝스티치 자수 포인트\n투웨이 앞지퍼\n안감 체크 원단 포인트\n"
  },
  {
    "line": "UNISEX",
    "category": "JK",
    "styleNo": "SWA2701JK004",
    "itemName": "컬러배색 패커블 바람막이",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "JK",
    "styleNo": "SWA2701JK005",
    "itemName": "빈티지 코튼 카라 자켓",
    "imageUrl": "",
    "rrp": 159000,
    "fit": "오버핏",
    "description": "10수 피그먼트 옥스포트 원단활용한 코치자켓 가먼트 워싱을하여 자연스러운 \n빈티지한 컬러감 다양한 디스트로이드 워싱을 주어 안감 포인트 컬러가 노출되는 디자인\n투웨이 앞지퍼"
  },
  {
    "line": "UNISEX",
    "category": "JK",
    "styleNo": "SWA2701JK006",
    "itemName": "디스트로이드 데님후드집업",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "오버핏",
    "description": "11.7OZ 데님원단 활용  한 후드집업 자켓\n투웨이 앞지퍼\n다양한 디스트로이드 워싱을 주어 안감 포인트 컬러가 노출되는 디자인\n앞판 심플한 두줄워드마크 뒤판 엠보 고주파 활용한 볼륨감 있는 아트웍 포인트"
  },
  {
    "line": "UNISEX",
    "category": "JK",
    "styleNo": "SWA2702JK001",
    "itemName": "하이넥 경량 윈드브레이커 집업",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SH",
    "styleNo": "SWA2701SH001",
    "itemName": "샴브레이 데님라이크 오버사이즈 셔츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "오버핏",
    "description": "쿨맥스 원사 활용한 8OZ 두께감의 인디고 원단\n앞판 가슴 포켓 두줄 워드마크 포인트 \n포켓 옆 옐로우 사이드 포인트라벨"
  },
  {
    "line": "UNISEX",
    "category": "SH",
    "styleNo": "SWA2701SH002",
    "itemName": "빈티지 스트라이프 오버셔츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SH",
    "styleNo": "SWA2701SH003",
    "itemName": "빈티지 체크 오버셔츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SH",
    "styleNo": "SWA2701SH004",
    "itemName": "시어서커 체크 후드 셔츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SH",
    "styleNo": "SWA2701SH005",
    "itemName": "라운지 시리즈 긴팔 셔츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": "면100% 이중직 체크/스트라이프 원단을 활용해 믹스 블럭 매치 한 오버핏셔츠"
  },
  {
    "line": "UNISEX",
    "category": "SS",
    "styleNo": "SWA2702SS001",
    "itemName": "패턴 반팔셔츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SS",
    "styleNo": "SWA2702SS002",
    "itemName": "다이마루 반팔셔츠",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SS",
    "styleNo": "SWA2702SS003",
    "itemName": "그래픽 패턴 반팔셔츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SS",
    "styleNo": "SWA2702SS004",
    "itemName": "체크 반팔 셔츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SS",
    "styleNo": "SWA2702SS005",
    "itemName": "이지데님반팔셔츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": "쿨맥스 원사 활용한 8OZ 두께감의 인디고 원단\n앞판 가슴 포켓 두줄 워드마크 포인트 \n포켓 옆 옐로우 사이드 포인트라벨"
  },
  {
    "line": "UNISEX",
    "category": "SS",
    "styleNo": "SWA2702SS006",
    "itemName": "라운지 시리즈 반팔 셔츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "오버핏",
    "description": "시원한 터치감의 스트라이프 원단을 활용한 라운지웨어  셋업물 \n오픈카라 반팔셔츠 /왼쪽 가슴 포켓 와키윌리 아트웍"
  },
  {
    "line": "UNISEX",
    "category": "CD",
    "styleNo": "SWA2701CD001",
    "itemName": "워드로고 라운드 스웻 가디건",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "CD",
    "styleNo": "SWA2701CD002",
    "itemName": "전판 그래픽 브이넥 가디건",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "CD",
    "styleNo": "SWA2701CD003",
    "itemName": "스카시 조직 니트 후드 집업",
    "imageUrl": "",
    "rrp": 129000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "CD",
    "styleNo": "SWA2702CD004",
    "itemName": "스트라이프 반팔 니트 가디건",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "KT",
    "styleNo": "SWA2702KT001",
    "itemName": "카라 스트라이프 반팔 니트",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "CR",
    "styleNo": "SWA2701CR001",
    "itemName": "소로나 스몰 로고 맨투맨",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "CR",
    "styleNo": "SWA2701CR002",
    "itemName": "디스트레스드 와플 라이닝 맨투맨",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "크롭 오버",
    "description": "면100 400G헤비쭈리/ 가먼트 다잉후 블리치 워싱(그라데이션) /\n부분 블리치 스플래터 워시 포인트(락스튄 효과)\n왼쪽가슴 라인키키 직자수 포인트"
  },
  {
    "line": "UNISEX",
    "category": "CR",
    "styleNo": "SWA2701CR003",
    "itemName": "데님 라이크 스몰 로고 맨투맨",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "CR",
    "styleNo": "SWA2701CR004",
    "itemName": "HOODIE 로고 맨투맨",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "세미 크롭 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "CR",
    "styleNo": "SWA2701CR005",
    "itemName": "전판 그래픽 맨투맨",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "크롭 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "CR",
    "styleNo": "SWA2701CR006",
    "itemName": "빈티지 카툰 그래픽 블리치드 맨투맨",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HD",
    "styleNo": "SWA2701HD001",
    "itemName": "디스트레스드 와플 라이닝 후드",
    "imageUrl": "",
    "rrp": 149000,
    "fit": "세미 크롭 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HD",
    "styleNo": "SWA2701HD002",
    "itemName": "타이포 그래픽 후드",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HD",
    "styleNo": "SWA2701HD003",
    "itemName": "그래피티 스프레이 후드",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HD",
    "styleNo": "SWA2701HD004",
    "itemName": "소로나 스몰 로고 후드",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ001",
    "itemName": "디스트레스드 와플 라이닝 후드 집업",
    "imageUrl": "",
    "rrp": 169000,
    "fit": "세미 크롭 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ002",
    "itemName": "피그먼트 블리치드 후드집업",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "크롭 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ003",
    "itemName": "와플 키키 라인 후드 집업",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "크롭 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ004",
    "itemName": "카모시리즈 후드 집업(추가룸)",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ005",
    "itemName": "데님라이크 후드 집업",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ006",
    "itemName": "와플 전판 그래픽 후드 집업",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "크롭오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ007",
    "itemName": "타이포 그래픽 후드 집업",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ009",
    "itemName": "키키 심볼 트랙 자켓",
    "imageUrl": "",
    "rrp": 129000,
    "fit": "세미오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "HZ",
    "styleNo": "SWA2701HZ011",
    "itemName": "소로나 스몰 로고 후드 집업",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT001",
    "itemName": "베이직 스몰 로고 롱슬리브",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT002",
    "itemName": "레이스업 스트라이프 롱슬리브",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT003",
    "itemName": "풋볼 져지 롱슬리브",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT004",
    "itemName": "럭비 스몰 로고 롱슬리브",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT005",
    "itemName": "와플 헨리넥 롱슬리브",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "슬림",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT006",
    "itemName": "레이어드 롱슬리브",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT007",
    "itemName": "멀티 스트라이프 롱슬리브 1",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "세미오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT008",
    "itemName": "멀티 스트라이프 롱슬리브 2",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT009",
    "itemName": "그래피티 롱슬리브",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "LT",
    "styleNo": "SWA2701LT011",
    "itemName": "베이직 스트라이프 롱슬리브",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST001",
    "itemName": "베이직 스몰 로고 반팔티셔츠",
    "imageUrl": "",
    "rrp": 39000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST029",
    "itemName": "(COOL) 폰테 키키 로고 반팔티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST002",
    "itemName": "타이다잉 스트라이프 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST003",
    "itemName": "빈티지 카툰 링거 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "슬림",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST004",
    "itemName": "카모시리즈 반팔 티셔츠(추가룸)",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST005",
    "itemName": "데님 라이크 스몰 로고 반팔티셔츠",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST006",
    "itemName": "앞판 그래픽 스트라이프 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST007",
    "itemName": "멀티 스트라이프 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "슬림",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST008",
    "itemName": "앞판 타이포 스트라이프 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "세미 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST009",
    "itemName": "키키 심볼 트랙 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "세미오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST030",
    "itemName": "링거 반팔 티셔츠 2PACK",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST011",
    "itemName": "전판 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "크롭 오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST012",
    "itemName": "뒤판 그래픽 - 타이포 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST013",
    "itemName": "뒤판 그래픽 - 타이포+캐릭터 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST014",
    "itemName": "캐릭터 타이포 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "슬림",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST015",
    "itemName": "앞판 그래픽 - 타이포+캐릭터 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST016",
    "itemName": "뒤판 타이포 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST017",
    "itemName": "슬럽 앞판 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST018",
    "itemName": "베이직 스트라이프 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST019",
    "itemName": "슬럽 앞판 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "슬림",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST021",
    "itemName": "젤리 코어 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST022",
    "itemName": "'I LOVE' 빈티지 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST023",
    "itemName": "빈티지 카툰 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "레귤러",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "ST",
    "styleNo": "SWA2702ST024",
    "itemName": "그래피티 스프레이 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "오버",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT001",
    "itemName": "디스트레스드 와이드 스웻 팬츠",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT002",
    "itemName": "피그먼트 블리치드 커브드 스웻 팬츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "커브드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT003",
    "itemName": "와플 멀티 그래픽 와이드 팬츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT004",
    "itemName": "카모 와이드 스웻 팬츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "세미와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT005",
    "itemName": "전판 그래픽 와이드 스웻  팬츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT006",
    "itemName": "데님 라이크 와이드 스웻 팬츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "세미와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT008",
    "itemName": "그래피티 스프레이 와이드 스웻 팬츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT009",
    "itemName": "키키 심볼 와이드 트랙 팬츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT011",
    "itemName": "라이트온스 이지 데님 팬츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT012",
    "itemName": "빈티지 워싱 데님 와이드 팬츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT013",
    "itemName": "면 카고 와이드 팬츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT014",
    "itemName": "면 커브드 팬츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT015",
    "itemName": "라이트 온스 파라수트_워싱물",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT016",
    "itemName": "라운지 시리즈 팬츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT017",
    "itemName": "부츠컷 데님 팬츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "PT",
    "styleNo": "SWA2701PT018",
    "itemName": "스몰 로고 리얼 와이드 스웻 팬츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO001",
    "itemName": "디스트레스드 와플 포켓 스웻 쇼츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "세미와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO002",
    "itemName": "와이드 카고 스웻 쇼츠",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO003",
    "itemName": "데님라이크 리얼 와이드 스웻 숏팬츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "와이드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO004",
    "itemName": "카모시리즈 와이드 스웻 쇼츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "와이드(롱)",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO005",
    "itemName": "라운지 시리즈 숏 팬츠",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO006",
    "itemName": "그래피티 스프레이 스웻 쇼츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "버뮤다",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO007",
    "itemName": "스몰 로고 리얼 와이드 스웻 쇼츠",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO009",
    "itemName": "키키 심볼 트랙 와이드 쇼츠",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "스탠다드",
    "description": ""
  },
  {
    "line": "UNISEX",
    "category": "SO",
    "styleNo": "SWA2702SO011",
    "itemName": "기본 치노 쇼츠(버뮤다)",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "JK",
    "styleNo": "SWA2701JK501",
    "itemName": "레더 자켓",
    "imageUrl": "",
    "rrp": 199000,
    "fit": "세미오버핏",
    "description": "1. 하이넥 유광 레더 블루종 집업\n2. 앞마이 ZIP  + 플라켓 여밈\n3. 밑단 밴딩\n4. 아웃포켓+ 구찌포켓 디테일에 후다 포켓 진행\n5. 심볼 로고 결합  볼륨 직자수"
  },
  {
    "line": "WOMEN",
    "category": "JK",
    "styleNo": "SWA2701JK502",
    "itemName": "코튼 소재 자켓",
    "imageUrl": "",
    "rrp": 159000,
    "fit": "세미오버핏",
    "description": "1. 컬러 피그다잉 옥스포드 소재 카라 자켓\n2. 앞마이 ZIP 여밈\n3. 카라 모티브 탈부착 디테일\n4. 밑단 /소맷단 밴딩\n5. 구찌포켓+ 후다 포켓 진행\n6. 심볼 로고 결합  볼륨 직자수\n"
  },
  {
    "line": "WOMEN",
    "category": "JK",
    "styleNo": "SWA2701JK503",
    "itemName": "봄성 바람막이 점퍼",
    "imageUrl": "",
    "rrp": 149000,
    "fit": "세미오버핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "JK",
    "styleNo": "SWA2701JK504",
    "itemName": "봄성 트렌드 소재 바시티자켓",
    "imageUrl": "",
    "rrp": 159000,
    "fit": "스텐다드핏",
    "description": "1. 왁시드 코팅 트윌  코튼 소재 바시티\n2. 넥/밑단/소맷단 배색 핀 시보리 진행\n3. 앞여밈 스냅 진행\n4. 앞판 심볼+로고 결합 나염 자수 \n5.뒷판 빅그래픽 나염 자수"
  },
  {
    "line": "WOMEN",
    "category": "JK",
    "styleNo": "SWA2702JK505",
    "itemName": "여름성 시어소재 바람막이",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "세미오버핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "JK",
    "styleNo": "SWA2702JK506",
    "itemName": "체크시어서커 셔츠형 후디 점퍼",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "세미오버핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "CD",
    "styleNo": "SWA2701CD501",
    "itemName": "베이직 라운드넥 가디건 (PBT소재)",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "CD",
    "styleNo": "SWA2701CD502",
    "itemName": "스트라이프/패턴 가디건",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "CD",
    "styleNo": "SWA2701CD503",
    "itemName": "에센셜 가디건",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "슬림핏",
    "description": "1. 자가드 아일렛 립소재의 에센셜라인 가디건\n2. 여러 컬러 믹스매치하여 코디 연출 진행 \n3.끝라인 스칼럽 테이프 디테일 \n4. 로고 직자수+리본 디테일 진행"
  },
  {
    "line": "WOMEN",
    "category": "CD",
    "styleNo": "SWA2702CD504",
    "itemName": "여름 반팔 가디건",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "CD",
    "styleNo": "SWA2702CD505",
    "itemName": "쿨소재 가디건",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "스텐다드핏",
    "description": "1. 시어한 조직감의 여름성 가디건\n2. 전판 플라워 프린팅\n3. 끝라인 스칼럽 조직\n4. 로고 직자수 + 리본 디테일"
  },
  {
    "line": "WOMEN",
    "category": "KT",
    "styleNo": "SWA2701KT501",
    "itemName": "레이어드형 풀오버",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "KT",
    "styleNo": "SWA2702KT502",
    "itemName": "케이블 카라 반팔니트 - 솔리드/스트라이프",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "KT",
    "styleNo": "SWA2702KT503",
    "itemName": "IP 타이포 활용 반팔 니트",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "스텐다드핏",
    "description": "1. 네프사 소재의 반팔 풀오버\n2. 넥/밑단/소맷단 배색 핀 진행\n3. 앞판 로고 빅그래픽 - 부클자수/체인자수/코르샤쥬 다양하게 기법 믹스 하여  진행"
  },
  {
    "line": "WOMEN",
    "category": "KT",
    "styleNo": "SWA2702KT504",
    "itemName": "IP 그래픽 활용 반팔 니트",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "KT",
    "styleNo": "SWA2702KT505",
    "itemName": "레이어드형 크로쉐 니트 베스트",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "세미오버\n크롭\n",
    "description": "1. 레이어드형  2도스트라이프 크로셰 베스트\n2. 조직짜임 릴리형상 꽃 모양 진행\n3. 앞판 로고 부클 자수 진행"
  },
  {
    "line": "WOMEN",
    "category": "KT",
    "styleNo": "SWA2702KT506",
    "itemName": "트렌드 반팔 니트",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SH",
    "styleNo": "SWA2701SH501",
    "itemName": "오버핏 긴팔 체크 셔츠 / 여름성소재",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "세미오버핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SH",
    "styleNo": "SWA2702SH530",
    "itemName": "저온스 데님 긴팔셔츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "세미오버핏",
    "description": "1. 이지데님라인 - 8oz 저온스 데님 긴팔 셔츠\n2. 앞판 왼쪽가슴 아웃포켓 진행\n3. 포켓에 릴리 포인트라벨 끼워물림\n4. 포켓에 로고 볼륨 직자수+ 테두리 러닝자수 진행"
  },
  {
    "line": "WOMEN",
    "category": "SS",
    "styleNo": "SWA2702SS501",
    "itemName": "코튼 소재 반팔 셔츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SS",
    "styleNo": "SWA2702SS502",
    "itemName": "저온스 데님 반팔 셔츠 - 셋업",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "세미오버\n크롭",
    "description": "1. 이지데님라인 - 8oz 저온스 데님 반팔 셔츠\n2. 전판 플라워 자가드 원단 진행\n3. 앞판 왼쪽가슴 아웃포켓 진행\n4. 포켓에 릴리 포인트라벨 끼워물림\n5. 포켓에 로고 볼륨 직자수+ 테두리 러닝자수 진행"
  },
  {
    "line": "WOMEN",
    "category": "LT",
    "styleNo": "SWA2701LT501",
    "itemName": "에센셜 롱슬리브",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "슬림핏",
    "description": "1. 자가드 아일렛 립소재의 에센셜라인 롱슬리브\n2. 여러 컬러 믹스매치하여 코디 연출 진행 \n3.끝라인 스칼럽 테이프 디테일 \n4. 로고 직자수+리본 디테일 진행"
  },
  {
    "line": "WOMEN",
    "category": "LT",
    "styleNo": "SWA2701LT502",
    "itemName": "(럭비) 스트라이프 롱슬리브",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "세미오버핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "LT",
    "styleNo": "SWA2701LT503",
    "itemName": "데님 라이크 롱슬리브",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "세미오버핏",
    "description": "1. 세미오버핏 블리칭 워싱 배색 레그런 롱슬리브\n2. 넥 프릴 여성스러운 디테일\n3. 도밍고 워싱 포인트 추가\n4. 심볼+로고 결합 직자수 진행"
  },
  {
    "line": "WOMEN",
    "category": "LT",
    "styleNo": "SWA2701LT504",
    "itemName": "멀티스트라이프 롱슬리브",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "세미오버핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "CR",
    "styleNo": "SWA2701CR501",
    "itemName": "뉴베이직 맨투맨",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "스텐다드핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "CR",
    "styleNo": "SWA2701CR502",
    "itemName": "IP그래픽 맨투맨",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "세미오버핏",
    "description": "1. 360쭈리 소재의 세미오버핏 크루넥\n2. 앞판 그래피티 무드의 로고 그래픽 - 나염+부클+러닝 st 결합 진행"
  },
  {
    "line": "WOMEN",
    "category": "CR",
    "styleNo": "SWA2701CR504",
    "itemName": "그래픽 맨투맨",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "세미오버핏",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "CR",
    "styleNo": "SWA2701CR530",
    "itemName": "데님 라이크 크루넥",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "세미오버핏",
    "description": "1. 데님저지라인 - 데님쭈리 소재 사용 세미오버핏 크루넥\n2. 상/하단 브러쉬 진행\n3. 도밍고 워싱 포인트 디테일\n4. 제원단 데끼 릴리 빅 그래픽 + 실버사 직자수"
  },
  {
    "line": "WOMEN",
    "category": "HD",
    "styleNo": "SWA2701HD501",
    "itemName": "뉴베이직 후디",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "HD",
    "styleNo": "SWA2701HD502",
    "itemName": "IP 그래픽 후디",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "HD",
    "styleNo": "SWA2702HD530",
    "itemName": "리본 디테일 반팔 후디",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "스텐다드핏",
    "description": "1. 전판 미니쭈리 스텐다드핏 반팔 후디\n2. 후드 리본 디테일 과 퍼프 소매 셔링으로 러블리 무드 연출\n3. 사이바 절개 디테일\n4. 왼쪽가슴 로고 직자수"
  },
  {
    "line": "WOMEN",
    "category": "HZ",
    "styleNo": "SWA2701HZ501",
    "itemName": "뉴베이직 후드집업",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "HZ",
    "styleNo": "SWA2701HZ502",
    "itemName": "데님 워싱 후드집업 - 셋업",
    "imageUrl": "",
    "rrp": 129000,
    "fit": "스텐다드핏",
    "description": "1. 데님저지라인 - 데님쭈리 소재 사용 스텐다드핏 후드집업\n2. 도밍고 워싱 포인트 디테일\n3. 제원단 데끼 릴리 빅 그래픽 + 실버사 직자수"
  },
  {
    "line": "WOMEN",
    "category": "HZ",
    "styleNo": "SWA2701HZ503",
    "itemName": "IP 활용 아플리케 후드집업",
    "imageUrl": "",
    "rrp": 119000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "HZ",
    "styleNo": "SWA2701HZ504",
    "itemName": "전판도트 러플 후드집업",
    "imageUrl": "",
    "rrp": 129000,
    "fit": "세미오버핏",
    "description": "1. 세미오버핏 도트 자가드 쭈리 후드집업\n2. 앞판 데끼 러플 릴리 디테일 \n3. 구찌포켓  + 로고 직자수 진행"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST501",
    "itemName": "레귤러핏 기본와펜 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 39000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST502",
    "itemName": "크롭기장 기본와펜 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 39000,
    "fit": "슬림 베이비핏",
    "description": "1. 30수 싱글 스판 소재의 슬림 베이비핏 숏 슬리브 티셔츠\n2. 앞판 왼쪽가슴 글리터 젤리 릴리 와펜\n3. 밑단 심볼+로고 결합 포인트 라벨"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST503",
    "itemName": "베이직 링거 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "스탠다드핏",
    "description": "1.20수 싱글 소재의 스텐다드핏 배색 링거티\n2. 앞판  로고 그래픽 배색 체크 패치 진행"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST504",
    "itemName": "빅릴리 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "스탠다드핏",
    "description": "1. 20수 싱글 소재의 스텐다드핏 숏 슬리브 티셔츠\n2.젤리 빅릴리 그래픽 진행 - 메인몸판도 팝한 컬러 진행\n3. 유막코팅 기법으로 젤리 실리콘 느낌 연출"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST505",
    "itemName": "레글런 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "슬림 베이비핏",
    "description": "1. 30수 싱글스판 소재의 슬림 베이비핏 배색 레그런 반팔티\n2. 앞판 바캉스 무드 그래픽 진행\n3. 빈티지 크랙 느낌을 연출한 안료나염 진행"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST506",
    "itemName": "IP그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST507",
    "itemName": "썸머 그래픽 반팔 티셔츠 - 쿨소재",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST508",
    "itemName": "전판 그래픽 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST509",
    "itemName": "스트라이프 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST510",
    "itemName": "데님라이크 반팔 티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "슬림베이비",
    "description": "1. 세미오버핏 블리칭 워싱 숏슬리브\n2. 넥 프릴 여성스러운 디테일\n3. 도밍고 워싱 포인트 추가\n4. 심볼+로고 결합 직자수 진행"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST511",
    "itemName": "뉴베이직 슬리브리스",
    "imageUrl": "",
    "rrp": 39000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST512",
    "itemName": "에센셜라인 슬리브리스",
    "imageUrl": "",
    "rrp": 39000,
    "fit": "슬림핏",
    "description": "1. 자가드 아일렛 립소재의 에센셜라인 슬리브 리스\n2. 여러 컬러 믹스매치하여 코디 연출 진행 \n3.끝라인 스칼럽 테이프 디테일 \n4. 로고 직자수+리본 디테일 진행"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST513",
    "itemName": "러플디테일 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "오버핏",
    "description": "1. 20수 싱글 소재를 사용한 오버핏 숏 슬리브 티셔츠\n2. 밑단 제원단 러플 디테일과 앞판 리본으로  러블리 디테일 진행\n3. 뒷넥 로고 직자수 진행\n"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST514",
    "itemName": "시즌 2PACK",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "스탠다드핏",
    "description": "1. 프리미엄 투팩_ 20수 싱글 소재를 사용한 스탠다드핏  숏 슬리브 티셔츠\n2. 과자봉지를 형상화 하는 pu소재 투팩 포장지\n    일회용성으로 버려지는게 아닌, 여행시 수납팩으로 따로 사용 가능\n3. 앞판 로고 프린트 진행 \n4.뒷넥 로고 전사 나염 진행\n5. 밑단 심볼+로고 결합 포인트라벨 진행"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST515",
    "itemName": "멀티스트라이프 반팔티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST590",
    "itemName": "에센셜라인 스퀘어넥 반팔티셔츠",
    "imageUrl": "",
    "rrp": 49000,
    "fit": "슬림핏",
    "description": "1. 자가드 아일렛 립소재의 에센셜라인 스퀘어넥 숏슬리브\n2. 여러 컬러 믹스매치하여 코디 연출 진행 \n3.끝라인 스칼럽 테이프 디테일 \n4. 로고 직자수+리본 디테일 진행"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST580",
    "itemName": "블러그래픽 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST530",
    "itemName": "풋볼 티셔츠",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST533",
    "itemName": "인형 티셔츠",
    "imageUrl": "",
    "rrp": 69000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST531",
    "itemName": "전판도트 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST532",
    "itemName": "레이어드형 슬리브리스",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "스탠다드핏",
    "description": "1. 코튼 아일렛 소재를 사용한 레이어드형 슬리브리스 블라우스\n2. 어깨 끈조정 가능\n3. 상동 고무줄 밴딩 내장으로 편의성 높임\n4. 네크라인 따라 스칼렛 레이스 테이프 끼워물림\n5. 우먼스 전용 레이스 모티브 덧박음"
  },
  {
    "line": "WOMEN",
    "category": "ST",
    "styleNo": "SWA2702ST534",
    "itemName": "카모 메쉬 반팔티셔츠",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "PT",
    "styleNo": "SWA2701PT501",
    "itemName": "뉴베이직 스웻팬츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "PT",
    "styleNo": "SWA2701PT502",
    "itemName": "데님워싱 스웻팬츠 - 셋업",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "세미벌룬핏",
    "description": "1. 데님저지라인 - 데님쭈리 소재 사용 세미벌룬핏 팬츠\n2. 와끼 맞턱 + 사이바 절개 디테일 \n3. 도밍고 워싱 포인트 디테일\n4. 제원단 데끼 릴리 빅 그래픽 + 실버사 직자수"
  },
  {
    "line": "WOMEN",
    "category": "PT",
    "styleNo": "SWA2701PT503",
    "itemName": "세미와이드 데님팬츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "PT",
    "styleNo": "SWA2701PT504",
    "itemName": "트렌드핏 데님팬츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "와이드핏",
    "description": "1. 11oz 여름성 소재 사용 데님 와이드핏 카고팬츠\n2. 오비 없이 데끼 마감진행\n3. 입체포켓으로  4포켓진행\n4. 상단 포켓은 리본 디테일 추가\n5. 우먼스용 스칼럽 텍션지 사용"
  },
  {
    "line": "WOMEN",
    "category": "PT",
    "styleNo": "SWA2702PT505",
    "itemName": "저온스 데님팬츠 - 셋업",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "와이드핏",
    "description": "1. 이지데님라인 - 8oz 저온스 데님 와이드핏 팬츠\n2. 앞판 왼쪽 무까대 릴리 볼륨 직자수+ 테두리 러닝자수 진행\n3. 뒷판 포켓에 릴리 포인트라벨 끼워물림\n4. 뒷판 포켓에 로고 볼륨 직자수+ 테두리 러닝자수 진행\n5. 더블 벨트고리 + 레이스 스트링 벨트 디테일"
  },
  {
    "line": "WOMEN",
    "category": "PT",
    "styleNo": "SWA2702PT506",
    "itemName": "나일론코튼혼방 소재 파라슈트팬츠",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "PT",
    "styleNo": "SWA2701PT591",
    "itemName": "에센셜라인 팬츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "세미와이드",
    "description": "1. 자가드 아일렛 립소재의 에센셜라인 세미와이드핏 팬츠\n2. 여러 컬러 믹스매치하여 코디 연출 진행 \n3.오비 끝라인 스칼럽 테이프 디테일 \n4. 로고 직자수+리본 디테일 진행"
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO501",
    "itemName": "저온스 데님 숏팬츠 (셋업)",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "3부기장",
    "description": "1. 이지데님라인 - 8oz 저온스 데님 숏팬츠\n2. 전판 플라워 자가드 원단 진행\n3. 앞판 왼쪽 무까대 릴리 볼륨 직자수+ 테두리 러닝자수 진행\n4. 뒷판 포켓에 릴리 포인트라벨 끼워물림\n5. 뒷판 포켓에 로고 볼륨 직자수+ 테두리 러닝자수 진행\n6. 더블 벨트고리 + 레이스 스트링 벨트 디테일"
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO502",
    "itemName": "3부 데님 숏팬츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO503",
    "itemName": "버뮤다 데님 팬츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO504",
    "itemName": "카프리 팬츠",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO505",
    "itemName": "프릴디테일 셋업 쇼츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO510",
    "itemName": "코튼체크소재 셋업 쇼츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO530",
    "itemName": "에센셜라인 치마바지",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "치마바지",
    "description": "1. 자가드 아일렛 립소재의 에센셜라인 미니기장 치마바지\n2. 제원단 속바지 추가\n3. 여러 컬러 믹스매치하여 코디 연출 진행 \n4.오비, 밑단 끝라인 스칼럽 테이프 디테일 \n5. 로고 직자수+리본 디테일 진행"
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO531",
    "itemName": "데님라이크 벌룬 숏팬츠",
    "imageUrl": "",
    "rrp": 79000,
    "fit": "펌킨숏팬츠",
    "description": "1. 데님저지라인 - 데님쭈리 소재 사용 펌킨 숏팬츠\n2. 가자리 뎅고+ 꽃단추 사용\n3. 도밍고 워싱 포인트 디테일\n4. 뒷판 제원단 데끼 릴리 빅 그래픽 + 실버사 직자수"
  },
  {
    "line": "WOMEN",
    "category": "SO",
    "styleNo": "SWA2702SO532",
    "itemName": "러플디테일 버뮤다 팬츠",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "5부 기장",
    "description": "1. 12oz ECRU 컬러 코튼 버뮤다 팬츠\n2. 오비 제원단 러플  디테일\n3. 전판 그래픽 컬러 안료 나염 진행\n"
  },
  {
    "line": "WOMEN",
    "category": "SR",
    "styleNo": "SWA2702SR501",
    "itemName": "데님 스커트",
    "imageUrl": "",
    "rrp": 89000,
    "fit": "3부기장\n플리츠라인",
    "description": "1. 이지데님라인 - 8oz 저온스 데님 플리츠 숏스커트\n2. 전판 플라워 자가드 원단 진행\n3. 뒷판 가자리 구찌포켓 진행\n4. 앞판 코인 포켓에 릴리 포인트라벨 끼워물림\n5. 앞판 요크라인 로고 볼륨 직자수+ 테두리 러닝자수 진행\n"
  },
  {
    "line": "WOMEN",
    "category": "SR",
    "styleNo": "SWA2702SR502",
    "itemName": "코튼혼방 소재 미디 스커트",
    "imageUrl": "",
    "rrp": 109000,
    "fit": "미디기장",
    "description": "1. 40수 고밀도 코튼소재를 사용한  미디기장 스커트\n2. 탄탄하고 고시감 있는 원단으로 스커트 실루엣 볼륨있게 살림 \n3. 허리 고무줄 밴딩 마감 + 제원단 스트링 진행\n4. 러플 끝단 레이스 테이프 덧박음\n5.우먼스 전용 레이스 모티브 덧박음"
  },
  {
    "line": "WOMEN",
    "category": "SR",
    "styleNo": "SWA2702SR503",
    "itemName": "여름성 소재 러플 스커트",
    "imageUrl": "",
    "rrp": 99000,
    "fit": "",
    "description": ""
  },
  {
    "line": "WOMEN",
    "category": "SR",
    "styleNo": "SWA2702SR504",
    "itemName": "레이어드용 랩스커트",
    "imageUrl": "",
    "rrp": 59000,
    "fit": "랩스커트",
    "description": "1. 플라워 패턴 우라기리 소재 사용 레이어드형 랩스커트\n2. 끝단 러플 마감\n3.재원단 스트링 여밈\n4.우먼스 전용 레이스 모티브 덧박음"
  },
  {
    "line": "WOMEN",
    "category": "OP",
    "styleNo": "SWA2702OP501",
    "itemName": "레이어드형 슬리브리스 원피스",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "스텐다트핏\n+미니기장",
    "description": "1. 코튼 아일렛 소재를 사용한 레이어드형 슬리브리스 원피스\n2. 어깨 끈조정 가능\n3. 상동 허리 고무줄 밴딩 내장으로 편의성 높임\n4. 네크라인 제원단 후랏쉬 디테일+  스칼렛 레이스 테이프 끼워물림\n5. 밑단 후랏쉬 디테일+  스칼렛 레이스 테이프 끼워물림\n6. 양쪽 허리 제원단 스트링으로 리본 연출 가능\n7.우먼스 전용 레이스 모티브 덧박음"
  },
  {
    "line": "WOMEN",
    "category": "OP",
    "styleNo": "SWA2702OP502",
    "itemName": "오버롤 팬츠",
    "imageUrl": "",
    "rrp": 159000,
    "fit": "세미와이드핏",
    "description": "1. 면 헤링본 소재의 오버롤 팬츠\n2.넥라인+어깨끈라인+포켓라인 전체 스칼럽 레이스 끼워물림\n3. 앞넥라인+뒷포켓 레이스 테이프 덧박음\n4. 어깨끈 조정 가능\n5. 허리 단추 여밈\n6. 앞판 아웃포켓/사이드포켓/뒷포켓 진행\n7. 앞판 아웃포켓 로고 직자수 진행"
  },
  {
    "line": "WOMEN",
    "category": "OP",
    "styleNo": "SWA2702OP530",
    "itemName": "블라우스형 원피스",
    "imageUrl": "",
    "rrp": 139000,
    "fit": "미니기장",
    "description": "1. 저밀도 트윌 코튼소재를 사용한 카라 원피스\n2. 벌룬소매+ 끝단 러플 마감\n3. 둥근카라에 스칼렛 레이스 테이프 끼워물림\n4. 밑단 스칼렛 레이스 테이프 끼워물림\n5. 앞판 요크라인+ 단추 여밈 진행 _ 핀턱 디테일\n6.우먼스 전용 레이스 모티브 덧박음"
  }
];

function create_UNISEX_JK() { createCategoryForm_('UNISEX', 'JK'); }
function create_UNISEX_SH() { createCategoryForm_('UNISEX', 'SH'); }
function create_UNISEX_SS() { createCategoryForm_('UNISEX', 'SS'); }
function create_UNISEX_CD() { createCategoryForm_('UNISEX', 'CD'); }
function create_UNISEX_KT() { createCategoryForm_('UNISEX', 'KT'); }
function create_UNISEX_CR() { createCategoryForm_('UNISEX', 'CR'); }
function create_UNISEX_HD() { createCategoryForm_('UNISEX', 'HD'); }
function create_UNISEX_HZ() { createCategoryForm_('UNISEX', 'HZ'); }
function create_UNISEX_LT() { createCategoryForm_('UNISEX', 'LT'); }
function create_UNISEX_ST() { createCategoryForm_('UNISEX', 'ST'); }
function create_UNISEX_PT() { createCategoryForm_('UNISEX', 'PT'); }
function create_UNISEX_SO() { createCategoryForm_('UNISEX', 'SO'); }
function create_WOMEN_JK() { createCategoryForm_('WOMEN', 'JK'); }
function create_WOMEN_CD() { createCategoryForm_('WOMEN', 'CD'); }
function create_WOMEN_KT() { createCategoryForm_('WOMEN', 'KT'); }
function create_WOMEN_SH() { createCategoryForm_('WOMEN', 'SH'); }
function create_WOMEN_SS() { createCategoryForm_('WOMEN', 'SS'); }
function create_WOMEN_LT() { createCategoryForm_('WOMEN', 'LT'); }
function create_WOMEN_CR() { createCategoryForm_('WOMEN', 'CR'); }
function create_WOMEN_HD() { createCategoryForm_('WOMEN', 'HD'); }
function create_WOMEN_HZ() { createCategoryForm_('WOMEN', 'HZ'); }
function create_WOMEN_ST() { createCategoryForm_('WOMEN', 'ST'); }
function create_WOMEN_PT() { createCategoryForm_('WOMEN', 'PT'); }
function create_WOMEN_SO() { createCategoryForm_('WOMEN', 'SO'); }
function create_WOMEN_SR() { createCategoryForm_('WOMEN', 'SR'); }
function create_WOMEN_OP() { createCategoryForm_('WOMEN', 'OP'); }

function listCategories() {
  const grouped = groupByLineCategory_(STYLE_DATA);
  Object.keys(grouped).forEach(function(key) {
    Logger.log(key + ' : ' + grouped[key].length + ' styles');
  });
}

function createCategoryForm_(targetLine, targetCategory) {
  const sectionStyles = STYLE_DATA.filter(function(row) {
    return row.line === targetLine && row.category === targetCategory;
  });

  if (sectionStyles.length === 0) {
    throw new Error('No styles found for ' + targetLine + ' / ' + targetCategory);
  }

  const form = FormApp.create('WACKYWILLY 27SS 품평 설문 - ' + targetLine + ' / ' + targetCategory);
  form.setDescription([
    '카테고리별 분할 설문입니다.',
    '대상: ' + targetLine + ' / ' + targetCategory,
    '품번 수: ' + sectionStyles.length,
    '1 매우 낮음 / 2 낮음 / 3 보통 / 4 높음 / 5 매우 높음',
    '전개 추천: 제외 / 소량 테스트 / 기본 전개 / 확대 전개 / 주력 전개'
  ].join('\n'));
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('응답이 저장되었습니다. 감사합니다.');

  addRespondentQuestions_(form);

  form.addPageBreakItem()
    .setTitle(targetLine + ' / ' + targetCategory)
    .setHelpText('품번별 평가 후 마지막에 카테고리 종합 의견을 작성해 주세요.');

  sectionStyles.forEach(function(style) {
    addStyleQuestionSet_(form, style);
  });

  addCategoryQuestions_(form, targetLine, targetCategory);

  Logger.log('FORM: ' + targetLine + ' / ' + targetCategory);
  Logger.log('STYLE_COUNT: ' + sectionStyles.length);
  Logger.log('EDIT_URL: ' + form.getEditUrl());
  Logger.log('RESPONDENT_URL: ' + form.getPublishedUrl());
}

function addRespondentQuestions_(form) {
  form.addSectionHeaderItem()
    .setTitle('응답자 정보')
    .setHelpText('품평 응답 취합을 위한 기본 정보입니다.');

  form.addTextItem().setTitle('성명').setRequired(true);
  form.addTextItem().setTitle('소속 / 매장명').setRequired(true);
  form.addListItem()
    .setTitle('응답자 구분')
    .setChoiceValues(['매장 매니저', '영업/영업기획', '상품기획', '디자인', '소싱/소재', '마케팅/온라인/VM', '사업부 임직원', '기타'])
    .setRequired(true);
}

function addStyleQuestionSet_(form, style) {
  const title = '[' + style.line + '/' + style.category + '] ' + style.styleNo + ' | ' + style.itemName;
  const help = [
    style.rrp ? 'RRP: ' + style.rrp : '',
    style.fit ? 'FIT: ' + style.fit : '',
    style.description ? '설명: ' + style.description : ''
  ].filter(Boolean).join('\n');

  form.addSectionHeaderItem().setTitle(title).setHelpText(help);

  if (style.imageUrl) {
    try {
      const blob = UrlFetchApp.fetch(style.imageUrl).getBlob();
      form.addImageItem().setTitle(style.styleNo + ' image').setImage(blob);
    } catch (err) {
      form.addSectionHeaderItem().setTitle('이미지 로드 실패: ' + style.styleNo).setHelpText(String(err));
    }
  }

  addScale_(form, style.styleNo + ' / 진행 적합도', '이 품번을 27SS에 전개할 가치가 있습니까?');
  addScale_(form, style.styleNo + ' / 예상 판매성', '매장/채널에서 판매 전환 가능성이 높습니까?');
  addScale_(form, style.styleNo + ' / 디자인·컬러 매력도', '디자인과 컬러가 고객에게 매력적으로 보입니까?');
  addScale_(form, style.styleNo + ' / 가격 적정성', '예상 판매가 기준 가격 저항이 낮습니까?');
  addScale_(form, style.styleNo + ' / 브랜드·고객 적합도', '와키윌리 고객과 매장 무드에 잘 맞습니까?');
  addScale_(form, style.styleNo + ' / 차별성·신선도', '기존 상품 대비 새로움이나 차별성이 있습니까?');

  form.addListItem()
    .setTitle(style.styleNo + ' / 전개 추천')
    .setHelpText('해당 품번의 권장 전개 범위를 선택해 주세요.')
    .setChoiceValues(['제외', '소량 테스트', '기본 전개', '확대 전개', '주력 전개'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle(style.styleNo + ' / 품번별 주관 의견')
    .setHelpText('좋은 점, 우려점, 수정 의견이 있으면 작성해 주세요. 선택 입력입니다.')
    .setRequired(false);
}

function addScale_(form, title, helpText) {
  form.addScaleItem()
    .setTitle(title)
    .setHelpText(helpText)
    .setBounds(1, 5)
    .setLabels('매우 낮음', '매우 높음')
    .setRequired(true);
}

function addCategoryQuestions_(form, line, category) {
  const prefix = '[' + line + '/' + category + '] ';
  form.addSectionHeaderItem()
    .setTitle(prefix + '카테고리 종합 평가')
    .setHelpText('해당 카테고리 전체에 대한 종합 의견입니다.');

  form.addParagraphTextItem().setTitle(prefix + '가장 강하다고 느껴지는 상품/디테일은 무엇입니까?').setRequired(true);
  form.addParagraphTextItem().setTitle(prefix + '판매가 우려되는 상품군, 가격대, 디자인 요소는 무엇입니까?').setRequired(true);
  form.addParagraphTextItem().setTitle(prefix + '현재 구성에서 빠졌다고 느껴지는 아이템/컬러/핏이 있습니까?').setRequired(true);
  form.addParagraphTextItem().setTitle(prefix + '카테고리 전체 가격대에 대한 고객 반응을 어떻게 예상합니까?').setRequired(true);
  form.addParagraphTextItem().setTitle(prefix + '매장 전개 시 우선 보여줘야 할 상품과 연출 방향은 무엇입니까?').setRequired(true);
  form.addParagraphTextItem().setTitle(prefix + '기타 자유 의견').setRequired(false);
}

function groupByLineCategory_(rows) {
  const grouped = {};
  rows.forEach(function(row) {
    const key = row.line + ' / ' + row.category;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });
  return grouped;
}
