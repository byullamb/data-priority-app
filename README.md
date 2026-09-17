# 데이터 우선순위 앱

1차/2차 카테고리 데이터를 관리하고, 가중치를 매기고, Tree Map / Circle Packing / Sunburst 차트로 시각화하는 React + D3 앱입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 아이콘 준비

PWA 아이콘 파일을 `public/` 폴더에 추가하세요 (임의의 정사각형 PNG면 충분합니다):
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)

## GitHub Pages 배포

```bash
npm install -D gh-pages
npm run deploy
```

- `vite.config.js`의 `base: '/data-priority-app/'`를 실제 GitHub 저장소 이름으로 변경하세요.
- 배포 후 `https://<username>.github.io/<repo-name>/` 에서 접속 가능합니다.
- 모바일 브라우저에서 "홈 화면에 추가"를 하면 오프라인 PWA로 사용할 수 있습니다.

## 주요 기능

- **관리 모드**: 1차 카테고리 추가/삭제, 탭하여 2차 카테고리 추가, 더블탭으로 가중치 입력
  - 2차 카테고리가 있으면 1차 가중치는 숨겨지고, 2차를 모두 삭제하면 1차 가중치가 복원됩니다.
- **우선순위 모드**: 항목을 위/아래로 스와이프(또는 버튼)하여 순위 변경
- **시각화 모드**: Tree Map / Circle Packing / Sunburst 차트, 1차/2차 세분화 전환
- **JSON 내보내기/가져오기**: 데이터 백업 및 복원

## 데이터 저장

브라우저의 `localStorage`에 저장됩니다 (기기별로 별도 저장).
