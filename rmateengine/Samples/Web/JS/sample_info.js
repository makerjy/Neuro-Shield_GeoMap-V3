// sample
var sampleBaseURL = "./Samples/",
	
	types = [{
		// 지도종류(한국)
			"n":"대한민국 지도", "c":[
				{"n":"대한민국 시.도","u":"SouthKorea"},
				{"n":"대한민국 구.군","u":"SouthKoreaGuGun"},
				{"n":"전국 행정동지도","u":"SouthKoreaDrillDownUMD"},
				{"n":"행정동지도(예)","u":"SubMapUMD"},
				{"n":"대한민국 권역별","u":"SouthKoreaDrillDownMetroDongRegion"},
				{"n":"구청등록지역","u":"SouthKoreaDrillDownDong12Gu"},
				{"n":"독도","u":"SouthKoreaDokdo"},
				{"n":"남.북한","u":"SouthNorthKorea"},
				{"n":"북한 구.군","u":"NorthKoreaDetail"}
			]
		},{
		// 맵차트 속성/스타일
			"n":"맵차트 속성/스타일", "c":[
				// n - name
				// u - url
				{"n":"맵차트 전체 속성","u":"MapChartProperties"},
				{"n":"맵시리즈 스타일","u":"MapSeriesStyle"},
				{"n":"라벨 투명도 변경","u":"LabelOpacity"},
				{"n":"라벨 콜아웃 (CallOut)","u":"_World_USA_Callout"},
				{"n":"맵시리즈 Enabled제어","u":"MapEnabled"},
				{"n":"데이터팁 변경","u":"DataTipType"},
				{"n":"데이터를 통한 속성/스타일 변경","u":"DataProperties"},
				{"n":"AreaDataCode","u":"AreaDataCode"},
				{"n":"맵선택 해제","u":"ClearSelection"},
				{"n":"맵차트 이미지 저장","u":"SaveImage"},
				{"n":"웹접근성 기능","u":"Accesibility"}
			]
		},{
		// 맵차트 Series
			"n":"맵차트 Series", "c":[
				{"n":"Multi Plot Series","u":"MultiMapPlotSeries"},
				{"n":"Plot Series (CallOut)","u":"_MapPlotSeries_callOut"},
				{"n":"Panel Series","u":"MapPanelSeries"},
				{"n":"Panel Series (hide header)","u":"MapPanelSeriesHideHeader"},
				{"n":"Panel Series (패널종류)","u":"MapPanelItemRenderer"},
				{"n":"Panel Series (CallOut)","u":"_MapPanelSeriesDrillDown_callOut"},
				{"n":"Bubble Series","u":"MapBubbleSeries"},
				{"n":"Bubble Series(ball)","u":"MapBubbleSeriesBall"},
				{"n":"Image Series","u":"MapImageSeries"},
				{"n":"Image Series (LabelCallOut)","u":"_MapImageSeriesDrillDown_callOut"},
				{"n":"Route Series","u":"MapRouteSeries2"},
				{"n":"Spark Series(Column)","u":"MapSparkSeriesColumn"},
				{"n":"Spark Series(Pie)","u":"MapSparkSeriesPie2"},
				{"n":"Div Series(애니메이션 GIF)","u":"MapDivSeries"}
			]
		},{
		// DrillDown
			"n":"DrillDown", "c":[
				{"n":"세계국가","u":"WorldDrillDown"},
				{"n":"미국","u":"World_USADrilldown_abbreviation"},
				{"n":"대한민국 전도","u":"SouthKoreaDrillDown"},
				{"n":"북한","u":"NorthKoreaDrillDown"}
			]
		},{
		// Effect
			"n":"Effect", "c":[
				{"n":"Interpolate Effect","u":"SeriesInterpolate"},
				{"n":"Slide Effect","u":"SeriesSlide"},
				{"n":"Zoom Effect","u":"SeriesZoom"}
			]
		},{
		// 맵차트 컬러
			"n":"맵차트 컬러", "c":[
				{"n":"SolidColor","u":"SolidColor"},
				{"n":"RollOver","u":"RollOver"},
				{"n":"Selection","u":"Selection"},
				{"n":"SelectionMarking","u":"SelectionMarking"},
				{"n":"Pattern","u":"MapPattern"},
				{"n":"DataColorFill","u":"DataColorFill"},
				{"n":"RollOverHighlight","u":"SelectionTransparent"},
				{"n":"RollOverFilter","u":"RollOverFilter"}
			]
		},{
		// 범례
			"n":"범례", "c":[
				{"n":"하단(마우스오버시 아이템 강조)","u":"LegendBottom"},
				{"n":"오른쪽(클릭 시 아이템 On/Off)","u":"LegendRight"},
				{"n":"범위 범례표시","u":"Legend"},
				{"n":"데이터영역 범례표시(아이템)","u":"LegendRangeData"},
				{"n":"데이터영역 범례표시(지역)","u":"LegendRangeDataMap"}
			]
		},{
		// 사용자 정의 설정
			"n":"사용자 정의 설정", "c":[
				{"n":"데이터팁","u":"DataTipJsFunction"},
				{"n":"Div데이터팁","u":"DivTooltip"},
				{"n":"맵 클릭 이벤트","u":"MapClickJsFunction"},
				{"n":"아이템 클릭 이벤트","u":"ItemClickJsFunction"},
				{"n":"상위맵 이동시 이벤트","u":"BackToMapClickJsFunction"},
				{"n":"아이템클릭DrillDown","u":"_MapBubbleSeriesSetOpenCode"},
				{"n":"특정지역으로 선택 설정","u":"SelectedCode"},
				{"n":"지역색 변경","u":"LocalFillJsFunction"},
				{"n":"아이템색 변경","u":"FillJsFunction"},
				{"n":"패널타이틀","u":"TitleJsFunction"},
				{"n":"라벨","u":"LabelJsFunction2"},
				{"n":"줄바꿈","u":"WordWrap"},
				{"n":"아이템라벨,줄바꿈","u":"_MapBubbleSeriesSetWordWrap"},
				{"n":"패턴","u":"LocalFillJsFunction2"},
				{"n":"Stroke","u":"StrokeJsFunction"},
				{"n":"하위맵 크기 설정","u":"SubMap2"},
				{"n":"Route이미지 이동","u":"MapRouteSeriesMoveImage"},
				{"n":"뎁스별 다른 시리즈","u":"_MapDataSeriesDrillDown"},
				{"n":"외부함수로 아이템 선택","u":"_SetSelectedItem"},
			]
		},{
		// 여러 맵 연동
			"n":"여러 맵 연동", "c":[
				{"n":"한 화면에 두개의 맵 연동","u":"SubMap"},
				{"n":"팝업에 의한 맵 연동","u":"PopupMap"},
				{"n":"인덱스 맵","u":"_SubMapUseIndex"},
			]
		},{
		// GIS 데이터 맵 연동
			"n":"GIS 데이터 연동", "c":[
				{"n":"GIS 데이터로 지역위치 설정","u":"SouthKoreaDrillDownDong12Gu_GIS"},
				{"n":"GIS 데이터로 지역위치 설정<br>(좌표입력)","u":"SouthKoreaDrillDownDong12Gu_GISInput"},
				{"n":"GIS 데이터로 지역위치 설정<br>(시군구)","u":"SouthKoreaDrillDownDong12Gu_GISInput2"},
				{"n":"지역별 GIS 좌표","u":"_SouthKoreaDrillDownUMD_GIS"}
			]
		},{
		// 데이터 연동 및 동적 변경
			"n":"데이터 연동 및 동적 변경", "c":[
				{"n":"개별 Series 데이터 연동","u":"SetSeriesData"},
				{"n":"데이터 동적으로 변경","u":"DynamicChangeData"},
				{"n":"레이아웃 동적으로 변경","u":"DynamicChangeLayout"}
			]
		},{
		// 축소확대
			"n":"축소확대", "c":[
				{"n":"크기 축소 확대","u":"Scale"},
				{"n":"맵의 이동","u":"Moving"},
				{"n":"휠/드래그 확대축소","u":"PanZoom"},
				{"n":"맵 네비게이터","u":"Navigator"}
			]
		},{
		// 지도종류(세계)
			"n":"세계 지도", "c":[
				{"n":"세계지도 6대륙","u":"WorldSimpleContinental"},
				{"n":"세계지도 7대륙","u":"WorldContinental"},
				{"n":"중동분리 7대륙","u":"WorldDrillDown_MidEast"},
				{"n":"세계의 국가","u":"WorldCountry"},
				{"n":"미국","u":"World_USA_abbreviation"},
				{"n":"미국상세","u":"World_USADetail"},
				{"n":"일본","u":"World_Japan"},
				{"n":"일본 (도,부,현)","u":"World_JapanDetail"},
				{"n":"중국","u":"World_China"},
				{"n":"캐나다","u":"World_Canada"},
				{"n":"영국","u":"World_England"},
				{"n":"말레이시아","u":"World_Malaysia"},
				{"n":"태국","u":"World_Thailand"},
				{"n":"베트남","u":"World_Vietnam"},
				{"n":"브라질","u":"World_Brazil"},
				{"n":"아르헨티나","u":"World_Argentina"},
				{"n":"이란","u":"World_Iran"},
				{"n":"인도네시아","u":"World_Indonesia"},
				{"n":"멕시코","u":"World_Mexico"},
				{"n":"싱가포르","u":"World_Singapore"},
				{"n":"호주","u":"World_Australia"},
				{"n":"프랑스","u":"World_France"},
				{"n":"독일","u":"World_Germany"},
				{"n":"인도","u":"World_India"},
				{"n":"이탈리아","u":"World_Italy"},
				{"n":"뉴질랜드","u":"World_NewZealand"},
				{"n":"남아프리카공화국","u":"World_RepublicOfSouthAfrica"},
				{"n":"러시아","u":"World_Russia"},
				{"n":"사우디아라비아","u":"World_SaudiArabia"},
				{"n":"스페인","u":"World_Spain"},
				{"n":"대만","u":"World_Taiwan"},
				{"n":"튀르키예","u":"World_Turkey"}
			]
		},{
		// 지도종류(디자인맵)
			"n":"디자인 지도", "c":[
				{"n":"대한민국","u":"DesignMap_SouthKorea"},
				{"n":"서울","u":"DesignMap_Seoul"},
				{"n":"세계","u":"DesignMap_World"}
			]
		},{
		// 지도종류(기타)
			"n":"기타 지도", "c":[
				{"n":"비행기(소형)","u":"Airplane"},
				{"n":"비행기(대형)","u":"Airplane2"},
				{"n":"빌딩","u":"Building"},
				{"n":"극장","u":"Theater"}
			]
		}
]