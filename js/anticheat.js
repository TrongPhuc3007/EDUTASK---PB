/**
 * EDUTASK - PB — ANTI-CHEAT & PROCTORING MODULE
 * Hệ thống giám sát chống gian lận & phát hiện task ngoài (chuyển tab, mở AI, tài liệu ngoài)
 */

const AntiCheat = {
  isMonitoring: false,
  activeSession: null,
  blurTimestamp: null,
  isCurrentlyBlurred: false,

  init() {
    // Lắng nghe sự kiện chuyển tab trình duyệt (visibilitychange)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleFocusLoss('tab_hidden');
      } else {
        this.handleFocusRegained('tab_visible');
      }
    });

    // Lắng nghe sự kiện mất tiêu điểm cửa sổ (Alt+Tab, mở ứng dụng ngoài, click ra ngoài)
    window.addEventListener('blur', () => {
      this.handleFocusLoss('window_blur');
    });

    window.addEventListener('focus', () => {
      this.handleFocusRegained('window_focus');
    });

    console.log("AntiCheat Proctoring Engine initialized!");
  },

  // Bắt đầu phiên giám sát (thường khi học sinh mở bài làm hoặc nộp bài)
  startMonitoring(assignmentId, studentId) {
    this.isMonitoring = true;
    this.blurTimestamp = null;
    this.isCurrentlyBlurred = false;

    this.activeSession = {
      assignmentId: assignmentId,
      studentId: studentId,
      startedAt: new Date().toISOString(),
      violationCount: 0,
      totalDuration: 0,
      logs: []
    };

    this.renderLiveBanner(true);
    console.log(`[AntiCheat] Bắt đầu giám sát bài tập ${assignmentId} của học sinh ${studentId}`);
  },

  // Kết thúc phiên giám sát và trả về dữ liệu nhật ký
  stopMonitoring() {
    if (!this.isMonitoring || !this.activeSession) {
      return { violationCount: 0, totalDuration: 0, logs: [] };
    }

    const report = {
      violationCount: this.activeSession.violationCount,
      totalDuration: this.activeSession.totalDuration,
      logs: [...this.activeSession.logs]
    };

    this.isMonitoring = false;
    this.activeSession = null;
    this.blurTimestamp = null;
    this.isCurrentlyBlurred = false;
    this.renderLiveBanner(false);

    console.log("[AntiCheat] Kết thúc phiên giám sát:", report);
    return report;
  },

  // Xử lý khi mất tiêu điểm (rời tab hoặc cửa sổ)
  handleFocusLoss(trigger) {
    if (!this.isMonitoring || !this.activeSession) return;
    if (this.isCurrentlyBlurred) return; // Đã ghi nhận mất tiêu điểm trước đó

    this.isCurrentlyBlurred = true;
    this.blurTimestamp = Date.now();
    console.warn(`[AntiCheat] PHÁT HIỆN RỜI MÀN HÌNH (${trigger}) lúc ${new Date().toLocaleTimeString()}`);
  },

  // Xử lý khi quay lại tiêu điểm (học sinh quay lại tab làm bài)
  handleFocusRegained(trigger) {
    if (!this.isMonitoring || !this.activeSession) return;
    if (!this.isCurrentlyBlurred || !this.blurTimestamp) return;

    const elapsedMs = Date.now() - this.blurTimestamp;
    const durationSec = Math.max(1, Math.round(elapsedMs / 1000));

    this.isCurrentlyBlurred = false;
    this.blurTimestamp = null;

    // Chỉ tính là vi phạm nếu thời gian rời màn hình >= 1 giây
    this.recordViolation(durationSec);
  },

  // Ghi nhận vi phạm vào nhật ký phiên
  recordViolation(durationSec) {
    if (!this.activeSession) return;

    this.activeSession.violationCount++;
    this.activeSession.totalDuration += durationSec;

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const logEntry = {
      count: this.activeSession.violationCount,
      time: timeFormatted,
      duration: durationSec,
      type: 'Chuyển tab ngoài / Rời màn hình bài làm',
      reason: 'Nghi vấn tra cứu công cụ AI (ChatGPT, Claude...) hoặc tài liệu ngoài không cho phép'
    };

    this.activeSession.logs.push(logEntry);

    // Phát âm thanh cảnh báo (Web Audio Synthesizer)
    this.playAlertBeep();

    // Hiển thị modal cảnh báo khẩn cấp cho học sinh
    this.showWarningModal(logEntry, this.activeSession.violationCount);

    // Cập nhật banner thời gian thực
    this.updateLiveBanner();
  },

  // Phát âm thanh cảnh báo nghiêm khắc
  playAlertBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio autoplay restrictions fallback
    }
  },

  // Hiển thị popup cảnh báo vi phạm cho học sinh
  showWarningModal(entry, totalCount) {
    const modal = document.getElementById('antiCheatWarningModal');
    if (!modal) return;

    document.getElementById('antiCheatViolationCountBadge').textContent = `LẦN THỨ ${totalCount}`;
    document.getElementById('antiCheatDurationText').textContent = `${entry.duration} giây`;
    document.getElementById('antiCheatTimeText').textContent = entry.time;

    const levelBadge = document.getElementById('antiCheatSeverityBadge');
    if (levelBadge) {
      if (totalCount === 1) {
        levelBadge.className = 'badge badge-warning';
        levelBadge.textContent = 'Mức độ: Nhắc nhở lần đầu';
      } else if (totalCount === 2) {
        levelBadge.className = 'badge badge-danger';
        levelBadge.textContent = 'Mức độ: Cảnh cáo nghiêm khắc';
      } else {
        levelBadge.className = 'badge badge-danger';
        levelBadge.textContent = 'Mức độ: Báo động nguy cơ gian lận cao';
      }
    }

    modal.classList.add('active');
  },

  closeWarningModal() {
    const modal = document.getElementById('antiCheatWarningModal');
    if (modal) modal.classList.remove('active');
  },

  // Hiển thị dải banner giám sát trực tiếp trên màn hình nộp bài
  renderLiveBanner(active) {
    const banner = document.getElementById('antiCheatLiveBanner');
    if (!banner) return;

    if (active) {
      banner.style.display = 'flex';
      this.updateLiveBanner();
    } else {
      banner.style.display = 'none';
    }
  },

  updateLiveBanner() {
    const banner = document.getElementById('antiCheatLiveBanner');
    if (!banner || !this.activeSession) return;

    const count = this.activeSession.violationCount;
    if (count === 0) {
      banner.className = 'anti-cheat-live-bar safe';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="pulse-indicator safe"></span>
          <span><strong>CHẾ ĐỘ GIÁM SÁT CHỐNG GIAN LẬN:</strong> Đang hoạt động • Nghiêm cấm chuyển tab / dùng AI ngoài</span>
        </div>
        <span class="badge badge-success">✓ 0 vi phạm</span>
      `;
    } else {
      banner.className = 'anti-cheat-live-bar warning';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="pulse-indicator warning"></span>
          <span><strong>PHÁT HIỆN TASK NGOÀI:</strong> Đã rời màn hình <strong>${count} lần</strong> (${this.activeSession.totalDuration}s) • Dữ liệu đã được ghi lại</span>
        </div>
        <span class="badge badge-danger">⚠️ ${count} lần rời tab</span>
      `;
    }
  },

  // Mở popup xem chi tiết lịch sử rời tab (cho Gia sư, Admin và Học sinh xem)
  openLogModal(submissionId) {
    const sub = Store.data.submissions.find(s => s.id === submissionId);
    if (!sub) return;

    const modal = document.getElementById('cheatLogDetailModal');
    if (!modal) return;

    const student = Store.getUserById(sub.studentId);
    const assignment = Store.data.assignments.find(a => a.id === sub.assignmentId);

    document.getElementById('cheatLogModalTitle').textContent = `Nhật Ký Giám Sát: ${student ? student.name : sub.studentName}`;
    document.getElementById('cheatLogModalSub').textContent = `Bài tập: ${assignment ? assignment.title : 'Phiếu bài tập'} • Nộp lúc: ${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : 'Mới nộp'}`;

    const totalCount = sub.cheatCount || 0;
    const totalDuration = sub.cheatDuration || 0;
    const logs = sub.cheatLogs || [];

    const summaryBox = document.getElementById('cheatLogSummaryBox');
    if (summaryBox) {
      if (totalCount === 0) {
        summaryBox.innerHTML = `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px; display:flex; align-items:center; gap:12px;">
            <div style="font-size:28px;">🛡️</div>
            <div>
              <strong style="color:#166534; font-size:14.5px;">Bài Làm Hoàn Toàn Trung Thực (100% Tập Trung)</strong>
              <div style="font-size:12.5px; color:#15803d; margin-top:2px;">
                Hệ thống không ghi nhận bất kỳ thao tác chuyển tab hoặc mở ứng dụng ngoài nào trong suốt buổi làm bài.
              </div>
            </div>
          </div>
        `;
      } else {
        summaryBox.innerHTML = `
          <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:10px; padding:14px; display:flex; align-items:center; gap:12px;">
            <div style="font-size:28px;">🚨</div>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:#9f1239; font-size:14.5px;">Phát Hiện ${totalCount} Lần Rời Khỏi Màn Hình Làm Bài</strong>
                <span class="badge badge-danger">Tổng thời gian ngoài: ${totalDuration} giây</span>
              </div>
              <div style="font-size:12.5px; color:#be123c; margin-top:3px;">
                Nghi vấn học sinh đã chuyển tab sang các công cụ AI (ChatGPT, Mathway,...) hoặc mở tài liệu ngoài.
              </div>
            </div>
          </div>
        `;
      }
    }

    const tableBody = document.getElementById('cheatLogTableBody');
    if (tableBody) {
      if (logs.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">
              ✓ Không có bản ghi vi phạm nào được ghi nhận.
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = logs.map(l => `
          <tr>
            <td style="text-align:center;">
              <span class="badge badge-danger" style="font-size:11px;">#${l.count}</span>
            </td>
            <td><strong>${l.time}</strong></td>
            <td><strong style="color:#b91c1c;">${l.duration} giây</strong></td>
            <td>
              <div style="font-size:13px; font-weight:600; color:#0f172a;">${l.type || 'Chuyển tab ngoài'}</div>
              <small style="color:#64748b;">${l.reason}</small>
            </td>
          </tr>
        `).join('');
      }
    }

    modal.classList.add('active');
  }
};

if (typeof window !== 'undefined') {
  window.AntiCheat = AntiCheat;
}

// Tự động khởi tạo engine
document.addEventListener('DOMContentLoaded', () => {
  AntiCheat.init();
});

