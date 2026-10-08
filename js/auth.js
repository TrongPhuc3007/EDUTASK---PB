/**
 * EDUTASK PRO — AUTHENTICATION & ROLE SEPARATION
 * Phân quyền độc lập 3 giao diện: Admin (Toàn quyền), Gia Sư, Học Sinh.
 * Cá nhân không thể thấy giao diện của nhau, trừ Admin có toàn quyền giám sát.
 */

const Auth = {
  SESSION_KEY: 'EDUTASK_USER_SESSION_V3',
  SUPERVISE_KEY: 'EDUTASK_ADMIN_SUPERVISE_ID',
  REMEMBER_KEY: 'EDUTASK_REMEMBERED_USERNAME',

  sessionUser: null,    // Tài khoản gốc đã đăng nhập
  activeUser: null,     // Tài khoản đang hiển thị giao diện

  init() {
    try {
      localStorage.removeItem('EDUTASK_USER_SESSION');
      localStorage.removeItem('EDUTASK_USER_SESSION_V2');
    } catch (e) {}

    let savedUserId = null;
    try {
      savedUserId = sessionStorage.getItem(this.SESSION_KEY) || localStorage.getItem(this.SESSION_KEY);
    } catch (e) {}

    if (savedUserId && window.Store) {
      const user = Store.getUserById(savedUserId);
      if (user) {
        this.sessionUser = user;
        this.activeUser = user;
        try {
          const superviseId = localStorage.getItem(this.SUPERVISE_KEY);
          if (superviseId && user.role === 'admin') {
            const target = Store.getUserById(superviseId);
            if (target) this.activeUser = target;
          }
        } catch (e) {}
        console.log(`[Auth] Khôi phục phiên làm việc hợp lệ: ${user.name} (${user.role})`);
        return;
      }
    }

    // Nếu chưa đăng nhập: Luôn hiển thị màn hình Đăng Nhập Gateway
    this.sessionUser = null;
    this.activeUser = null;
  },

  isAuthenticated() {
    return !!this.sessionUser;
  },

  getCurrentUser() {
    return this.activeUser;
  },

  getSessionUser() {
    return this.sessionUser;
  },

  // Làm mới đối tượng tài khoản từ Store khi có cập nhật từ xa
  refreshUserFromStore() {
    if (this.sessionUser && window.Store) {
      const freshSession = Store.getUserById(this.sessionUser.id);
      if (freshSession) this.sessionUser = freshSession;
    }
    if (this.activeUser && window.Store) {
      const freshActive = Store.getUserById(this.activeUser.id);
      if (freshActive) this.activeUser = freshActive;
    }
  },

  // Kiểm tra người thực sự đăng nhập có phải là Admin hay không
  isRealAdmin() {
    return this.sessionUser && this.sessionUser.role === 'admin';
  },

  // Kiểm tra Admin có đang đóng vai xem giao diện người khác hay không
  isAdminSupervising() {
    return this.isRealAdmin() && this.activeUser && this.activeUser.id !== this.sessionUser.id;
  },

  // Phương thức đăng nhập chính thức bằng Tên đăng nhập (tk) và Mật khẩu (mk)
  async login(username, password, rememberMe = false) {
    let authResult = Store.authenticate(username, password);

    // NẾU CHƯA THÀNH CÔNG: Tự động kéo dữ liệu mới nhất từ Firebase Realtime (0.05s) hoặc GitHub!
    // Tránh tình trạng tài khoản vừa tạo trên máy tính nhưng điện thoại chưa kịp nạp dữ liệu.
    if (!authResult.success && (!authResult.user || authResult.notFound)) {
      if (window.CloudSync && typeof CloudSync.pullFromCloud === 'function') {
        try {
          console.log(`[Auth] Không tìm thấy tài khoản "${username}". Đang kiểm tra tức thì trên Firebase Cloud...`);
          const cloudPulled = await CloudSync.pullFromCloud();
          if (cloudPulled) {
            authResult = Store.authenticate(username, password);
          }
        } catch (e) {}
      }

      if (!authResult.success && (!authResult.user || authResult.notFound) && window.GitHubSync && typeof GitHubSync.pullFromGitHub === 'function') {
        try {
          console.log(`[Auth] Tiếp tục kéo dữ liệu kiểm tra từ GitHub...`);
          const pullRes = await GitHubSync.pullFromGitHub(false);
          if (pullRes && pullRes.success) {
            authResult = Store.authenticate(username, password);
          }
        } catch (err) {
          console.warn('[Auth] Không thể kéo dữ liệu kiểm tra từ GitHub:', err);
        }
      }
    }

    if (!authResult.success) {
      return authResult;
    }

    const user = authResult.user;
    this.sessionUser = user;
    this.activeUser = user;

    // Lưu phiên làm việc an toàn (hỗ trợ cả Safari ẩn danh trên điện thoại)
    try {
      sessionStorage.setItem(this.SESSION_KEY, user.id);
    } catch (e) {
      console.warn('[Auth] sessionStorage không khả dụng:', e);
    }

    try {
      if (rememberMe) {
        localStorage.setItem(this.SESSION_KEY, user.id);
      } else {
        localStorage.removeItem(this.SESSION_KEY);
      }
      localStorage.removeItem(this.SUPERVISE_KEY);
      localStorage.setItem(this.REMEMBER_KEY, user.username);
    } catch (e) {
      console.warn('[Auth] localStorage không khả dụng:', e);
    }

    window.dispatchEvent(new CustomEvent('auth:user_changed', { detail: user }));

    if (typeof App !== 'undefined' && App.showToast) {
      const roleTitle = user.role === 'admin' ? 'Quản Trị Viên (Toàn Quyền)' : (user.role === 'tutor' ? 'Gia Sư Trực Tiếp' : `Học Sinh (${user.name})`);
      App.showToast(`Chào mừng bạn đã đăng nhập vào ${roleTitle}!`, 'success');
    }

    return authResult;
  },

  // Đăng nhập tài khoản cụ thể theo ID
  loginAs(userId) {
    const user = Store.getUserById(userId);
    if (!user) return false;

    // QUY ĐỊNH BẮT BUỘC: Học sinh chỉ đăng nhập được khi đã có tài khoản chính thức
    if (user.role === 'student') {
      if (!user.hasAccount || user.accountStatus !== 'active') {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(`⛔ Học sinh "${user.name}" chưa được cấp tài khoản chính thức!`, 'warning');
        }
        return false;
      }
    }

    this.sessionUser = user;
    this.activeUser = user;
    sessionStorage.setItem(this.SESSION_KEY, user.id);
    localStorage.setItem(this.SESSION_KEY, user.id);
    localStorage.removeItem(this.SUPERVISE_KEY);

    window.dispatchEvent(new CustomEvent('auth:user_changed', { detail: user }));
    
    if (typeof App !== 'undefined' && App.showToast) {
      const roleTitle = user.role === 'admin' ? 'Quản Trị Viên (Toàn Quyền)' : (user.role === 'tutor' ? 'Gia Sư Trực Tiếp' : `Học Sinh (${user.name})`);
      App.showToast(`Chào mừng bạn đã đăng nhập vào ${roleTitle}!`, 'success');
    }
    return true;
  },

  // Đăng xuất khỏi hệ thống -> trở về màn hình đăng nhập
  logout() {
    if (window.Quiz && Quiz.activeQuiz && Quiz.activeQuiz.timerInterval) {
      clearInterval(Quiz.activeQuiz.timerInterval);
    }
    if (window.AntiCheat && AntiCheat.isMonitoring) {
      AntiCheat.stopMonitoring();
    }
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));

    this.sessionUser = null;
    this.activeUser = null;
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SUPERVISE_KEY);

    window.dispatchEvent(new CustomEvent('auth:user_changed', { detail: null }));

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Đã đăng xuất! Vui lòng chọn cổng truy cập.', 'info');
    }
  },

  // DÀNH RIÊNG CHO ADMIN: Giám sát toàn quyền giao diện Gia Sư hoặc Học Sinh
  adminSupervise(targetUserId) {
    if (!this.isRealAdmin()) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Chỉ Quản trị viên (Admin) mới có quyền giám sát các giao diện khác!', 'error');
      }
      return false;
    }

    const targetUser = Store.getUserById(targetUserId);
    if (!targetUser) return false;

    this.activeUser = targetUser;
    localStorage.setItem(this.SUPERVISE_KEY, targetUserId);

    window.dispatchEvent(new CustomEvent('auth:user_changed', { detail: targetUser }));

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`🛡️ Đang giám sát giao diện: ${targetUser.name} (${targetUser.roleName})`, 'info');
    }
    return true;
  },

  // DÀNH RIÊNG CHO ADMIN: Thoát chế độ giám sát và quay về Bàn Quản Trị Admin
  adminReturnToAdmin() {
    if (!this.isRealAdmin()) return false;

    this.activeUser = this.sessionUser;
    localStorage.removeItem(this.SUPERVISE_KEY);

    window.dispatchEvent(new CustomEvent('auth:user_changed', { detail: this.sessionUser }));

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('👑 Đã quay trở về Bàn Quản Trị Hệ Thống (Admin)!', 'success');
    }
    return true;
  }
};

if (typeof window !== 'undefined') {
  window.Auth = Auth;
}

