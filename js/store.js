/**
 * EDUTASK PRO — DATA STORE (MÔ HÌNH GIA SƯ CÁ NHÂN VỚI HỒ SƠ CHI TIẾT)
 * 1 Admin Quản trị + 1 Gia Sư trực tiếp + Danh sách Học Sinh với hồ sơ chuyên sâu
 */

const Store = {
  STORAGE_KEY: 'EDUTASK_INDIVIDUAL_DB_V3',

  // Trang vở mẫu viết tay học sinh nộp
  samplePaperDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
    <rect width="800" height="1100" fill="%23fffef8"/>
    <!-- Notebook lines -->
    <line x1="50" y1="50" x2="750" y2="50" stroke="%23e2e8f0" stroke-width="1"/>
    <line x1="100" y1="0" x2="100" y2="1100" stroke="%23fecaca" stroke-width="1.5"/>
    <g stroke="%23e2e8f0" stroke-width="1">
      <line x1="50" y1="120" x2="750" y2="120"/>
      <line x1="50" y1="170" x2="750" y2="170"/>
      <line x1="50" y1="220" x2="750" y2="220"/>
      <line x1="50" y1="270" x2="750" y2="270"/>
      <line x1="50" y1="320" x2="750" y2="320"/>
      <line x1="50" y1="370" x2="750" y2="370"/>
      <line x1="50" y1="420" x2="750" y2="420"/>
      <line x1="50" y1="470" x2="750" y2="470"/>
      <line x1="50" y1="520" x2="750" y2="520"/>
      <line x1="50" y1="570" x2="750" y2="570"/>
      <line x1="50" y1="620" x2="750" y2="620"/>
      <line x1="50" y1="670" x2="750" y2="670"/>
      <line x1="50" y1="720" x2="750" y2="720"/>
      <line x1="50" y1="770" x2="750" y2="770"/>
      <line x1="50" y1="820" x2="750" y2="820"/>
      <line x1="50" y1="870" x2="750" y2="870"/>
      <line x1="50" y1="920" x2="750" y2="920"/>
    </g>
    <!-- Handwritten text simulation -->
    <text x="120" y="90" font-family="sans-serif" font-weight="bold" font-size="20" fill="%231e293b">BÀI TẬP VỀ NHÀ: CHUYÊN ĐỀ CỰC TRỊ VÀ BẤT ĐẲNG THỨC</text>
    <text x="120" y="115" font-family="sans-serif" font-size="14" fill="%2364748b">Học sinh: Nguyễn Minh Quang — Lớp: 12A1</text>
    
    <text x="120" y="160" font-family="monospace" font-weight="bold" font-size="16" fill="%230f172a">Bài 1: Tìm cực trị của hàm số y = x^3 - 3x^2 + 2</text>
    <text x="130" y="210" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">TXĐ: D = R. Ta có y' = 3x^2 - 6x = 3x(x - 2)</text>
    <text x="130" y="260" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">y' = 0 &lt;=&gt; x = 0 hoặc x = 2.</text>
    <text x="130" y="310" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">Bảng biến thiên: Hàm số đạt CĐ tại x = 0, y_CD = 2.</text>
    <text x="130" y="360" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">Hàm số đạt CT tại x = 2, y_CT = -2. (Đúng đáp số)</text>

    <text x="120" y="460" font-family="monospace" font-weight="bold" font-size="16" fill="%230f172a">Bài 2: Cho a, b > 0. Chứng minh (a + b)(1/a + 1/b) &gt;= 4</text>
    <text x="130" y="510" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">Áp dụng BĐT Cauchy cho 2 số dương a, b:</text>
    <text x="140" y="560" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">a + b &gt;= 2*sqrt(ab)  (1)</text>
    <text x="140" y="610" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">1/a + 1/b &gt;= 2*sqrt(1/(ab))  (2)</text>
    <text x="130" y="660" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">Nhân vế theo vế (1) và (2) ta được:</text>
    <text x="140" y="710" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">(a + b)(1/a + 1/b) &gt;= 2*sqrt(ab) * 2/sqrt(ab) = 4.</text>
    <text x="130" y="760" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">Dấu "=" xảy ra khi a = b.</text>

    <text x="120" y="860" font-family="monospace" font-weight="bold" font-size="16" fill="%230f172a">Bài 3: Tìm GTLN của P = x/(x^2 + 1) với x > 0</text>
    <text x="130" y="910" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">Chia cả tử và mẫu cho x: P = 1 / (x + 1/x)</text>
    <text x="130" y="960" font-family="cursive, sans-serif" font-size="16" fill="%231e3a8a">Do x + 1/x &gt;= 2 nên P &lt;= 1/2. Max P = 1/2 khi x = 1.</text>
  </svg>`,

  data: null,

  init() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        this.data = JSON.parse(raw);
        // Migration: Đảm bảo toàn bộ tài khoản có username, password, phân quyền và phân công giáo viên chính xác
        if (this.data && Array.isArray(this.data.users)) {
          let updated = false;

          // Kiểm tra và bổ sung Gia Sư thứ 2 nếu chưa có (Cô Phương Linh)
          const hasLinh = this.data.users.some(u => u.id === 'u_tutor_linh');
          if (!hasLinh) {
            this.data.users.splice(2, 0, {
              id: 'u_tutor_linh',
              username: 'giasu_linh',
              password: '123456',
              name: 'Cô Phương Linh',
              role: 'tutor',
              roleName: 'Gia Sư Phụ Trách',
              phone: '0988.765.432',
              avatarText: 'PL',
              subjects: ['Toán & Khoa Học Tự Nhiên']
            });
            updated = true;
          }

          // Cập nhật tên Thầy Minh Đức cho u_tutor
          const mainTutor = this.data.users.find(u => u.id === 'u_tutor');
          if (mainTutor && (mainTutor.name === 'Gia Sư Trực Tiếp' || !mainTutor.name)) {
            mainTutor.name = 'Thầy Minh Đức';
            mainTutor.avatarText = 'MĐ';
            updated = true;
          }

          this.data.users.forEach(u => {
            if (u.role === 'admin') {
              if (!u.username) { u.username = 'admin'; updated = true; }
              if (!u.password) { u.password = 'admin123'; updated = true; }
            } else if (u.role === 'tutor') {
              if (!u.username) { u.username = u.id === 'u_tutor_linh' ? 'giasu_linh' : 'giasu'; updated = true; }
              if (!u.password) { u.password = '123456'; updated = true; }
            } else if (u.role === 'student') {
              if (!u.password) { u.password = '123456'; updated = true; }
              if (!u.username) {
                u.username = u.id === 'u_std_quang' ? 'std_quang' : (u.id === 'u_std_maianh' ? 'std_maianh' : (u.id === 'u_std_nam' ? 'std_nam' : 'std_' + u.id));
                updated = true;
              }
              if (typeof u.hasAccount === 'undefined') {
                updated = true;
                if (u.id === 'u_std_quang' || u.id === 'u_std_maianh') {
                  u.hasAccount = true;
                  u.accountStatus = 'active';
                } else {
                  u.hasAccount = false;
                  u.accountStatus = 'none';
                }
              }
              // Migration: Phân công giáo viên phụ trách cho học sinh
              if (!u.assignedTutorId) {
                if (u.id === 'u_std_nam') {
                  u.assignedTutorId = 'u_tutor_linh';
                  u.assignedTutorName = 'Cô Phương Linh';
                } else {
                  u.assignedTutorId = 'u_tutor';
                  u.assignedTutorName = 'Thầy Minh Đức';
                }
                updated = true;
              } else if (!u.assignedTutorName) {
                const tutor = this.data.users.find(t => t.id === u.assignedTutorId);
                u.assignedTutorName = tutor ? tutor.name : 'Thầy Minh Đức';
                updated = true;
              }
            }
          });
          if (updated) {
            this.save();
          }
        }

        // Migration: Đảm bảo toàn bộ bài tập có trường tutorId và tệp đề bài đính kèm
        if (this.data && Array.isArray(this.data.assignments)) {
          let asnUpdated = false;
          this.data.assignments.forEach(a => {
            if (!a.tutorId) {
              // Tìm gia sư của học sinh nhận bài
              const firstStudent = a.targetStudentIds && a.targetStudentIds[0] ? this.getUserById(a.targetStudentIds[0]) : null;
              a.tutorId = (firstStudent && firstStudent.assignedTutorId) ? firstStudent.assignedTutorId : 'u_tutor';
              asnUpdated = true;
            }
            if (typeof a.attachmentName === 'undefined') {
              if (a.id === 'asn_001') {
                a.attachmentName = 'Phieu_05_Cuc_Tri_Va_Bat_Dang_Thuc.pdf';
                a.attachmentSize = '1.4 MB';
                a.attachmentType = 'pdf';
              } else if (a.id === 'asn_002') {
                a.attachmentName = 'Phieu_04_De_Khao_Sat_Do_Thi.docx';
                a.attachmentSize = '820 KB';
                a.attachmentType = 'docx';
              } else if (a.id === 'asn_003') {
                a.attachmentName = '10_Cau_Trac_Nghiem_Nguyen_Ham.pdf';
                a.attachmentSize = '560 KB';
                a.attachmentType = 'pdf';
              } else {
                a.attachmentName = null;
                a.attachmentSize = null;
                a.attachmentType = null;
              }
              asnUpdated = true;
            }
          });
          if (asnUpdated) this.save();
        }

        // Migration: Đảm bảo toàn bộ bài nộp có trường dữ liệu giám sát rời tab
        if (this.data && Array.isArray(this.data.submissions)) {
          let subUpdated = false;
          this.data.submissions.forEach(s => {
            if (typeof s.cheatCount === 'undefined') {
              if (s.id === 'sub_001') {
                s.cheatCount = 2;
                s.cheatDuration = 35;
                s.cheatLogs = [
                  { count: 1, time: '11:15:20', duration: 15, type: 'Chuyển tab ngoài', reason: 'Nghi vấn mở tab tra cứu công cụ AI (ChatGPT, Claude...)' },
                  { count: 2, time: '11:32:04', duration: 20, type: 'Mất tiêu điểm cửa sổ', reason: 'Mở cửa sổ ứng dụng ngoài bài làm' }
                ];
              } else {
                s.cheatCount = 0;
                s.cheatDuration = 0;
                s.cheatLogs = [];
              }
              subUpdated = true;
            }
          });
          if (subUpdated) this.save();
        }
      } catch (e) {
        this.resetDefault();
      }
    } else {
      this.resetDefault();
    }

    if (window.CloudSync && typeof CloudSync.init === 'function') {
      CloudSync.init();
    }

    if (window.GitHubSync && typeof GitHubSync.init === 'function') {
      GitHubSync.init();
    }

    this.initSyncChannel();
  },

  syncChannel: null,

  initSyncChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.syncChannel = new BroadcastChannel('edutask_sync_bus');
        this.syncChannel.onmessage = (event) => {
          if (event && event.data && event.data.type === 'EDUTASK_LOCAL_SAVE') {
            this.handleCrossTabUpdate(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel không khả dụng, sử dụng fallback storage event');
      }
    }

    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY && event.newValue) {
        this.handleCrossTabUpdate({ raw: event.newValue });
      }
    });
  },

  handleCrossTabUpdate(payload) {
    try {
      const raw = payload.raw || localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          this.data = parsed;
          if (window.App && typeof App.renderCurrentView === 'function') {
            const isGrader = window.Grader && Grader.activeSubmission;
            const hasActiveModal = document.querySelector('.modal-overlay.active');
            if (!isGrader && !hasActiveModal) {
              App.updateHeaderProfile();
              App.renderCurrentView();
            }
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi đồng bộ tab:', e);
    }
  },

  save(skipCloudPush = false, immediate = false) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('LocalStorage đầy! Bắt đầu dọn dẹp và tối ưu hóa ảnh...');
        this.optimizeStorage();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (err2) {
          console.error('Không thể lưu LocalStorage sau khi tối ưu:', err2);
          if (window.App && App.showToast) {
            App.showToast('Bộ nhớ trình duyệt đã đầy. Vui lòng xuất bản sao lưu ra file JSON!', 'warning');
          }
        }
      }
    }

    // Thông báo cho các tab khác trên cùng trình duyệt
    if (this.syncChannel) {
      try {
        this.syncChannel.postMessage({
          type: 'EDUTASK_LOCAL_SAVE',
          timestamp: Date.now()
        });
      } catch (e) {}
    }

    // Tự động đẩy lên Firebase nếu có cấu hình
    if (!skipCloudPush && window.CloudSync && typeof CloudSync.schedulePush === 'function') {
      CloudSync.schedulePush();
    }

    // Tự động đẩy lên Kho dữ liệu trung tâm GitHub
    if (!skipCloudPush && window.GitHubSync && typeof GitHubSync.schedulePush === 'function') {
      GitHubSync.schedulePush(immediate);
    }
  },

  optimizeStorage() {
    if (this.data && Array.isArray(this.data.submissions)) {
      this.data.submissions.forEach((sub, idx) => {
        if (idx > 10 && sub.photoUrl && sub.photoUrl.length > 50000) {
          sub.photoUrl = this.samplePaperDataUrl;
        }
      });
    }
  },

  resetDefault() {
    this.data = {
      // 1. NGƯỜI DÙNG: 1 Admin + 2 Gia Sư Chuyên Môn + Danh Sách Học Sinh Phân Công Kèm 1-1
      users: [
        {
          id: 'u_admin',
          username: 'admin',
          password: 'admin123',
          name: 'Quản Trị Hệ Thống',
          role: 'admin',
          roleName: 'Quản Trị Viên (Admin)',
          phone: '0900.123.456',
          avatarText: 'AD'
        },
        {
          id: 'u_tutor',
          username: 'giasu',
          password: '123456',
          name: 'Thầy Minh Đức',
          role: 'tutor',
          roleName: 'Gia Sư Phụ Trách',
          phone: '0912.345.678',
          avatarText: 'MĐ',
          subjects: ['Toán Học THPT']
        },
        {
          id: 'u_tutor_linh',
          username: 'giasu_linh',
          password: '123456',
          name: 'Cô Phương Linh',
          role: 'tutor',
          roleName: 'Gia Sư Phụ Trách',
          phone: '0988.765.432',
          avatarText: 'PL',
          subjects: ['Toán & Khoa Học Tự Nhiên']
        },
        {
          id: 'u_std_quang',
          hasAccount: true,
          accountStatus: 'active',
          username: 'std_quang',
          password: '123456',
          accountCreatedAt: '2026-08-15',
          name: 'Nguyễn Minh Quang',
          role: 'student',
          roleName: 'Học Sinh',
          assignedTutorId: 'u_tutor',
          assignedTutorName: 'Thầy Minh Đức',
          dob: '2008-08-15',
          gender: 'Nam',
          school: 'THPT Chu Văn An',
          grade: 'Lớp 12A1',
          phone: '0901.222.333',
          address: 'Số 28, Phố Thụy Khuê, Tây Hồ, Hà Nội',
          parentName: 'Bác Nguyễn Văn Tuấn (Bố)',
          parentPhone: '0909.888.999',
          parentJob: 'Kỹ sư xây dựng',
          subject: 'Toán Học 12 (Ôn thi THPT Quốc Gia)',
          initialScore: 5.5,
          targetScore: 9.0,
          currentScore: 7.8,
          feePerSession: 250000,
          totalSessions: 8,
          learningMode: '1 kèm 1 tại nhà',
          schedule: 'Tối Thứ 3 (19h30 - 21h30) & Tối Thứ 6 (19h30 - 21h30)',
          startDate: '2026-08-15',
          strengths: 'Chăm chỉ, tư duy đại số khá, tiếp thu lý thuyết nhanh.',
          weaknesses: 'Hổng phần Hình không gian Oxyz, hay tính ẩu nhầm dấu ở bước rút gọn cuối cùng.',
          notes: 'Mục tiêu đỗ Đại học Bách Khoa Hà Nội (Ngành CNTT).',
          avatarText: 'MQ'
        },
        {
          id: 'u_std_maianh',
          hasAccount: true,
          accountStatus: 'active',
          username: 'std_maianh',
          password: '123456',
          accountCreatedAt: '2026-09-01',
          name: 'Trần Mai Anh',
          role: 'student',
          roleName: 'Học Sinh',
          assignedTutorId: 'u_tutor',
          assignedTutorName: 'Thầy Minh Đức',
          dob: '2008-05-20',
          gender: 'Nữ',
          school: 'THPT Kim Liên',
          grade: 'Lớp 12A3',
          phone: '0903.444.555',
          address: 'Tầng 12, Chung cư Star City, Lê Văn Lương, Thanh Xuân',
          parentName: 'Cô Lê Thu Hà (Mẹ)',
          parentPhone: '0918.555.444',
          parentJob: 'Kế toán trưởng',
          subject: 'Toán Học 12 (Luyện thi ĐH khối D01)',
          initialScore: 7.0,
          targetScore: 8.5,
          currentScore: 8.2,
          feePerSession: 250000,
          totalSessions: 6,
          learningMode: '1 kèm 1 Online qua Google Meet',
          schedule: 'Tối Thứ 4 (19h30 - 21h30) & Sáng Chủ Nhật (8h30 - 10h30)',
          startDate: '2026-09-01',
          strengths: 'Trình bày sạch sẽ, cẩn thận từng bước giải, hình học không gian nắm tốt.',
          weaknesses: 'Tốc độ làm bài trắc nghiệm còn chậm, ngại các bài toán vận dụng cao chứa tham số m.',
          notes: 'Mục tiêu xét tuyển Đại học Ngoại Thương.',
          avatarText: 'MA'
        },
        {
          id: 'u_std_nam',
          hasAccount: false,
          accountStatus: 'none',
          username: 'std_nam',
          password: '123456',
          accountCreatedAt: null,
          name: 'Lê Hoàng Nam',
          role: 'student',
          roleName: 'Học Sinh',
          assignedTutorId: 'u_tutor_linh',
          assignedTutorName: 'Cô Phương Linh',
          dob: '2009-11-10',
          gender: 'Nam',
          school: 'THPT Cầu Giấy',
          grade: 'Lớp 11B',
          phone: '0905.666.777',
          address: 'Ngõ 165 Cầu Giấy, Hà Nội',
          parentName: 'Bác Lê Văn Hùng (Bố)',
          parentPhone: '0933.111.222',
          parentJob: 'Kinh doanh tự do',
          subject: 'Toán Học 11 (Lấy lại gốc & Củng cố)',
          initialScore: 4.0,
          targetScore: 7.5,
          currentScore: 6.5,
          feePerSession: 200000,
          totalSessions: 4,
          learningMode: 'Nhóm nhỏ 2 bạn',
          schedule: 'Chiều Thứ 7 (14h00 - 16h00)',
          startDate: '2026-09-15',
          strengths: 'Nhiệt tình, có tinh thần cầu tiến khi được động viên.',
          weaknesses: 'Mất gốc lượng giác lớp 10, chưa thuộc công thức biến đổi cơ bản.',
          notes: 'Cần kiểm tra bài cũ đều đặn 10 phút đầu mỗi buổi.',
          avatarText: 'HN'
        }
      ],

      // 2. BÀI TẬP DO GIA SƯ GIAO CHO TỪNG HỌC SINH
      assignments: [
        {
          id: 'asn_001',
          tutorId: 'u_tutor',
          title: 'Phiếu 05: Chuyên Đề Cực Trị & Bất Đẳng Thức',
          description: 'Làm chi tiết bài 1, 2, 3 ra vở viết tay, chụp ảnh nộp trước buổi học tới.',
          attachmentName: 'Phieu_05_Cuc_Tri_Va_Bat_Dang_Thuc.pdf',
          attachmentSize: '1.4 MB',
          attachmentType: 'pdf',
          targetType: 'individual',
          targetStudentIds: ['u_std_quang'],
          deadline: '2026-10-08T21:00',
          createdAt: '2026-10-06T09:00',
          totalPoints: 10,
          submissionType: 'photo'
        },
        {
          id: 'asn_002',
          tutorId: 'u_tutor',
          title: 'Phiếu 04: Khảo Sát Đồ Thị Hàm Số Phân Thức',
          description: 'Bài tập rèn luyện kỹ năng vẽ bảng biến thiên và tiệm cận.',
          attachmentName: 'Phieu_04_De_Khao_Sat_Do_Thi.docx',
          attachmentSize: '820 KB',
          attachmentType: 'docx',
          targetType: 'individual',
          targetStudentIds: ['u_std_maianh'],
          deadline: '2026-10-07T20:00',
          createdAt: '2026-10-05T14:00',
          totalPoints: 10,
          submissionType: 'photo'
        },
        {
          id: 'asn_003',
          tutorId: 'u_tutor',
          title: 'Phiếu Chung: 10 Câu Trắc Nghiệm Nguyên Hàm Cơ Bản',
          description: 'Kiểm tra tốc độ tính nguyên hàm bảng chuẩn.',
          attachmentName: '10_Cau_Trac_Nghiem_Nguyen_Ham.pdf',
          attachmentSize: '560 KB',
          attachmentType: 'pdf',
          targetType: 'group',
          targetStudentIds: ['u_std_quang', 'u_std_maianh'],
          deadline: '2026-10-09T22:00',
          createdAt: '2026-10-06T10:30',
          totalPoints: 10,
          submissionType: 'photo'
        }
      ],

      // 3. BÀI NỘP CỦA HỌC SINH (Có tích hợp Giám Sát Chống Gian Lận Rời Tab)
      submissions: [
        {
          id: 'sub_001',
          assignmentId: 'asn_001',
          studentId: 'u_std_quang',
          studentName: 'Nguyễn Minh Quang',
          submittedAt: '2026-10-06T11:45',
          status: 'submitted',
          photoUrl: this.samplePaperDataUrl,
          score: null,
          feedback: '',
          gradedAt: null,
          annotatedPhoto: null,
          cheatCount: 2,
          cheatDuration: 35,
          cheatLogs: [
            { count: 1, time: '11:15:20', duration: 15, type: 'Chuyển tab ngoài', reason: 'Nghi vấn mở tab tra cứu công cụ AI (ChatGPT, Claude...)' },
            { count: 2, time: '11:32:04', duration: 20, type: 'Mất tiêu điểm cửa sổ', reason: 'Mở cửa sổ ứng dụng ngoài bài làm' }
          ]
        },
        {
          id: 'sub_002',
          assignmentId: 'asn_002',
          studentId: 'u_std_maianh',
          studentName: 'Trần Mai Anh',
          submittedAt: '2026-10-05T18:20',
          status: 'graded',
          photoUrl: this.samplePaperDataUrl,
          score: 9.0,
          feedback: 'Bài làm rất sạch sẽ, nắm chắc bảng biến thiên. Tiếp tục phát huy nhé em!',
          gradedAt: '2026-10-05T20:00',
          annotatedPhoto: this.samplePaperDataUrl,
          cheatCount: 0,
          cheatDuration: 0,
          cheatLogs: []
        }
      ]
    };
    this.save();
  },

  // Helpers
  getUsersByRole(role) {
    return this.data.users.filter(u => u.role === role);
  },

  getUserById(id) {
    if (!id || !this.data || !Array.isArray(this.data.users)) return null;
    return this.data.users.find(u => u.id === id) || null;
  },

  getUserByUsername(username) {
    if (!username || !this.data || !Array.isArray(this.data.users)) return null;
    const clean = username.trim().toLowerCase();
    return this.data.users.find(u => u.username && u.username.toLowerCase() === clean);
  },

  authenticate(username, password) {
    if (!username || !password) {
      return { 
        success: false, 
        message: 'Vui lòng nhập đầy đủ Tên đăng nhập (tk) và Mật khẩu (mk)!' 
      };
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Tìm kiếm theo tên đăng nhập chính xác hoặc bí danh thông dụng
    let user = this.data.users.find(u => u.username && u.username.toLowerCase() === cleanUsername);

    // Hỗ trợ bí danh linh hoạt giữa các thiết bị
    if (!user) {
      if (cleanUsername === 'admin') {
        user = this.data.users.find(u => u.role === 'admin' || u.id === 'u_admin');
      } else if (cleanUsername === 'tutor' || cleanUsername === 'giasu') {
        user = this.data.users.find(u => u.id === 'u_tutor');
      } else if (cleanUsername === 'linh' || cleanUsername === 'giasu_linh') {
        user = this.data.users.find(u => u.id === 'u_tutor_linh');
      } else if (cleanUsername === 'quang' || cleanUsername === 'std_quang') {
        user = this.data.users.find(u => u.id === 'u_std_quang');
      } else if (cleanUsername === 'maianh' || cleanUsername === 'std_maianh') {
        user = this.data.users.find(u => u.id === 'u_std_maianh');
      } else if (cleanUsername === 'nam' || cleanUsername === 'std_nam') {
        user = this.data.users.find(u => u.id === 'u_std_nam');
      }
    }

    if (!user) {
      return { 
        success: false, 
        message: 'Tài khoản không tồn tại trên hệ thống! Vui lòng kiểm tra lại.' 
      };
    }

    // Kiểm tra mật khẩu (hỗ trợ mật khẩu đặt trước hoặc mặc định của vai trò)
    const matchesPassword = cleanPassword === user.password ||
      (user.role === 'admin' && (cleanPassword === 'admin123' || cleanPassword === '123456')) ||
      (user.role === 'tutor' && (cleanPassword === '123456' || cleanPassword === 'tutor123')) ||
      (user.role === 'student' && cleanPassword === '123456');

    if (!matchesPassword) {
      return { 
        success: false, 
        message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' 
      };
    }

    // Kiểm tra quy định học sinh: Phải có tài khoản chính thức và ở trạng thái active
    if (user.role === 'student') {
      if (!user.hasAccount || user.accountStatus !== 'active') {
        return {
          success: false,
          user: user,
          isUnactivatedStudent: true,
          message: `⛔ Học sinh "${user.name}" chưa được Admin cấp tài khoản chính thức hoặc đang bị tạm khóa. Vui lòng liên hệ Admin để kích hoạt!`
        };
      }
    }

    return { 
      success: true, 
      user: user 
    };
  },

  getStudents() {
    return this.data.users.filter(u => u.role === 'student');
  },

  getTutors() {
    return this.data.users.filter(u => u.role === 'tutor');
  },

  getStudentsByTutor(tutorId) {
    return this.getStudents().filter(s => s.assignedTutorId === tutorId);
  },

  assignStudentTutor(studentId, tutorId) {
    const std = this.getUserById(studentId);
    const tutor = this.getUserById(tutorId);
    if (!std || !tutor) return false;
    std.assignedTutorId = tutor.id;
    std.assignedTutorName = tutor.name;
    this.save();
    return true;
  },

  isUsernameTaken(username, excludeUserId = null) {
    if (!username) return false;
    const clean = username.trim().toLowerCase();
    return this.data.users.some(u => u.username && u.username.toLowerCase() === clean && u.id !== excludeUserId);
  },

  addTutor(tutorData) {
    if (!tutorData.id) tutorData.id = 'u_tutor_' + Date.now();
    if (!tutorData.role) tutorData.role = 'tutor';
    if (!tutorData.roleName) tutorData.roleName = 'Gia Sư Phụ Trách';
    if (!tutorData.avatarText) {
      const words = (tutorData.name || 'Gia Sư').trim().split(/\s+/);
      tutorData.avatarText = words.length > 1 ? (words[0][0] + words[words.length - 1][0]).toUpperCase() : words[0].slice(0, 2).toUpperCase();
    }
    this.data.users.push(tutorData);
    this.save();
    return tutorData;
  },

  deleteTutor(tutorId) {
    const tutors = this.getTutors();
    if (tutors.length <= 1) {
      return { success: false, message: 'Hệ thống cần duy trì ít nhất 1 gia sư!' };
    }
    this.data.users = this.data.users.filter(u => u.id !== tutorId);
    // Chuyển học sinh đang kèm sang gia sư còn lại
    const remaining = this.getTutors();
    const fallback = remaining[0];
    this.getStudents().forEach(s => {
      if (s.assignedTutorId === tutorId) {
        s.assignedTutorId = fallback.id;
        s.assignedTutorName = fallback.name;
      }
    });
    this.save();
    return { success: true };
  },

  updateTutorPassword(tutorId, newPassword) {
    const tutor = this.getUserById(tutorId);
    if (!tutor) return false;
    tutor.password = newPassword;
    this.save();
    return true;
  },

  getAssignmentsForStudent(studentId) {
    return this.data.assignments.filter(a => a.targetStudentIds.includes(studentId));
  },

  getAllAssignments() {
    return this.data.assignments;
  },

  getSubmission(assignmentId, studentId) {
    return this.data.submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
  },

  getSubmissionsByAssignment(assignmentId) {
    return this.data.submissions.filter(s => s.assignmentId === assignmentId);
  },

  getStudentCheatSummary(studentId) {
    const studentSubs = this.data.submissions.filter(s => s.studentId === studentId);
    let totalViolations = 0;
    let totalDuration = 0;
    let flaggedSubmissions = 0;
    studentSubs.forEach(s => {
      const c = s.cheatCount || 0;
      if (c > 0) {
        flaggedSubmissions++;
        totalViolations += c;
        totalDuration += (s.cheatDuration || 0);
      }
    });
    return {
      totalSubmissions: studentSubs.length,
      flaggedSubmissions,
      totalViolations,
      totalDuration,
      honestyRate: studentSubs.length > 0 ? Math.round(((studentSubs.length - flaggedSubmissions) / studentSubs.length) * 100) : 100
    };
  },

  addAssignment(assignment) {
    this.data.assignments.unshift(assignment);
    this.save();
  },

  addSubmission(submission) {
    const existingIndex = this.data.submissions.findIndex(
      s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId
    );
    if (existingIndex >= 0) {
      this.data.submissions[existingIndex] = submission;
    } else {
      this.data.submissions.unshift(submission);
    }
    this.save();
  },

  updateSubmissionGrading(subId, score, feedback, annotatedPhoto) {
    const sub = this.data.submissions.find(s => s.id === subId);
    if (sub) {
      sub.status = 'graded';
      sub.score = parseFloat(score);
      sub.feedback = feedback;
      sub.annotatedPhoto = annotatedPhoto;
      sub.gradedAt = new Date().toISOString();
      this.save();
    }
  },

  addStudent(studentData) {
    this.data.users.push(studentData);
    this.save();
  },

  deleteStudent(studentId) {
    // 1. Xóa học sinh khỏi danh sách người dùng
    this.data.users = this.data.users.filter(u => u.id !== studentId);

    // 2. Xóa toàn bộ bài nộp của học sinh này
    this.data.submissions = this.data.submissions.filter(s => s.studentId !== studentId);

    // 3. Xóa học sinh khỏi các bài tập; nếu bài tập giao riêng cho học sinh này thì xóa hẳn bài tập
    this.data.assignments = this.data.assignments.filter(a => {
      a.targetStudentIds = a.targetStudentIds.filter(id => id !== studentId);
      return a.targetStudentIds.length > 0;
    });

    this.save();
  },

  updateStudent(studentId, updatedData) {
    const index = this.data.users.findIndex(u => u.id === studentId);
    if (index >= 0) {
      this.data.users[index] = { ...this.data.users[index], ...updatedData };
      this.save();
    }
  },

  // Danh sách học sinh đã được cấp tài khoản chính thức (có quyền truy cập giao diện học sinh)
  getStudentsWithAccount() {
    return this.getStudents().filter(s => s.hasAccount === true && s.accountStatus === 'active');
  },

  // Cấp tài khoản chính thức cho học sinh
  provisionStudentAccount(studentId, accountInfo = {}) {
    const std = this.getUserById(studentId);
    if (!std) return false;
    std.hasAccount = true;
    std.accountStatus = 'active';
    if (accountInfo.username && accountInfo.username.trim()) {
      std.username = accountInfo.username.trim();
    } else if (!std.username) {
      std.username = 'std_' + Date.now();
    }
    if (accountInfo.password && accountInfo.password.trim()) {
      std.password = accountInfo.password.trim();
    } else if (!std.password) {
      std.password = '123456';
    }
    std.accountCreatedAt = std.accountCreatedAt || new Date().toISOString();
    this.save();
    return true;
  },

  // Thu hồi / vô hiệu hóa tài khoản học sinh
  revokeStudentAccount(studentId) {
    const std = this.getUserById(studentId);
    if (!std) return false;
    std.hasAccount = false;
    std.accountStatus = 'none';
    this.save();
    return true;
  },

  // Cập nhật thông tin đăng nhập học sinh
  updateStudentAccount(studentId, { username, password, status }) {
    const std = this.getUserById(studentId);
    if (!std) return false;
    if (username) std.username = username.trim();
    if (password) std.password = password.trim();
    if (status) {
      std.accountStatus = status;
      std.hasAccount = (status === 'active');
    }
    this.save();
    return true;
  },

  // Lấy tổng hợp dữ liệu giám sát rời tab / trung thực của học sinh
  getStudentCheatSummary(studentId) {
    const studentSubs = (this.data.submissions || []).filter(s => s.studentId === studentId);
    let totalViolations = 0;
    let totalDuration = 0;
    let submissionsWithCheating = 0;

    studentSubs.forEach(sub => {
      if (sub.cheatCount && sub.cheatCount > 0) {
        totalViolations += sub.cheatCount;
        totalDuration += (sub.cheatDuration || 0);
        submissionsWithCheating++;
      }
    });

    return {
      totalSubmissions: studentSubs.length,
      totalViolations,
      totalDuration,
      submissionsWithCheating,
      integrityRate: studentSubs.length > 0 ? Math.round(((studentSubs.length - submissionsWithCheating) / studentSubs.length) * 100) : 100
    };
  }
};
