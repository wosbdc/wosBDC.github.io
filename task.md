# Task: Fix iOS Mobile Sidebar & Background Scroll Leak

- [x] Create automated project backup archive (`backup_wos_v2.9.29_pre_ios_sidebar_fix.zip`) <!-- id: 0 -->
- [ ] Fix Z-index layering (`.sidebar-overlay` z-index 99990, `.settings-sidebar` z-index 99999) so navbar (z-index 9990) cannot bleed through or receive touches <!-- id: 1 -->
- [ ] Implement iOS body scroll lock (`body.sidebar-open`, `body.mobile-menu-open`, `touch-action: none`, `overscroll-behavior: contain`) <!-- id: 2 -->
- [ ] Upgrade `.settings-sidebar` and `.mobile-menu` with `height: 100dvh`, `-webkit-overflow-scrolling: touch`, `touch-action: pan-y`, and transform-based sliding animations <!-- id: 3 -->
- [ ] Add touchmove event cancellation on `.sidebar-overlay` to block iOS rubber-band dragging of background document <!-- id: 4 -->
- [ ] Bump version to `v2.9.30` across `package.json`, `index.html`, `version.json`, `public/version.json`, `public/sw.js`, and `CHANGELOG.md` <!-- id: 5 -->
- [ ] Run full automated test suite & build validation (`cmd /c npm run build`) <!-- id: 6 -->
- [ ] Commit and push to GitHub with `v2.9.30 : ...` title <!-- id: 7 -->













