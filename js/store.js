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
    if (!str.includes('?') && !str.includes('\uFFFD')) return str;

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
    if (!Array.isArray(dataObj.deletedClassIds)) dataObj.deletedClassIds = [];

    // Luôn bảo vệ triệt để các lớp học mặc định đã xóa (cls_12a1, cls_10a2)
    const seedClasses = ['cls_12a1', 'cls_10a2'];
    seedClasses.forEach(cid => {
      if (!dataObj.deletedClassIds.includes(cid)) {
        dataObj.deletedClassIds.push(cid);
      }
    });

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
    const delClasses = new Set(dataObj.deletedClassIds);
    if (delClasses.size > 0 && Array.isArray(dataObj.classes)) {
      dataObj.classes = dataObj.classes.filter(c => c && !delClasses.has(c.id));
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

    // 4. Chuẩn hóa & bảo vệ tính toàn vẹn quan hệ danh sách Lớp học (Classes)
    if (Array.isArray(dataObj.classes)) {
      const activeTutors = (dataObj.users || []).filter(u => u && u.role === 'tutor' && !delUsers.has(u.id));
      const fallbackTutor = activeTutors.length > 0 ? activeTutors[0] : null;

      dataObj.classes.forEach(c => {
        if (!c) return;
        // Lọc sạch studentIds không còn tồn tại hoặc đã bị xóa
        if (Array.isArray(c.studentIds)) {
          c.studentIds = c.studentIds.filter(sid => !delUsers.has(sid) && (dataObj.users || []).some(u => u && u.id === sid));
        }
        // Đảm bảo tutorId hợp lệ
        if (c.tutorId && (delUsers.has(c.tutorId) || !(dataObj.users || []).some(u => u && u.id === c.tutorId))) {
          if (fallbackTutor) {
            c.tutorId = fallbackTutor.id;
            c.tutorName = fallbackTutor.name;
          }
        }
        for (const k in c) {
          if (typeof c[k] === 'string') {
            c[k] = this.healString(c[k]);
          }
        }
      });
    }

    // 5. Chuẩn hóa targetStudentIds và tutorId trong Assignments
    if (Array.isArray(dataObj.assignments)) {
      const activeTutors = (dataObj.users || []).filter(u => u && u.role === 'tutor' && !delUsers.has(u.id));
      const fallbackTutor = activeTutors.length > 0 ? activeTutors[0] : null;

      dataObj.assignments.forEach(a => {
        if (!a) return;
        if (Array.isArray(a.targetStudentIds)) {
          a.targetStudentIds = a.targetStudentIds.filter(sid => !delUsers.has(sid) && (dataObj.users || []).some(u => u && u.id === sid));
        }
        if (a.tutorId && (delUsers.has(a.tutorId) || !(dataObj.users || []).some(u => u && u.id === a.tutorId))) {
          if (fallbackTutor) {
            a.tutorId = fallbackTutor.id;
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
        // Cài đặt chuẩn hóa: Đảm bảo ban đầu chỉ có duy nhất tài khoản Quản Trị Viên (Admin)
        if (!this.data.migratedAdminOnlyV13) {
          this.data.users = (this.data.users || []).filter(u => u && (u.id === 'u_admin' || u.role === 'admin'));
          if (this.data.users.length === 0) {
            this.data.users = [
              {
                id: 'u_admin',
                username: 'admin',
                password: 'admin123',
                name: 'Quản Trị Hệ Thống',
                role: 'admin',
                roleName: 'Quản Trị Viên (Admin)',
                phone: '0900.123.456',
                avatarText: 'AD'
              }
            ];
          }
          this.data.assignments = [];
          this.data.submissions = [];
          this.data.classes = [];
          this.data.deletedUserIds = [
            'u_tutor_1791305106234',
            'u_std_1791385736306',
            'u_std_quang',
            'u_std_maianh',
            'u_std_nam',
            'u_std_thuyduong',
            'u_std_1791342637918',
            'u_tutor',
            'u_tutor_linh'
          ];
          this.data.deletedAssignmentIds = ['asn_001', 'asn_002', 'asn_003', 'asn_004'];
          this.data.deletedSubmissionIds = ['sub_001', 'sub_002'];
          this.data.deletedClassIds = ['cls_12a1', 'cls_10a2'];
          this.data.migratedInitialUsers = true;
          this.data.migratedAdminOnlyV13 = true;
          this.data.migratedClassesTombstoneV14 = true;
          this.save(false, true);
        }

        // Cập nhật bảo vệ lớp học đã xóa (Tombstone V14)
        if (!this.data.migratedClassesTombstoneV14) {
          if (!Array.isArray(this.data.deletedClassIds)) this.data.deletedClassIds = [];
          const seedDeletedClasses = ['cls_12a1', 'cls_10a2'];
          seedDeletedClasses.forEach(cid => {
            if (!this.data.deletedClassIds.includes(cid)) {
              this.data.deletedClassIds.push(cid);
            }
          });
          if (Array.isArray(this.data.classes)) {
            const delC = new Set(this.data.deletedClassIds);
            this.data.classes = this.data.classes.filter(c => c && !delC.has(c.id));
          }
          this.data.migratedClassesTombstoneV14 = true;
          this.save(false, true);
        }

        // Tự động phục hồi toàn bộ chuỗi font chữ bị lỗi ngay khi nạp & loại bỏ tài khoản đã xóa
        this.healAllData(this.data);

        // Đảm bảo tài khoản admin luôn có thông tin đăng nhập chuẩn
        if (this.data && Array.isArray(this.data.users)) {
          let updated = false;
          this.data.users.forEach(u => {
            if (u.role === 'admin') {
              if (!u.username) { u.username = 'admin'; updated = true; }
              if (!u.password) { u.password = 'admin123'; updated = true; }
            }
          });
          if (updated) {
            this.save();
          }
        }

        // Đảm bảo cấu trúc mảng classes luôn hợp lệ
        if (!Array.isArray(this.data.classes)) {
          this.data.classes = [];
          this.save();
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

  lastTabUpdateTimestamp: 0,

  handleCrossTabUpdate(payload) {
    try {
      const raw = payload.raw || localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          const prev = this.data ? JSON.parse(JSON.stringify(this.data)) : null;
          this.healAllData(parsed);
          this.data = parsed;

          // Kiểm tra xem dữ liệu có thực sự thay đổi cho giao diện đang hiển thị hay không
          const cs = window.CloudSync;
          const hasChanged = cs && typeof cs.hasDataChanged === 'function' ? cs.hasDataChanged(prev, parsed) : true;
          if (hasChanged) {
            if (window.App && typeof App.safeRenderCurrentView === 'function') {
              App.safeRenderCurrentView();
            } else if (window.App && typeof App.renderCurrentView === 'function') {
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
    // Lưu ý: Học sinh (student) tuyệt đối không push trực tiếp lên GitHub (để chống xung đột SHA và nghẽn rate limit);
    // Mọi tương tác của học sinh đều được Firebase Realtime đồng bộ tức thì sang máy Gia sư/Admin.
    const gs = window.GitHubSync || (typeof GitHubSync !== 'undefined' ? GitHubSync : null);
    const currentUser = (this.data && this.data.currentUser) || (window.Auth && typeof Auth.getCurrentUser === 'function' ? Auth.getCurrentUser() : null);
    const isStudent = currentUser && currentUser.role === 'student';
    if (!skipCloudPush && !isStudent && gs && typeof gs.schedulePush === 'function') {
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
        'u_tutor_1791305106234',
        'u_std_1791385736306',
        'u_std_quang',
        'u_std_maianh',
        'u_std_nam',
        'u_std_thuyduong',
        'u_std_1791342637918',
        'u_tutor',
        'u_tutor_linh'
      ],
      deletedAssignmentIds: ['asn_001', 'asn_002', 'asn_003', 'asn_004'],
      deletedSubmissionIds: ['sub_001', 'sub_002'],
      deletedClassIds: ['cls_12a1', 'cls_10a2'],
      migratedInitialUsers: true,
      migratedAdminOnlyV13: true,
      migratedClassesTombstoneV14: true,
      // 1. CÀI ĐẶT BAN ĐẦU: CHỈ CÓ DUY NHẤT TÀI KHOẢN ADMIN
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
        }
      ],
      // 2. BÀI TẬP TRỐNG BAN ĐẦU
      assignments: [],
      // 3. BÀI NỘP TRỐNG BAN ĐẦU
      submissions: [],
      // 4. DANH MỤC LỚP HỌC TRỐNG BAN ĐẦU
      classes: []
    };
    this.save(false, true);
  },

  // Helpers
  getUsers() {
    const del = new Set(this.data?.deletedUserIds || []);
    return (this.data?.users || []).filter(u => !del.has(u.id));
  },

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
    const del = new Set(this.data?.deletedUserIds || []);
    return (this.data?.users || []).filter(u => u.role === 'student' && !del.has(u.id));
  },

  getTutors() {
    const del = new Set(this.data?.deletedUserIds || []);
    return (this.data?.users || []).filter(u => u.role === 'tutor' && !del.has(u.id));
  },

  getStudentsByTutor(tutorId) {
    if (!tutorId) return [];
    const tutorClasses = this.getClassesByTutor(tutorId);
    const classStudentIds = new Set(tutorClasses.flatMap(c => Array.isArray(c.studentIds) ? c.studentIds : []));
    return this.getStudents().filter(s => s.assignedTutorId === tutorId || classStudentIds.has(s.id));
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
    const studentClassIds = this.getStudentClasses(studentId).map(c => c.id);
    return (this.data?.assignments || []).filter(a => {
      if (delAsns.has(a.id)) return false;
      if (Array.isArray(a.targetStudentIds) && a.targetStudentIds.includes(studentId)) return true;
      if (a.classId && studentClassIds.includes(a.classId)) return true;
      return false;
    });
  },

  getAssignmentsByClass(classId) {
    const cls = this.getClassById(classId);
    if (!cls) return [];
    const studentIdSet = new Set(cls.studentIds || []);
    const delAsns = new Set(this.data?.deletedAssignmentIds || []);
    return (this.data?.assignments || []).filter(a => {
      if (delAsns.has(a.id)) return false;
      if (a.classId === classId) return true;
      if (Array.isArray(a.targetStudentIds) && a.targetStudentIds.some(id => studentIdSet.has(id))) return true;
      return false;
    });
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

  getAssignmentById(id) {
    if (!this.data || !Array.isArray(this.data.assignments)) return null;
    return this.data.assignments.find(a => a && a.id === id) || null;
  },

  saveAssignment(assignment) {
    if (!assignment || !assignment.id) return false;
    const existing = this.getAssignmentById(assignment.id);
    if (existing) {
      return this.updateAssignment(assignment.id, assignment);
    } else {
      this.addAssignment(assignment);
      return true;
    }
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
    if (!submission) return;
    if (!submission.id) {
      submission.id = `sub_${Date.now()}_${submission.studentId || Math.random().toString(36).substr(2, 6)}`;
    }
    const existingIndex = this.data.submissions.findIndex(
      s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId
    );
    if (existingIndex >= 0) {
      this.data.submissions[existingIndex] = { ...this.data.submissions[existingIndex], ...submission };
    } else {
      this.data.submissions.unshift(submission);
    }
    this.save(false, true);
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
  },

  // ================= QUẢN LÝ LỚP HỌC (CLASSROOM MODULE) =================
  getDefaultClasses() {
    return [];
  },

  getClasses() {
    if (!this.data) return [];
    if (!Array.isArray(this.data.classes)) {
      this.data.classes = [];
      this.save();
    }
    const del = new Set(this.data?.deletedClassIds || []);
    return this.data.classes.filter(c => c && !del.has(c.id));
  },

  getClassById(classId) {
    if (!classId) return null;
    const del = new Set(this.data?.deletedClassIds || []);
    if (del.has(classId)) return null;
    return this.getClasses().find(c => c.id === classId || c.code === classId) || null;
  },

  getClassesByTutor(tutorId) {
    return this.getClasses().filter(c => c.tutorId === tutorId);
  },

  getStudentClass(studentId) {
    if (!studentId) return null;
    return this.getClasses().find(c => Array.isArray(c.studentIds) && c.studentIds.includes(studentId)) || null;
  },

  getStudentClasses(studentId) {
    if (!studentId) return [];
    return this.getClasses().filter(c => Array.isArray(c.studentIds) && c.studentIds.includes(studentId));
  },

  setStudentClass(studentId, classId) {
    if (!studentId) return false;
    const now = new Date().toISOString();
    if (Array.isArray(this.data.classes)) {
      this.data.classes.forEach(c => {
        if (Array.isArray(c.studentIds) && c.studentIds.includes(studentId)) {
          c.studentIds = c.studentIds.filter(id => id !== studentId);
          c.updatedAt = now;
        }
      });
    }
    if (classId && classId !== 'none') {
      const cls = this.getClassById(classId);
      if (cls) {
        if (!Array.isArray(cls.studentIds)) cls.studentIds = [];
        if (!cls.studentIds.includes(studentId)) {
          cls.studentIds.push(studentId);
        }
        cls.updatedAt = now;

        const std = this.getUserById(studentId);
        if (std && cls.tutorId) {
          if (!std.assignedTutorId || std.assignedTutorId === 'u_tutor') {
            std.assignedTutorId = cls.tutorId;
            std.assignedTutorName = cls.tutorName;
          }
          std.updatedAt = now;
        }

        // Tự động đồng bộ các bài tập đã giao cho toàn lớp để học sinh mới cũng nhận được
        if (Array.isArray(this.data?.assignments)) {
          this.data.assignments.forEach(asn => {
            if (asn && asn.classId === classId) {
              if (!Array.isArray(asn.targetStudentIds)) asn.targetStudentIds = [];
              if (!asn.targetStudentIds.includes(studentId)) {
                asn.targetStudentIds.push(studentId);
              }
            }
          });
        }
      }
    }
    this.save(false, true);
    return true;
  },

  joinClassByCode(studentId, classCode) {
    if (!studentId || !classCode) {
      return { success: false, message: 'Vui lòng nhập mã lớp học hợp lệ!' };
    }
    const cleanCode = classCode.trim().toUpperCase();
    const cls = this.getClasses().find(c => 
      (c.code && c.code.toUpperCase() === cleanCode) || 
      (c.id && c.id.toUpperCase() === cleanCode)
    );
    if (!cls) {
      return { success: false, message: `Mã lớp "${classCode}" không tồn tại trên hệ thống. Vui lòng kiểm tra lại chính xác mã do Thầy/Cô cung cấp!` };
    }

    if (!Array.isArray(cls.studentIds)) cls.studentIds = [];
    if (cls.studentIds.includes(studentId)) {
      return { success: false, message: `Bạn đã tham gia lớp "${cls.name}" từ trước rồi!`, class: cls };
    }

    const now = new Date().toISOString();
    cls.studentIds.push(studentId);
    cls.updatedAt = now;

    // Đồng bộ thông tin gia sư phụ trách cho học sinh
    const student = this.getUserById(studentId);
    if (student && cls.tutorId) {
      if (!student.assignedTutorId || student.assignedTutorId === 'u_tutor') {
        student.assignedTutorId = cls.tutorId;
        student.assignedTutorName = cls.tutorName;
      }
      student.updatedAt = now;
    }

    // Tự động đồng bộ các bài tập đã giao cho toàn lớp để học sinh mới cũng nhận được
    if (Array.isArray(this.data?.assignments)) {
      this.data.assignments.forEach(asn => {
        if (asn && asn.classId === cls.id) {
          if (!Array.isArray(asn.targetStudentIds)) asn.targetStudentIds = [];
          if (!asn.targetStudentIds.includes(studentId)) {
            asn.targetStudentIds.push(studentId);
          }
        }
      });
    }

    this.save(false, true);
    return { 
      success: true, 
      message: `🎉 Chúc mừng bạn đã tham gia thành công lớp "${cls.name}" do ${cls.tutorName} phụ trách!`, 
      class: cls 
    };
  },

  leaveClass(studentId, classId) {
    if (!studentId || !classId) return { success: false, message: 'Thông tin không hợp lệ!' };
    const cls = this.getClassById(classId);
    if (!cls) return { success: false, message: 'Lớp học không tồn tại!' };
    if (!Array.isArray(cls.studentIds) || !cls.studentIds.includes(studentId)) {
      return { success: false, message: 'Bạn không thuộc lớp học này!' };
    }
    cls.studentIds = cls.studentIds.filter(id => id !== studentId);
    cls.updatedAt = new Date().toISOString();

    // Nếu học sinh chưa nộp bài của bài tập lớp này, loại khỏi targetStudentIds
    if (Array.isArray(this.data?.assignments)) {
      this.data.assignments.forEach(asn => {
        if (asn && asn.classId === classId && Array.isArray(asn.targetStudentIds)) {
          const sub = this.getSubmission(asn.id, studentId);
          if (!sub) {
            asn.targetStudentIds = asn.targetStudentIds.filter(id => id !== studentId);
          }
        }
      });
    }

    this.save(false, true);
    return { success: true, message: `Đã rời lớp "${cls.name}" thành công!` };
  },

  addClass(classData) {
    if (!this.data) return null;
    if (!Array.isArray(this.data.classes)) this.data.classes = [];
    const now = new Date().toISOString();
    const newClass = {
      id: classData.id || ('cls_' + Date.now()),
      code: (classData.code || ('LOP' + Math.floor(1000 + Math.random() * 9000))).toUpperCase(),
      name: classData.name || 'Lớp Học Mới',
      grade: classData.grade || 'Lớp 12',
      subject: classData.subject || 'Toán Học',
      room: classData.room || 'Phòng Học Online',
      tutorId: classData.tutorId || 'u_tutor',
      tutorName: classData.tutorName || 'Gia Sư Phụ Trách',
      studentIds: Array.isArray(classData.studentIds) ? classData.studentIds : [],
      createdAt: now,
      updatedAt: now,
      announcements: Array.isArray(classData.announcements) ? classData.announcements : []
    };
    if (Array.isArray(this.data.deletedClassIds)) {
      this.data.deletedClassIds = this.data.deletedClassIds.filter(id => id !== newClass.id);
    }
    this.data.classes.unshift(newClass);

    // Đồng bộ gia sư cho các học sinh mới vào lớp nếu chưa có gia sư
    if (newClass.studentIds.length > 0 && newClass.tutorId) {
      newClass.studentIds.forEach(sid => {
        const std = this.getUserById(sid);
        if (std && (!std.assignedTutorId || std.assignedTutorId === 'u_tutor')) {
          std.assignedTutorId = newClass.tutorId;
          std.assignedTutorName = newClass.tutorName;
          std.updatedAt = now;
        }
      });
    }

    this.save(false, true);
    return newClass;
  },

  updateClass(classId, updatedData) {
    if (!this.data || !Array.isArray(this.data.classes)) return false;
    const index = this.data.classes.findIndex(c => c.id === classId);
    if (index >= 0) {
      const now = new Date().toISOString();
      const prevClass = this.data.classes[index];
      const updatedClass = {
        ...prevClass,
        ...updatedData,
        updatedAt: now
      };
      this.data.classes[index] = updatedClass;

      // Đồng bộ thông tin học sinh và bài tập nếu danh sách học sinh thay đổi
      if (Array.isArray(updatedClass.studentIds)) {
        updatedClass.studentIds.forEach(sid => {
          // 1. Đồng bộ gia sư
          const std = this.getUserById(sid);
          if (std && updatedClass.tutorId && (!std.assignedTutorId || std.assignedTutorId === 'u_tutor')) {
            std.assignedTutorId = updatedClass.tutorId;
            std.assignedTutorName = updatedClass.tutorName;
            std.updatedAt = now;
          }
          // 2. Đồng bộ bài tập của lớp
          if (Array.isArray(this.data.assignments)) {
            this.data.assignments.forEach(asn => {
              if (asn && asn.classId === classId) {
                if (!Array.isArray(asn.targetStudentIds)) asn.targetStudentIds = [];
                if (!asn.targetStudentIds.includes(sid)) {
                  asn.targetStudentIds.push(sid);
                }
              }
            });
          }
        });
      }

      this.save(false, true);
      return true;
    }
    return false;
  },

  deleteClass(classId) {
    if (!this.data || !Array.isArray(this.data.classes)) return false;
    if (!Array.isArray(this.data.deletedClassIds)) this.data.deletedClassIds = [];
    if (!this.data.deletedClassIds.includes(classId)) {
      this.data.deletedClassIds.push(classId);
    }
    this.data.classes = this.data.classes.filter(c => c && c.id !== classId);
    if (Array.isArray(this.data.assignments)) {
      this.data.assignments.forEach(a => {
        if (a && a.classId === classId) {
          a.classId = null;
        }
      });
    }
    this.save(false, true);
    return true;
  },

  addStudentToClass(classId, studentId) {
    const cls = this.getClassById(classId);
    if (!cls) return false;
    if (!Array.isArray(cls.studentIds)) cls.studentIds = [];
    if (!cls.studentIds.includes(studentId)) {
      cls.studentIds.push(studentId);
    }
    const now = new Date().toISOString();
    cls.updatedAt = now;

    // Đồng bộ gia sư cho học sinh nếu chưa có hoặc mặc định
    const std = this.getUserById(studentId);
    if (std && cls.tutorId) {
      if (!std.assignedTutorId || std.assignedTutorId === 'u_tutor') {
        std.assignedTutorId = cls.tutorId;
        std.assignedTutorName = cls.tutorName;
      }
      std.updatedAt = now;
    }

    // Tự động đồng bộ các bài tập đã giao cho toàn lớp để học sinh mới cũng nhận được
    if (Array.isArray(this.data?.assignments)) {
      this.data.assignments.forEach(asn => {
        if (asn && asn.classId === classId) {
          if (!Array.isArray(asn.targetStudentIds)) asn.targetStudentIds = [];
          if (!asn.targetStudentIds.includes(studentId)) {
            asn.targetStudentIds.push(studentId);
          }
        }
      });
    }
    this.save(false, true);
    return true;
  },

  removeStudentFromClass(classId, studentId) {
    const cls = this.getClassById(classId);
    if (!cls || !Array.isArray(cls.studentIds)) return false;
    cls.studentIds = cls.studentIds.filter(id => id !== studentId);
    cls.updatedAt = new Date().toISOString();

    // Nếu học sinh chưa nộp bài của bài tập lớp này, loại khỏi targetStudentIds
    if (Array.isArray(this.data?.assignments)) {
      this.data.assignments.forEach(asn => {
        if (asn && asn.classId === classId && Array.isArray(asn.targetStudentIds)) {
          const sub = this.getSubmission(asn.id, studentId);
          if (!sub) {
            asn.targetStudentIds = asn.targetStudentIds.filter(id => id !== studentId);
          }
        }
      });
    }
    this.save(false, true);
    return true;
  },

  getStudentsByClass(classId) {
    const cls = this.getClassById(classId);
    if (!cls || !Array.isArray(cls.studentIds)) return [];
    return cls.studentIds.map(id => this.getUserById(id)).filter(Boolean);
  },

  addClassAnnouncement(classId, { title, content, authorName }) {
    const cls = this.getClassById(classId);
    if (!cls) return false;
    if (!Array.isArray(cls.announcements)) cls.announcements = [];
    const ann = {
      id: 'ann_' + Date.now(),
      title: title || 'Thông báo mới',
      content: content || '',
      createdAt: new Date().toISOString(),
      authorName: authorName || cls.tutorName || 'Giáo viên'
    };
    cls.announcements.unshift(ann);
    this.save(false, true);
    return ann;
  },

  // ================= ĐÁNH GIÁ & NHẬN XÉT TOÀN LỚP (CLASS EVALUATION) =================
  getClassEvaluations(classId) {
    const cls = this.getClassById(classId);
    if (!cls) return [];
    if (!Array.isArray(cls.evaluations)) {
      cls.evaluations = [];
    }
    return [...cls.evaluations].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  },

  getLatestClassEvaluation(classId) {
    const evals = this.getClassEvaluations(classId);
    return evals.length > 0 ? evals[0] : null;
  },

  saveClassEvaluation(classId, evalData) {
    const cls = this.getClassById(classId);
    if (!cls) return null;
    if (!Array.isArray(cls.evaluations)) cls.evaluations = [];

    const now = new Date().toISOString();
    let evaluation = null;

    if (evalData.id) {
      const idx = cls.evaluations.findIndex(e => e.id === evalData.id);
      if (idx >= 0) {
        evaluation = {
          ...cls.evaluations[idx],
          ...evalData,
          updatedAt: now
        };
        cls.evaluations[idx] = evaluation;
      }
    }

    if (!evaluation) {
      evaluation = {
        id: evalData.id || ('eval_' + Date.now()),
        period: evalData.period || ('Đánh Giá Tháng ' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear()),
        date: evalData.date || now,
        createdAt: now,
        overallComment: evalData.overallComment || '',
        strengths: evalData.strengths || '',
        weaknesses: evalData.weaknesses || '',
        actionPlan: evalData.actionPlan || '',
        commendations: evalData.commendations || '',
        attentionNeeded: evalData.attentionNeeded || '',
        studentNotes: evalData.studentNotes || {},
        createdBy: evalData.createdBy || cls.tutorName || 'Giáo viên phụ trách',
        statsSnapshot: evalData.statsSnapshot || null
      };
      cls.evaluations.unshift(evaluation);
    }

    this.save(false, true);
    return evaluation;
  },

  deleteClassEvaluation(classId, evalId) {
    const cls = this.getClassById(classId);
    if (!cls || !Array.isArray(cls.evaluations)) return false;
    cls.evaluations = cls.evaluations.filter(e => e.id !== evalId);
    this.save(false, true);
    return true;
  },

  updateStudentClassEvaluationNote(classId, evalId, studentId, note) {
    const cls = this.getClassById(classId);
    if (!cls || !Array.isArray(cls.evaluations)) return false;
    const evaluation = cls.evaluations.find(e => e.id === evalId);
    if (!evaluation) return false;
    if (!evaluation.studentNotes) evaluation.studentNotes = {};
    evaluation.studentNotes[studentId] = note;
    this.save(false, true);
    return true;
  },

  // Sổ Điểm Điện Tử & Bảng Ma Trận Điểm Cả Lớp
  getClassGradebook(classId) {
    const cls = this.getClassById(classId);
    if (!cls) return null;

    const students = this.getStudentsByClass(classId);
    const studentIdSet = new Set(cls.studentIds || []);

    // Lấy tất cả bài tập giao cho lớp này hoặc giao cho học sinh trong lớp
    const assignments = this.getAllAssignments().filter(a => {
      if (a.classId === classId) return true;
      if (Array.isArray(a.targetStudentIds) && a.targetStudentIds.some(id => studentIdSet.has(id))) return true;
      return false;
    });

    const matrix = students.map(std => {
      const studentScores = {};
      let totalScore = 0;
      let gradedCount = 0;
      let submittedCount = 0;

      assignments.forEach(asn => {
        const sub = this.getSubmission(asn.id, std.id);
        if (sub) {
          submittedCount++;
          if (sub.status === 'graded' && sub.score !== null) {
            studentScores[asn.id] = sub.score;
            totalScore += sub.score;
            gradedCount++;
          } else {
            studentScores[asn.id] = 'pending'; // Chờ chấm
          }
        } else {
          studentScores[asn.id] = null; // Chưa nộp
        }
      });

      const avgScore = gradedCount > 0 ? Math.round((totalScore / gradedCount) * 10) / 10 : null;

      let classification = 'Chưa xếp loại';
      if (avgScore !== null) {
        if (avgScore >= 8.5) classification = 'Giỏi';
        else if (avgScore >= 7.0) classification = 'Khá';
        else if (avgScore >= 5.0) classification = 'Trung Bình';
        else classification = 'Yếu';
      }

      return {
        student: std,
        scores: studentScores,
        avgScore: avgScore,
        gradedCount: gradedCount,
        submittedCount: submittedCount,
        totalAsns: assignments.length,
        completionRate: assignments.length > 0 ? Math.round((submittedCount / assignments.length) * 100) : 100,
        classification: classification
      };
    });

    // Sắp xếp thứ hạng theo điểm trung bình giảm dần
    const rankings = [...matrix].sort((a, b) => {
      const scoreA = a.avgScore !== null ? a.avgScore : -1;
      const scoreB = b.avgScore !== null ? b.avgScore : -1;
      return scoreB - scoreA;
    });

    // Thống kê phổ điểm cả lớp
    let totalClassScore = 0;
    let studentsWithScore = 0;
    let countExcellent = 0, countGood = 0, countAvg = 0, countWeak = 0;

    matrix.forEach(row => {
      if (row.avgScore !== null) {
        totalClassScore += row.avgScore;
        studentsWithScore++;
        if (row.avgScore >= 8.5) countExcellent++;
        else if (row.avgScore >= 7.0) countGood++;
        else if (row.avgScore >= 5.0) countAvg++;
        else countWeak++;
      }
    });

    const classAvg = studentsWithScore > 0 ? (totalClassScore / studentsWithScore).toFixed(1) : 'Chưa có';

    return {
      classInfo: cls,
      students: students,
      assignments: assignments,
      matrix: matrix,
      rankings: rankings,
      classAvg: classAvg,
      distribution: {
        totalRated: studentsWithScore,
        excellent: { count: countExcellent, percent: studentsWithScore > 0 ? Math.round((countExcellent / studentsWithScore) * 100) : 0 },
        good: { count: countGood, percent: studentsWithScore > 0 ? Math.round((countGood / studentsWithScore) * 100) : 0 },
        average: { count: countAvg, percent: studentsWithScore > 0 ? Math.round((countAvg / studentsWithScore) * 100) : 0 },
        weak: { count: countWeak, percent: studentsWithScore > 0 ? Math.round((countWeak / studentsWithScore) * 100) : 0 }
      }
    };
  },

  // ================= THỐNG KÊ & LỊCH SỬ CÁC ĐỢT KIỂM TRA / ĐÁNH GIÁ (CLASS TEST HISTORY) =================
  getClassTestHistory(classId) {
    const cls = this.getClassById(classId);
    if (!cls) return { classInfo: null, items: [], summary: {} };

    const students = this.getStudentsByClass(classId);
    const studentIdSet = new Set(cls.studentIds || []);

    const assignments = this.getAssignmentsByClass(classId);
    const evaluations = this.getClassEvaluations(classId);

    const historyItems = [];

    // 1. Chuyển đổi các bài kiểm tra / bài tập thành bản ghi đợt kiểm tra
    assignments.forEach(a => {
      const subs = this.getSubmissionsByAssignment(a.id).filter(s => studentIdSet.has(s.studentId));
      const gradedSubs = subs.filter(s => s.status === 'graded');
      const scores = gradedSubs.map(s => s.score);

      const targetCount = Array.isArray(a.targetStudentIds) && a.targetStudentIds.length > 0 
        ? a.targetStudentIds.filter(id => studentIdSet.has(id)).length 
        : students.length;

      const avgScore = scores.length > 0 
        ? (scores.reduce((sum, v) => sum + v, 0) / scores.length).toFixed(1) 
        : null;

      let highestScore = null;
      let highestStudents = [];
      let lowestScore = null;
      if (scores.length > 0) {
        highestScore = Math.max(...scores);
        lowestScore = Math.min(...scores);
        highestStudents = gradedSubs.filter(s => s.score === highestScore).map(s => s.studentName);
      }

      const feedbackCount = gradedSubs.filter(s => s.feedback && s.feedback.trim()).length;
      const cleanCheatCount = subs.filter(s => !s.cheatCount || s.cheatCount === 0).length;

      // Xác định thời gian cập nhật gần nhất của đợt này
      let lastUpdatedTime = a.updatedAt || a.createdAt;
      subs.forEach(s => {
        if (s.gradedAt && new Date(s.gradedAt) > new Date(lastUpdatedTime)) lastUpdatedTime = s.gradedAt;
        else if (s.submittedAt && new Date(s.submittedAt) > new Date(lastUpdatedTime)) lastUpdatedTime = s.submittedAt;
      });

      // Danh sách nội dung cập nhật
      const updatedDetails = [];
      const isQuiz = a.type === 'quiz' || a.submissionType === 'quiz';
      updatedDetails.push({
        type: 'created',
        icon: '📌',
        text: `Đã khởi tạo đề kiểm tra: "${a.title}" (Hình thức: ${isQuiz ? 'Trắc nghiệm Online' : 'Tự luận vở viết tay'})`,
        time: a.createdAt
      });

      if (a.deadline) {
        updatedDetails.push({
          type: 'deadline',
          icon: '⏰',
          text: `Hạn chót nộp bài: ${new Date(a.deadline).toLocaleString('vi-VN')}`,
          time: a.createdAt
        });
      }

      updatedDetails.push({
        type: 'submission',
        icon: '📥',
        text: `Đã thu bài: ${subs.length}/${targetCount} học sinh (${targetCount > 0 ? Math.round((subs.length / targetCount) * 100) : 0}%)`,
        time: lastUpdatedTime
      });

      if (gradedSubs.length > 0) {
        updatedDetails.push({
          type: 'grading',
          icon: '✍️',
          text: `Đã chấm điểm & phê bút đỏ: ${gradedSubs.length}/${subs.length} bài đã nộp`,
          time: lastUpdatedTime
        });

        if (avgScore !== null) {
          const highNames = highestStudents.slice(0, 2).join(', ');
          updatedDetails.push({
            type: 'score',
            icon: '📊',
            text: `Điểm trung bình đợt: ${avgScore}/10 • Cao nhất: ${highestScore}đ${highNames ? ` (${highNames})` : ''} • Thấp nhất: ${lowestScore}đ`,
            time: lastUpdatedTime
          });
        }
      }

      if (feedbackCount > 0) {
        updatedDetails.push({
          type: 'feedback',
          icon: '💬',
          text: `Đã cập nhật lời phê cá nhân hóa cho ${feedbackCount} học sinh`,
          time: lastUpdatedTime
        });
      }

      if (subs.length > 0) {
        updatedDetails.push({
          type: 'integrity',
          icon: '🛡️',
          text: `Giám sát trung thực: ${cleanCheatCount}/${subs.length} bài nộp không có vi phạm rời tab`,
          time: lastUpdatedTime
        });
      }

      let status = 'in_progress';
      let statusLabel = 'Đang làm bài';
      let statusColor = 'primary';
      if (gradedSubs.length >= targetCount && targetCount > 0) {
        status = 'completed';
        statusLabel = 'Đã hoàn tất chấm';
        statusColor = 'success';
      } else if (subs.length > 0 && gradedSubs.length < subs.length) {
        status = 'grading';
        statusLabel = `Đang chấm (${gradedSubs.length}/${subs.length})`;
        statusColor = 'warning';
      } else if (a.deadline && new Date(a.deadline) < new Date()) {
        status = 'overdue';
        statusLabel = 'Đã quá hạn nộp';
        statusColor = 'danger';
      }

      historyItems.push({
        id: a.id,
        itemType: 'test',
        category: isQuiz ? 'Trắc nghiệm Online' : 'Tự luận viết tay',
        title: a.title,
        topic: a.topic || 'Kiểm tra & Luyện tập',
        description: a.description || '',
        createdAt: a.createdAt,
        deadline: a.deadline,
        lastUpdated: lastUpdatedTime,
        author: cls.tutorName || 'Gia sư phụ trách',
        targetCount,
        submittedCount: subs.length,
        gradedCount: gradedSubs.length,
        avgScore,
        highestScore,
        lowestScore,
        highestStudents,
        status,
        statusLabel,
        statusColor,
        updatedDetails,
        rawAssignment: a,
        submissions: subs
      });
    });

    // 2. Chuyển đổi các bản đánh giá định kỳ của lớp
    evaluations.forEach(e => {
      const updatedDetails = [];
      updatedDetails.push({
        type: 'created',
        icon: '📝',
        text: `Khởi tạo bản đánh giá định kỳ: "${e.period}"`,
        time: e.createdAt || e.date
      });

      if (e.overallComment) {
        updatedDetails.push({
          type: 'overall',
          icon: '📋',
          text: `Nhận xét chung: "${e.overallComment}"`,
          time: e.updatedAt || e.createdAt
        });
      }

      if (e.strengths) {
        updatedDetails.push({
          type: 'strengths',
          icon: '🟢',
          text: `Ghi nhận ưu điểm: "${e.strengths}"`,
          time: e.updatedAt || e.createdAt
        });
      }

      if (e.weaknesses) {
        updatedDetails.push({
          type: 'weaknesses',
          icon: '🔴',
          text: `Cần củng cố: "${e.weaknesses}"`,
          time: e.updatedAt || e.createdAt
        });
      }

      if (e.actionPlan) {
        updatedDetails.push({
          type: 'actionPlan',
          icon: '🎯',
          text: `Kế hoạch tuần tới: "${e.actionPlan}"`,
          time: e.updatedAt || e.createdAt
        });
      }

      if (e.commendations) {
        updatedDetails.push({
          type: 'commendations',
          icon: '🌟',
          text: `Tuyên dương khen thưởng: "${e.commendations}"`,
          time: e.updatedAt || e.createdAt
        });
      }

      if (e.attentionNeeded) {
        updatedDetails.push({
          type: 'attention',
          icon: '⚠️',
          text: `Cần đôn đốc: "${e.attentionNeeded}"`,
          time: e.updatedAt || e.createdAt
        });
      }

      const noteCount = e.studentNotes ? Object.keys(e.studentNotes).filter(k => e.studentNotes[k] && e.studentNotes[k].trim()).length : 0;
      if (noteCount > 0) {
        updatedDetails.push({
          type: 'studentNotes',
          icon: '💬',
          text: `Đã lưu lời phê riêng cho ${noteCount}/${students.length} học sinh`,
          time: e.updatedAt || e.createdAt
        });
      }

      historyItems.push({
        id: e.id,
        itemType: 'evaluation',
        category: 'Đánh giá định kỳ toàn lớp',
        title: e.period,
        topic: 'Đánh giá định kỳ',
        description: e.overallComment || '',
        createdAt: e.createdAt || e.date,
        deadline: null,
        lastUpdated: e.updatedAt || e.createdAt || e.date,
        author: e.createdBy || cls.tutorName || 'Giáo viên phụ trách',
        targetCount: students.length,
        submittedCount: students.length,
        gradedCount: students.length,
        avgScore: null,
        highestScore: null,
        lowestScore: null,
        highestStudents: [],
        status: 'recorded',
        statusLabel: 'Bản đánh giá chính thức',
        statusColor: 'info',
        updatedDetails,
        rawEvaluation: e
      });
    });

    // Sắp xếp thứ tự thời gian mới nhất lên trước
    historyItems.sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt));

    // Thống kê tổng hợp
    const testsOnly = historyItems.filter(i => i.itemType === 'test');
    const gradedScores = testsOnly.filter(i => i.avgScore !== null).map(i => parseFloat(i.avgScore));
    const overallAvgScore = gradedScores.length > 0 
      ? (gradedScores.reduce((s, v) => s + v, 0) / gradedScores.length).toFixed(1) 
      : '—';

    let totalSubmitted = 0;
    let totalTarget = 0;
    testsOnly.forEach(t => {
      totalSubmitted += t.submittedCount;
      totalTarget += t.targetCount;
    });
    const avgCompletionRate = totalTarget > 0 ? Math.round((totalSubmitted / totalTarget) * 100) : 100;

    return {
      classInfo: cls,
      items: historyItems,
      summary: {
        totalItems: historyItems.length,
        totalTests: testsOnly.length,
        totalEvals: historyItems.filter(i => i.itemType === 'evaluation').length,
        lastUpdatedDate: historyItems.length > 0 ? historyItems[0].lastUpdated : null,
        overallAvgScore,
        avgCompletionRate
      }
    };
  },

  exportClassTestHistoryCSV(classId) {
    const history = this.getClassTestHistory(classId);
    if (!history || !history.classInfo) return;

    const rows = [
      ['STT', 'Tên Đợt Kiểm Tra / Đánh Giá', 'Phân Loại', 'Thời Gian Giao / Tạo', 'Hạn Nộp', 'Thời Gian Cập Nhật', 'Người Phụ Trách', 'Trạng Thái', 'Sĩ Số / Đã Nộp', 'Điểm TB', 'Điểm Cao Nhất', 'Nội Dung Cập Nhật & Ghi Nhận']
    ];

    history.items.forEach((item, idx) => {
      const updatesText = item.updatedDetails.map(u => `${u.icon} ${u.text}`).join(' | ');
      rows.push([
        idx + 1,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${item.category}"`,
        `"${new Date(item.createdAt).toLocaleString('vi-VN')}"`,
        `"${item.deadline ? new Date(item.deadline).toLocaleString('vi-VN') : '—'}"`,
        `"${new Date(item.lastUpdated).toLocaleString('vi-VN')}"`,
        `"${item.author}"`,
        `"${item.statusLabel}"`,
        `"${item.submittedCount}/${item.targetCount}"`,
        `"${item.avgScore !== null ? item.avgScore : '—'}"`,
        `"${item.highestScore !== null ? item.highestScore : '—'}"`,
        `"${updatesText.replace(/"/g, '""')}"`
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LichSu_KiemTra_${history.classInfo.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    if (typeof window === 'undefined' || !window.__EDUTASK_AUDIT_MODE__) {
      link.click();
    }
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`📊 Đã tải thành công file lịch sử kiểm tra lớp ${history.classInfo.name}!`, 'success');
    }
    return csvContent;
  },

  exportClassEvaluationCSV(classId) {
    const cls = this.getClassById(classId);
    if (!cls) return '';

    const gradebook = this.getClassGradebook(classId);
    const students = this.getStudentsByClass(classId);
    const evaluations = this.getClassEvaluations(classId);
    const latestEval = evaluations.length > 0 ? evaluations[0] : null;

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    const rows = [];
    rows.push([`BÁO CÁO ĐÁNH GIÁ TÌNH HÌNH HỌC TẬP TOÀN LỚP — ${cls.name.toUpperCase()}`]);
    rows.push([`Mã Lớp: ${cls.code}`, `Môn: ${cls.subject}`, `Khối: ${cls.grade}`, `Sĩ số: ${students.length} em`]);
    rows.push([`Kỳ Đánh Giá: ${latestEval ? latestEval.period : 'Mới nhất'}`, `Ngày Xuất: ${new Date().toLocaleString('vi-VN')}`]);
    if (latestEval) {
      rows.push([`Nhận Xét Chung: ${escapeCsv(latestEval.overallComment)}`]);
      rows.push([`Ưu Điểm: ${escapeCsv(latestEval.strengths)}`, `Cần Khắc Phục: ${escapeCsv(latestEval.weaknesses)}`]);
      rows.push([`Tuyên Dương: ${escapeCsv(latestEval.commendations)}`, `Cần Đôn Đốc: ${escapeCsv(latestEval.attentionNeeded)}`]);
    }
    rows.push([]);

    rows.push(['STT', 'Mã Học Sinh', 'Họ Và Tên', 'Tài Khoản', 'Trường Học', 'Điểm TB', 'Số Bài Nộp', 'Tỷ Lệ Hoàn Thành', 'Xếp Loại', 'Lời Phê Của Giáo Viên']);

    students.forEach((std, idx) => {
      const stdMatrix = gradebook ? gradebook.matrix.find(m => m.student.id === std.id) : null;
      const note = (latestEval && latestEval.studentNotes && latestEval.studentNotes[std.id]) || '';
      rows.push([
        idx + 1,
        std.id,
        escapeCsv(std.name),
        std.username || '',
        escapeCsv(std.school || ''),
        stdMatrix && stdMatrix.avgScore !== null ? stdMatrix.avgScore : '—',
        stdMatrix ? `${stdMatrix.submittedCount}/${stdMatrix.totalAsns}` : '—',
        stdMatrix ? `${stdMatrix.completionRate}%` : '—',
        stdMatrix ? stdMatrix.classification : '—',
        escapeCsv(note)
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `DanhGiaLop_${cls.code}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      if (typeof window === 'undefined' || !window.__EDUTASK_AUDIT_MODE__) {
        link.click();
      }
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch(e) {}
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`📊 Đã xuất thành công file báo cáo đánh giá lớp ${cls.name}!`, 'success');
    }
    return csvContent;
  }
};

if (typeof window !== 'undefined') {
  window.Store = Store;
}

