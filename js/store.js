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

  // Phục hồi và chuẩn hóa font chữ tiếng Việt cho một chuỗi (Chống lỗi font ?, \uFFFD)
  healString(str) {
    if (typeof str !== 'string' || !str) return str;
    if (!str.includes('?') && !str.includes('\uFFFD') && !str.includes('')) return str;

    let s = str;
    const phraseMap = [
      [/Th[\?\uFFFD]+y\s+Minh\s+D[\?\uFFFD]+c/gi, 'Thầy Minh Đức'],
      [/C[\?\uFFFD]*\s*Phuong\s*Linh/gi, 'Cô Phương Linh'],
      [/C[\?\uFFFD]*\s*B[\?\uFFFD]*nh\s*B[\?\uFFFD]*nh/gi, 'Cô Bình Bình'],
      [/Qu[\?\uFFFD]+n\s+Tr[\?\uFFFD]+\s+H[\?\uFFFD]+\s+Th[\?\uFFFD]+ng/gi, 'Quản Trị Hệ Thống'],
      [/Nguy[\?\uFFFD]+n\s+Minh\s+Quang/gi, 'Nguyễn Minh Quang'],
      [/H[\?\uFFFD]+c\s+Sinh\s+AN/gi, 'Học Sinh AN'],
      [/L[\?\uFFFD]+e?\s+Ho[\?\uFFFD]+ng\s+Nam/gi, 'Lê Hoàng Nam'],
      [/Tr[\?\uFFFD]+n\s+Mai\s+Anh/gi, 'Trần Mai Anh'],
      [/To[\?\uFFFD]+n\s+H[\?\uFFFD]+c\s+THPT/gi, 'Toán Học THPT'],
      [/To[\?\uFFFD]+n\s+&\s+Khoa\s+H[\?\uFFFD]+c\s*T?[\?\uFFFD]*\s*Nhi?[\?\uFFFD]*n?/gi, 'Toán & Khoa Học Tự Nhiên'],
      [/To[\?\uFFFD]+n\s+H[\?\uFFFD]+c\s+12/gi, 'Toán Học 12'],
      [/To[\?\uFFFD]+n\s+H[\?\uFFFD]+c/gi, 'Toán Học'],
      [/Chuy[\?\uFFFD]+n\s+D[\?\uFFFD]+\s+C[\?\uFFFD]+c\s+Tr[\?\uFFFD]+\s+&\s+B[\?\uFFFD]+t\s+D[\?\uFFFD]+ng\s+Th[\?\uFFFD]+c/gi, 'Chuyên Đề Cực Trị & Bất Đẳng Thức'],
      [/Kh[\?\uFFFD]+o\s+S[\?\uFFFD]+t\s+D[\?\uFFFD]+\s+Th[\?\uFFFD]+\s+H[\?\uFFFD]+m\s+S[\?\uFFFD]+\s+Ph[\?\uFFFD]+n\s+Th[\?\uFFFD]+c/gi, 'Khảo Sát Đồ Thị Hàm Số Phân Thức'],
      [/Phuong\s+Tr[\?\uFFFD]+nh\s+Lu[\?\uFFFD]+ng\s+Gi[\?\uFFFD]+c\s+Co\s+B[\?\uFFFD]+n/gi, 'Phương Trình Lượng Giác Cơ Bản'],
      [/Phi[\?\uFFFD]+u\s+05[^\n]*/gi, 'Phiếu 05: Chuyên Đề Cực Trị & Bất Đẳng Thức'],
      [/Phi[\?\uFFFD]+u\s+04[^\n]*/gi, 'Phiếu 04: Khảo Sát Đồ Thị Hàm Số Phân Thức'],
      [/Phi[\?\uFFFD]+u\s+03[^\n]*/gi, 'Phiếu 03: Phương Trình Lượng Giác Cơ Bản'],
      [/L[\?\uFFFD]+p\s+12/gi, 'Lớp 12'],
      [/L[\?\uFFFD]+p\s+11/gi, 'Lớp 11'],
      [/L[\?\uFFFD]+p\s+10/gi, 'Lớp 10'],
      [/Chua\s+c[\?\uFFFD]+p\s+nh[\?\uFFFD]+t/gi, 'Chưa cập nhật'],
      [/Ph[\?\uFFFD]+\s+huynh/gi, 'Phụ huynh'],
      [/^[N\?\uFFFD]+$/gi, 'Nữ']
    ];
    for (const [re, rep] of phraseMap) {
      s = s.replace(re, rep);
    }

    const wordMap = [
      [/\bTh[\?\uFFFD]+y\b/gi, 'Thầy'],
      [/\bC[\?\uFFFD]+\b/gi, 'Cô'],
      [/\bTo[\?\uFFFD]+n\b/gi, 'Toán'],
      [/\bH[\?\uFFFD]+c\b/gi, 'Học'],
      [/\bD[\?\uFFFD]+c\b/gi, 'Đức'],
      [/\bB[\?\uFFFD]+nh\b/gi, 'Bình'],
      [/\bN[\?\uFFFD]+\b/gi, 'Nữ'],
      [/\bNguy[\?\uFFFD]+n\b/gi, 'Nguyễn'],
      [/\bTr[\?\uFFFD]+n\b/gi, 'Trần'],
      [/\bL[\?\uFFFD]+\b/gi, 'Lê'],
      [/\bHo[\?\uFFFD]+ng\b/gi, 'Hoàng'],
      [/\bQu[\?\uFFFD]+n\b/gi, 'Quản'],
      [/\bTr[\?\uFFFD]+\b/gi, 'Trị'],
      [/\bH[\?\uFFFD]+\b/gi, 'Hệ'],
      [/\bTh[\?\uFFFD]+ng\b/gi, 'Thống'],
      [/\bPhi[\?\uFFFD]+u\b/gi, 'Phiếu'],
      [/\bChuy[\?\uFFFD]+n\b/gi, 'Chuyên'],
      [/\bD[\?\uFFFD]+\b/gi, 'Đề'],
      [/\bC[\?\uFFFD]+c\b/gi, 'Cực'],
      [/\bB[\?\uFFFD]+t\b/gi, 'Bất'],
      [/\bD[\?\uFFFD]+ng\b/gi, 'Đẳng'],
      [/\bTh[\?\uFFFD]+c\b/gi, 'Thức'],
      [/\bKh[\?\uFFFD]+o\b/gi, 'Khảo'],
      [/\bS[\?\uFFFD]+t\b/gi, 'Sát'],
      [/\bH[\?\uFFFD]+m\b/gi, 'Hàm'],
      [/\bS[\?\uFFFD]+\b/gi, 'Số'],
      [/\bPh[\?\uFFFD]+n\b/gi, 'Phân'],
      [/\bLu[\?\uFFFD]+ng\b/gi, 'Lượng'],
      [/\bGi[\?\uFFFD]+c\b/gi, 'Giác'],
      [/\bB[\?\uFFFD]+n\b/gi, 'Bản'],
      [/\bL[\?\uFFFD]+p\b/gi, 'Lớp'],
      [/\bPh[\?\uFFFD]+\b/gi, 'Phụ']
    ];
    for (const [re, rep] of wordMap) {
      s = s.replace(re, rep);
    }
    return s;
  },

  // Quét và tự động phục hồi toàn bộ dữ liệu hệ thống (Chống lỗi font vĩnh viễn)
  healAllData(dataObj) {
    if (!dataObj || typeof dataObj !== 'object') return dataObj;

    // Chuẩn hóa & bảo vệ danh sách các mục đã xóa (Tombstones)
    if (!Array.isArray(dataObj.deletedUserIds)) dataObj.deletedUserIds = [];
    if (!Array.isArray(dataObj.deletedAssignmentIds)) dataObj.deletedAssignmentIds = [];
    if (!Array.isArray(dataObj.deletedSubmissionIds)) dataObj.deletedSubmissionIds = [];

    const delUsers = new Set(dataObj.deletedUserIds);
    if (delUsers.size > 0 && Array.isArray(dataObj.users)) {
      dataObj.users = dataObj.users.filter(u => u && !delUsers.has(u.id));
    }
    const delAsns = new Set(dataObj.deletedAssignmentIds);
    if (delAsns.size > 0 && Array.isArray(dataObj.assignments)) {
      dataObj.assignments = dataObj.assignments.filter(a => a && !delAsns.has(a.id));
    }
    const delSubs = new Set(dataObj.deletedSubmissionIds);
    if (delSubs.size > 0 && Array.isArray(dataObj.submissions)) {
      dataObj.submissions = dataObj.submissions.filter(s => s && !delSubs.has(s.id));
    }

    // 1. Chuẩn hóa & bảo vệ danh sách Người dùng (Users)
    if (Array.isArray(dataObj.users)) {
      dataObj.users.forEach(u => {
        if (!u) return;
        if (u.id === 'u_tutor') {
          u.name = 'Thầy Minh Đức';
          u.roleName = 'Gia Sư Phụ Trách';
          u.subjects = ['Toán Học THPT'];
          u.avatarText = 'MĐ';
        } else if (u.id === 'u_tutor_linh') {
          u.name = 'Cô Phương Linh';
          u.roleName = 'Gia Sư Phụ Trách';
          u.subjects = ['Toán & Khoa Học Tự Nhiên'];
          u.avatarText = 'PL';
        } else if (u.id === 'u_tutor_1791305106234' || u.username === 'binhbinh') {
          u.name = 'Cô Bình Bình';
          u.roleName = 'Gia Sư Phụ Trách';
          u.subjects = ['Toán Học THPT'];
          u.gender = 'Nữ';
          u.avatarText = 'BB';
        } else if (u.id === 'u_admin') {
          u.name = 'Quản Trị Hệ Thống';
          u.roleName = 'Quản Trị Viên (Admin)';
          u.avatarText = 'AD';
        } else if (u.id === 'u_std_quang') {
          u.name = 'Nguyễn Minh Quang';
          u.roleName = 'Học Sinh';
          u.assignedTutorName = 'Thầy Minh Đức';
          u.gender = 'Nam';
        } else if (u.id === 'u_std_maianh') {
          u.name = 'Trần Mai Anh';
          u.roleName = 'Học Sinh';
          u.assignedTutorName = 'Thầy Minh Đức';
          u.gender = 'Nữ';
        } else if (u.id === 'u_std_nam') {
          u.name = 'Lê Hoàng Nam';
          u.roleName = 'Học Sinh';
          u.assignedTutorName = 'Cô Phương Linh';
          u.gender = 'Nam';
        } else if (u.id === 'u_std_1791342637918') {
          u.name = 'Học Sinh AN';
          u.roleName = 'Học Sinh';
          u.assignedTutorName = 'Cô Bình Bình';
        }

        for (const k in u) {
          if (typeof u[k] === 'string') {
            u[k] = this.healString(u[k]);
          } else if (Array.isArray(u[k])) {
            u[k] = u[k].map(item => typeof item === 'string' ? this.healString(item) : item);
          }
        }
      });
    }

    // 2. Chuẩn hóa & bảo vệ danh sách Bài tập (Assignments)
    if (Array.isArray(dataObj.assignments)) {
      dataObj.assignments.forEach(a => {
        if (!a) return;
        if (a.id === 'asn_001') {
          a.title = 'Phiếu 05: Chuyên Đề Cực Trị & Bất Đẳng Thức';
          a.subject = 'Toán Học 12 (Giải Tích & BĐT)';
        } else if (a.id === 'asn_002') {
          a.title = 'Phiếu 04: Khảo Sát Đồ Thị Hàm Số Phân Thức';
          a.subject = 'Toán Học 12 (Khảo sát hàm số)';
        } else if (a.id === 'asn_003') {
          a.title = 'Phiếu 03: Phương Trình Lượng Giác Cơ Bản';
          a.subject = 'Toán Học 11 (Lượng giác)';
        }
        for (const k in a) {
          if (typeof a[k] === 'string') {
            a[k] = this.healString(a[k]);
          }
        }
      });
    }

    // 3. Chuẩn hóa & bảo vệ danh sách Bài nộp (Submissions)
    if (Array.isArray(dataObj.submissions)) {
      dataObj.submissions.forEach(sub => {
        if (!sub) return;
        for (const k in sub) {
          if (typeof sub[k] === 'string') {
            sub[k] = this.healString(sub[k]);
          }
        }
      });
    }

    return dataObj;
  },

  data: null,

  init() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        this.data = JSON.parse(raw);
        if (!Array.isArray(this.data.deletedUserIds)) this.data.deletedUserIds = [];
        const seedDeleted = ['u_std_1791361091065', 'u_std_1791361864132'];
        seedDeleted.forEach(id => {
          if (!this.data.deletedUserIds.includes(id)) {
            this.data.deletedUserIds.push(id);
          }
        });
        // Tự động phục hồi toàn bộ chuỗi font chữ bị lỗi ngay khi nạp & loại bỏ tài khoản đã xóa
        this.healAllData(this.data);
        // Migration: Đảm bảo toàn bộ tài khoản có username, password, phân quyền và phân công giáo viên chính xác
        if (this.data && Array.isArray(this.data.users)) {
          let updated = false;

          const isDeletedUser = (uid) => Array.isArray(this.data.deletedUserIds) && this.data.deletedUserIds.includes(uid);

          // Chỉ bổ sung tài khoản mẫu lần đầu tiên (nếu chưa từng hoàn thành migration và không nằm trong danh sách đã xóa)
          if (!this.data.migratedInitialUsers) {
            // Kiểm tra và bổ sung Gia Sư thứ 2 nếu chưa có (Cô Phương Linh)
            const hasLinh = this.data.users.some(u => u.id === 'u_tutor_linh');
            if (!hasLinh && !isDeletedUser('u_tutor_linh')) {
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

            // Kiểm tra và bổ sung Gia Sư thứ 3 nếu chưa có (Cô Bình Bình)
            const hasBinhBinh = this.data.users.some(u => u.id === 'u_tutor_1791305106234' || u.username === 'binhbinh');
            if (!hasBinhBinh && !isDeletedUser('u_tutor_1791305106234')) {
              this.data.users.splice(3, 0, {
                id: 'u_tutor_1791305106234',
                username: 'binhbinh',
                password: '23032004',
                name: 'Cô Bình Bình',
                role: 'tutor',
                roleName: 'Gia Sư Phụ Trách',
                phone: '0902.704.416',
                avatarText: 'BB',
                subjects: ['Toán Học THPT']
              });
              updated = true;
            }

            // Kiểm tra và bổ sung Học Sinh AN nếu chưa có
            const hasAn = this.data.users.some(u => u.id === 'u_std_1791342637918' || u.username === 'std_an');
            if (!hasAn && !isDeletedUser('u_std_1791342637918')) {
              this.data.users.push({
                id: 'u_std_1791342637918',
                hasAccount: true,
                accountStatus: 'active',
                username: 'std_an',
                password: '123456',
                accountCreatedAt: '2026-10-07T03:10:37.918Z',
                name: 'Học Sinh AN',
                role: 'student',
                roleName: 'Học Sinh',
                assignedTutorId: 'u_tutor_1791305106234',
                assignedTutorName: 'Cô Bình Bình',
                dob: '2008-01-01',
                gender: 'Nam',
                school: 'THPT',
                grade: 'Lớp 12',
                phone: '0902.704.416',
                address: 'TP.HCM',
                parentName: 'Phụ huynh em AN',
                parentPhone: '1238912381',
                parentJob: '',
                subject: 'Toán Học 12',
                initialScore: 5.5,
                targetScore: 8.5,
                currentScore: 5.5,
                feePerSession: 250000,
                totalSessions: 0,
                learningMode: '1 kèm 1 tại nhà',
                schedule: 'Tối Thứ 2 & Thứ 5',
                startDate: '2026-10-07',
                strengths: '',
                weaknesses: '',
                notes: '',
                avatarText: 'AN'
              });
              updated = true;
            }
            this.data.migratedInitialUsers = true;
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

          // Tự động bổ sung bài kiểm tra trắc nghiệm mẫu (asn_004) nếu chưa có
          const isDeletedAsn = (aid) => Array.isArray(this.data.deletedAssignmentIds) && this.data.deletedAssignmentIds.includes(aid);
          if (!this.data.assignments.some(a => a.id === 'asn_004') && !isDeletedAsn('asn_004')) {
            const defaultAsns = this.getDefaultData().assignments;
            const sampleQuiz = defaultAsns.find(a => a.id === 'asn_004');
            if (sampleQuiz) {
              this.data.assignments.push(sampleQuiz);
              this.save();
            }
          }
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

    if (typeof CloudSync !== 'undefined' && typeof CloudSync.init === 'function') {
      CloudSync.init();
    }

    if (typeof GitHubSync !== 'undefined' && typeof GitHubSync.init === 'function') {
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
          this.healAllData(parsed);
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
    if (this.data) this.healAllData(this.data);
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
    const cs = window.CloudSync || (typeof CloudSync !== 'undefined' ? CloudSync : null);
    if (!skipCloudPush && cs) {
      if (immediate && typeof cs.pushData === 'function') {
        cs.pushData(this.data, true);
      } else if (typeof cs.schedulePush === 'function') {
        cs.schedulePush();
      }
    }

    // Tự động đẩy lên Kho dữ liệu trung tâm GitHub
    const gs = window.GitHubSync || (typeof GitHubSync !== 'undefined' ? GitHubSync : null);
    if (!skipCloudPush && gs && typeof gs.schedulePush === 'function') {
      return gs.schedulePush(immediate);
    }
    return Promise.resolve();
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
      deletedUserIds: [
        'u_std_1791361091065',
        'u_std_1791361864132'
      ],
      deletedAssignmentIds: [],
      deletedSubmissionIds: [],
      migratedInitialUsers: true,
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
        },
        {
          id: 'u_tutor_1791305106234',
          username: 'binhbinh',
          password: '23032004',
          name: 'Cô Bình Bình',
          role: 'tutor',
          roleName: 'Gia Sư Phụ Trách',
          phone: '0902.704.416',
          avatarText: 'BB',
          subjects: ['Toán Học THPT']
        },
        {
          id: 'u_std_1791342637918',
          hasAccount: true,
          accountStatus: 'active',
          username: 'std_an',
          password: '123456',
          accountCreatedAt: '2026-10-07T03:10:37.918Z',
          name: 'Học Sinh AN',
          role: 'student',
          roleName: 'Học Sinh',
          assignedTutorId: 'u_tutor_1791305106234',
          assignedTutorName: 'Cô Bình Bình',
          dob: '2008-01-01',
          gender: 'Nam',
          school: 'THPT',
          grade: 'Lớp 12',
          phone: '0902.704.416',
          address: 'TP.HCM',
          parentName: 'Phụ huynh em AN',
          parentPhone: '1238912381',
          parentJob: '',
          subject: 'Toán Học 12',
          initialScore: 5.5,
          targetScore: 8.5,
          currentScore: 5.5,
          feePerSession: 250000,
          totalSessions: 0,
          learningMode: '1 kèm 1 tại nhà',
          schedule: 'Tối Thứ 2 & Thứ 5',
          startDate: '2026-10-07',
          strengths: '',
          weaknesses: '',
          notes: '',
          avatarText: 'AN'
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
          targetStudentIds: ['u_std_quang', 'u_std_1791342637918'],
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
          targetStudentIds: ['u_std_maianh', 'u_std_1791342637918'],
          deadline: '2026-10-07T20:00',
          createdAt: '2026-10-05T14:00',
          totalPoints: 10,
          submissionType: 'photo'
        },
        {
          id: 'asn_003',
          tutorId: 'u_tutor_linh',
          title: 'Phiếu 03: Phương Trình Lượng Giác Cơ Bản',
          description: 'Ôn tập 10 công thức lượng giác và giải các phương trình sin, cos.',
          attachmentName: '10_Cau_Trac_Nghiem_Nguyen_Ham.pdf',
          attachmentSize: '560 KB',
          attachmentType: 'pdf',
          targetType: 'all',
          targetStudentIds: ['u_std_nam', 'u_std_quang', 'u_std_1791342637918'],
          deadline: '2026-10-10T23:59',
          createdAt: '2026-10-05T08:00',
          totalPoints: 10,
          submissionType: 'photo'
        },
        {
          id: 'asn_004',
          tutorId: 'u_tutor',
          title: '⚡ Đề Thi Trắc Nghiệm: 5 Câu Nguyên Hàm & Tích Phân',
          description: 'Bài kiểm tra trắc nghiệm online 5 câu hỏi trọng tâm. Thời gian làm bài 15 phút, hệ thống tự động chấm điểm 10/10 ngay lập tức!',
          attachmentName: '10_Cau_Trac_Nghiem_Nguyen_Ham.pdf',
          attachmentSize: '560 KB',
          attachmentType: 'pdf',
          targetType: 'individual',
          targetStudentIds: ['u_std_quang', 'u_std_maianh', 'u_std_1791342637918'],
          deadline: '2026-10-12T21:00',
          createdAt: '2026-10-08T08:00',
          totalPoints: 10,
          type: 'quiz',
          submissionType: 'quiz',
          quizData: {
            mode: 'detailed',
            durationMinutes: 15,
            questions: [
              {
                id: 1,
                text: 'Họ nguyên hàm của hàm số f(x) = 3x² + 2x là:',
                options: ['x³ + x² + C', '3x³ + 2x² + C', '6x + 2 + C', 'x³ + 2x² + C'],
                correct: 'A',
                explanation: 'Áp dụng công thức: ∫(3x² + 2x)dx = 3(x³/3) + 2(x²/2) + C = x³ + x² + C.'
              },
              {
                id: 2,
                text: 'Tìm nguyên hàm của hàm số f(x) = cos(2x):',
                options: ['sin(2x) + C', '(1/2)sin(2x) + C', '-2sin(2x) + C', '-(1/2)sin(2x) + C'],
                correct: 'B',
                explanation: '∫cos(ax)dx = (1/a)sin(ax) + C => ∫cos(2x)dx = (1/2)sin(2x) + C.'
              },
              {
                id: 3,
                text: 'Cho hàm số f(x) = e^(2x). Khẳng định nào sau đây đúng?',
                options: ['∫f(x)dx = 2e^(2x) + C', '∫f(x)dx = e^(2x) + C', '∫f(x)dx = (1/2)e^(2x) + C', '∫f(x)dx = e^x + C'],
                correct: 'C',
                explanation: 'Công thức ∫e^(ax)dx = (1/a)e^(ax) + C => ∫e^(2x)dx = (1/2)e^(2x) + C.'
              },
              {
                id: 4,
                text: 'Họ nguyên hàm của hàm số f(x) = 1/x (với x ≠ 0) là:',
                options: ['ln|x| + C', '-1/x² + C', 'ln(x) + C', '1/x² + C'],
                correct: 'A',
                explanation: 'Theo bảng nguyên hàm cơ bản: ∫(1/x)dx = ln|x| + C.'
              },
              {
                id: 5,
                text: 'Tích phân I = ∫[0 đến 1] (2x + 1) dx có giá trị bằng:',
                options: ['1', '2', '3', '4'],
                correct: 'B',
                explanation: 'Ta có: ∫(2x + 1)dx = [x² + x] từ 0 đến 1 = (1 + 1) - 0 = 2.'
              }
            ]
          }
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
    const del = new Set(this.data?.deletedUserIds || []);
    return (this.data?.users || []).filter(u => u.role === role && !del.has(u.id));
  },

  getUserById(id) {
    if (!id || !this.data || !Array.isArray(this.data.users)) return null;
    if (this.data.deletedUserIds && this.data.deletedUserIds.includes(id)) return null;
    return this.data.users.find(u => u.id === id) || null;
  },

  getUserByUsername(username) {
    if (!username || !this.data || !Array.isArray(this.data.users)) return null;
    const clean = username.trim().toLowerCase();
    const del = new Set(this.data.deletedUserIds || []);
    return this.data.users.find(u => !del.has(u.id) && u.username && u.username.toLowerCase() === clean) || null;
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
    const del = new Set(this.data?.deletedUserIds || []);
    let user = this.data.users.find(u => !del.has(u.id) && u.username && u.username.toLowerCase() === cleanUsername);

    // Hỗ trợ bí danh linh hoạt giữa các thiết bị
    if (!user) {
      if (cleanUsername === 'admin') {
        user = this.data.users.find(u => !del.has(u.id) && (u.role === 'admin' || u.id === 'u_admin'));
      } else if (cleanUsername === 'tutor' || cleanUsername === 'giasu') {
        user = this.data.users.find(u => !del.has(u.id) && u.id === 'u_tutor');
      } else if (cleanUsername === 'linh' || cleanUsername === 'giasu_linh') {
        user = this.data.users.find(u => !del.has(u.id) && u.id === 'u_tutor_linh');
      } else if (cleanUsername === 'quang' || cleanUsername === 'std_quang') {
        user = this.data.users.find(u => !del.has(u.id) && u.id === 'u_std_quang');
      } else if (cleanUsername === 'maianh' || cleanUsername === 'std_maianh') {
        user = this.data.users.find(u => !del.has(u.id) && u.id === 'u_std_maianh');
      } else if (cleanUsername === 'nam' || cleanUsername === 'std_nam') {
        user = this.data.users.find(u => !del.has(u.id) && u.id === 'u_std_nam');
      }
    }

    if (user && del.has(user.id)) {
      user = null;
    }

    if (!user) {
      return { 
        success: false, 
        notFound: true,
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
    if (this.data) this.healAllData(this.data);
    const del = new Set(this.data?.deletedUserIds || []);
    return (this.data?.users || []).filter(u => u.role === 'student' && !del.has(u.id));
  },

  getTutors() {
    if (this.data) this.healAllData(this.data);
    const del = new Set(this.data?.deletedUserIds || []);
    return (this.data?.users || []).filter(u => u.role === 'tutor' && !del.has(u.id));
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
    const del = new Set(this.data?.deletedUserIds || []);
    return (this.data?.users || []).some(u => !del.has(u.id) && u.username && u.username.toLowerCase() === clean && u.id !== excludeUserId);
  },

  addTutor(tutorData) {
    if (!tutorData.id) tutorData.id = 'u_tutor_' + Date.now();
    if (!tutorData.role) tutorData.role = 'tutor';
    if (!tutorData.roleName) tutorData.roleName = 'Gia Sư Phụ Trách';
    if (!tutorData.avatarText) {
      const words = (tutorData.name || 'Gia Sư').trim().split(/\s+/);
      tutorData.avatarText = words.length > 1 ? (words[0][0] + words[words.length - 1][0]).toUpperCase() : words[0].slice(0, 2).toUpperCase();
    }
    // Xóa khỏi danh sách đã xóa nếu tạo lại
    if (this.data.deletedUserIds) {
      this.data.deletedUserIds = this.data.deletedUserIds.filter(id => id !== tutorData.id);
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
    // Ghi nhận tombstone vĩnh viễn
    if (!this.data.deletedUserIds) this.data.deletedUserIds = [];
    if (!this.data.deletedUserIds.includes(tutorId)) {
      this.data.deletedUserIds.push(tutorId);
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
    // Chuyển bài tập do gia sư này phụ trách sang gia sư còn lại
    if (Array.isArray(this.data.assignments)) {
      this.data.assignments.forEach(a => {
        if (a && a.tutorId === tutorId && fallback) {
          a.tutorId = fallback.id;
        }
      });
    }
    this.save(false, true);
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
    const delAsns = new Set(this.data?.deletedAssignmentIds || []);
    return (this.data?.assignments || []).filter(a => !delAsns.has(a.id) && Array.isArray(a.targetStudentIds) && a.targetStudentIds.includes(studentId));
  },

  getAllAssignments() {
    const delAsns = new Set(this.data?.deletedAssignmentIds || []);
    return (this.data?.assignments || []).filter(a => !delAsns.has(a.id));
  },

  getSubmission(assignmentId, studentId) {
    const delSubs = new Set(this.data?.deletedSubmissionIds || []);
    return (this.data?.submissions || []).find(s => !delSubs.has(s.id) && s.assignmentId === assignmentId && s.studentId === studentId);
  },

  getSubmissionsByAssignment(assignmentId) {
    const delSubs = new Set(this.data?.deletedSubmissionIds || []);
    return (this.data?.submissions || []).filter(s => !delSubs.has(s.id) && s.assignmentId === assignmentId);
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
    if (this.data.deletedAssignmentIds) {
      this.data.deletedAssignmentIds = this.data.deletedAssignmentIds.filter(id => id !== assignment.id);
    }
    this.data.assignments.unshift(assignment);
    this.save();
  },

  updateAssignment(assignmentId, updatedData) {
    if (!this.data || !Array.isArray(this.data.assignments)) return false;
    const index = this.data.assignments.findIndex(a => a.id === assignmentId);
    if (index >= 0) {
      this.data.assignments[index] = {
        ...this.data.assignments[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      this.save(false, true);
      return true;
    }
    return false;
  },

  deleteAssignment(assignmentId) {
    if (!this.data.deletedAssignmentIds) this.data.deletedAssignmentIds = [];
    if (!this.data.deletedAssignmentIds.includes(assignmentId)) {
      this.data.deletedAssignmentIds.push(assignmentId);
    }
    this.data.assignments = (this.data.assignments || []).filter(a => a.id !== assignmentId);

    const removedSubs = (this.data.submissions || []).filter(s => s.assignmentId === assignmentId);
    if (!this.data.deletedSubmissionIds) this.data.deletedSubmissionIds = [];
    removedSubs.forEach(s => {
      if (!this.data.deletedSubmissionIds.includes(s.id)) {
        this.data.deletedSubmissionIds.push(s.id);
      }
    });
    this.data.submissions = (this.data.submissions || []).filter(s => s.assignmentId !== assignmentId);
    this.save(false, true);
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

  updateSubmissionGrading(subId, score, feedback, annotatedPhoto, annotatedPhotos = null) {
    const sub = this.data.submissions.find(s => s.id === subId);
    if (sub) {
      sub.status = 'graded';
      sub.score = parseFloat(score);
      sub.feedback = feedback;
      sub.annotatedPhoto = annotatedPhoto;
      if (Array.isArray(annotatedPhotos) && annotatedPhotos.length > 0) {
        sub.annotatedPhotos = annotatedPhotos;
      }
      sub.gradedAt = new Date().toISOString();
      this.save();
    }
  },

  adjustStudentSessions(studentId, delta) {
    const std = this.getUserById(studentId);
    if (!std) return false;
    const current = std.totalSessions || 0;
    const nextVal = Math.max(0, current + delta);
    return this.updateStudent(studentId, { totalSessions: nextVal });
  },

  resetStudentSessions(studentId) {
    return this.updateStudent(studentId, { totalSessions: 0 });
  },

  addStudent(studentData) {
    if (this.data.deletedUserIds) {
      this.data.deletedUserIds = this.data.deletedUserIds.filter(id => id !== studentData.id);
    }
    this.data.users.push(studentData);
    this.save();
  },

  deleteStudent(studentId) {
    // 1. Ghi nhận tombstone vĩnh viễn
    if (!this.data.deletedUserIds) this.data.deletedUserIds = [];
    if (!this.data.deletedUserIds.includes(studentId)) {
      this.data.deletedUserIds.push(studentId);
    }

    // 2. Xóa học sinh khỏi danh sách người dùng
    this.data.users = (this.data.users || []).filter(u => u.id !== studentId);

    // 3. Xóa toàn bộ bài nộp của học sinh này & ghi nhận tombstone
    const removedSubs = (this.data.submissions || []).filter(s => s.studentId === studentId);
    if (!this.data.deletedSubmissionIds) this.data.deletedSubmissionIds = [];
    removedSubs.forEach(s => {
      if (!this.data.deletedSubmissionIds.includes(s.id)) {
        this.data.deletedSubmissionIds.push(s.id);
      }
    });
    this.data.submissions = (this.data.submissions || []).filter(s => s.studentId !== studentId);

    // 4. Xóa học sinh khỏi các bài tập; nếu bài tập giao riêng cho học sinh này thì xóa hẳn bài tập & ghi nhận tombstone
    const removedAsnIds = [];
    this.data.assignments = (this.data.assignments || []).filter(a => {
      a.targetStudentIds = (a.targetStudentIds || []).filter(id => id !== studentId);
      if (a.targetStudentIds.length === 0) {
        removedAsnIds.push(a.id);
        return false;
      }
      return true;
    });
    if (removedAsnIds.length > 0) {
      if (!this.data.deletedAssignmentIds) this.data.deletedAssignmentIds = [];
      removedAsnIds.forEach(id => {
        if (!this.data.deletedAssignmentIds.includes(id)) {
          this.data.deletedAssignmentIds.push(id);
        }
      });
    }

    this.save(false, true);
  },

  updateStudent(studentId, updatedData) {
    if (!this.data || !Array.isArray(this.data.users)) return false;
    const index = this.data.users.findIndex(u => u.id === studentId);
    if (index >= 0) {
      const current = this.data.users[index];
      const merged = { ...current, ...updatedData };

      // Cập nhật avatarText nếu tên thay đổi
      if (updatedData.name) {
        const words = updatedData.name.trim().split(/\s+/).filter(Boolean);
        merged.avatarText = words.length > 1 ? (words[0][0] + words[words.length - 1][0]).toUpperCase() : words[0].slice(0, 2).toUpperCase();
      }

      this.data.users[index] = merged;

      // Đồng bộ tên học sinh mới vào các bài nộp cũ
      if (updatedData.name && Array.isArray(this.data.submissions)) {
        this.data.submissions.forEach(sub => {
          if (sub.studentId === studentId) {
            sub.studentName = updatedData.name;
          }
        });
      }

      // Lưu ngay lập tức và đẩy đồng bộ lên Cloud & GitHub
      this.save(false, true);
      return true;
    }
    return false;
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

if (typeof window !== 'undefined') {
  window.Store = Store;
}

