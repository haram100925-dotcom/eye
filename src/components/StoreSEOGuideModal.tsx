import React, { useState } from 'react';
import {
  X,
  Play,
  Globe,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Search,
  ShieldCheck,
  Sparkles,
  Layers,
  Award,
  Download,
  Server,
  FolderPlus,
  FileText,
  BookOpen,
  Camera,
} from 'lucide-react';
import { DarkScreenshotDownloader } from './DarkScreenshotDownloader';

interface StoreSEOGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteUrl: string;
}

export const StoreSEOGuideModal: React.FC<StoreSEOGuideModalProps> = ({
  isOpen,
  onClose,
  siteUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'cronya' | 'store' | 'screenshots' | 'seo' | 'monetization' | 'marketing' | 'docs'>('screenshots');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                수익화, 스토어 출시 & 검색 홍보 가이드
              </h3>
              <p className="text-xs text-slate-500">
                구글 광고 연동, 플레이스토어 등록, 네이버/구글 검색 노출
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl shrink-0 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('cronya')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cronya'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌐 cronya.pe.kr 배포
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'store'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📱 플레이스토어 출시
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'screenshots'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📸 다크모드 스크린샷 7종
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'seo'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔍 네이버·구글 검색 등록
          </button>
          <button
            onClick={() => setActiveTab('monetization')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'monetization'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 구글 광고 & 수익화
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'marketing'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📣 사용자 유입 홍보
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📑 설계·출시 문서 (.MD)
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="overflow-y-auto pr-1 space-y-4 text-xs text-slate-700 flex-1">
          {/* TAB 0: CRONYA.PE.KR SUBFOLDER DEPLOYMENT */}
          {activeTab === 'cronya' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
                <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Server className="w-4 h-4 text-teal-700" />
                  <span>https://cronya.pe.kr/eye/ 서브폴더 3분 배포 안내</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  기존 PHP 웹사이트와 MySQL 데이터베이스에는 <strong>어떠한 간섭이나 영향도 주지 않고</strong>,
                  호스팅의 <code>/eye/</code> 서브폴더 경로에 눈 건강 PWA 앱을 독립 배포할 수 있는 전용 패키지를 준비해 두었습니다.
                </p>
              </div>

              {/* 1-Click Package Download Button */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                      ZIP
                    </div>
                    <div>
                      <p className="text-xs font-bold">cronya_eye_deploy.zip</p>
                      <p className="text-[10px] text-slate-400">
                        상대경로 빌드 + Apache .htaccess 내장 (약 251KB)
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href="./cronya_eye_deploy.zip"
                  download="cronya_eye_deploy.zip"
                  className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>배포용 완성 압축파일 다운로드 (1-클릭)</span>
                </a>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <a
                    href="./docs/PLAYSTORE_TWA_GUIDE.md"
                    download="PLAYSTORE_TWA_GUIDE.md"
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                  >
                    <FileText className="w-3 h-3" />
                    <span>출시 가이드 (.md)</span>
                  </a>
                  <a
                    href="./docs/PROJECT_DESIGN_DOCUMENT.md"
                    download="PROJECT_DESIGN_DOCUMENT.md"
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                  >
                    <FileText className="w-3 h-3" />
                    <span>설계 문서 (.md)</span>
                  </a>
                </div>
              </div>

              {/* Step by Step Guide */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">📂 FTP 3단계 업로드 방법</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <span>1. 위 [배포용 압축파일 다운로드] 클릭 후 압축 풀기</span>
                    </span>
                    <p className="text-[11px] text-slate-600">
                      내 PC에서 압축을 풀면 <code>index.html</code>, <code>.htaccess</code>, <code>assets/</code>, <code>manifest.webmanifest</code> 등이 나옵니다.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <span>2. 파일질라(FileZilla)로 호스팅 FTP 접속</span>
                    </span>
                    <p className="text-[11px] text-slate-600">
                      호스팅 메인 디렉터리(<code>public_html</code> 또는 <code>www</code>) 안에 마우스 우클릭으로 <strong>eye</strong> 폴더를 새로 만듭니다.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <span>3. eye 폴더 안에 압축 푼 파일들 그대로 업로드!</span>
                    </span>
                    <p className="text-[11px] text-slate-600">
                      업로드가 끝나면 브라우저 주소창에 <strong>https://cronya.pe.kr/eye/</strong> 를 입력하고 접속하시면 즉시 실행됩니다!
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety guarantee */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1 text-teal-800">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>기존 호스팅 사이트 안전 보장</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  기존 PHP 소스와 MySQL DB는 <code>/eye/</code> 서브폴더 외부에 있으므로 충돌이 전혀 없습니다. 함께 포함된 <code>.htaccess</code> 파일이 새로고침 시 404 오류를 완벽하게 방지해 줍니다.
                </p>
              </div>
            </div>
          )}

          {/* TAB: SCREENSHOTS & STORE ASSETS */}
          {activeTab === 'screenshots' && (
            <DarkScreenshotDownloader />
          )}

          {/* TAB 1: PLAY STORE TWA PACKAGING */}
          {activeTab === 'store' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">구글 플레이 등록용 다크모드 스크린샷 7종 완비</p>
                    <p className="text-[10px] text-slate-400">휴대전화 4장, 7인치 태블릿, 데스크톱, 1024x500 그래픽 이미지</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('screenshots')}
                  className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  스크린샷 7종 다운로드 →
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 space-y-2">
                <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  <span>Capacitor Android 네이티브 앱 빌드 (.aab) 안내</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  이 앱은 <strong>Capacitor + 네이티브 Google AdMob SDK</strong> 구조로 변환되었습니다.
                  안드로이드 기기에서는 Play 스토어 네이티브 앱(`.aab`)으로 출시하고, 아이폰(iOS) 방문자에게는 Safari PWA 설치를 안내합니다.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">🚀 플레이스토어 네이티브 출시 3단계</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>1. 웹 빌드 및 Android 프로젝트 동기화</span>
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      프로젝트 터미널에서 아래 명령어를 실행해 최신 웹 코드를 <code>android/</code> 네이티브 프로젝트에 반영합니다.
                    </p>
                    <div className="relative bg-slate-900 text-teal-300 p-2 rounded-lg text-[10px] font-mono overflow-x-auto">
                      <code>npm run cap:sync</code>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900">
                      2. Android Studio에서 서명된 App Bundle (.aab) 생성
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Android Studio에서 <code>android</code> 폴더를 연 뒤, 상단 메뉴 <strong>Build &gt; Generate Signed Bundle / APK &gt; Android App Bundle (.aab)</strong>로 서명 파일을 빌드합니다.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900">
                      3. Google Play Console에 업로드 & 출시
                    </span>
                    <p className="text-[11px] text-slate-600">
                      패키지 ID <code>kr.pe.cronya.twa</code>으로 등록하고 <code>.aab</code>와 스크린샷을 올리면 됩니다. 안드로이드 웹 브라우저 접속자는 자동으로 Play 스토어 설치 버튼을 보게 됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* AdMob in AndroidManifest */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                    <span>AndroidManifest.xml AdMob App ID & AD_ID 적용 완료</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">AndroidManifest.xml</span>
                </div>
                <div className="relative bg-slate-900 text-teal-300 p-2 rounded-lg text-[10px] font-mono overflow-x-auto">
                  <code>{`<meta-data\n  android:name="com.google.android.gms.ads.APPLICATION_ID"\n  android:value="ca-app-pub-2281115817010682~4985485283" />`}</code>
                  <button
                    onClick={() => handleCopy('<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-2281115817010682~4985485283" />', 'manifest-snippet')}
                    className="absolute top-1.5 right-1.5 py-0.5 px-2 bg-teal-700 text-white rounded text-[9px] font-bold cursor-pointer hover:bg-teal-600"
                  >
                    {copiedText === 'manifest-snippet' ? '복사됨!' : '태그 복사'}
                  </button>
                </div>
              </div>

              {/* Recommended ASO Keywords */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-900">
                  🎯 스토어 상위 노출 추천 키워드 (ASO)
                </span>
                <p className="text-[11px] text-slate-600">
                  <strong>앱 제목</strong>: 노안방지 - 하루 3분 가보르 시력 훈련<br />
                  <strong>핵심 검색어</strong>: 노안 예방, 시력 회복, 가보르 패치, 눈 피로, 눈 운동, 란돌트 시력 검사, 스마트폰 눈 피로
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH ENGINE SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 space-y-2">
                <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Globe className="w-4 h-4 text-teal-700" />
                  <span>네이버 & 구글 웹 검색 등록 안내</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  PWA는 일반 웹사이트의 특성을 그대로 가지고 있으므로 구글과 네이버 검색 엔진에 100% 등록됩니다. 사이트를 등록해두면 사용자가 '노안방지', '시력회복 앱' 등을 검색했을 때 웹사이트 상단에 노출됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">📌 포털 사이트별 등록 방법</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <span>네이버 서치어드바이저</span>
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      1. <a href="https://searchadvisor.naver.com" target="_blank" rel="noreferrer" className="text-teal-700 underline font-bold">searchadvisor.naver.com</a> 접속<br />
                      2. 웹마스터 도구에 앱 URL 등록<br />
                      3. 사이트맵에 <code>sitemap.xml</code> 제출 완료!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-blue-800 flex items-center gap-1">
                      <span>구글 서치콘솔</span>
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      1. <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-teal-700 underline font-bold">search.google.com</a> 접속<br />
                      2. URL 접두사에 앱 주소 입력<br />
                      3. 색인 생성 요청 및 sitemap.xml 제출!
                    </p>
                  </div>
                </div>
              </div>

              {/* Already Configured Features */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>앱 내 이미 완벽하게 구성된 검색 최적화(SEO) 항목</span>
                </span>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5">
                  <li><strong>OpenGraph & Twitter Card</strong>: 카카오톡, 페이스북, X 공유 시 예쁜 썸네일 카드 자동 생성</li>
                  <li><strong>Schema.org JSON-LD 구조화 데이터</strong>: 구글 검색 로봇이 시력 훈련 공식 앱으로 인식하도록 등록 완료</li>
                  <li><strong>robots.txt & sitemap.xml</strong>: 모든 포털 검색 로봇이 모든 페이지를 빠르게 수집하도록 개방</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: ADS & MONETIZATION */}
          {activeTab === 'monetization' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 space-y-2">
                <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs sm:text-sm">
                  <DollarSign className="w-4 h-4 text-teal-700" />
                  <span>Google AdMob 광고 연동 완료 내역</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  요청하신 <strong>Google AdMob</strong> 광고 단위가 앱 전체에 완벽하게 연동되었습니다.
                  사용자가 앱을 켜거나 훈련을 마쳤을 때, 그리고 화면 하단에 지속적으로 광고가 송출되어 수익을 창출합니다.
                </p>
              </div>

              {/* Configured AdMob IDs */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>현재 적용된 AdMob 광고 단위</span>
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                        📱 페이지 이동 전면 광고 (Interstitial Ad)
                      </span>
                      <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded text-[10px] font-bold">
                        페이지/탭 전환 & 훈련 완료 시
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      안드로이드 네이티브 앱에서 탭/페이지 이동 및 시력 측정·훈련 완료 시 네이티브 AdMob 전면 광고로 송출됩니다.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <code className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-800 truncate">
                        ca-app-pub-2281115817010682/8542034027
                      </code>
                      <button
                        onClick={() => handleCopy('ca-app-pub-2281115817010682/8542034027', 'open-ad')}
                        className="py-1 px-2.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-700"
                      >
                        {copiedText === 'open-ad' ? '복사됨!' : '복사'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                        🏷️ 하단 띠 배너 광고 (Bottom Banner Ad)
                      </span>
                      <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded text-[10px] font-bold">
                        Adaptive Bottom Banner
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      안드로이드 네이티브 화면 최하단에 적응형 띠 배너 광고가 고정 송출됩니다.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <code className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-800 truncate">
                        ca-app-pub-2281115817010682/9855115692
                      </code>
                      <button
                        onClick={() => handleCopy('ca-app-pub-2281115817010682/9855115692', 'banner-ad')}
                        className="py-1 px-2.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-700"
                      >
                        {copiedText === 'banner-ad' ? '복사됨!' : '복사'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-800 text-[11px]">
                      🆔 AdMob 앱 ID (APPLICATION_ID)
                    </span>
                    <p className="text-[11px] font-mono text-teal-800 font-bold">
                      ca-app-pub-2281115817010682~4985485283
                    </p>
                  </div>
                </div>
              </div>

              {/* Native AdMob Tip */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-950">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Google Play 콘솔 광고 ID 선언 안내</span>
                </span>
                <p className="text-[11px] leading-relaxed">
                  Capacitor 네이티브 앱에는 AdMob SDK와 <code>com.google.android.gms.permission.AD_ID</code> 권한이 포함되어 있으므로 Play Console에서 광고 ID 사용 여부를 <strong>'예(Yes)'</strong>로 선택하고 광고 목적으로 제출하시면 됩니다.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: MARKETING & VIRAL */}
          {activeTab === 'marketing' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 space-y-2">
                <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs sm:text-sm">
                  <TrendingUp className="w-4 h-4 text-teal-700" />
                  <span>사용자들이 저절로 찾아오게 만드는 3대 홍보 전략</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  광고비를 들이지 않고도 40~60대 노안 타깃과 스마트폰 눈 피로 20~30대 사용자를 끌어모으는 검증된 바이럴 방법입니다.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900">
                    1. 네이버 밴드 / 5060 동호회 카페 정보글 공유
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    "안과 의사가 추천하는 돈 안 드는 노안 극복법, 하루 3분 줄무늬 찾기"라는 제목으로 가보르 패치 원리를 설명하고 무료 체험 링크를 공유하면 부모님 세대 밴드에서 엄청난 조회수가 발생합니다.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900">
                    2. 카카오톡 단체방 '시력 자가 측정' 챌린지
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    "내 시력 1.2 나왔는데 너는 몇 나옴?" 형태로 가족 단톡방이나 지인 모임에 앱 링크를 공유하면 재미 삼아 테스트해 본 뒤 홈 화면에 설치하게 됩니다.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900">
                    3. 유튜브 쇼츠 / 인스타 릴스 숏폼 영상
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    앱 화면을 15초 녹화하여 "스마트폰 오래 봐서 눈 침침할 때 10초 만에 찾는 줄무늬 테스트" 영상으로 올리고 고정 댓글에 링크를 남기면 하루 수백 명이 유입됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DESIGN & STORE DOCUMENTATION (.MD) */}
          {activeTab === 'docs' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 space-y-2">
                <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs sm:text-sm">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  <span>설계 문서 & 플레이스토어 출시 가이드 (MD 파일)</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  개발 진행 설계 내역과 구글 플레이스토어 TWA 출시 절차가 마크다운(<code>.md</code>) 파일로 프로젝트 내부에 영구 보관되어 있습니다.
                  언제든지 다운로드하여 내 PC에 소장하거나 웹 주소로 바로 열어보실 수 있습니다.
                </p>
              </div>

              {/* Document 1: PLAYSTORE_TWA_GUIDE.md */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">PLAYSTORE_TWA_GUIDE.md</p>
                      <p className="text-[10px] text-slate-400">
                        스토어 출시, 주소창 제거, AAB 업데이트 원리 가이드
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded-full font-mono">
                    /docs/
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-800/80 p-2.5 rounded-xl space-y-1">
                  <p>• <strong>웹뷰 구동 원리</strong>: TWA 크롬 풀스크린 런처 동작 방식</p>
                  <p>• <strong>실시간 자동 반영</strong>: 웹 수정 시 AAB 재빌드 및 구글 심사 불필요</p>
                  <p>• <strong>도메인 인증</strong>: <code>assetlinks.json</code> FTP 배치 방법</p>
                  <p>• <strong>구글 플레이 콘솔</strong>: 정책 설문, ASO 키워드, AAB 업로드 4단계</p>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href="./docs/PLAYSTORE_TWA_GUIDE.md"
                    download="PLAYSTORE_TWA_GUIDE.md"
                    className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>MD 파일 다운로드</span>
                  </a>
                  <button
                    onClick={() => handleCopy('https://cronya.pe.kr/eye/docs/PLAYSTORE_TWA_GUIDE.md', 'doc-url-1')}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText === 'doc-url-1' ? '복사됨!' : '웹 URL 복사'}</span>
                  </button>
                </div>
              </div>

              {/* Document 2: PROJECT_DESIGN_DOCUMENT.md */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">PROJECT_DESIGN_DOCUMENT.md</p>
                      <p className="text-[10px] text-slate-400">
                        프로젝트 시스템 아키텍처 및 과학적 알고리즘 설계서
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded-full font-mono">
                    /docs/
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-800/80 p-2.5 rounded-xl space-y-1">
                  <p>• <strong>가보르 패치 수학</strong>: 2D 가우스 가보르 함수 및 뇌 시각피질 자극 수식</p>
                  <p>• <strong>란돌트 C 시력 검사</strong>: 국제 안과 표준 분각(arcmin) 시력 변환식</p>
                  <p>• <strong>Google AdMob</strong>: 앱 오프닝 전면 광고 및 45초 자동 배너 단위 규격</p>
                  <p>• <strong>오프라인 PWA</strong>: Workbox Service Worker 캐시 및 오디오 엔진 설계</p>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href="./docs/PROJECT_DESIGN_DOCUMENT.md"
                    download="PROJECT_DESIGN_DOCUMENT.md"
                    className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>MD 파일 다운로드</span>
                  </a>
                  <button
                    onClick={() => handleCopy('https://cronya.pe.kr/eye/docs/PROJECT_DESIGN_DOCUMENT.md', 'doc-url-2')}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText === 'doc-url-2' ? '복사됨!' : '웹 URL 복사'}</span>
                  </button>
                </div>
              </div>

              {/* ZIP inclusion info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span>배포 압축파일(cronya_eye_deploy.zip) 내 자동 포함 안내</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  위 두 문서 파일은 <code>cronya_eye_deploy.zip</code> 압축 파일 내부의 <code>docs/</code> 폴더에도 기본 포함되어 있습니다. 압축을 푸시면 인터넷 연결 없이도 언제든 마크다운 뷰어나 메모장으로 열람하실 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close */}
        <button
          onClick={onClose}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          확인 완료 및 닫기
        </button>
      </div>
    </div>
  );
};
