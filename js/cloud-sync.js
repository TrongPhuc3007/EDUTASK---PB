/**
 * EDUTASK PRO — CLOUD SYNC ENGINE (GOOGLE FIREBASE REALTIME DATABASE)
 * Đồng bộ dữ liệu 2 chiều theo thời gian thực (Real-time) giữa Máy tính (PC) và Điện thoại (Mobile).
 * Hỗ trợ: Tự động phát hiện QR code, Smart Merge chống mất dữ liệu, Bộ nhớ đệm ngoại tuyến (Offline-first).
 */

const CloudSync = {
  CONFIG_STORAGE_KEY: 'EDUTASK_FIREBASE_CONFIG_V1',
  DEVICE_ID_KEY: 'EDUTASK_DEVICE_ID',
  ROOM_CODE_DEFAULT: 'lop_chinh',

  // Cấu hình Google Firebase Realtime Database tích hợp cứng vĩnh viễn cho toàn bộ hệ thống & mọi nền tảng
  PERMANENT_FIREBASE_CONFIG: {
    apiKey: "AIzaSyCiupEKem9dHd5tCKvxnI-w75OiD5LCPbY",
    authDomain: "edutask-pb.firebaseapp.com",
    databaseURL: "https://edutask-pb-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "edutask-pb",
    storageBucket: "edutask-pb.firebasestorage.app",
    messagingSenderId: "754760560590",
    appId: "1:754760560590:web:26cdbe949ed8c35a33c59f",
    measurementId: "G-SPN865YCZZ",
    roomCode: "lop_chinh"
  },

  // Trạng thái hoạt động: LUÔN SẴN SÀNG (isConfigured = true) trên mọi nền tảng không cần nhập lại
  config: {
    apiKey: "AIzaSyCiupEKem9dHd5tCKvxnI-w75OiD5LCPbY",
    authDomain: "edutask-pb.firebaseapp.com",
    databaseURL: "https://edutask-pb-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "edutask-pb",
    storageBucket: "edutask-pb.firebasestorage.app",
    messagingSenderId: "754760560590",
    appId: "1:754760560590:web:26cdbe949ed8c35a33c59f",
    measurementId: "G-SPN865YCZZ",
    roomCode: "lop_chinh"
  },
  db: null,
  syncRef: null,
  connectionRef: null,
  isConnected: false,
  isConfigured: true,
  myDeviceId: null,
  pushTimer: null,
  lastPushedTimestamp: 0,
  lastAppliedRemoteTimestamp: 0,
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
      // Kéo dữ liệu mới nhất ngay khi mở trang
      setTimeout(() => this.pullFromCloud(false), 200);
      // Kích hoạt nhịp tim kiểm tra thay đổi liên tục từ các thiết bị khác
      this.startHeartbeat();
    }
  },

  // Giám sát trạng thái mạng online / offline và chuyển tab
  initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Mạng Internet đã phục hồi!');
      if (this.isConfigured) {
        this.connectFirebase();
        this.pullFromCloud(false);
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

    // Khi người dùng chuyển tab hoặc quay lại máy tính -> Kéo và kiểm tra NGAY LẬP TỨC
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isConfigured) {
        this.checkCloudChanges();
      }
    });

    window.addEventListener('focus', () => {
      if (this.isConfigured) {
        this.checkCloudChanges();
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
    this.config = { ...this.PERMANENT_FIREBASE_CONFIG };
    this.isConfigured = true;
    try {
      localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {}
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

  // Trả về URL REST API chuẩn của Firebase Realtime Database
  getRestUrl() {
    const dbUrl = (this.config && this.config.databaseURL) ? this.config.databaseURL : this.PERMANENT_FIREBASE_CONFIG.databaseURL;
    const room = (this.config && this.config.roomCode) ? this.config.roomCode : this.ROOM_CODE_DEFAULT;
    const cleanRoom = room.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${dbUrl}/edutask_data/rooms/${cleanRoom}.json`;
  },

  // Kéo dữ liệu từ Cloud về máy trực tiếp (dùng cho Auth hoặc nạp dữ liệu tức thì đa thiết bị)
  async pullFromCloud(isManual = false) {
    if (!this.isConfigured) return false;

    // 1. Kéo trực tiếp qua Firebase REST API (100% tin cậy, không phụ thuộc trạng thái WebSocket)
    try {
      const url = `${this.getRestUrl()}?t=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        if (payload && payload.data) {
          this.applyRemoteData(payload);
          if (isManual && window.App && App.showToast) {
            const count = payload.data.users ? payload.data.users.length : 0;
            App.showToast(`✅ Đã đồng bộ thành công với Cloud (${count} tài khoản hiện có)!`, 'success');
          }
          return true;
        }
      }
    } catch (restErr) {
      console.warn('[CloudSync] REST pull warning:', restErr);
    }

    // 2. Dự phòng qua Firebase SDK nếu có sẵn
    if (this.syncRef) {
      try {
        const snapshot = await this.syncRef.once('value');
        const payload = snapshot.val();
        if (payload && payload.data) {
          this.applyRemoteData(payload);
          return true;
        }
      } catch (err) {
        console.warn('[CloudSync] SDK pull warning:', err);
      }
    }
    return false;
  },

  // Kiểm tra định kỳ xem có thay đổi từ thiết bị khác không
  async checkCloudChanges() {
    if (this.isApplyingRemote || !this.isConfigured) return;
    try {
      const url = `${this.getRestUrl()}?t=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        if (payload && payload.data && Array.isArray(payload.data.users)) {
          const remoteTime = payload.lastUpdated || 0;
          const isFromOther = payload.deviceId !== this.myDeviceId;
          
          if (isFromOther && remoteTime > this.lastAppliedRemoteTimestamp && remoteTime > this.lastPushedTimestamp) {
            console.log(`[CloudSync] ⚡ Phát hiện thay đổi từ thiết bị khác (${payload.author || payload.deviceId}), nạp ngay!`);
            this.lastAppliedRemoteTimestamp = remoteTime;
            this.applyRemoteData(payload);
          }
        }
      }
    } catch (e) {}
  },

  // Nhịp tim đồng bộ kiểm tra thay đổi liên tục
  heartbeatTimer: null,
  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (document.hidden) return;
      // Khi kết nối Firebase WebSocket đang hoạt động tốt, máy chủ đã tự động gửi sự kiện tức thì qua handleRemoteSnapshot.
      // Không cần dội REST polling liên tục để tránh dồn tải và nghẽn mạng khi nhiều máy cùng kết nối.
      if (this.isConnected && this.syncRef) return;
      this.checkCloudChanges();
    }, 4500);
  },

  // Xử lý dữ liệu nhận về từ Firebase SDK WebSocket
  handleRemoteSnapshot(snapshot) {
    if (this.isApplyingRemote) return;

    const payload = snapshot.val();

    // Trường hợp 1: Trên Cloud chưa có gì (lần đầu tiên thiết lập dự án)
    if (!payload || !payload.data) {
      console.log('Đám mây phòng này chưa có dữ liệu. Đang đẩy dữ liệu khởi tạo lên Cloud...');
      this.pushData(Store.data, true);
      return;
    }

    // Trường hợp 2: Dữ liệu này do chính thiết bị này vừa đẩy lên
    if (payload.deviceId === this.myDeviceId) {
      return;
    }

    // Bỏ qua nếu dữ liệu này đã được áp dụng trước đó
    const remoteTime = payload.lastUpdated || 0;
    if (remoteTime > 0 && remoteTime <= this.lastAppliedRemoteTimestamp) {
      return;
    }

    // Coalesce buffer (60ms): Khi nhiều học sinh cùng vào lớp hoặc nộp bài, Firebase phát sự kiện liên tục.
    // Gom nhiều snapshot liên tiếp thành 1 lần xử lý duy nhất để CPU máy học sinh không bị quá tải, thao tác không bị đơ giật!
    this.pendingRemotePayload = payload;
    if (this.remoteApplyTimer) clearTimeout(this.remoteApplyTimer);
    this.remoteApplyTimer = setTimeout(() => {
      if (this.pendingRemotePayload) {
        const p = this.pendingRemotePayload;
        this.pendingRemotePayload = null;
        this.applyRemoteData(p);
      }
    }, 60);
  },

  // So sánh dữ liệu thông minh theo vai trò và ngữ cảnh người dùng đang đăng nhập:
  // Ngăn chặn triệt để tình trạng một học sinh/gia sư thao tác làm toàn bộ các máy khác bị giật đùng đùng!
  hasDataChanged(prev, next) {
    if (!prev || !next) return true;

    const currentUser = (window.Auth && typeof Auth.getCurrentUser === 'function') ? Auth.getCurrentUser() : null;

    // 1. Trường hợp chưa đăng nhập (đang ở cổng Gateway Login):
    if (!currentUser || !currentUser.role) {
      const pu = prev.users || [];
      const nu = next.users || [];
      // Chỉ re-render cổng khi danh sách tài khoản thay đổi (để cập nhật dropdown học sinh/gia sư)
      if (pu.length !== nu.length) return true;
      for (let i = 0; i < nu.length; i++) {
        const u2 = nu[i];
        const u1 = pu.find(u => u && u.id === u2.id);
        if (!u1 || u1.accountStatus !== u2.accountStatus || u1.name !== u2.name) return true;
      }
      return false; // Tuyệt đối không re-render cổng login khi các máy khác nộp bài hoặc làm trắc nghiệm!
    }

    // 2. Trường hợp là HỌC SINH (Student):
    if (currentUser.role === 'student') {
      const myId = currentUser.id;

      // a. Kiểm tra tài khoản bản thân có đổi không (đổi tên, trạng thái tài khoản, đổi gia sư phụ trách)
      const prevMe = (prev.users || []).find(u => u.id === myId);
      const nextMe = (next.users || []).find(u => u.id === myId);
      if (!prevMe || !nextMe || prevMe.name !== nextMe.name || prevMe.assignedTutorId !== nextMe.assignedTutorId || prevMe.accountStatus !== nextMe.accountStatus) return true;

      // b. Kiểm tra lớp học của học sinh này (tham gia lớp, đổi lớp, rời lớp, thông báo mới)
      const prevClasses = (prev.classes || []).filter(c => c.studentIds && c.studentIds.includes(myId));
      const nextClasses = (next.classes || []).filter(c => c.studentIds && c.studentIds.includes(myId));
      if (prevClasses.length !== nextClasses.length) return true;
      for (const nc of nextClasses) {
        const pc = prevClasses.find(c => c.id === nc.id);
        if (!pc) return true;
        if (pc.name !== nc.name || pc.room !== nc.room || (pc.announcements || []).length !== (nc.announcements || []).length) return true;
      }

      // c. Kiểm tra bài tập liên quan đến học sinh này (giao riêng hoặc giao theo lớp)
      const myClassIds = nextClasses.map(c => c.id);
      const isMyAsn = (a) => {
        if (!a) return false;
        if (a.targetStudentIds && a.targetStudentIds.includes(myId)) return true;
        if (a.classId && myClassIds.includes(a.classId)) return true;
        return false;
      };

      const prevMyAsns = (prev.assignments || []).filter(isMyAsn);
      const nextMyAsns = (next.assignments || []).filter(isMyAsn);
      if (prevMyAsns.length !== nextMyAsns.length) return true;
      for (const na of nextMyAsns) {
        const pa = prevMyAsns.find(a => a.id === na.id);
        if (!pa || pa.title !== na.title || pa.deadline !== na.deadline || pa.updatedAt !== na.updatedAt || pa.maxScore !== na.maxScore) return true;
      }

      // d. Kiểm tra bài nộp của CHÍNH HỌC SINH NÀY (được chấm điểm, cập nhật lời phê, đổi điểm)
      const prevMySubs = (prev.submissions || []).filter(s => s.studentId === myId);
      const nextMySubs = (next.submissions || []).filter(s => s.studentId === myId);
      if (prevMySubs.length !== nextMySubs.length) return true;
      for (const ns of nextMySubs) {
        const ps = prevMySubs.find(s => s.id === ns.id);
        if (!ps || ps.status !== ns.status || ps.score !== ns.score || ps.gradedAt !== ns.gradedAt || ps.tutorFeedback !== ns.tutorFeedback) return true;
      }

      // Toàn bộ dữ liệu của học sinh này không đổi -> KHÔNG RE-RENDER! (Loại bỏ 100% giật khi các bạn khác thao tác)
      return false;
    }

    // 3. Trường hợp là PHỤ HUYNH (Parent):
    if (currentUser.role === 'parent') {
      const childId = currentUser.studentId;
      if (!childId) return false;

      const prevSubs = (prev.submissions || []).filter(s => s.studentId === childId);
      const nextSubs = (next.submissions || []).filter(s => s.studentId === childId);
      if (prevSubs.length !== nextSubs.length) return true;
      for (const ns of nextSubs) {
        const ps = prevSubs.find(s => s.id === ns.id);
        if (!ps || ps.status !== ns.status || ps.score !== ns.score || ps.gradedAt !== ns.gradedAt) return true;
      }
      return false;
    }

    // 4. Trường hợp là GIA SƯ (Tutor):
    if (currentUser.role === 'tutor') {
      const tutorId = currentUser.id;
      const prevDelCls = new Set(prev.deletedClassIds || []);
      const nextDelCls = new Set(next.deletedClassIds || []);

      // Danh sách lớp phụ trách (loại trừ các lớp đã xóa)
      const myClasses = (next.classes || []).filter(c => c && !nextDelCls.has(c.id) && (c.tutorId === tutorId || c.assignedTutorId === tutorId));
      const myClassIds = new Set(myClasses.map(c => c.id));
      const myStudentIds = new Set([
        ...(next.users || []).filter(u => u.role === 'student' && (u.assignedTutorId === tutorId || u.tutorId === tutorId)).map(u => u.id),
        ...myClasses.flatMap(c => c.studentIds || [])
      ]);

      // Kiểm tra thay đổi sĩ số học sinh phụ trách
      const prevStdCount = (prev.users || []).filter(u => myStudentIds.has(u.id)).length;
      const nextStdCount = (next.users || []).filter(u => myStudentIds.has(u.id)).length;
      if (prevStdCount !== nextStdCount) return true;

      // Kiểm tra thay đổi bài tập của gia sư này hoặc lớp của gia sư này
      const prevTutorAsns = (prev.assignments || []).filter(a => a.tutorId === tutorId || (a.classId && myClassIds.has(a.classId)));
      const nextTutorAsns = (next.assignments || []).filter(a => a.tutorId === tutorId || (a.classId && myClassIds.has(a.classId)));
      if (prevTutorAsns.length !== nextTutorAsns.length) return true;

      // Kiểm tra bài nộp của học sinh thuộc gia sư này
      const prevTutorSubs = (prev.submissions || []).filter(s => myStudentIds.has(s.studentId));
      const nextTutorSubs = (next.submissions || []).filter(s => myStudentIds.has(s.studentId));
      if (prevTutorSubs.length !== nextTutorSubs.length) return true;
      for (const ns of nextTutorSubs) {
        const ps = prevTutorSubs.find(s => s.id === ns.id);
        if (!ps || ps.status !== ns.status || ps.score !== ns.score || ps.submittedAt !== ns.submittedAt) return true;
      }

      // Kiểm tra các lớp học phụ trách (phát hiện ngay khi có lớp bị xóa hoặc thêm mới)
      const prevTutorClasses = (prev.classes || []).filter(c => c && !prevDelCls.has(c.id) && (c.tutorId === tutorId || c.assignedTutorId === tutorId));
      if (prevTutorClasses.length !== myClasses.length) return true;
      for (const mc of myClasses) {
        if (!prevTutorClasses.some(pc => pc.id === mc.id)) return true;
      }

      // Nếu không liên quan đến học sinh hoặc lớp của gia sư này -> Không re-render
      return false;
    }

    // 5. Trường hợp là ADMIN:
    // Kiểm tra biến động tổng thể trên toàn bộ dữ liệu
    const pu = prev.users || [];
    const nu = next.users || [];
    if (pu.length !== nu.length) return true;

    const pa = prev.assignments || [];
    const na = next.assignments || [];
    if (pa.length !== na.length) return true;

    const ps = prev.submissions || [];
    const ns = next.submissions || [];
    if (ps.length !== ns.length) return true;

    const prevDelClasses = new Set(prev.deletedClassIds || []);
    const nextDelClasses = new Set(next.deletedClassIds || []);
    const pc = (prev.classes || []).filter(c => c && !prevDelClasses.has(c.id));
    const nc = (next.classes || []).filter(c => c && !nextDelClasses.has(c.id));
    if (pc.length !== nc.length) return true;

    for (let i = 0; i < ns.length; i++) {
      const s2 = ns[i];
      const s1 = ps.find(s => s && s.id === s2.id);
      if (!s1 || s1.status !== s2.status || s1.score !== s2.score || s1.submittedAt !== s2.submittedAt) return true;
    }

    for (let i = 0; i < na.length; i++) {
      const a2 = na[i];
      const a1 = pa.find(a => a && a.id === a2.id);
      if (!a1 || a1.title !== a2.title || a1.deadline !== a2.deadline || a1.updatedAt !== a2.updatedAt) return true;
    }

    return false;
  },

  // Áp dụng dữ liệu từ Cloud vào Store với cơ chế Smart Merge
  applyRemoteData(remotePayload) {
    try {
      this.isApplyingRemote = true;
      const remoteData = remotePayload.data;
      if (!remoteData || !Array.isArray(remoteData.users)) {
        return;
      }

      // Lưu snapshot trước khi merge để đối soát
      const prevData = Store.data ? JSON.parse(JSON.stringify(Store.data)) : null;

      const mergedData = this.smartMerge(Store.data, remoteData);
      if (window.Store && typeof Store.healAllData === 'function') {
        Store.healAllData(mergedData);
      }

      Store.data = mergedData;
      this.lastAppliedRemoteTimestamp = remotePayload.lastUpdated || Date.now();

      // Lưu vào LocalStorage (không kích hoạt push ngược lại)
      try {
        localStorage.setItem(Store.STORAGE_KEY, JSON.stringify(Store.data));
      } catch (stErr) {
        console.warn('Lỗi lưu localStorage sau merge:', stErr);
      }

      // Làm mới session tài khoản đang đăng nhập nếu có cập nhật
      if (window.Auth && typeof Auth.refreshUserFromStore === 'function') {
        Auth.refreshUserFromStore();
      }

      // Kích hoạt thông báo tương tác đa thiết bị thông minh (Gia sư <-> Học sinh)
      if (prevData && window.App && typeof App.checkCrossDeviceNotifications === 'function') {
        App.checkCrossDeviceNotifications(prevData, Store.data);
      }

      // TUYỆT ĐỐI KHÔNG tự động đẩy ngược lên Cloud hay GitHub khi đang nhận dữ liệu từ xa!
      // (Ngăn chặn triệt để vòng lặp bão Ping-Pong khi nhiều máy cùng đăng nhập)

      // Kiểm tra xem dữ liệu có thực sự thay đổi hiển thị hay không trước khi vẽ lại giao diện
      const hasChanged = this.hasDataChanged(prevData, Store.data);
      if (hasChanged) {
        if (window.App && typeof App.safeRenderCurrentView === 'function') {
          App.safeRenderCurrentView();
        }
      }
    } catch (e) {
      console.error('Lỗi khi áp dụng dữ liệu đám mây:', e);
    } finally {
      this.isApplyingRemote = false;
      // Nếu trong lúc áp dụng remote data, học sinh vừa thực hiện thao tác (vào lớp, nộp bài, v.v.),
      // tiến hành đẩy ngay dữ liệu vừa merge lên Firebase để bảo toàn 100% thao tác!
      if (this.hasQueuedPush) {
        this.hasQueuedPush = false;
        setTimeout(() => this.schedulePush(), 50);
      }
    }
  },

  // Cơ chế Smart Merge: Giữ toàn vẹn tài khoản, bài tập và điểm số giữa các thiết bị
  smartMerge(local, remote) {
    if (!local) return remote;
    if (!remote) return local;

    const merged = { ...remote, ...local };

    // Hợp nhất danh sách tombstones (các ID đã bị xóa)
    const deletedUserIds = new Set([
      ...(Array.isArray(local.deletedUserIds) ? local.deletedUserIds : []),
      ...(Array.isArray(remote.deletedUserIds) ? remote.deletedUserIds : [])
    ]);
    const deletedAsnIds = new Set([
      ...(Array.isArray(local.deletedAssignmentIds) ? local.deletedAssignmentIds : []),
      ...(Array.isArray(remote.deletedAssignmentIds) ? remote.deletedAssignmentIds : [])
    ]);
    const deletedSubIds = new Set([
      ...(Array.isArray(local.deletedSubmissionIds) ? local.deletedSubmissionIds : []),
      ...(Array.isArray(remote.deletedSubmissionIds) ? remote.deletedSubmissionIds : [])
    ]);
    const deletedClassIds = new Set([
      'cls_12a1', 'cls_10a2',
      ...(Array.isArray(local.deletedClassIds) ? local.deletedClassIds : []),
      ...(Array.isArray(remote.deletedClassIds) ? remote.deletedClassIds : [])
    ]);

    merged.deletedUserIds = Array.from(deletedUserIds);
    merged.deletedAssignmentIds = Array.from(deletedAsnIds);
    merged.deletedSubmissionIds = Array.from(deletedSubIds);
    merged.deletedClassIds = Array.from(deletedClassIds);

    // 1. Hợp nhất danh sách Users (Loại trừ triệt để các tài khoản đã bị xóa)
    const localUsers = (Array.isArray(local.users) ? local.users : []).filter(u => !deletedUserIds.has(u.id));
    const remoteUsers = (Array.isArray(remote.users) ? remote.users : []).filter(u => !deletedUserIds.has(u.id));
    const userMap = new Map();

    // Nạp remote users trước
    remoteUsers.forEach(u => userMap.set(u.id, u));
    // Nạp & hợp nhất local users
    localUsers.forEach(lu => {
      if (!userMap.has(lu.id)) {
        userMap.set(lu.id, lu);
      } else {
        const ru = userMap.get(lu.id);
        const hasAccount = (typeof lu.hasAccount !== 'undefined') ? lu.hasAccount : ru.hasAccount;
        const accountStatus = lu.accountStatus || ru.accountStatus || 'none';

        const combined = {
          ...ru,
          ...lu,
          hasAccount,
          accountStatus
        };

        // Chống lỗi font: Nếu ru bị lỗi font (? hoặc \uFFFD) mà lu không bị, ưu tiên giữ lu
        for (const k in combined) {
          if (typeof lu[k] === 'string' && typeof ru[k] === 'string') {
            const ruBad = ru[k].includes('?') || ru[k].includes('\uFFFD');
            const luBad = lu[k].includes('?') || lu[k].includes('\uFFFD');
            if (ruBad && !luBad) combined[k] = lu[k];
          }
        }

        if (lu.username && lu.username.trim()) combined.username = lu.username;
        else if (ru.username && ru.username.trim()) combined.username = ru.username;

        if (lu.password && lu.password.trim()) combined.password = lu.password;
        else if (ru.password && ru.password.trim()) combined.password = ru.password;

        userMap.set(lu.id, combined);
      }
    });
    merged.users = Array.from(userMap.values()).filter(u => !deletedUserIds.has(u.id));

    // 2. Hợp nhất Bài Tập (Assignments)
    const localAsns = (Array.isArray(local.assignments) ? local.assignments : []).filter(a => !deletedAsnIds.has(a.id));
    const remoteAsns = (Array.isArray(remote.assignments) ? remote.assignments : []).filter(a => !deletedAsnIds.has(a.id));
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
    merged.assignments = Array.from(asnsMap.values()).filter(a => !deletedAsnIds.has(a.id));

    // 3. Hợp nhất Bài Nộp (Submissions) — Khóa thông minh theo (assignmentId + studentId)
    const localSubs = (Array.isArray(local.submissions) ? local.submissions : []).filter(s => !deletedSubIds.has(s.id));
    const remoteSubs = (Array.isArray(remote.submissions) ? remote.submissions : []).filter(s => !deletedSubIds.has(s.id));
    const subsMap = new Map();

    const getSubKey = (s) => (s && s.assignmentId && s.studentId) ? `${s.assignmentId}_${s.studentId}` : (s.id || Math.random().toString());

    remoteSubs.forEach(s => subsMap.set(getSubKey(s), s));
    localSubs.forEach(ls => {
      const key = getSubKey(ls);
      if (!subsMap.has(key)) {
        subsMap.set(key, ls);
      } else {
        const rs = subsMap.get(key);
        if (ls.status === 'graded' && rs.status !== 'graded') {
          subsMap.set(key, { ...rs, ...ls });
        } else if (rs.status === 'graded' && ls.status !== 'graded') {
          subsMap.set(key, { ...ls, ...rs });
        } else {
          const lTime = ls.gradedAt || ls.submittedAt || ls.createdAt || '';
          const rTime = rs.gradedAt || rs.submittedAt || rs.createdAt || '';
          subsMap.set(key, lTime >= rTime ? { ...rs, ...ls } : { ...ls, ...rs });
        }
      }
    });
    merged.submissions = Array.from(subsMap.values()).filter(s => !deletedSubIds.has(s.id));

    // 4. Hợp nhất Danh mục Lớp học (Classes) — Tuyệt đối loại bỏ các lớp đã xóa & không làm mất học sinh khi nhiều em cùng vào lớp
    const localClasses = (Array.isArray(local.classes) ? local.classes : []).filter(c => c && !deletedClassIds.has(c.id));
    const remoteClasses = (Array.isArray(remote.classes) ? remote.classes : []).filter(c => c && !deletedClassIds.has(c.id));
    const classesMap = new Map();

    const currentUserId = (window.Auth && typeof Auth.getCurrentUser === 'function' && Auth.getCurrentUser()) ? Auth.getCurrentUser().id : null;
    const currentUserRole = (window.Auth && typeof Auth.getCurrentUser === 'function' && Auth.getCurrentUser()) ? Auth.getCurrentUser().role : null;

    remoteClasses.forEach(c => {
      if (c && c.id && !deletedClassIds.has(c.id)) classesMap.set(c.id, { ...c });
    });

    localClasses.forEach(lc => {
      if (!lc || !lc.id || deletedClassIds.has(lc.id)) return;
      if (!classesMap.has(lc.id)) {
        classesMap.set(lc.id, { ...lc });
      } else {
        const rc = classesMap.get(lc.id);

        // Hợp nhất danh sách học sinh (studentIds) với Set union
        let mergedStudentIds = [];
        if (currentUserRole === 'student' && currentUserId) {
          const remoteOthers = (Array.isArray(rc.studentIds) ? rc.studentIds : []).filter(id => id !== currentUserId);
          const localOthers = (Array.isArray(lc.studentIds) ? lc.studentIds : []).filter(id => id !== currentUserId);
          const allOthers = Array.from(new Set([...remoteOthers, ...localOthers]));

          const localHasMe = Array.isArray(lc.studentIds) && lc.studentIds.includes(currentUserId);
          if (localHasMe) {
            mergedStudentIds = [...allOthers, currentUserId];
          } else {
            mergedStudentIds = allOthers;
          }
        } else {
          mergedStudentIds = Array.from(new Set([
            ...(Array.isArray(rc.studentIds) ? rc.studentIds : []),
            ...(Array.isArray(lc.studentIds) ? lc.studentIds : [])
          ]));
        }

        // Hợp nhất thông báo lớp học (announcements)
        const annMap = new Map();
        (Array.isArray(rc.announcements) ? rc.announcements : []).forEach(a => { if (a && a.id) annMap.set(a.id, a); });
        (Array.isArray(lc.announcements) ? lc.announcements : []).forEach(a => { if (a && a.id) annMap.set(a.id, a); });

        const baseClass = (lc.updatedAt || '') >= (rc.updatedAt || '') ? { ...rc, ...lc } : { ...lc, ...rc };
        baseClass.studentIds = mergedStudentIds;
        baseClass.announcements = Array.from(annMap.values());
        classesMap.set(lc.id, baseClass);
      }
    });
    merged.classes = Array.from(classesMap.values()).filter(c => c && !deletedClassIds.has(c.id));

    return merged;
  },

  // Đẩy dữ liệu lên Cloud (Có Debounce chống dồn lệnh và Hàng đợi thông minh)
  schedulePush() {
    if (!this.isConfigured) return;
    if (this.isApplyingRemote) {
      this.hasQueuedPush = true;
      return;
    }

    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.pushData(Store.data);
    }, 300);
  },

  // Thực hiện đẩy dữ liệu (Đa kênh: HTTP REST API độc lập + Firebase SDK WebSocket)
  async pushData(dataToPush, immediate = false) {
    if (!this.isConfigured) return false;

    const authorName = (window.Auth && Auth.getCurrentUser()) ? Auth.getCurrentUser().name : 'EduTask';
    const cleanData = dataToPush || Store.data;
    if (window.Store && typeof Store.healAllData === 'function') {
      Store.healAllData(cleanData);
    }
    const payload = {
      data: cleanData,
      lastUpdated: Date.now(),
      deviceId: this.myDeviceId,
      author: authorName,
      clientVersion: 14
    };

    this.renderHeaderIndicator('syncing');
    let pushSuccess = false;

    // 1. Kênh WebSocket chính qua Firebase SDK: Nhanh nhất (0.05s), mượt mà, không dội HTTP kép
    if (this.syncRef && this.isConnected) {
      try {
        await new Promise((resolve) => {
          this.syncRef.set(payload, (error) => {
            if (error) {
              console.warn('[CloudSync] SDK push warning, fallback REST:', error);
              resolve(false);
            } else {
              pushSuccess = true;
              this.lastPushedTimestamp = payload.lastUpdated;
              this.renderHeaderIndicator('connected');
              resolve(true);
            }
          });
        });
      } catch (sdkErr) {
        console.warn('[CloudSync] SDK push exception:', sdkErr);
      }
    }

    // 2. Kênh REST API trực tiếp: Kích hoạt dự phòng khi chưa kết nối WebSocket hoặc SDK có sự cố
    if (!pushSuccess) {
      try {
        const restUrl = this.getRestUrl();
        const res = await fetch(restUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          pushSuccess = true;
          this.lastPushedTimestamp = payload.lastUpdated;
          this.renderHeaderIndicator('connected');
          console.log('[CloudSync] ⚡ Đẩy dữ liệu lên Firebase qua REST API thành công!');
        }
      } catch (restErr) {
        console.warn('[CloudSync] REST push warning:', restErr);
      }
    }

    if (!pushSuccess) {
      this.renderHeaderIndicator('error');
    }

    return pushSuccess;
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

  // Tải dữ liệu từ Cloud về máy thủ công (Đa kênh REST + SDK)
  async manualPullNow() {
    if (window.App && App.showToast) {
      App.showToast('📥 Đang kiểm tra và nạp dữ liệu từ Cloud...', 'info');
    }
    const success = await this.pullFromCloud(true);
    if (!success) {
      if (window.App && App.showToast) {
        App.showToast('Chưa thể lấy dữ liệu mới từ Cloud hoặc mạng bị gián đoạn.', 'warning');
      }
    }
    this.openModal('status');
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

// Đăng ký toàn cục vào window để mọi module và trình duyệt đa nền tảng đều truy cập được
if (typeof window !== 'undefined') {
  window.CloudSync = CloudSync;
  CloudSync.init();
}

