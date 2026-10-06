/**
 * EDUTASK PRO — AUTHENTICATION & ROLE SEPARATION
 * Phân quyền độc lập 3 giao diện: Admin (Toàn quyền), Gia Sư, Học Sinh.
 * Cá nhân không thể thấy giao diện của nhau, trừ Admin có toàn quyền giám sát.
 */

const Auth = {
  SESSION_KEY: 'EDUTASK_USER_SESSION_V2',
  SUPERVISE_KEY: 'EDUTASK_ADMIN_SUPERVISE_ID',
  REMEMBER_KEY: 'EDUTASK_REMEMBERED_USERNAME',

  sessionUser: null,    // Tài khoản gốc đã đăng nhập
  activeUser: null,     // Tài khoản đang hiển thị giao diện

  init() {
    // Quy định bảo mật: Luôn bắt buộc đăng nhập lại mỗi khi vào web, không lưu phiên tự động
    this.sessionUser = null;
    this.activeUser = null;
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SUPERVISE_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);
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

  // Kiểm tra người thực sự đăng nhập có phải là Admin hay không
  isRealAdmin() {
    return this.sessionUser && this.sessionUser.role === 'admin';
  },

  // Kiểm tra Admin có đang đóng vai xem giao diện người khác hay không
  isAdminSupervising() {
    return this.isRealAdmin() && this.activeUser && this.activeUser.id !== this.sessionUser.id;
  },

  // Phương thức đăng nhập chính thức bằng Tên đăng nhập (tk) và Mật khẩu (mk)
  login(username, password) {
    const authResult = Store.authenticate(username, password);
    if (!authResult.success) {
      return authResult;
    }

    const user = authResult.user;
    this.sessionUser = user;
    this.activeUser = user;

    // Không lưu phiên vào localStorage để mỗi lần mở lại web đều phải đăng nhập lại
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SUPERVISE_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);

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
    this.sessionUser = null;
    this.activeUser = null;
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
