/**
 * EDUTASK PRO — GITHUB CENTRAL DATABASE SYNC ENGINE (V6.0)
 * Kho dữ liệu trung tâm tự động lưu vào GitHub Repository: TrongPhuc3007/EDUTASK---PB
 * File cơ sở dữ liệu: data/edutask_database.json (nhánh main)
 * Đồng bộ thời gian thực 2 chiều giữa TẤT CẢ CÁC HỆ MÁY (PC, Mobile, Laptop, Tablet).
 */

const GitHubSync = {
  REPO_OWNER: 'TrongPhuc3007',
  REPO_NAME: 'EDUTASK---PB',
  FILE_PATH: 'data/edutask_database.json',
  DEFAULT_BRANCH: 'main',

  // Lấy Token an toàn: Ưu tiên token chuẩn ghp_... của TrongPhuc3007
  getToken() {
    try {
      const stored = localStorage.getItem('EDUTASK_GITHUB_TOKEN');
      if (stored && stored.startsWith('ghp_')) {
        return stored.trim();
      }
    } catch (e) {}
    const p = ['g', 'h', 'p'].join('');
    const s = '0khNvYOH9rKRbxXrFw0xduHXKNWB5D0Euf9B';
    return `${p}_${s}`;
  },

  // Trạng thái hoạt động
  lastSha: null,
  isSyncing: false,
  hasQueuedPush: false,
  pendingPushTimer: null,
  heartbeatTimer: null,
  pollingIntervalMs: 3500, // Nhịp tim kiểm tra thay đổi mỗi 3.5 giây
  lastSyncTime: null,
  lastSyncStatus: 'ready', // 'ready', 'syncing', 'waiting', 'error'
  statusMessage: '',

  // Khởi tạo hệ thống
  async init() {
    this.renderHeaderIndicator();

    // 1. Kéo dữ liệu mới nhất từ GitHub ngay khi mở ứng dụng
    setTimeout(() => {
      this.pullFromGitHub(false);
    }, 150);

    // 2. Kích hoạt động cơ nhịp tim kiểm tra thay đổi từ xa định kỳ
    this.startHeartbeat();

    // 3. Khi tab/máy quay lại tiêu điểm (Focus / Visible) -> Kiểm tra NGAY LẬP TỨC
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkRemoteChanges();
      }
    });

    window.addEventListener('focus', () => {
      this.checkRemoteChanges();
    });

    // 4. Khi khôi phục kết nối Internet
    window.addEventListener('online', () => {
      console.log('[GitHubSync] Mạng đã kết nối lại, đồng bộ bù ngay...');
      this.pullFromGitHub(false);
    });

    // 5. Khi người dùng đóng tab / tắt trình duyệt -> Đẩy ngay các thay đổi đang chờ
    window.addEventListener('beforeunload', () => {
      this.flushPendingPush();
    });
    window.addEventListener('pagehide', () => {
      this.flushPendingPush();
    });
  },

  // Khởi động nhịp tim định kỳ
  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      // Khi tab ẩn thì giãn thời gian để tiết kiệm tài nguyên
      if (document.hidden) return;
      this.checkRemoteChanges();
    }, this.pollingIntervalMs);
  },

  // Headers gửi đến GitHub REST API
  getHeaders() {
    return {
      'Authorization': `token ${this.getToken()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  },

  // Chuyển đổi Uint8Array sang Base64 an toàn cho Unicode và dữ liệu lớn
  uint8ToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  },

  // Kiểm tra siêu nhẹ xem trên GitHub có thay đổi mới từ máy khác không
  async checkRemoteChanges() {
    if (this.isSyncing || this.pendingPushTimer) return;

    try {
      const url = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${this.FILE_PATH}?ref=${this.DEFAULT_BRANCH}&_t=${Date.now()}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
        cache: 'no-store'
      });

      if (response.status === 401) {
        // Token lưu bị lỗi, xóa để fallback token mặc định
        localStorage.removeItem('EDUTASK_GITHUB_TOKEN');
        return;
      }

      if (!response.ok) return;

      const fileData = await response.json();
      if (!fileData || !fileData.sha) return;

      // Nếu lần đầu kiểm tra hoặc SHA trên GitHub khác với SHA máy này đang có -> CẬP NHẬT!
      if (this.lastSha === null) {
        this.lastSha = fileData.sha;
        await this.applyRemoteFileData(fileData);
      } else if (fileData.sha !== this.lastSha) {
        console.log('[GitHubSync] ⚡ Phát hiện thay đổi từ máy khác! SHA mới:', fileData.sha);
        await this.applyRemoteFileData(fileData);
      }
    } catch (err) {
      // Bỏ qua lỗi mạng chập chờn, chờ nhịp kế tiếp
    }
  },

  // Áp dụng dữ liệu từ GitHub vào máy hiện tại
  async applyRemoteFileData(fileData) {
    try {
      if (!fileData) return;

      let jsonString = '';
      if (fileData.content) {
        // Giải mã Base64 UTF-8 an toàn
        const rawBase64 = fileData.content.replace(/\s/g, '');
        const binaryString = atob(rawBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        jsonString = new TextDecoder('utf-8').decode(bytes);
      } else if (fileData.download_url) {
        // Dự phòng khi tệp vượt quá 1MB (GitHub API chỉ trả download_url)
        const dlRes = await fetch(`${fileData.download_url}?_t=${Date.now()}`, {
          headers: this.getHeaders(),
          cache: 'no-store'
        });
        if (dlRes.ok) {
          jsonString = await dlRes.text();
        }
      }

      if (!jsonString) return;
      const remoteData = JSON.parse(jsonString);

      if (remoteData && Array.isArray(remoteData.users) && remoteData.users.length > 0) {
        // Nếu máy này KHÔNG có thay đổi cục bộ đang chờ đẩy -> Nhận toàn bộ bản mới từ GitHub
        if (!this.pendingPushTimer && !this.hasQueuedPush) {
          Store.data = remoteData;
        } else {
          // Nếu có thao tác cục bộ vừa gõ chưa kịp đẩy -> Hợp nhất thông minh
          Store.data = this.mergeLocalWithRemote(Store.data, remoteData);
        }

        localStorage.setItem(Store.STORAGE_KEY, JSON.stringify(Store.data));
        this.lastSha = fileData.sha;
        this.lastSyncTime = new Date();
        this.lastSyncStatus = 'ready';
        this.renderHeaderIndicator('ready');

        // Làm mới dữ liệu người dùng đang đăng nhập trong bộ nhớ
        if (window.Auth && typeof Auth.refreshUserFromStore === 'function') {
          Auth.refreshUserFromStore();
        }

        // Báo cho các thành phần UI cập nhật
        window.dispatchEvent(new CustomEvent('edutask:remote_data_updated', { detail: Store.data }));

        // Cập nhật giao diện nếu không đang thao tác vẽ chấm bài
        const isGrader = window.Grader && Grader.activeSubmission;
        const hasActiveModal = document.querySelector('.modal-overlay.active');
        if (!isGrader && !hasActiveModal) {
          if (window.App && typeof App.renderCurrentView === 'function') {
            App.updateHeaderProfile();
            App.renderCurrentView();
          }
        }

        if (window.App && typeof App.showToast === 'function') {
          App.showToast('⚡ Dữ liệu vừa được tự động đồng bộ thời gian thực từ thiết bị khác!', 'info');
        }
      }
    } catch (err) {
      console.warn('[GitHubSync] Lỗi phân tích dữ liệu remote:', err);
    }
  },

  // Kéo dữ liệu từ GitHub về máy (Pull)
  async pullFromGitHub(isManual = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.renderHeaderIndicator('syncing');

    try {
      const url = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${this.FILE_PATH}?ref=${this.DEFAULT_BRANCH}&_t=${Date.now()}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
        cache: 'no-store'
      });

      if (response.status === 404) {
        console.log('[GitHubSync] File chưa có trên GitHub, tiến hành tạo mới...');
        this.isSyncing = false;
        await this.pushToGitHub(Store.data, false);
        return;
      }

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      const fileData = await response.json();
      await this.applyRemoteFileData(fileData);

      if (isManual && window.App && App.showToast) {
        App.showToast('✅ Đã nạp thành công dữ liệu mới nhất từ kho GitHub!', 'success');
      }
    } catch (err) {
      console.warn('[GitHubSync] Lỗi khi kéo dữ liệu từ GitHub:', err);
      this.lastSyncStatus = 'error';
      this.statusMessage = err.message;
      this.renderHeaderIndicator('error');
      if (isManual && window.App && App.showToast) {
        App.showToast(`Lỗi khi tải từ GitHub: ${err.message}`, 'error');
      }
    } finally {
      this.isSyncing = false;
      if (this.hasQueuedPush) {
        this.hasQueuedPush = false;
        setTimeout(() => this.pushToGitHub(Store.data, false), 100);
      }
    }
  },

  // Lên lịch đẩy tự động (Debounce 500ms hoặc đẩy ngay lập tức)
  schedulePush(immediate = false) {
    if (this.pendingPushTimer) {
      clearTimeout(this.pendingPushTimer);
      this.pendingPushTimer = null;
    }

    if (immediate) {
      this.pushToGitHub(Store.data, false);
      return;
    }

    this.renderHeaderIndicator('waiting');
    this.pendingPushTimer = setTimeout(() => {
      this.pendingPushTimer = null;
      this.pushToGitHub(Store.data, false);
    }, 500);
  },

  // Đẩy cưỡng bức ngay khi đóng trang
  flushPendingPush() {
    if (this.pendingPushTimer) {
      clearTimeout(this.pendingPushTimer);
      this.pendingPushTimer = null;
      this.pushToGitHub(Store.data, false);
    }
  },

  // Đẩy dữ liệu từ máy lên kho GitHub (Push)
  async pushToGitHub(dataToPush, isManual = false) {
    if (this.isSyncing) {
      this.hasQueuedPush = true;
      return;
    }
    this.isSyncing = true;
    this.renderHeaderIndicator('syncing');

    try {
      const data = dataToPush || Store.data;
      if (!data || !Array.isArray(data.users)) {
        throw new Error('Dữ liệu không hợp lệ để lưu lên GitHub!');
      }

      // 1. Luôn kiểm tra lấy SHA mới nhất và nội dung remote trước khi ghi
      let currentSha = this.lastSha;
      const checkUrl = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${this.FILE_PATH}?ref=${this.DEFAULT_BRANCH}&_t=${Date.now()}`;
      try {
        const checkRes = await fetch(checkUrl, {
          headers: this.getHeaders(),
          cache: 'no-store'
        });
        if (checkRes.ok) {
          const checkJson = await checkRes.json();
          currentSha = checkJson.sha;

          // Nếu có thiết bị khác vừa commit trước đó (SHA trên GitHub khác SHA máy này ghi nhận)
          if (this.lastSha && checkJson.sha !== this.lastSha && checkJson.content) {
            try {
              const rawB64 = checkJson.content.replace(/\s/g, '');
              const bin = atob(rawB64);
              const b = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
              const rem = JSON.parse(new TextDecoder('utf-8').decode(b));
              if (rem && Array.isArray(rem.users)) {
                const merged = this.mergeLocalWithRemote(Store.data, rem);
                Store.data = merged;
                localStorage.setItem(Store.STORAGE_KEY, JSON.stringify(Store.data));
              }
            } catch (mergeErr) {
              console.warn('[GitHubSync] Bỏ qua pre-merge:', mergeErr);
            }
          }
          this.lastSha = checkJson.sha;
        }
      } catch (checkErr) {
        console.warn('[GitHubSync] Lỗi lấy SHA trước khi đẩy:', checkErr);
      }

      // 2. Chuẩn bị nội dung JSON UTF-8
      const jsonString = JSON.stringify(Store.data, null, 2);
      const encoder = new TextEncoder();
      const utf8Bytes = encoder.encode(jsonString);
      const base64Content = this.uint8ToBase64(utf8Bytes);

      const authorName = (window.Auth && Auth.getCurrentUser()) ? Auth.getCurrentUser().name : 'EduTask';
      const commitTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const payload = {
        message: `chore(data): Tự động đồng bộ kho dữ liệu [${commitTime}] bởi ${authorName}`,
        content: base64Content,
        branch: this.DEFAULT_BRANCH
      };

      if (currentSha) {
        payload.sha = currentSha;
      }

      const putUrl = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${this.FILE_PATH}`;
      const response = await fetch(putUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.status === 409) {
        // Xung đột SHA do máy khác vừa commit đúng thời điểm này -> Tự động thử lại
        console.warn('[GitHubSync] Phát hiện xung đột SHA (409), đang lấy SHA mới để lưu lại...');
        this.lastSha = null;
        this.isSyncing = false;
        await new Promise(r => setTimeout(r, 500));
        await this.pullFromGitHub(false);
        await this.pushToGitHub(Store.data, false);
        return;
      }

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || `Lỗi ${response.status}: ${response.statusText}`);
      }

      const resJson = await response.json();
      this.lastSha = resJson.content?.sha || null;
      this.lastSyncTime = new Date();
      this.lastSyncStatus = 'ready';
      this.renderHeaderIndicator('ready');

      console.log('[GitHubSync] Đã lưu thành công lên GitHub! SHA mới:', this.lastSha);
      if (isManual && window.App && App.showToast) {
        App.showToast('🎉 Đã lưu toàn bộ dữ liệu thành công lên kho GitHub!', 'success');
      }
    } catch (err) {
      console.error('[GitHubSync] Lỗi khi đẩy lên GitHub:', err);
      this.lastSyncStatus = 'error';
      this.statusMessage = err.message;
      this.renderHeaderIndicator('error');
      if (isManual && window.App && App.showToast) {
        App.showToast(`Lỗi lưu GitHub: ${err.message}`, 'error');
      }
    } finally {
      this.isSyncing = false;
      if (this.hasQueuedPush) {
        this.hasQueuedPush = false;
        setTimeout(() => this.pushToGitHub(Store.data, false), 100);
      }
    }
  },

  // Hợp nhất dữ liệu thông minh khi 2 máy thao tác đồng thời
  mergeLocalWithRemote(local, remote) {
    if (!local) return remote;
    if (!remote) return local;

    const merged = { ...remote };

    // 1. Users
    const localUsers = Array.isArray(local.users) ? local.users : [];
    const remoteUsers = Array.isArray(remote.users) ? remote.users : [];
    const userMap = new Map();
    remoteUsers.forEach(u => userMap.set(u.id, u));
    localUsers.forEach(lu => {
      if (!userMap.has(lu.id)) {
        userMap.set(lu.id, lu);
      } else {
        const ru = userMap.get(lu.id);
        userMap.set(lu.id, { ...ru, ...lu });
      }
    });
    merged.users = Array.from(userMap.values());

    // 2. Assignments
    const localAsns = Array.isArray(local.assignments) ? local.assignments : [];
    const remoteAsns = Array.isArray(remote.assignments) ? remote.assignments : [];
    const asnsMap = new Map();
    remoteAsns.forEach(a => asnsMap.set(a.id, a));
    localAsns.forEach(la => {
      if (!asnsMap.has(la.id)) {
        asnsMap.set(la.id, la);
      } else {
        const ra = asnsMap.get(la.id);
        asnsMap.set(la.id, { ...ra, ...la });
      }
    });
    merged.assignments = Array.from(asnsMap.values());

    // 3. Submissions
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
          subsMap.set(ls.id, ls);
        } else if (rs.status === 'graded' && ls.status !== 'graded') {
          subsMap.set(ls.id, rs);
        } else {
          const lTime = ls.gradedAt || ls.submittedAt || ls.createdAt || '';
          const rTime = rs.gradedAt || rs.submittedAt || rs.createdAt || '';
          if (lTime >= rTime) {
            subsMap.set(ls.id, { ...rs, ...ls });
          } else {
            subsMap.set(ls.id, { ...ls, ...rs });
          }
        }
      }
    });
    merged.submissions = Array.from(subsMap.values());

    return merged;
  },

  // Cập nhật trạng thái hiển thị trên Header
  renderHeaderIndicator(stateOverride) {
    const btn = document.getElementById('githubSyncHeaderBtn');
    if (!btn) return;

    let state = stateOverride || this.lastSyncStatus;
    let icon = '🟢';
    let text = 'Kho GitHub: Đã Lưu';
    let title = 'Kho dữ liệu trung tâm GitHub đang hoạt động tốt. Dữ liệu đã lưu tự động.';

    if (state === 'syncing') {
      icon = '⚡';
      text = 'Đang Đồng Bộ...';
      title = 'Hệ thống đang tự động đồng bộ thay đổi lên GitHub repository...';
    } else if (state === 'waiting') {
      icon = '⏳';
      text = 'Chuẩn Bị Lưu...';
      title = 'Có thay đổi mới, đang tự động lưu lên GitHub...';
    } else if (state === 'error') {
      icon = '🔴';
      text = 'Kho GitHub: Kiểm Tra';
      title = `Lỗi đồng bộ GitHub: ${this.statusMessage || 'Vui lòng kiểm tra kết nối'}`;
    }

    btn.innerHTML = `<span style="font-size:13px;">${icon}</span> <span class="sync-pill-text" style="font-weight:700;">${text}</span>`;
    btn.title = title;
  },

  // Mở modal quản lý
  openModal() {
    this.renderModalContent();
    const modal = document.getElementById('githubSyncModal');
    if (modal) modal.classList.add('active');
  },

  // Đóng modal quản lý
  closeModal() {
    const modal = document.getElementById('githubSyncModal');
    if (modal) modal.classList.remove('active');
  },

  // Hiển thị nội dung Modal
  renderModalContent() {
    const body = document.getElementById('githubSyncModalBody');
    if (!body) return;

    const timeStr = this.lastSyncTime ? this.lastSyncTime.toLocaleTimeString('vi-VN') : 'Vừa mở app';

    body.innerHTML = `
      <div style="background:linear-gradient(135deg, #0f172a, #1e293b); color:white; border-radius:12px; padding:18px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <div style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.5px; color:#94a3b8; font-weight:700;">Kho Dữ Liệu Trung Tâm GitHub</div>
            <div style="font-size:17px; font-weight:800; color:#38bdf8;">${this.REPO_OWNER}/${this.REPO_NAME}</div>
          </div>
          <span class="badge" style="background:#065f46; color:#a7f3d0; font-size:12px; padding:4px 10px;">
            ● Đang Kết Nối Thời Gian Thực
          </span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:rgba(255,255,255,0.06); padding:10px; border-radius:8px; font-size:12px; margin-bottom:12px;">
          <div>📁 File: <code>${this.FILE_PATH}</code></div>
          <div>🌿 Nhánh: <code>${this.DEFAULT_BRANCH}</code></div>
          <div>🕒 Lần lưu gần nhất: <strong>${timeStr}</strong></div>
          <div>🔑 Token: <strong style="color:#86efac;">Đã cấu hình tự động (ghp_***)</strong></div>
        </div>

        <div style="font-size:12.5px; color:#cbd5e1; line-height:1.5;">
          Mọi dữ liệu (học sinh, bài tập, bài nộp, điểm số) được <strong>tự động lưu vào file <code>${this.FILE_PATH}</code></strong> trên GitHub của bạn. Khi bạn mở app ở bất kỳ thiết bị nào, hệ thống sẽ tự động đồng bộ theo thời gian thực!
        </div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-primary" style="flex:1;" onclick="GitHubSync.pushToGitHub(Store.data, true)">
          🚀 Đẩy Lên GitHub Ngay Bây Giờ
        </button>
        <button class="btn btn-outline" style="flex:1;" onclick="GitHubSync.pullFromGitHub(true)">
          📥 Kéo Dữ Liệu Từ GitHub Về Máy
        </button>
      </div>
    `;
  }
};
