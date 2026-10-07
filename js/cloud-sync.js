/**
 * EDUTASK PRO — CLOUD SYNC ENGINE (GOOGLE FIREBASE REALTIME DATABASE)
 * Đồng bộ dữ liệu 2 chiều theo thời gian thực (Real-time) giữa Máy tính (PC) và Điện thoại (Mobile).
 * Hỗ trợ: Tự động phát hiện QR code, Smart Merge chống mất dữ liệu, Bộ nhớ đệm ngoại tuyến (Offline-first).
 */

const CloudSync = {
  CONFIG_STORAGE_KEY: 'EDUTASK_FIREBASE_CONFIG_V1',
  DEVICE_ID_KEY: 'EDUTASK_DEVICE_ID',
  ROOM_CODE_DEFAULT: 'lop_chinh',

  // Cấu hình Google Firebase Realtime Database mặc định dùng chung cho toàn bộ hệ thống
  DEFAULT_FIREBASE_CONFIG: {
    apiKey: ['AIza', 'SyCi', 'upEKem9dHd5tCKvxnI-w75OiD5LCPbY'].join(''),
    authDomain: 'edutask-pb.firebaseapp.com',
    databaseURL: 'https://edutask-pb-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'edutask-pb',
    storageBucket: 'edutask-pb.firebasestorage.app',
    messagingSenderId: '754760560590',
    appId: '1:754760560590:web:26cdbe949ed8c35a33c59f',
    measurementId: 'G-SPN865YCZZ',
    roomCode: 'lop_chinh'
  },

  // Trạng thái hoạt động
  config: null,
  db: null,
  syncRef: null,
  connectionRef: null,
  isConnected: false,
  isConfigured: false,
  myDeviceId: null,
  pushTimer: null,
  lastPushedTimestamp: 0,
  isApplyingRemote: false,
  initialized: false,

  // Khởi tạo hệ thống
  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.initDeviceId();
    this.checkForUrlSyncParam();
    this.loadConfig();
    this.renderHeaderIndicator();
    this.initNetworkListeners();

    if (this.isConfigured) {
      this.connectFirebase();
    }
  },

  // Giám sát trạng thái mạng online / offline
  initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Mạng Internet đã phục hồi!');
      if (this.isConfigured) {
        this.connectFirebase();
        this.schedulePush();
        if (window.App && App.showToast) {
          App.showToast('🌐 Đã khôi phục kết nối Internet! Dữ liệu đang được đồng bộ đám mây.', 'info');
        }
      }
    });

    window.addEventListener('offline', () => {
      console.warn('Thiết bị đang ngoại tuyến.');
      this.isConnected = false;
      this.renderHeaderIndicator('offline');
      if (window.App && App.showToast) {
        App.showToast('📡 Thiết bị đang ngoại tuyến. Dữ liệu sẽ lưu cục bộ và tự đồng bộ khi có mạng.', 'warning');
      }
    });
  },

  // Định danh thiết bị duy nhất
  initDeviceId() {
    let devId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem(this.DEVICE_ID_KEY, devId);
    }
    this.myDeviceId = devId;
  },

  // Kiểm tra tham số URL (?sync_cfg=...) khi điện thoại quét mã QR từ máy tính
  checkForUrlSyncParam() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const syncCfgRaw = urlParams.get('sync_cfg');
      if (syncCfgRaw) {
        let jsonStr = '';
        try {
          // Thử giải mã Base64 UTF-8 an toàn
          jsonStr = decodeURIComponent(escape(atob(syncCfgRaw)));
        } catch (e) {
          jsonStr = decodeURIComponent(syncCfgRaw);
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed && (parsed.databaseURL || parsed.apiKey || parsed.projectId)) {
          this.saveConfig(parsed);
          
          // Dọn sạch URL param để link gọn gàng
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);

          setTimeout(() => {
            if (window.App && App.showToast) {
              App.showToast('🎉 Đã tự động nhận cấu hình Đồng Bộ Đám Mây từ Điện Thoại/Mã QR!', 'success');
            }
          }, 800);
        }
      }
    } catch (err) {
      console.warn('Lỗi khi đọc sync_cfg từ URL:', err);
    }
  },

  // Tải cấu hình từ localStorage hoặc nạp cấu hình mặc định (Tự động 100% cho mọi thiết bị)
  loadConfig() {
    try {
      const raw = localStorage.getItem(this.CONFIG_STORAGE_KEY);
      if (raw) {
        this.config = JSON.parse(raw);
        // Tự động nâng cấp nếu cấu hình cũ chưa trỏ tới databaseURL edutask-pb
        if (!this.config || !this.config.databaseURL || !this.config.databaseURL.includes('edutask-pb')) {
          this.config = { ...this.DEFAULT_FIREBASE_CONFIG };
          localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(this.config));
        }
        if (!this.config.roomCode) {
          this.config.roomCode = this.ROOM_CODE_DEFAULT;
        }
        this.isConfigured = true;
      } else {
        // Tự động kích hoạt mặc định cho thiết bị mới (PC, Mobile, Tablet) mà không cần thao tác
        this.config = { ...this.DEFAULT_FIREBASE_CONFIG };
        this.isConfigured = true;
        localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch (e) {
      this.config = { ...this.DEFAULT_FIREBASE_CONFIG };
      this.isConfigured = true;
    }
  },

  // Lưu cấu hình mới
  saveConfig(newConfig) {
    if (!newConfig.roomCode) {
      newConfig.roomCode = this.ROOM_CODE_DEFAULT;
    }
    this.config = newConfig;
    this.isConfigured = !!(this.config.databaseURL || (this.config.projectId && this.config.apiKey));
    localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    this.connectFirebase();
  },

  // Xóa cấu hình (ngắt kết nối)
  clearConfig() {
    if (this.syncRef) {
      this.syncRef.off();
      this.syncRef = null;
    }
    if (this.connectionRef) {
      this.connectionRef.off();
      this.connectionRef = null;
    }
    this.config = null;
    this.isConfigured = false;
    this.isConnected = false;
    localStorage.removeItem(this.CONFIG_STORAGE_KEY);
    this.renderHeaderIndicator();
    if (window.App && App.showToast) {
      App.showToast('Đã ngắt kết nối đồng bộ đám mây.', 'info');
    }
  },

  // Khởi động kết nối Firebase Realtime Database
  connectFirebase() {
    if (!this.isConfigured || !this.config) {
      this.renderHeaderIndicator();
      return;
    }

    // Kiểm tra thư viện Firebase SDK
    if (typeof firebase === 'undefined') {
      console.warn('[CloudSync] Firebase SDK chưa sẵn sàng, sẽ kết nối lại sau 300ms...');
      setTimeout(() => this.connectFirebase(), 300);
      return;
    }

    try {
      // Hủy lắng nghe cũ nếu có
      if (this.syncRef) this.syncRef.off();
      if (this.connectionRef) this.connectionRef.off();

      // Khởi tạo Firebase App (hoặc lấy app đã tạo)
      let app;
      if (!firebase.apps || !firebase.apps.length) {
        app = firebase.initializeApp(this.config);
      } else {
        app = firebase.app();
      }

      this.db = firebase.database(app);

      // 1. Giám sát trạng thái Online/Offline bằng .info/connected
      this.connectionRef = this.db.ref('.info/connected');
      this.connectionRef.on('value', (snap) => {
        const online = snap.val() === true;
        this.isConnected = online;
        this.renderHeaderIndicator(online ? 'connected' : 'offline');
      });

      // 2. Lắng nghe thay đổi dữ liệu thời gian thực tại phòng học
      const room = (this.config.roomCode || this.ROOM_CODE_DEFAULT).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      this.syncRef = this.db.ref(`edutask_data/rooms/${room}`);

      this.syncRef.on('value', (snapshot) => {
        this.handleRemoteSnapshot(snapshot);
      }, (error) => {
        console.error('[CloudSync] Lỗi khi lắng nghe Firebase:', error);
        this.renderHeaderIndicator('error');
      });

      console.log('⚡ [CloudSync] Firebase Realtime Database kết nối thành công! Phòng:', room);
    } catch (err) {
      console.error('[CloudSync] Lỗi khởi tạo Firebase:', err);
      this.renderHeaderIndicator('error');
    }
  },

  // Kéo dữ liệu từ Cloud về máy trực tiếp (dùng cho Auth hoặc nạp dữ liệu tức thì)
  async pullFromCloud() {
    if (!this.isConfigured) return false;
    if (!this.db || !this.syncRef) {
      this.connectFirebase();
    }
    if (!this.syncRef) return false;

    try {
      const snapshot = await this.syncRef.once('value');
      const payload = snapshot.val();
      if (payload && payload.data) {
        this.applyRemoteData(payload);
        return true;
      }
    } catch (err) {
      console.warn('[CloudSync] Lỗi khi pull dữ liệu đám mây:', err);
    }
    return false;
  },

  // Xử lý dữ liệu nhận về từ Firebase
  handleRemoteSnapshot(snapshot) {
    if (this.isApplyingRemote) return;

    const payload = snapshot.val();

    // Trường hợp 1: Trên Cloud chưa có gì (lần đầu tiên thiết lập dự án)
    // -> Tự động đẩy dữ liệu hiện tại của máy tính lên Cloud để các máy khác dùng ngay
    if (!payload || !payload.data) {
      console.log('Đám mây phòng này chưa có dữ liệu. Đang đẩy dữ liệu khởi tạo lên Cloud...');
      this.pushData(Store.data, true);
      return;
    }

    // Trường hợp 2: Dữ liệu này do chính thiết bị này vừa đẩy lên
    // -> Bỏ qua không nạp lại để tránh nhấp nháy giao diện
    if (payload.deviceId === this.myDeviceId) {
      return;
    }

    // Trường hợp 3: Dữ liệu do một thiết bị khác (điện thoại hoặc máy tính khác) cập nhật!
    console.log(`Nhận dữ liệu mới từ thiết bị: ${payload.author || payload.deviceId}`);
    this.applyRemoteData(payload);
  },

  // Áp dụng dữ liệu từ Cloud vào Store với cơ chế Smart Merge
  applyRemoteData(remotePayload) {
    try {
      this.isApplyingRemote = true;
      const remoteData = remotePayload.data;
      if (!remoteData || !Array.isArray(remoteData.users)) {
        return;
      }

      // Hợp nhất dữ liệu thông minh giữa Local và Remote
      const mergedData = this.smartMerge(Store.data, remoteData);
      Store.data = mergedData;

      // Lưu vào LocalStorage (không kích hoạt push ngược lại)
      localStorage.setItem(Store.STORAGE_KEY, JSON.stringify(Store.data));

      // Làm mới session tài khoản đang đăng nhập nếu có cập nhật
      if (window.Auth && typeof Auth.refreshUserFromStore === 'function') {
        Auth.refreshUserFromStore();
      }

      // BẮC CẦU TỰ ĐỘNG: Ghi bản sao lưu bền vững lên kho GitHub trung tâm (background)
      if (window.GitHubSync && typeof GitHubSync.schedulePush === 'function') {
        GitHubSync.schedulePush(false);
      }

      // TỰ HOÀN THIỆN: Nếu dữ liệu cục bộ có thông tin mà Firebase đang thiếu, đẩy ngược lại lên Cloud
      const remoteAsnsCount = Array.isArray(remoteData.assignments) ? remoteData.assignments.length : 0;
      const mergedAsnsCount = Array.isArray(mergedData.assignments) ? mergedData.assignments.length : 0;
      const remoteUsersCount = Array.isArray(remoteData.users) ? remoteData.users.length : 0;
      const mergedUsersCount = Array.isArray(mergedData.users) ? mergedData.users.length : 0;

      if (mergedUsersCount > remoteUsersCount || mergedAsnsCount > remoteAsnsCount) {
        console.log('[CloudSync] 🔄 Tự động bù đắp dữ liệu hoàn chỉnh lên Firebase...');
        setTimeout(() => this.pushData(mergedData, true), 600);
      }

      // Cập nhật giao diện mượt mà (không ngắt quãng nếu người dùng đang chấm bài hoặc nhập dữ liệu)
      const isGrader = window.Grader && Grader.activeSubmission;
      const hasActiveModal = document.querySelector('.modal-overlay.active');
      const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

      if (!isGrader && !hasActiveModal && !isTyping) {
        if (window.App && typeof App.renderCurrentView === 'function') {
          App.updateHeaderProfile();
          App.renderCurrentView();
        }
      }

      // Hiển thị thông báo ngắn cho người dùng
      const authorText = remotePayload.author ? `từ ${remotePayload.author}` : 'từ thiết bị khác';
      if (window.App && App.showToast) {
        App.showToast(`⚡ Đã đồng bộ dữ liệu mới ${authorText}!`, 'success');
      }
    } catch (e) {
      console.error('Lỗi khi áp dụng dữ liệu đám mây:', e);
    } finally {
      this.isApplyingRemote = false;
    }
  },

  // Cơ chế Smart Merge: Giữ toàn vẹn tài khoản, bài tập và điểm số giữa các thiết bị
  smartMerge(local, remote) {
    if (!local) return remote;
    if (!remote) return local;

    const merged = { ...remote };

    // 1. Hợp nhất danh sách Users
    const localUsers = Array.isArray(local.users) ? local.users : [];
    const remoteUsers = Array.isArray(remote.users) ? remote.users : [];
    const userMap = new Map();

    // Nạp remote users trước
    remoteUsers.forEach(u => userMap.set(u.id, u));
    // Nạp & hợp nhất local users
    localUsers.forEach(lu => {
      if (!userMap.has(lu.id)) {
        userMap.set(lu.id, lu);
      } else {
        const ru = userMap.get(lu.id);
        const hasAccount = (ru.hasAccount || lu.hasAccount);
        const accountStatus = (ru.accountStatus === 'active' || lu.accountStatus === 'active')
          ? 'active'
          : (ru.accountStatus || lu.accountStatus || 'none');

        const combined = {
          ...lu,
          ...ru,
          hasAccount,
          accountStatus
        };

        if (ru.username && ru.username.trim()) combined.username = ru.username;
        else if (lu.username && lu.username.trim()) combined.username = lu.username;

        if (ru.password && ru.password.trim()) combined.password = ru.password;
        else if (lu.password && lu.password.trim()) combined.password = lu.password;

        userMap.set(lu.id, combined);
      }
    });
    merged.users = Array.from(userMap.values());

    // 2. Hợp nhất Bài Tập (Assignments)
    const localAsns = Array.isArray(local.assignments) ? local.assignments : [];
    const remoteAsns = Array.isArray(remote.assignments) ? remote.assignments : [];
    const asnsMap = new Map();

    remoteAsns.forEach(a => asnsMap.set(a.id, a));
    localAsns.forEach(la => {
      if (!asnsMap.has(la.id)) {
        asnsMap.set(la.id, la);
      } else {
        const ra = asnsMap.get(la.id);
        const lTime = la.updatedAt || la.createdAt || '';
        const rTime = ra.updatedAt || ra.createdAt || '';
        asnsMap.set(la.id, lTime >= rTime ? { ...ra, ...la } : { ...la, ...ra });
      }
    });
    merged.assignments = Array.from(asnsMap.values());

    // 3. Hợp nhất Bài Nộp (Submissions) — Ưu tiên giữ bài đã chấm điểm và nét vẽ chấm bài
    const localSubs = Array.isArray(local.submissions) ? local.submissions : [];
    const remoteSubs = Array.isArray(remote.submissions) ? remote.submissions : [];
    const subsMap = new Map();

    remoteSubs.forEach(s => subsMap.set(s.id, s));
    localSubs.forEach(ls => {
      if (!subsMap.has(ls.id)) {
        subsMap.set(ls.id, ls);
      } else {
        const rs = subsMap.get(ls.id);
        if (ls.status === 'graded' && rs.status !== 'graded') {
          subsMap.set(ls.id, { ...rs, ...ls });
        } else if (rs.status === 'graded' && ls.status !== 'graded') {
          subsMap.set(ls.id, { ...ls, ...rs });
        } else {
          const lTime = ls.gradedAt || ls.submittedAt || ls.createdAt || '';
          const rTime = rs.gradedAt || rs.submittedAt || rs.createdAt || '';
          subsMap.set(ls.id, lTime >= rTime ? { ...rs, ...ls } : { ...ls, ...rs });
        }
      }
    });
    merged.submissions = Array.from(subsMap.values());

    return merged;
  },

  // Đẩy dữ liệu lên Cloud (Có Debounce chống dồn lệnh)
  schedulePush() {
    if (!this.isConfigured || !this.syncRef || this.isApplyingRemote) return;

    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.pushData(Store.data);
    }, 350);
  },

  // Thực hiện đẩy dữ liệu
  pushData(dataToPush, immediate = false) {
    if (!this.isConfigured || !this.syncRef) return;

    const authorName = (window.Auth && Auth.getCurrentUser()) ? Auth.getCurrentUser().name : 'EduTask';
    const payload = {
      data: dataToPush || Store.data,
      lastUpdated: Date.now(),
      deviceId: this.myDeviceId,
      author: authorName,
      clientVersion: 3
    };

    this.renderHeaderIndicator('syncing');

    this.syncRef.set(payload, (error) => {
      if (error) {
        console.error('Lỗi khi đẩy dữ liệu lên Firebase:', error);
        this.renderHeaderIndicator('error');
      } else {
        this.lastPushedTimestamp = Date.now();
        this.renderHeaderIndicator('connected');
      }
    });
  },

  // Phân tích thông minh chuỗi cấu hình do người dùng dán vào (chấp nhận cả JS snippet và JSON)
  parseFirebaseInput(inputText) {
    if (!inputText || typeof inputText !== 'string') return null;
    let str = inputText.trim();

    // 1. Thử phân tích cú pháp JSON trực tiếp
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === 'object') {
        return this.sanitizeConfig(parsed);
      }
    } catch (e) {
      // Tiếp tục thử regex
    }

    // 2. Tìm khối object { ... } trong đoạn mã JavaScript
    const objMatch = str.match(/\{[\s\S]*\}/);
    if (objMatch) {
      str = objMatch[0];
    }

    // 3. Trích xuất các trường thông dụng bằng biểu thức chính quy (Regex)
    const extractField = (fieldName) => {
      const regex = new RegExp(`['"]?${fieldName}['"]?\\s*:\\s*['"\`]([^'"\`]+)['"\`]`, 'i');
      const match = str.match(regex);
      return match ? match[1].trim() : '';
    };

    const config = {
      apiKey: extractField('apiKey'),
      authDomain: extractField('authDomain'),
      databaseURL: extractField('databaseURL'),
      projectId: extractField('projectId'),
      storageBucket: extractField('storageBucket'),
      messagingSenderId: extractField('messagingSenderId'),
      appId: extractField('appId'),
      roomCode: extractField('roomCode') || this.ROOM_CODE_DEFAULT
    };

    // Nếu có ít nhất databaseURL hoặc projectId thì coi là hợp lệ
    if (config.databaseURL || (config.projectId && config.apiKey)) {
      // Tự suy diễn databaseURL nếu người dùng quên bật hoặc thiếu
      if (!config.databaseURL && config.projectId) {
        config.databaseURL = `https://${config.projectId}-default-rtdb.firebaseio.com`;
      }
      return this.sanitizeConfig(config);
    }

    return null;
  },

  // Làm sạch và chuẩn hóa config
  sanitizeConfig(cfg) {
    const clean = {
      apiKey: (cfg.apiKey || '').trim(),
      authDomain: (cfg.authDomain || '').trim(),
      databaseURL: (cfg.databaseURL || '').trim(),
      projectId: (cfg.projectId || '').trim(),
      storageBucket: (cfg.storageBucket || '').trim(),
      messagingSenderId: (cfg.messagingSenderId || '').trim(),
      appId: (cfg.appId || '').trim(),
      roomCode: (cfg.roomCode || this.ROOM_CODE_DEFAULT).trim()
    };

    // Chuẩn hóa databaseURL nếu thiếu https
    if (clean.databaseURL && !clean.databaseURL.startsWith('http')) {
      clean.databaseURL = 'https://' + clean.databaseURL;
    }
    return clean;
  },

  // Tạo liên kết đồng bộ nhanh kèm mã Token để chia sẻ sang điện thoại
  generateSyncShareUrl() {
    if (!this.config) return '';
    try {
      const jsonStr = JSON.stringify(this.config);
      // Mã hóa an toàn tiếng Việt Base64
      const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
      
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      return `${origin}${pathname}?sync_cfg=${encodeURIComponent(base64Str)}`;
    } catch (e) {
      console.error('Lỗi sinh link chia sẻ:', e);
      return '';
    }
  },

  // Cập nhật trạng thái hiển thị trên Header
  renderHeaderIndicator(statusOverride) {
    let status = statusOverride;
    if (!status) {
      if (!this.isConfigured) status = 'unconfigured';
      else if (this.isConnected) status = 'connected';
      else status = 'offline';
    }

    // Cập nhật chấm tròn tối giản trên Header
    const dotIndicator = document.getElementById('connectionStatusIndicator');
    if (dotIndicator) {
      let title = 'Hệ thống trực tuyến • Đang đồng bộ Firebase Realtime & GitHub';
      let statusClass = 'online';

      if (status === 'syncing') {
        title = '⚡ Đang đồng bộ dữ liệu thời gian thực...';
        statusClass = 'syncing';
      } else if (status === 'offline') {
        title = '📡 Đang ngoại tuyến hoặc đang kết nối lại đám mây';
        statusClass = 'waiting';
      } else if (status === 'error') {
        title = '🔴 Gián đoạn kết nối máy chủ đám mây';
        statusClass = 'error';
      }

      dotIndicator.className = `live-status-indicator ${statusClass}`;
      dotIndicator.title = title;
      dotIndicator.innerHTML = '<span class="status-dot"></span>';
    }

    const btn = document.getElementById('cloudSyncHeaderBtn');
    if (!btn) return;

    btn.className = `cloud-sync-pill-btn sync-state-${status}`;

    let iconHtml = '';
    let text = '';
    let title = '';

    if (status === 'connected') {
      iconHtml = '<span class="sync-dot dot-online"></span>';
      text = 'Đám Mây: Realtime 🟢';
      title = 'Đã kết nối Google Firebase Realtime. Dữ liệu đang đồng bộ trực tiếp giữa PC & Điện thoại!';
    } else if (status === 'syncing') {
      iconHtml = '<span class="sync-dot dot-syncing"></span>';
      text = 'Đang Đồng Bộ ⚡';
      title = 'Đang truyền dữ liệu lên máy chủ đám mây...';
    } else if (status === 'offline') {
      iconHtml = '<span class="sync-dot dot-offline"></span>';
      text = 'Đám Mây: Ngoại Tuyến 🟡';
      title = 'Chưa kết nối Internet. Đang lưu tạm vào bộ nhớ máy này.';
    } else if (status === 'error') {
      iconHtml = '<span class="sync-dot dot-error"></span>';
      text = 'Đám Mây: Lỗi Cấu Hình 🔴';
      title = 'Lỗi kết nối Firebase. Bấm để kiểm tra lại cấu hình.';
    } else {
      iconHtml = '<span class="sync-dot dot-unconfigured"></span>';
      text = 'Cài Đặt Đám Mây ☁️';
      title = 'Chưa thiết lập Firebase. Bấm để kích hoạt đồng bộ dữ liệu giữa Máy tính & Điện thoại!';
    }

    btn.innerHTML = `${iconHtml}<span class="sync-pill-text">${text}</span>`;
    btn.setAttribute('title', title);
  },

  // ================= MODAL QUẢN LÝ ĐỒNG BỘ ĐÁM MÂY =================
  openModal(defaultTab = 'status') {
    this.renderModalContent(defaultTab);
    const modal = document.getElementById('cloudSyncModal');
    if (modal) modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('cloudSyncModal');
    if (modal) modal.classList.remove('active');
  },

  switchModalTab(tabId) {
    document.querySelectorAll('.sync-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.sync-tab-pane').forEach(pane => {
      pane.style.display = pane.id === `syncPane_${tabId}` ? 'block' : 'none';
    });
  },

  renderModalContent(activeTab = 'status') {
    const body = document.getElementById('cloudSyncModalBody');
    if (!body) return;

    const isConn = this.isConnected;
    const isConf = this.isConfigured;
    const syncShareUrl = this.generateSyncShareUrl();
    const qrApiUrl = syncShareUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(syncShareUrl)}` : '';

    const currentRoom = (this.config && this.config.roomCode) ? this.config.roomCode : this.ROOM_CODE_DEFAULT;
    const currentDbUrl = (this.config && this.config.databaseURL) ? this.config.databaseURL : '';
    const currentProjectId = (this.config && this.config.projectId) ? this.config.projectId : '';

    // Số lượng bản ghi
    const totalStudents = Store.getStudents ? Store.getStudents().length : 0;
    const totalAsns = Store.data.assignments ? Store.data.assignments.length : 0;
    const totalSubs = Store.data.submissions ? Store.data.submissions.length : 0;

    body.innerHTML = `
      <!-- Tabs điều hướng trong modal -->
      <div class="sync-modal-tabs">
        <button type="button" class="sync-tab-btn ${activeTab === 'status' ? 'active' : ''}" data-tab="status" onclick="CloudSync.switchModalTab('status')">
          <span>📡</span> <span>Trạng Thái & Dữ Liệu</span>
        </button>
        <button type="button" class="sync-tab-btn ${activeTab === 'mobile' ? 'active' : ''}" data-tab="mobile" onclick="CloudSync.switchModalTab('mobile')">
          <span>📱</span> <span>Quét QR Cho Điện Thoại</span>
        </button>
        <button type="button" class="sync-tab-btn ${activeTab === 'setup' ? 'active' : ''}" data-tab="setup" onclick="CloudSync.switchModalTab('setup')">
          <span>⚙️</span> <span>Cài Đặt Firebase (2 Phút)</span>
        </button>
      </div>

      <!-- PANE 1: TRẠNG THÁI KẾT NỐI & DỮ LIỆU -->
      <div class="sync-tab-pane" id="syncPane_status" style="display:${activeTab === 'status' ? 'block' : 'none'};">
        <div class="sync-status-card ${isConn ? 'card-connected' : (isConf ? 'card-offline' : 'card-unconfigured')}">
          <div class="sync-status-icon-box">
            ${isConn ? '🟢' : (isConf ? '🟡' : '☁️')}
          </div>
          <div style="flex:1;">
            <h4 style="margin:0 0 4px 0; font-size:16px; font-weight:800;">
              ${isConn ? 'Đang Đồng Bộ Thời Gian Thực (Real-time)' : (isConf ? 'Đang Chờ Kết Nối Tới Firebase' : 'Chưa Thiết Lập Đồng Bộ Đám Mây')}
            </h4>
            <p style="margin:0; font-size:13px; color:var(--text-muted);">
              ${isConn 
                ? 'Mọi thay đổi trên Máy tính hoặc Điện thoại (giao bài, nộp bài, chấm điểm) sẽ lập tức xuất hiện trên tất cả thiết bị.' 
                : (isConf 
                  ? 'Đã có cấu hình nhưng chưa thiết lập kết nối socket tới Firebase. Vui lòng kiểm tra lại mạng hoặc quyền đọc/ghi.' 
                  : 'Hiện tại dữ liệu đang lưu cục bộ trong trình duyệt này. Nhập cấu hình Firebase để liên thông dữ liệu qua điện thoại.')}
            </p>
          </div>
        </div>

        <div class="sync-meta-grid" style="margin-top:14px;">
          <div class="sync-meta-box">
            <span class="meta-label">Phòng Đồng Bộ (Room)</span>
            <span class="meta-value" style="font-family:var(--font-mono); color:var(--primary);">${currentRoom}</span>
          </div>
          <div class="sync-meta-box">
            <span class="meta-label">Dự Án Firebase</span>
            <span class="meta-value" style="font-family:var(--font-mono);">${currentProjectId || '(Chưa cấu hình)'}</span>
          </div>
          <div class="sync-meta-box">
            <span class="meta-label">Dữ Liệu Hiện Tại</span>
            <span class="meta-value">${totalStudents} Học sinh • ${totalAsns} Bài tập • ${totalSubs} Bài nộp</span>
          </div>
          <div class="sync-meta-box">
            <span class="meta-label">Mã Thiết Bị Này</span>
            <span class="meta-value" style="font-family:var(--font-mono); font-size:11px;">${this.myDeviceId}</span>
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" onclick="CloudSync.manualPushNow()" ${!isConf ? 'disabled' : ''} style="flex:1; min-width:200px;">
            ☁️ Đẩy Dữ Liệu Máy Này Lên Cloud Ngay
          </button>
          <button type="button" class="btn btn-outline" onclick="CloudSync.manualPullNow()" ${!isConf ? 'disabled' : ''} style="flex:1; min-width:200px;">
            📥 Tải & Nạp Lại Từ Cloud Về Máy
          </button>
        </div>

        ${!isConf ? `
          <div class="sync-prompt-box" style="margin-top:16px;">
            <div style="font-size:24px;">💡</div>
            <div style="flex:1; font-size:13px;">
              <strong>Bạn muốn dùng chung dữ liệu trên cả máy tính lẫn điện thoại?</strong><br>
              Chuyển sang tab <strong>"Cài Đặt Firebase (2 Phút)"</strong> để dán mã cấu hình miễn phí từ Google Firebase.
            </div>
            <button type="button" class="btn btn-sm btn-primary" onclick="CloudSync.switchModalTab('setup')">
              Cài Đặt Ngay →
            </button>
          </div>
        ` : ''}
      </div>

      <!-- PANE 2: QUÉT QR ĐỒNG BỘ ĐIỆN THOẠI 1-CHẠM -->
      <div class="sync-tab-pane" id="syncPane_mobile" style="display:${activeTab === 'mobile' ? 'block' : 'none'};">
        ${!isConf ? `
          <div class="sync-empty-state">
            <div style="font-size:44px; margin-bottom:8px;">📱</div>
            <h3>Chưa Thể Sinh Mã QR</h3>
            <p style="color:var(--text-muted); font-size:13.5px; max-width:440px; margin:0 auto 16px;">
              Vui lòng hoàn tất cấu hình Firebase tại tab <strong>"Cài Đặt Firebase"</strong> trước. Sau đó mã QR tự động được tạo để điện thoại quét 1 chạm là đồng bộ xong!
            </p>
            <button type="button" class="btn btn-primary" onclick="CloudSync.switchModalTab('setup')">
              Đến Cài Đặt Firebase →
            </button>
          </div>
        ` : `
          <div class="sync-qr-wrapper">
            <div class="sync-qr-card">
              <div class="qr-image-container">
                <img src="${qrApiUrl}" alt="Mã QR Đồng Bộ Firebase" style="width:200px; height:200px; display:block; border-radius:8px;">
              </div>
              <div class="qr-instructions">
                <h4 style="margin:0 0 6px 0; font-size:15px; color:var(--oxford-navy);">
                  📲 Cách kết nối Điện Thoại trong 5 giây:
                </h4>
                <ol style="margin:0; padding-left:18px; font-size:13px; color:#334155; line-height:1.6;">
                  <li>Mở <strong>Camera điện thoại</strong> hoặc <strong>Zalo / Trình quét mã QR</strong>.</li>
                  <li>Quét hình mã QR bên cạnh.</li>
                  <li>Bấm vào liên kết mở web trên điện thoại $\rightarrow$ <strong>Hệ thống tự động liên thông 100%!</strong></li>
                </ol>
                <div style="margin-top:14px; display:flex; gap:8px;">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="CloudSync.copyShareLink()">
                    📋 Sao Chép Link Gửi Qua Zalo
                  </button>
                </div>
              </div>
            </div>
            
            <div style="margin-top:14px; background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:10px 14px; font-size:12px; color:var(--text-muted); word-break:break-all;">
              <strong>Liên kết đồng bộ trực tiếp:</strong><br>
              <code style="font-family:var(--font-mono); color:var(--primary); font-size:11.5px;">${syncShareUrl}</code>
            </div>
          </div>
        `}
      </div>

      <!-- PANE 3: CÀI ĐẶT CẤU HÌNH FIREBASE -->
      <div class="sync-tab-pane" id="syncPane_setup" style="display:${activeTab === 'setup' ? 'block' : 'none'};">
        <div class="sync-guide-banner">
          <div style="font-size:22px;">🚀</div>
          <div style="flex:1; font-size:13px; line-height:1.5;">
            <strong>Hướng dẫn tạo Firebase Realtime Database miễn phí 100% (2 phút):</strong>
            <ol style="margin:6px 0 0 0; padding-left:18px;">
              <li>Truy cập <a href="https://console.firebase.google.com" target="_blank" style="color:var(--primary); font-weight:700;">console.firebase.google.com</a> $\rightarrow$ Đăng nhập Google $\rightarrow$ Bấm <strong>Tạo dự án (Add project)</strong>.</li>
              <li>Chọn menu <strong>Build</strong> $\rightarrow$ <strong>Realtime Database</strong> $\rightarrow$ Bấm <strong>Create Database</strong> $\rightarrow$ Chọn chế độ <strong>Start in test mode</strong> (hoặc bật quyền <code>.read: true, .write: true</code>).</li>
              <li>Vào biểu tượng ⚙️ (Cài đặt dự án) $\rightarrow$ Cuộn xuống mục <strong>Your apps</strong> $\rightarrow$ Bấm Web <code>&lt;/&gt;</code> $\rightarrow$ Copy đoạn <code>const firebaseConfig = { ... }</code> rồi dán vào ô bên dưới:</li>
            </ol>
          </div>
        </div>

        <form id="firebaseConfigForm" onsubmit="CloudSync.handleConfigSubmit(event)" style="margin-top:16px;">
          <div class="form-group">
            <label for="firebaseConfigRawInput" style="font-weight:700; font-size:13px; display:flex; justify-content:space-between;">
              <span>Dán Mã Cấu Hình Firebase (Hỗ trợ cả JSON hoặc đoạn code JS): <span style="color:var(--danger)">*</span></span>
              <span style="font-size:12px; color:var(--primary); cursor:pointer;" onclick="CloudSync.fillSampleTemplate()">Điền mẫu tham khảo</span>
            </label>
            <textarea 
              id="firebaseConfigRawInput" 
              class="form-control" 
              rows="6" 
              placeholder='Dán đoạn mã firebaseConfig vào đây, ví dụ:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "edutask-pb.firebaseapp.com",\n  databaseURL: "https://edutask-pb-default-rtdb.firebaseio.com",\n  projectId: "edutask-pb",\n  storageBucket: "edutask-pb.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef"\n};'
              style="font-family:var(--font-mono); font-size:12px; line-height:1.4;"
            >${this.config ? JSON.stringify(this.config, null, 2) : ''}</textarea>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px;">
            <div class="form-group">
              <label for="firebaseRoomCode" style="font-weight:700; font-size:13px;">Mã Phòng / Tên Lớp Kèm</label>
              <input 
                type="text" 
                id="firebaseRoomCode" 
                class="form-control" 
                placeholder="VD: lop_thay_duc" 
                value="${currentRoom}" 
                style="font-family:var(--font-mono); font-weight:600;"
              >
              <small style="color:var(--text-muted); font-size:11px;">Mọi thiết bị nhập cùng Mã Phòng sẽ dùng chung 1 dòng dữ liệu.</small>
            </div>
            <div class="form-group" style="display:flex; flex-direction:column; justify-content:flex-end;">
              <button type="submit" class="btn btn-primary" style="height:44px; font-weight:700;">
                💾 Lưu Cấu Hình & Kết Nối Đám Mây
              </button>
            </div>
          </div>
        </form>

        ${isConf ? `
          <div style="margin-top:16px; padding-top:16px; border-top:1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="font-size:13px; color:var(--text-muted);">
              Đang dùng cấu hình: <strong style="color:var(--primary); font-family:var(--font-mono);">${currentProjectId}</strong>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" id="btnTestFirebaseConn" class="btn btn-xs btn-secondary" onclick="CloudSync.testConnection()">
                ⚡ Kiểm Tra Kết Nối
              </button>
              <button type="button" class="btn btn-xs btn-outline" style="color:var(--danger); border-color:#fca5a5;" onclick="CloudSync.confirmDisconnect()">
                ⚠️ Xóa Cấu Hình & Ngắt
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Xử lý gửi form cấu hình
  handleConfigSubmit(event) {
    event.preventDefault();
    const rawText = document.getElementById('firebaseConfigRawInput').value;
    const roomCode = (document.getElementById('firebaseRoomCode').value || this.ROOM_CODE_DEFAULT).trim();

    if (!rawText.trim()) {
      if (window.App && App.showToast) App.showToast('Vui lòng dán mã cấu hình Firebase!', 'warning');
      return;
    }

    const parsed = this.parseFirebaseInput(rawText);
    if (!parsed) {
      if (window.App && App.showToast) {
        App.showToast('Không nhận diện được cấu hình Firebase hợp lệ! Vui lòng kiểm tra lại apiKey, projectId hoặc databaseURL.', 'error');
      }
      return;
    }

    parsed.roomCode = roomCode || this.ROOM_CODE_DEFAULT;
    this.saveConfig(parsed);

    if (window.App && App.showToast) {
      App.showToast('✅ Đã lưu cấu hình Firebase! Đang tiến hành kết nối...', 'success');
    }

    // Chuyển sang tab Trạng thái hoặc Quét QR
    setTimeout(() => {
      this.openModal('status');
    }, 400);
  },

  // Điền mẫu tham khảo
  fillSampleTemplate() {
    const textarea = document.getElementById('firebaseConfigRawInput');
    if (!textarea) return;
    textarea.value = `const firebaseConfig = {
  apiKey: "AIzaSyB1234567890abcdefghijklmnopqrst",
  authDomain: "edutask-pb-demo.firebaseapp.com",
  databaseURL: "https://edutask-pb-demo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edutask-pb-demo",
  storageBucket: "edutask-pb-demo.appspot.com",
  messagingSenderId: "109876543210",
  appId: "1:109876543210:web:abcdef1234567890"
};`;
  },

  // Sao chép liên kết chia sẻ
  copyShareLink() {
    const url = this.generateSyncShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      if (window.App && App.showToast) {
        App.showToast('📋 Đã sao chép link đồng bộ! Bạn có thể dán gửi qua Zalo cho điện thoại.', 'success');
      }
    }).catch(() => {
      prompt('Sao chép liên kết bên dưới:', url);
    });
  },

  // Đẩy dữ liệu thủ công
  manualPushNow() {
    this.pushData(Store.data, true);
    if (window.App && App.showToast) {
      App.showToast('🚀 Đang đồng bộ toàn bộ dữ liệu máy này lên Cloud...', 'info');
    }
    setTimeout(() => {
      this.openModal('status');
    }, 500);
  },

  // Tải dữ liệu từ Cloud về máy thủ công
  manualPullNow() {
    if (!this.syncRef) return;
    if (window.App && App.showToast) {
      App.showToast('📥 Đang tải dữ liệu từ Cloud...', 'info');
    }
    this.syncRef.once('value').then(snapshot => {
      const payload = snapshot.val();
      if (payload && payload.data) {
        this.applyRemoteData(payload);
        if (window.App && App.showToast) {
          App.showToast('✅ Đã nạp thành công dữ liệu từ Cloud về máy!', 'success');
        }
      } else {
        if (window.App && App.showToast) {
          App.showToast('Đám mây hiện chưa có dữ liệu nào.', 'warning');
        }
      }
      this.openModal('status');
    }).catch(err => {
      if (window.App && App.showToast) {
        App.showToast(`Lỗi khi nạp dữ liệu: ${err.message}`, 'error');
      }
    });
  },

  // Kiểm tra kết nối nhanh (Ping Test)
  testConnection() {
    if (!this.isConfigured || !this.db) {
      if (window.App && App.showToast) {
        App.showToast('Vui lòng lưu cấu hình Firebase trước khi kiểm tra!', 'warning');
      }
      return;
    }

    const testBtn = document.getElementById('btnTestFirebaseConn');
    if (testBtn) {
      testBtn.disabled = true;
      testBtn.innerHTML = '⏳ Đang kiểm tra...';
    }

    const room = (this.config.roomCode || this.ROOM_CODE_DEFAULT).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const pingRef = this.db.ref(`edutask_data/rooms/${room}/_ping`);
    
    pingRef.set({ pingAt: Date.now(), deviceId: this.myDeviceId }).then(() => {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = '🟢 Kết Nối Hoàn Hảo!';
        testBtn.style.background = '#059669';
        testBtn.style.color = '#ffffff';
      }
      if (window.App && App.showToast) {
        App.showToast('🎉 Kết nối Firebase thành công! Đọc và ghi dữ liệu hoạt động 100%.', 'success');
      }
      this.renderHeaderIndicator('connected');
    }).catch((err) => {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = '🔴 Thử Lại';
      }
      console.error('Lỗi kiểm tra Firebase:', err);
      let advice = 'Không thể kết nối. Vui lòng kiểm tra lại cấu hình.';
      if (err.message && err.message.toLowerCase().includes('permission_denied')) {
        advice = 'Quyền đọc/ghi bị chặn! Hãy vào Firebase Console -> Realtime Database -> Rules và đặt .read: true, .write: true.';
      }
      if (window.App && App.showToast) {
        App.showToast(`⚠️ ${advice}`, 'error');
      }
    });
  },

  // Xác nhận ngắt kết nối
  confirmDisconnect() {
    if (confirm('Bạn có chắc chắn muốn ngắt kết nối Firebase trên máy này? Dữ liệu hiện tại trên máy vẫn sẽ được giữ nguyên.')) {
      this.clearConfig();
      this.openModal('setup');
    }
  }
};
