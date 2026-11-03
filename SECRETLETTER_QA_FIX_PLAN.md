# SECRET LETTER — QA Audit & Immediate Fix Plan

**Dự án:** [DatMoiTapDev/secretletter](https://github.com/DatMoiTapDev/secretletter)  
**Bản demo:** https://datmoitapdev.github.io/secretletter/  
**Ngày lập:** 02/11/2026  
**Vai trò:** QA / Software Tester (black-box test planning + source-code inspection)  
**Phạm vi:** React/Vite frontend, GitHub Pages static adapter, Firebase Realtime Database synchronization, Express backend, trải nghiệm đọc/gửi thư.

> **Phân biệt bằng chứng:** Những mục đánh dấu **CODE-CONFIRMED** là vấn đề/rủi ro xác nhận qua mã nguồn nhánh `main`, không đồng nghĩa đã tái hiện trên bản production. **TEST-REQUIRED** là giả thuyết cần kiểm chứng bằng trình duyệt, Network/Console, Firebase Rules và đa thiết bị. Chưa thực hiện kiểm thử tương tác hay Lighthouse; không ghi số liệu đo giả.

## 1. Kết luận kiểm thử và quyết định phát hành

**Khuyến nghị: NO-GO cho thư riêng tư/tài khoản thật cho đến khi xử lý P0.** Có khóa mã hóa dùng chung đặt trong frontend công khai, dữ liệu cloud được mã hóa XOR, và quá trình đồng bộ có khả năng tranh chấp ghi đè. Không được mô tả cơ chế hiện tại là *end-to-end encryption* hay *bảo mật tuyệt đối*.

**Phương án xử lý tức thời (không đòi hỏi refactor lớn):**
1. Tạm giới hạn website ở chế độ **demo không chứa thông tin nhạy cảm**; đặt thông báo ngắn rằng dữ liệu không phù hợp cho thư riêng tư cho đến khi nâng cấp bảo mật.
2. Tạm **vô hiệu hóa ghi cloud từ client** (`pushToCloudDb`) và các hành động tạo/sửa dữ liệu thật nếu chưa bảo vệ bằng Firebase Authentication và Security Rules; tránh tiếp tục đẩy plaintext có thể khôi phục hoặc làm hỏng dữ liệu trên nhiều máy. Kiểm tra sao lưu rồi mới thực hiện.
3. Chụp snapshot/export có kiểm soát dữ liệu hiện có và phiên bản Firebase Rules (không đưa dữ liệu thật vào repo), xác minh khôi phục được trước mọi thay đổi.
4. Đổi/thu hồi khóa và token máy chủ liên quan **sau khi triển khai cơ chế thay thế**. Không coi việc thay chuỗi bí mật trong JavaScript là cách sửa bảo mật.
5. Nếu cloud đang mở read/write công khai, **khóa quyền ngay** theo nguyên tắc deny-by-default, sau khi chuẩn bị đường truy cập hợp lệ cho dữ liệu cần bảo toàn.

## 2. Danh sách lỗi / rủi ro theo mức ưu tiên

| ID | Mức | Trạng thái | Vị trí | Phát hiện và tác động | Cách khắc phục ngay | Giải pháp lâu dài | Điều kiện nghiệm thu |
|---|---|---|---|---|---|---|---|
| SEC-01 | **P0** | CODE-CONFIRMED | `client/src/api/mockAdapter.js`: `VAULT_SECRET`, `encryptVaultData`, `decryptVaultData` | XOR sử dụng khóa cố định xuất hiện trong frontend public; người có ciphertext và bundle có thể giải mã. Không đạt E2EE. | Ngừng gọi đây là E2EE; tránh lưu thư riêng tư mới; hạn chế cloud ghi/đọc đến khi có quy tắc truy cập. | Thiết kế phân quyền Firebase Auth + Rules; nếu cần E2EE dùng Web Crypto AES-GCM với khóa chỉ người gửi/nhận kiểm soát, KDF/trao đổi khóa phù hợp, nonce mới mỗi lần, phiên bản payload và quy trình khôi phục khóa. | Người chưa đăng nhập không đọc/ghi được dữ liệu riêng; attacker có bundle + ciphertext nhưng không có khóa người dùng không thể đọc nội dung; test sai khóa và tamper đều thất bại. |
| SEC-02 | **P0** | CODE-CONFIRMED | `mockAdapter.js`: `verifyAdminKey`, `VALID_SYSTEM_SIG`, `VITE_ADMIN_KEY` | Quyết định quyền quản trị được thực hiện ở client; secret build-time `VITE_*` không được coi là bí mật. Client có thể bị chỉnh sửa/bỏ qua kiểm tra. | Tắt thao tác admin thay đổi cloud nếu chưa có xác thực server-side. | Dùng Firebase Auth custom claims + Rules hoặc Express backend kiểm tra quyền thực tại mỗi API; không tin token/role tự đặt trong localStorage. | Truy cập API admin không có session, role giả mạo, tài khoản member: 401/403; không chỉ ẩn nút UI. |
| SEC-03 | **P0** | TEST-REQUIRED | Firebase RTDB `vault_data.json` | Frontend đọc và `PUT` vào URL Firebase RTDB trực tiếp; chưa xem được Firebase Security Rules, **chưa xác nhận DB đang public**. Nếu Rules cho phép client vô danh ghi toàn bộ node thì có nguy cơ đọc/ghi/xóa toàn bộ dữ liệu. | Kiểm tra Rules và quyền thực tế bằng tài khoản test; deny-by-default trước khi mở dữ liệu thật. | Cấu trúc `/users/{uid}`, `/letters/{id}`, per-resource Rules/ownership; không cho client `PUT` cả kho. | Người vô danh đọc/ghi bị từ chối; user A không đọc/sửa thư của B; admin được phép theo policy; test bằng Firebase Emulator. |
| DATA-01 | **P0/P1** | CODE-CONFIRMED (race risk) | `setupGitHubPagesMock`, `syncWithCloudDb`, `seed-data.json`, `importSyncPayload` | Khởi động hai fetch bất đồng bộ (Firebase và seed); cả hai có thể thay thế users/letters/vibe trong localStorage. Kết quả phụ thuộc tác vụ hoàn thành sau. | Chỉ nạp seed khi chưa có dữ liệu hoặc dữ liệu chưa được khởi tạo; đợi cloud xong, áp dụng ưu tiên nguồn; snapshot trước khi migrate. | Định nghĩa source-of-truth + state machine `loading/ready/error`, version/revision, merge theo ID, đồng bộ có transaction và conflict handling. | Reload nhiều lần ở 2 máy không tự phục hồi thư cũ/ghi đè bản mới; seed không được thay cloud mới hơn. |
| DATA-02 | **P1** | CODE-CONFIRMED (lost-update risk) | `pushToCloudDb()` | `PUT /vault_data.json` ghi nguyên payload; hai thiết bị sửa gần nhau có thể ghi đè nhau; `.catch(() => {})` nuốt lỗi. | Tạm serialize việc sửa; thông báo lỗi đồng bộ thay vì im lặng; sao lưu trước ghi. | Ghi theo letter ID, optimistic concurrency/ETag/transaction, retry có backoff, trạng thái sync rõ ràng, audit log. | Hai thiết bị cập nhật hai thư độc lập đều còn; mất mạng hiện `Chưa đồng bộ`, kết nối lại đồng bộ đúng, không mất dữ liệu. |
| DATA-03 | **P1** | CODE-CONFIRMED | `getSyncPayload`, `importSyncPayload`, `localStorage` | Toàn bộ thư/tài khoản nằm localStorage, có thể đầy dung lượng (đặc biệt ảnh base64/iOS) và dữ liệu dễ bị sửa từ client. | Giới hạn kích thước ảnh, thêm cảnh báo quota + bản sao lưu, tránh lưu ảnh base64 lớn. | Cloud storage cho tệp, DB metadata, offline cache IndexedDB có migration và integrity checks. | Test quota exceeded, chế độ riêng tư, clear storage, offline, thao tác thất bại có thông báo rõ. |
| UX-01 | **P1** | CODE-CONFIRMED | `index.html` | `maximum-scale=1, user-scalable=no` hạn chế phóng to bằng thao tác zoom, giảm accessibility. | Bỏ `maximum-scale` và `user-scalable=no`. | Kiểm toán WCAG, hỗ trợ zoom 200% và text resize. | Phóng to 200% trên mobile không mất nội dung/nút. |
| PERF-01 | **P1** | CODE-CONFIRMED (asset weight), TEST-REQUIRED (impact) | `public/audio/*.mp3`, `Home.jsx`, `soundEngine.js` | Bốn tệp MP3 trong repository có tổng kích thước khoảng 13,5 MB; chưa xác nhận cả bốn được tải ở lần mở đầu. `Home` gọi `playRandomTrack` khi vào trang. | Chỉ tải âm thanh sau khi có hành động người dùng, `preload=none/metadata`, hiển thị bật/tắt rõ ràng. | Nén audio hợp lý, CDN cache, đo waterfall, chọn track theo nhu cầu. | Initial load không download file âm thanh chưa dùng; autoplay-block không lỗi Console; điều khiển âm lượng hoạt động. |
| PERF-02 | **P1/P2** | TEST-REQUIRED | `ParticleCanvas`, `FloatingBubbles`, `Envelope3D` | Hiệu ứng Canvas/3D có thể tụt FPS hoặc nóng máy trên thiết bị yếu. Chưa đo hiệu năng. | Tắt/giảm animation khi `prefers-reduced-motion`, tab hidden, battery/data saver; giới hạn DPR và số lượng hạt. | Đo FPS, long tasks, INP trên mobile thật; lazy mount effects và animation budget. | Không bị kẹt thao tác; giảm chuyển động thực sự giảm hiệu ứng; tab background không chạy loop liên tục. |
| PERF-03 | **P2** | CODE-CONFIRMED (structure) | `App.jsx`, trang admin/editor | Các page nhập tĩnh trong router; chưa xác nhận kích thước bundle production. | Dùng `React.lazy` + `Suspense` cho Admin, MemberCompose, RecipientView nếu hợp lý. | Phân tích bundle, chia chunk theo route và giảm phụ thuộc lớn. | Build thành công; route chỉ tải chunk khi mở; deep-link vẫn chạy. |
| UX-02 | **P2** | CODE-CONFIRMED | `Home.jsx` | Dark mode mặc định `false`, chưa lưu lựa chọn người dùng. | Lưu theme preference và đồng bộ với `prefers-color-scheme` khi không có lựa chọn. | Centralized appearance settings, tránh flash theme khi load. | Reload giữ theme; light/dark hiển thị đúng. |
| UX-03 | **P2** | TEST-REQUIRED | Trình soạn/thư | Cần kiểm tra auto-save, cảnh báo rời trang, trình tự mở thư, trạng thái thao tác. Không kết luận là lỗi khi chưa test. | Bổ sung thông báo rõ sau lưu/gửi và thông báo lỗi. | Draft autosave versioned, confirmation và hỗ trợ keyboard. | Không mất nội dung nhập khi điều hướng ngoài ý muốn theo đặc tả; mọi nút có feedback. |
| DEPLOY-01 | **P1** | CODE-CONFIRMED | `vite.config.js`, `main.jsx`, `mockAdapter.js`, GH Pages | GitHub Pages không chạy Express; bản public dùng mock adapter cho `/api`, nên không thể suy luận rằng auth/rate limit của Express đang bảo vệ mọi hành động trên site. | Gắn nhãn rõ **Demo/static**; không quảng bá server protections cho GH Pages. | Tách frontend hosting và backend thật, hoặc Firebase Auth + Rules cho kiến trúc serverless. | Site public dùng đúng backend/auth production; phép thử deny permission thực sự bị từ chối. |
| SEC-04 | **P2** | CODE-CONFIRMED | `server/security.js` | `getClientIp` tin `x-forwarded-for` trực tiếp; khi không có reverse proxy đáng tin có thể bị spoof. `X-XSS-Protection` đã lỗi thời. | Chỉ trust proxy được kiểm soát; bỏ header lỗi thời. | Dùng rate-limit middleware có proxy config chuẩn, CSP/HSTS trên HTTPS, logging/metrics; không coi rate limiting là chống DDoS toàn diện. | Test spoof IP không vượt giới hạn; header CSP và cấu hình proxy phù hợp môi trường. |

## 3. Test cases thực thi thủ công (phải ghi bằng chứng)

| Test ID | Tiền điều kiện & bước kiểm thử | Kỳ vọng | Bằng chứng |
|---|---|---|---|
| T-01 | Mở homepage trong Incognito trên desktop và mobile | Màn hình chủ đề hiển thị, không lỗi Console/network | Screenshot + Console |
| T-02 | Chọn từng chủ đề Tết, Sinh nhật, Yêu, Tâm tình | Chủ đề, màu, âm nhạc/điều khiển phản hồi đúng; không phát nhạc ngoài ý muốn | Video ngắn + Network |
| T-03 | Nhập tên người nhận đúng/sai ở khóa 1 và mã đúng/sai khóa 2 | Không lộ dữ liệu khi sai; lỗi rõ; đúng thì mở đúng thư | Screenshots (dùng dữ liệu giả) |
| T-04 | Mở trực tiếp `/secretletter/letter/{id}` ở tab mới, reload | Route không 404; đúng màn hình | URL + screenshot |
| T-05 | Login member/admin, thử vào `/admin` bằng member hoặc không đăng nhập | UI và **backend/DB** đều chặn thao tác không có quyền | Network 401/403/Rules test |
| T-06 | Hai trình duyệt/máy cùng tải dữ liệu, mỗi máy sửa một thư khác nhau | Không mất thư hoặc ghi đè bản cập nhật | IDs/timestamps sau sync |
| T-07 | Thay đổi thư rồi ngắt mạng, reload, nối lại | Thấy trạng thái offline/chưa đồng bộ, dữ liệu không mất | Network offline logs |
| T-08 | Dọn localStorage rồi mở site hoặc thử quota exceeded | Có hướng dẫn/phục hồi hợp lý; không hiện trang trắng | Console + screenshot |
| T-09 | Trên 360px, 390px, tablet, desktop; zoom 200% | Không tràn ngang, không che nút, chữ đọc được | Bộ screenshots |
| T-10 | `prefers-reduced-motion`, keyboard Tab/Enter/Escape, screen reader | Focus rõ; có thể dùng không chuột; giảm hiệu ứng | Video + accessibility scan |
| T-11 | Chrome, Edge, Firefox, Safari iOS; mở/reload/deep-link | Chức năng quan trọng nhất quán | Matrix browser |
| T-12 | Lighthouse Mobile/desktop trên bản production | Ghi baseline Performance/Accessibility/Best Practices, so sánh sau sửa | File report (không tự đặt điểm) |
| T-13 | Test Firebase Rules bằng emulator: anonymous, member A, member B, admin | Không đọc/ghi được ngoài quyền được cấp | Test log |
| T-14 | Thử sửa/xóa bất hợp pháp bằng DevTools trực tiếp với Firebase API **chỉ trên dự án test/authorized** | Security Rules từ chối ngoài quyền; UI không đủ để bảo vệ | HTTP 401/403 và audit log |
| T-15 | Upload ảnh lớn, audio không hợp lệ, nhiều ảnh | Không crash, thông báo giới hạn chính xác | Screenshot + Network |

**Chú ý:** Không thử brute force trên production hoặc xuất bản dữ liệu khách hàng. Dùng Firebase Emulator, tài khoản và dữ liệu kiểm thử riêng.

## 4. Phương án triển khai đề xuất (theo thứ tự)

### Giai đoạn A — Hotfix P0 (chặn rủi ro, bảo toàn dữ liệu)
- [ ] Sao lưu dữ liệu JSON/Firebase và thử khôi phục trên môi trường staging.
- [ ] Kiểm tra Firebase Rules và giới hạn quyền truy cập ngay.
- [ ] Tạm tắt thao tác ghi cloud của GH Pages cho dữ liệu thật khi chưa có auth/RBAC.
- [ ] Bỏ mọi khẳng định “E2EE/bảo mật tuyệt đối” trên UI/README.
- [ ] Tạo issue cho SEC-01, SEC-02, SEC-03, DATA-01.
- [ ] Thiết lập staging Firebase project riêng, không thử thay đổi cấu trúc trực tiếp trên dữ liệu thật.

### Giai đoạn B — Sửa kiến trúc bảo mật/dữ liệu
- [ ] Chọn rõ **một** mô hình production: (1) Firebase Auth + RTDB Rules/Storage hoặc (2) Express backend + DB/Auth. Không triển khai nửa mock nửa server dưới cùng một lời hứa bảo mật.
- [ ] Chuyển credential/quyền kiểm tra sang hệ thống tin cậy; role chỉ lấy từ trusted claims/server.
- [ ] Thiết kế database record theo `uid`/`letterId`, xác định quyền owner/recipient/admin, validation và giới hạn kích thước.
- [ ] Dùng giao dịch hoặc revision/ETag thay vì `PUT` ghi đè toàn kho.
- [ ] Chuyển quá trình seed thành migration một lần và chỉ chạy trong staging hoặc dữ liệu trống.
- [ ] Nếu E2EE thực sự là yêu cầu: thiết kế threat model, khóa mã hóa không hardcode, Web Crypto AES-GCM + quy trình chia sẻ/khôi phục khóa được review riêng. Firebase encryption-at-rest không đồng nghĩa E2EE.
- [ ] Viết automated tests cho authentication, authorization, sync race, concurrent edits, offline/retry.

### Giai đoạn C — UX, hiệu năng, accessibility
- [ ] Bỏ khóa zoom; kiểm tra 200% zoom.
- [ ] Tối ưu tải MP3 theo nhu cầu, thêm điều khiển âm thanh có trạng thái rõ.
- [ ] `prefers-reduced-motion`, giảm particle trên mobile, pause khi tab inactive.
- [ ] Route-based code splitting/lazy imports; kiểm tra bundle bằng build analyzer.
- [ ] Giữ dark mode qua reload; hỗ trợ focus, keyboard, alt/aria, loading/error/empty states.
- [ ] Chạy Lighthouse + test trên thiết bị thật trước/sau tối ưu.

## 5. Quy tắc Definition of Done cho mỗi ticket

Một fix chỉ được đánh dấu **DONE** khi đủ các mục:
1. Có mô tả lỗi, reproduction steps, expected/actual và bằng chứng trước sửa (nếu đã tái hiện).
2. Code sửa trên branch riêng, không đính kèm secret/tài khoản thực.
3. Có unit/integration test phù hợp hoặc manual test case được thực hiện.
4. `npm run build` thành công, không còn error mới ở Console/Network.
5. Kiểm tra regression trên GitHub Pages routing, đọc thư, login, editor và đồng bộ.
6. Ghi kết quả và screenshot/test log sau sửa, có người review trước merge.
7. Có rollback plan (DB snapshot + commit/tag), nhất là migrations.

## 6. Prompt triển khai cho coding agent

> Hãy đóng vai Senior Full-stack Engineer + QA. Làm việc trên repository `DatMoiTapDev/secretletter`. Đọc `SECRETLETTER_QA_FIX_PLAN.md` và triển khai theo từng nhóm ticket ưu tiên. **Bắt đầu bằng audit và hotfix P0**, không được khẳng định đã kiểm thử UI hoặc đã bảo mật nếu chưa có test chứng minh. Tạo branch/PR thay vì push thẳng main; không tự ý xóa/migrate dữ liệu người dùng hoặc thay Firebase Rules production khi chưa có snapshot/đường rollback. Giữ nguyên UI cảm xúc, hiệu ứng phong bì và bốn chủ đề. Mỗi PR gồm: root cause, files changed, test results, evidence, risk/rollback. Với SEC-01/SEC-02/SEC-03, ưu tiên kiến trúc tin cậy và Rules; không vá bằng cách đổi secret hardcode ở frontend. Sau P0 tiếp tục sửa data race, tránh lost updates, rồi mới tối ưu hiệu năng và accessibility.

## 7. Nguồn mã đã đối chiếu

- `client/src/api/mockAdapter.js` — localStorage adapter, admin signature, fixed-key XOR, Firebase sync.
- `client/src/App.jsx` và `client/src/main.jsx` — routing, Pages basename và adapter.
- `client/src/pages/Home.jsx` — nhạc tự phát, theme state và Canvas.
- `index.html` — viewport.
- `public/audio/*.mp3` — kích thước tệp âm thanh (theo cây repository).
- `vite.config.js` — base path và proxy chỉ cho môi trường dev.
- `server/security.js` — rate limits và HTTP security headers.
- `server/scripts/deploy_gh_pages.js` — seed bundle cho static Pages.
- `README.md` — mô tả tính năng/bảo mật, cần cập nhật sau khi sửa.

**Nguyên tắc QA:** Ưu tiên an toàn dữ liệu và khả năng phục hồi, sau đó mới tới hiệu năng/giao diện. Không cho phát hành khi chưa xác nhận phân quyền thực sự được thực thi tại backend/Firebase Rules.
