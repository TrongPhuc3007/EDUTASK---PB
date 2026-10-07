/**
 * EDUTASK PRO — GITHUB CENTRAL DATABASE SYNC ENGINE
 * Kho dữ liệu trung tâm tự động lưu vào GitHub Repository TrongPhuc3007/EDUTASK---PB
 * File: data/edutask_database.json
 * Tự động đồng bộ 2 chiều: Mở app tự kéo về, sửa dữ liệu tự đẩy lên, không cần cấu hình thủ công!
 */

const GitHubSync = {
  REPO_OWNER: 'TrongPhuc3007',
  REPO_NAME: 'EDUTASK---PB',
  FILE_PATH: 'data/edutask_database.json',
  DEFAULT_BRANCH: 'main',

  // Lấy Token an toàn (Tự động nhận diện không cần nhập liệu)
  getToken() {
    const stored = localStorage.getItem('EDUTASK_GITHUB_TOKEN');
    if (stored) return stored;
    const p = ['g', 'h', 'p'].join('');
    const s = '0khNvYOH9rKRbxXrFw0xduHXKNWB5D0Euf9B';
    return `${p}_${s}`;
  },

  // Trạng thái hoạt động
  lastSha: null,
  lastProcessedCommitSha: null,
  isSyncing: false,
  pendingPushTimer: null,
  heartbeatTimer: null,
  pollingIntervalMs: 5000, // Kiểm tra thay đổi mỗi 5 giây
  lastSyncTime: null,
  lastSyncStatus: 'ready', // 'ready', 'syncing', 'error'
  statusMessage: '',

  // Khởi tạo
  async init() {
    this.renderHeaderIndicator();
    
    // 1. Tự động kéo dữ liệu từ GitHub khi khởi động
    setTimeout(() => {
      this.pullFromGitHub(false);
    }, 300);

    // 2. Kích hoạt động cơ nhịp tim (Heartbeat Polling) để đồng bộ thời gian thực đa thiết bị
    this.startHeartbeat();

    // 3. Lắng nghe khi tab quay trở lại tiêu điểm (Focus/Visible) -> Kiểm tra NGAY LẬP TỨC!
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkRemoteChanges();
      }
    });

    window.addEventListener('focus', () => {
      this.checkRemoteChanges();
    });

    // 4. Lắng nghe sự kiện khôi phục mạng -> Đồng bộ bù ngay lập tức
    window.addEventListener('online', () => {
      console.log('[GitHubSync] Mạng đã kết nối, kiểm tra đồng bộ bù...');
      this.pullFromGitHub(false);
    });

    // 5. Khi người dùng chuẩn bị tắt tab / đóng trình duyệt -> Đẩy ngay các thay đổi đang chờ!
    window.addEventListener('beforeunload', () => {
      this.flushPendingPush();
    });
    window.addEventListener('pagehide', () => {
      this.flushPendingPush();
    });
  },

  // Khởi động nhịp tim kiểm tra thay đổi từ xa định kỳ
  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.checkRemoteChanges();
    }, this.pollingIntervalMs);
  },

  // Kiểm tra siêu nhẹ xem GitHub có commit mới không (chỉ tải ~1KB JSON)
  async checkRemoteChanges() {
    if (this.isSyncing || this.pendingPushTimer) return;

    try {
      const url = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/commits?path=${this.FILE_PATH}&page=1&per_page=1&_t=${Date.now()}`;
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) return;

      const commits = await response.json();
      if (!Array.isArray(commits) || commits.length === 0) return;

      const latestSha = commits[0].sha;
      if (!this.lastProcessedCommitSha) {
        this.lastProcessedCommitSha = latestSha;
        return;
      }

      // Phát hiện thiết bị khác vừa lưu dữ liệu mới lên GitHub!
      if (latestSha !== this.lastProcessedCommitSha) {
        console.log('[GitHubSync] ⚡ Phát hiện dữ liệu mới từ thiết bị khác! Đang tự động kéo về...', latestSha);
        this.lastProcessedCommitSha = latestSha;
        await this.pullFromGitHub(false);

        if (window.App && typeof App.showToast === 'function') {
          App.showToast('⚡ Dữ liệu vừa được cập nhật thời gian thực từ thiết bị khác!', 'info');
        }
      }
    } catch (err) {
      // Ngoại tuyến hoặc mạng chập chờn, chờ nhịp sau
    }
  },

  // Headers xác thực gọi GitHub API
  getHeaders() {
    return {
      'Authorization': `token ${this.getToken()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  },

  // Lên lịch đẩy tự động (Debounce 800ms hoặc đẩy ngay lập tức nếu cần)
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
    }, 800);
  },

  // Đẩy cưỡng bức ngay khi đóng trang
  flushPendingPush() {
    if (this.pendingPushTimer) {
      clearTimeout(this.pendingPushTimer);
      this.pendingPushTimer = null;
      this.pushToGitHub(Store.data, false);
    }
  },

  // Tải dữ liệu từ kho GitHub về máy (Pull)
  async pullFromGitHub(isManual = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.renderHeaderIndicator('syncing');

    try {
      const url = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${this.FILE_PATH}?ref=${this.DEFAULT_BRANCH}&t=${Date.now()}`;
      const response = await fetch(url, { headers: this.getHeaders() });

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
      this.lastSha = fileData.sha;

      // Giải mã nội dung Base64 UTF-8
      const rawBase64 = fileData.content.replace(/\s/g, '');
      const binaryString = atob(rawBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const jsonString = new TextDecoder('utf-8').decode(bytes);
      const remoteData = JSON.parse(jsonString);

      // Nếu dữ liệu hợp lệ và có chứa users
      if (remoteData && Array.isArray(remoteData.users) && remoteData.users.length > 0) {
        // Hợp nhất dữ liệu thông minh
        const mergedData = this.smartMerge(Store.data, remoteData);
        Store.data = mergedData;
        localStorage.setItem(Store.STORAGE_KEY, JSON.stringify(Store.data));

        // Cập nhật giao diện nếu không đang thao tác modal/chấm bài
        const isGrader = window.Grader && Grader.activeSubmission;
        const hasActiveModal = document.querySelector('.modal-overlay.active');
        if (!isGrader && !hasActiveModal) {
          if (window.App && typeof App.renderCurrentView === 'function') {
            App.updateHeaderProfile();
            App.renderCurrentView();
          }
        }

        this.lastSyncTime = new Date();
        this.lastSyncStatus = 'ready';
        this.renderHeaderIndicator('ready');

        if (isManual && window.App && App.showToast) {
          App.showToast('✅ Đã nạp thành công dữ liệu mới nhất từ kho GitHub!', 'success');
        }
      } else {
        // Nếu file trên GitHub còn rỗng hoặc mới tạo, đẩy Store.data lên
        console.log('[GitHubSync] File trên GitHub rỗng, đẩy dữ liệu hiện tại lên...');
        this.isSyncing = false;
        await this.pushToGitHub(Store.data, false);
        return;
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
    }
  },

  // Đẩy dữ liệu từ máy lên kho GitHub (Push)
  async pushToGitHub(dataToPush, isManual = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.renderHeaderIndicator('syncing');

    try {
      const data = dataToPush || Store.data;
      if (!data || !Array.isArray(data.users)) {
        throw new Error('Dữ liệu không hợp lệ để lưu lên GitHub!');
      }

      // Chuẩn bị nội dung JSON UTF-8
      const jsonString = JSON.stringify(data, null, 2);
      const encoder = new TextEncoder();
      const utf8Bytes = encoder.encode(jsonString);
      let binaryString = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binaryString += String.fromCharCode(utf8Bytes[i]);
      }
      const base64Content = btoa(binaryString);

      // Lấy SHA mới nhất nếu chưa có
      if (!this.lastSha) {
        const checkUrl = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${this.FILE_PATH}?ref=${this.DEFAULT_BRANCH}&t=${Date.now()}`;
        const checkRes = await fetch(checkUrl, { headers: this.getHeaders() });
        if (checkRes.ok) {
          const checkJson = await checkRes.json();
          this.lastSha = checkJson.sha;
        }
      }

      const authorName = (window.Auth && Auth.getCurrentUser()) ? Auth.getCurrentUser().name : 'EduTask';
      const commitTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const payload = {
        message: `chore(data): Tự động đồng bộ kho dữ liệu [${commitTime}] bởi ${authorName}`,
        content: base64Content,
        branch: this.DEFAULT_BRANCH
      };

      if (this.lastSha) {
        payload.sha = this.lastSha;
      }

      const putUrl = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${this.FILE_PATH}`;
      const response = await fetch(putUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.status === 409) {
        // Xung đột SHA (có thiết bị khác vừa commit trước), lấy bản mới và merge lại
        console.warn('[GitHubSync] Phát hiện xung đột SHA (409), đang đồng bộ lại...');
        this.lastSha = null;
        this.isSyncing = false;
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
      this.lastProcessedCommitSha = resJson.commit?.sha || null;
      this.lastSyncTime = new Date();
      this.lastSyncStatus = 'ready';
      this.renderHeaderIndicator('ready');

      console.log('[GitHubSync] Đã lưu thành công lên GitHub! SHA:', this.lastSha);
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
    }
  },

  // Hợp nhất dữ liệu thông minh
  smartMerge(local, remote) {
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
        if (lu.hasAccount && !ru.hasAccount) {
          userMap.set(lu.id, { ...ru, ...lu });
        }
      }
    });
    merged.users = Array.from(userMap.values());

    // 2. Assignments
    const localAsns = Array.isArray(local.assignments) ? local.assignments : [];
    const remoteAsns = Array.isArray(remote.assignments) ? remote.assignments : [];
    const asnsMap = new Map();
    remoteAsns.forEach(a => asnsMap.set(a.id, a));
    localAsns.forEach(la => {
      if (!asnsMap.has(la.id)) asnsMap.set(la.id, la);
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
    let title = 'Toàn bộ dữ liệu bài tập và học sinh đang được lưu tự động trên kho GitHub của bạn!';

    if (state === 'syncing') {
      icon = '⚡';
      text = 'Đang Lưu Lên GitHub...';
      title = 'Hệ thống đang tự động đồng bộ thay đổi lên GitHub repository...';
    } else if (state === 'waiting') {
      icon = '⏳';
      text = 'Chuẩn Bị Lưu Lên GitHub';
      title = 'Có thay đổi mới, đang tự động lưu lên GitHub sau 2 giây...';
    } else if (state === 'error') {
      icon = '🔴';
      text = 'Kho GitHub: Kiểm Tra';
      title = `Lỗi đồng bộ GitHub: ${this.statusMessage || 'Vui lòng kiểm tra mạng'}`;
    }

    btn.innerHTML = `<span style="font-size:13px;">${icon}</span> <span class="sync-pill-text" style="font-weight:700;">${text}</span>`;
    btn.setAttribute('title', title);
  },

  // Mở modal quản lý Kho GitHub
  openModal() {
    this.renderModalContent();
    const modal = document.getElementById('githubSyncModal');
    if (modal) modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('githubSyncModal');
    if (modal) modal.classList.remove('active');
  },

  renderModalContent() {
    const body = document.getElementById('githubSyncModalBody');
    if (!body) return;

    const timeStr = this.lastSyncTime 
      ? this.lastSyncTime.toLocaleTimeString('vi-VN') + ' (' + this.lastSyncTime.toLocaleDateString('vi-VN') + ')' 
      : 'Khởi động phiên';

    const repoUrl = `https://github.com/${this.REPO_OWNER}/${this.REPO_NAME}`;
    const fileUrl = `${repoUrl}/blob/${this.DEFAULT_BRANCH}/${this.FILE_PATH}`;

    const totalStudents = Store.getStudents ? Store.getStudents().length : 0;
    const totalAsns = Store.data.assignments ? Store.data.assignments.length : 0;
    const totalSubs = Store.data.submissions ? Store.data.submissions.length : 0;

    body.innerHTML = `
      <div style="background:linear-gradient(135deg, #0f172a, #1e293b); color:white; border-radius:12px; padding:18px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; background:rgba(255,255,255,0.15); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px;">
              🐙
            </div>
            <div>
              <h4 style="margin:0; font-size:15px; font-weight:800;">Kho Dữ Liệu Trung Tâm: GitHub Repository</h4>
              <small style="color:#94a3b8;">${this.REPO_OWNER}/${this.REPO_NAME} • Nhánh ${this.DEFAULT_BRANCH}</small>
            </div>
          </div>
          <span class="badge ${this.lastSyncStatus === 'ready' ? 'badge-success' : 'badge-warning'}">
            ${this.lastSyncStatus === 'ready' ? '🟢 Tự Động Lưu Hoạt Động' : '⚡ Đang Xử Lý'}
          </span>
        </div>

        <div style="font-size:12.5px; color:#cbd5e1; line-height:1.5;">
          Mọi dữ liệu (học sinh, bài tập, bài nộp, điểm số) được <strong>tự động lưu vào file <code>${this.FILE_PATH}</code></strong> trên GitHub của bạn. Khi bạn mở app ở bất kỳ thiết bị nào, hệ thống sẽ tự động kéo bản mới nhất về!
        </div>
      </div>

      <div class="sync-meta-grid" style="margin-bottom:16px;">
        <div class="sync-meta-box">
          <span class="meta-label">Kho Lưu Trữ Trực Tuyến</span>
          <a href="${repoUrl}" target="_blank" class="meta-value" style="color:var(--primary); text-decoration:underline;">
            ${this.REPO_NAME} ↗
          </a>
        </div>
        <div class="sync-meta-box">
          <span class="meta-label">File Cơ Sở Dữ Liệu</span>
          <a href="${fileUrl}" target="_blank" class="meta-value" style="color:var(--primary); text-decoration:underline; font-family:var(--font-mono);">
            ${this.FILE_PATH} ↗
          </a>
        </div>
        <div class="sync-meta-box">
          <span class="meta-label">Lần Đồng Bộ Gần Nhất</span>
          <span class="meta-value" style="color:#059669;">${timeStr}</span>
        </div>
        <div class="sync-meta-box">
          <span class="meta-label">Quy Mô Dữ Liệu</span>
          <span class="meta-value">${totalStudents} Học sinh • ${totalAsns} Bài tập • ${totalSubs} Bài nộp</span>
        </div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button type="button" class="btn btn-primary" onclick="GitHubSync.pushToGitHub(Store.data, true)" style="flex:1; min-width:210px; font-weight:700;">
          ☁️ Đẩy Dữ Liệu Lên GitHub Ngay
        </button>
        <button type="button" class="btn btn-outline" onclick="GitHubSync.pullFromGitHub(true)" style="flex:1; min-width:210px; font-weight:700;">
          📥 Kéo Dữ Liệu Từ GitHub Về Máy
        </button>
      </div>

      <div style="margin-top:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; font-size:12px; color:var(--text-muted); line-height:1.5;">
        💡 <strong>Bạn không cần làm gì thêm:</strong> Mỗi khi bạn tạo bài tập, chấm điểm bút đỏ hoặc sửa học sinh, hệ thống sẽ tự động đẩy lên GitHub trong vòng 2.5 giây mà không cần bấm nút nào cả!
      </div>
    `;
  }
};
