# Android 네이티브(Capacitor + AdMob) & iOS PWA 듀얼 출시 가이드

- **프로젝트명**: 노안방지 - 하루 3분 가보르 시력 훈련 (`kr.pe.cronya.twa`)
- **웹 배포 주소**: https://cronya.pe.kr/eye/
- **Android 앱 방식**: Capacitor 네이티브 앱 + Google AdMob SDK (`.aab` 빌드)
- **iOS 웹 앱 방식**: Safari PWA ("홈 화면에 추가")

---

## 1. 플랫폼별 동작 구조 (Android vs iOS vs Web)

1. **Android 네이티브 앱 (Google Play 설치 사용자)**
   - React + Vite 빌드(`dist/`)가 Capacitor Android 앱 내부에 내장되어 실행됩니다.
   - **네이티브 Google AdMob SDK**(`@capacitor-community/admob`)로 실제 광고가 송출됩니다.
     - AdMob 앱 ID: `ca-app-pub-2281115817010682~4985485283`
     - 하단 띠 배너 광고: `ca-app-pub-2281115817010682/9855115692`
     - 페이지 이동·완료 전면 광고: `ca-app-pub-2281115817010682/8542034027`
   - 웹 PWA 설치 안내 버튼과 웹 AdSense 배너는 자동으로 숨겨집니다.

2. **Android 웹 브라우저 접속자 (`https://cronya.pe.kr/eye/`)**
   - 크롬/삼성 인터넷 등 안드로이드 브라우저로 웹 URL에 접속하면 PWA 설치 팝업 대신 **Google Play 스토어 설치 버튼**을 안내합니다.

3. **iPhone / iPad (iOS Safari) 접속자 (`https://cronya.pe.kr/eye/`)**
   - 아이폰 사용자는 별도 앱스토어 설치 없이 Safari 하단 **[공유 ⎋] → [홈 화면에 추가 ⊞]**를 통해 PWA 앱처럼 바로 설치해 사용할 수 있도록 안내합니다.

---

## 2. Android Studio에서 `.aab` 빌드하기

1. 프로젝트 루트에서 웹 빌드 및 Android 네이티브 동기화 실행:
   ```bash
   npm run cap:sync
   ```
2. Android Studio에서 `android` 폴더 열기 (또는 `npm run cap:open`)
3. 상단 메뉴 **Build > Generate Signed Bundle / APK > Android App Bundle (.aab)** 선택
4. 서명 키스토어(`*.jks` 또는 `*.keystore`)로 Release 빌드 생성
5. 생성된 `android/app/release/app-release.aab` 파일을 Google Play Console에 업로드

---

## 3. Google Play Console 광고 ID (`AD_ID`) 선언 안내

이 네이티브 프로젝트의 `AndroidManifest.xml`에는 Google AdMob SDK와 함께 아래 권한이 포함되어 있습니다:
- `<uses-permission android:name="com.google.android.gms.permission.AD_ID" />`
- `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-2281115817010682~4985485283" />`

따라서 Play Console **앱 콘텐츠 > 광고 ID** 질문에서는:
- **"앱에서 광고 ID를 사용합니까?"** → **[예 (Yes)]** 선택
- **목적**: **[광고 또는 마케팅]** 체크 후 저장하시면 됩니다.
