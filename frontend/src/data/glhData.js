
/* ---------- Classes (Role × Personality) ---------- */
  // Class accent colours live in the dark "game world" only.
  // The clean utility screens always use Garena Red for CTAs.
  export const CLASSES = {
    strategist: {
      id: "strategist",
      name: "Chiến Lược Gia",
      en: "The Strategist",
      tagline: "Nhìn xa, tính kỹ, ra quyết định.",
      description:
        "Bạn nhìn thấy bức tranh lớn trước khi người khác kịp nhận ra. Dữ liệu là vũ khí, và mỗi nước đi đều có lý do. Hành trình của bạn là biến tầm nhìn thành lộ trình.",
      roles: "Marketing · Business Dev · PM",
      color: "#7C5CFF",
      colorSoft: "#A38BFF",
      glyph: "compass",
    },
    builder: {
      id: "builder",
      name: "Người Kiến Tạo",
      en: "The Builder",
      tagline: "Dựng nên thứ chưa từng tồn tại.",
      description:
        "Bạn biến ý tưởng thành hệ thống chạy được. Tỉ mỉ, kiên nhẫn, và luôn muốn hiểu mọi thứ vận hành ra sao. Mỗi khóa học là một viên gạch trong công trình của bạn.",
      roles: "Engineering · Data · Tech",
      color: "#F2683C",
      colorSoft: "#FF9166",
      glyph: "hammer",
    },
    connector: {
      id: "connector",
      name: "Người Kết Nối",
      en: "The Connector",
      tagline: "Sức mạnh nằm ở mối quan hệ.",
      description:
        "Bạn khiến mọi người làm việc tốt hơn khi ở cạnh nhau. Đồng cảm, lắng nghe, và gắn kết là siêu năng lực của bạn. Hành trình của bạn là nâng cả đội đi lên.",
      roles: "HR · L&D · Comms · Ops",
      color: "#2BB6A3",
      colorSoft: "#5FD9C8",
      glyph: "link",
    },
    operator: {
      id: "operator",
      name: "Người Vận Hành",
      en: "The Operator",
      tagline: "Mọi thứ chạy đúng, mọi lúc.",
      description:
        "Bạn là cột sống của tổ chức — quy trình rõ ràng, đáng tin cậy, không bỏ sót chi tiết. Khi bạn ở đó, mọi người yên tâm. Hành trình của bạn là làm chủ sự ổn định.",
      roles: "Game Ops · CS · Finance",
      color: "#3B6FB0",
      colorSoft: "#6F9FD8",
      glyph: "gear",
    },
    explorer: {
      id: "explorer",
      name: "Người Khám Phá",
      en: "The Explorer",
      tagline: "Thử trước, học từ điều mới.",
      description:
        "Bạn không sợ vùng đất chưa ai đặt chân. Tò mò, thử nghiệm, và học nhanh là cách bạn tiến lên. Hành trình của bạn là mở ra những con đường chưa từng có.",
      roles: "Design · Creative · Research",
      color: "#F5A623",
      colorSoft: "#FFC65C",
      glyph: "spark",
    },
  };

  /* ---------- Personality types (from quiz) ---------- */
  export const PERSONALITIES = {
    analyst: { id: "analyst", name: "Người Phân Tích", en: "The Analyst", desc: "Bạn tin vào dữ liệu và logic. Trước khi hành động, bạn muốn hiểu tại sao." },
    collaborator: { id: "collaborator", name: "Người Đồng Hành", en: "The Collaborator", desc: "Bạn học và làm tốt nhất cùng người khác. Kết nối là cách bạn tiến bộ." },
    explorer: { id: "explorer", name: "Người Tiên Phong", en: "The Pioneer", desc: "Bạn lao vào thử nghiệm. Sai thì sửa, miễn là được khám phá điều mới." },
    achiever: { id: "achiever", name: "Người Chinh Phục", en: "The Achiever", desc: "Bạn đặt mục tiêu và đi tới cùng. Quy trình và kỷ luật là bạn đồng hành." },
  };

  /* ---------- Ranks (5-tier ladder) ----------
     XP thresholds are cumulative — reaching required_xp promotes the player. */
  export const RANKS = [
    { id: "rank_01", name: "Tân Binh", en: "Initiate", level: 1, required_xp: 0, description: "Vừa đặt chân vào hành trình. Mọi cánh cửa đang mở." },
    { id: "rank_02", name: "Học Việc", en: "Apprentice", level: 2, required_xp: 120, description: "Đã nắm nền tảng, bắt đầu chọn hướng đi của riêng mình." },
    { id: "rank_03", name: "Thành Thạo", en: "Adept", level: 3, required_xp: 320, description: "Tự tin trong chuyên môn, được đồng đội tìm đến để hỏi." },
    { id: "rank_04", name: "Chuyên Gia", en: "Specialist", level: 4, required_xp: 640, description: "Người dẫn dắt trong lĩnh vực của mình, định hình cách làm." },
    { id: "rank_05", name: "Bậc Thầy", en: "Master", level: 5, required_xp: 1080, description: "Tạo ảnh hưởng vượt ra ngoài đội nhóm. Người khác học theo bạn." },
  ];

  /* ---------- Skill constellation ----------
     Positions are in a 0–100 viewBox. Edges connect skill ids.
     A node is "completed" when the user finishes any course carrying that skill tag. */
  export const SKILLS = [
    { id: "foundations", name: "Nền Tảng Garena", tier: 1, x: 50, y: 86, courses: ["LC-001"] },
    { id: "data", name: "Tư Duy Dữ Liệu", tier: 2, x: 24, y: 64, courses: ["LC-002"] },
    { id: "communication", name: "Giao Tiếp Hiệu Quả", tier: 2, x: 50, y: 60, courses: ["LC-003"] },
    { id: "product", name: "Tư Duy Sản Phẩm", tier: 2, x: 76, y: 64, courses: ["LC-004"] },
    { id: "ai", name: "Ứng Dụng AI", tier: 3, x: 16, y: 42, courses: ["LC-005"] },
    { id: "analytics", name: "Phân Tích Nâng Cao", tier: 3, x: 36, y: 38, courses: ["LC-006"] },
    { id: "leadership", name: "Kỹ Năng Lãnh Đạo", tier: 3, x: 64, y: 38, courses: ["LC-007"] },
    { id: "facilitation", name: "Điều Phối & Đào Tạo", tier: 3, x: 84, y: 42, courses: ["LC-008"] },
    { id: "strategy", name: "Chiến Lược", tier: 4, x: 30, y: 18, courses: ["LC-009"] },
    { id: "ops_excellence", name: "Vận Hành Xuất Sắc", tier: 4, x: 50, y: 14, courses: ["LC-010"] },
    { id: "mentoring", name: "Dẫn Dắt Đội Nhóm", tier: 4, x: 70, y: 18, courses: ["LC-011"] },
  ];
  export const SKILL_EDGES = [
    ["foundations", "data"], ["foundations", "communication"], ["foundations", "product"],
    ["data", "ai"], ["data", "analytics"], ["communication", "leadership"],
    ["communication", "facilitation"], ["product", "leadership"], ["product", "facilitation"],
    ["analytics", "strategy"], ["ai", "strategy"], ["leadership", "ops_excellence"],
    ["leadership", "mentoring"], ["facilitation", "mentoring"], ["strategy", "ops_excellence"],
  ];

  /* ---------- Courses ---------- */
  export const COURSES = [
    { course_id: "LC-001", title: "Onboarding tại Garena", description: "Văn hóa, cấu trúc tổ chức và cách mọi thứ vận hành ở Garena. Bước khởi đầu cho mọi nhân viên mới.", class_ids: ["strategist","builder","connector","operator","explorer"], rank_ids:["rank_01"], skill_tags:["foundations"], format:"elearning", duration_minutes:45, xp_reward:30, trainer:"L&D Team", audience:"Toàn bộ nhân viên mới", url:"#" },
    { course_id: "LC-002", title: "Tư Duy Dữ Liệu Cho Người Mới", description: "Đọc hiểu số liệu, đặt câu hỏi đúng và tránh các bẫy diễn giải phổ biến.", class_ids:["strategist","operator"], rank_ids:["rank_01","rank_02"], skill_tags:["data"], format:"online", duration_minutes:90, xp_reward:50, trainer:"Data Team", audience:"Junior các phòng ban", url:"#" },
    { course_id: "LC-003", title: "Giao Tiếp Trong Công Việc", description: "Trình bày rõ ràng, viết súc tích và đưa phản hồi hiệu quả với đồng đội.", class_ids:["connector","explorer"], rank_ids:["rank_01","rank_02"], skill_tags:["communication"], format:"offline", duration_minutes:120, xp_reward:50, trainer:"Lan Nguyễn", audience:"Mọi cấp độ", url:"#" },
    { course_id: "LC-004", title: "Nhập Môn Tư Duy Sản Phẩm", description: "Hiểu người dùng, định nghĩa vấn đề và ưu tiên đúng việc cần làm.", class_ids:["strategist","explorer","builder"], rank_ids:["rank_02"], skill_tags:["product"], format:"online", duration_minutes:90, xp_reward:60, trainer:"Product Guild", audience:"PM, Designer, Engineer", url:"#" },
    { course_id: "LC-005", title: "AI Trong Công Việc Hằng Ngày", description: "Dùng các công cụ AI để tăng tốc công việc thực tế — không cần biết code.", class_ids:["explorer","builder","strategist"], rank_ids:["rank_02","rank_03"], skill_tags:["ai"], format:"online", duration_minutes:60, xp_reward:70, trainer:"AI Enablement", audience:"Mọi cấp độ", url:"#" },
    { course_id: "LC-006", title: "Phân Tích Dữ Liệu Nâng Cao", description: "Xây dựng phân tích đáng tin cậy, thiết kế thí nghiệm và kể chuyện bằng số liệu.", class_ids:["strategist","operator"], rank_ids:["rank_03"], skill_tags:["analytics"], format:"offline", duration_minutes:180, xp_reward:90, trainer:"Data Team", audience:"Senior phân tích", url:"#" },
    { course_id: "LC-007", title: "Nền Tảng Lãnh Đạo", description: "Chuyển từ làm việc cá nhân sang dẫn dắt người khác. Tin tưởng, ủy quyền và phản hồi.", class_ids:["connector","operator","strategist"], rank_ids:["rank_03","rank_04"], skill_tags:["leadership"], format:"offline", duration_minutes:240, xp_reward:100, trainer:"Leadership Academy", audience:"Lead tiềm năng", url:"#" },
    { course_id: "LC-008", title: "Kỹ Năng Điều Phối & Đào Tạo", description: "Thiết kế và dẫn dắt buổi workshop khiến người tham gia thực sự học được.", class_ids:["connector","explorer"], rank_ids:["rank_03"], skill_tags:["facilitation"], format:"offline", duration_minutes:180, xp_reward:80, trainer:"L&D Team", audience:"Trainer nội bộ", url:"#" },
    { course_id: "LC-009", title: "Chiến Lược & Ra Quyết Định", description: "Khung tư duy chiến lược, đánh đổi và cách bảo vệ một quyết định bằng lập luận.", class_ids:["strategist"], rank_ids:["rank_04"], skill_tags:["strategy"], format:"offline", duration_minutes:240, xp_reward:110, trainer:"BD Leadership", audience:"Manager", url:"#" },
    { course_id: "LC-010", title: "Vận Hành Xuất Sắc", description: "Thiết kế quy trình bền vững, đo lường và cải tiến liên tục ở quy mô lớn.", class_ids:["operator"], rank_ids:["rank_04"], skill_tags:["ops_excellence"], format:"online", duration_minutes:150, xp_reward:100, trainer:"Game Ops", audience:"Ops Lead", url:"#" },
    { course_id: "LC-011", title: "Dẫn Dắt Đội Nhóm Hiệu Suất Cao", description: "Xây dựng đội nhóm gắn kết, phát triển con người và giữ chân nhân tài.", class_ids:["connector","operator","strategist"], rank_ids:["rank_04","rank_05"], skill_tags:["mentoring"], format:"offline", duration_minutes:240, xp_reward:120, trainer:"Leadership Academy", audience:"Manager, Lead", url:"#" },
    { course_id: "LC-012", title: "Esports & Hệ Sinh Thái Garena", description: "Toàn cảnh mảng esports, giải đấu và cách các tựa game kết nối cộng đồng.", class_ids:["explorer","strategist","connector"], rank_ids:["rank_02","rank_03"], skill_tags:["product"], format:"elearning", duration_minutes:50, xp_reward:40, trainer:"Esports Team", audience:"Mọi cấp độ", url:"#" },
  ];

  /* ---------- Calendar events ---------- */
  export const CALENDAR = [
    { event_id:"EV-001", title:"Onboarding Day — Tháng 6",        type:"workshop", skill_tags:["foundations"],          class_ids:["strategist","builder","operator","connector","explorer"], start_date:"2026-06-09", time:"09:00–12:00", location:"Tầng 12, Garena VN HQ",    host:"L&D Team",          audience:"Nhân viên mới",    url:"#" },
    { event_id:"EV-002", title:"AI Trong Công Việc — Live Session",type:"webinar",  skill_tags:["ai"],                   class_ids:["strategist","builder","operator","connector","explorer"], start_date:"2026-06-16", time:"14:00–15:30", location:"Google Meet",            host:"AI Enablement",     audience:"Mọi cấp độ",      url:"#" },
    { event_id:"EV-003", title:"Workshop Giao Tiếp Hiệu Quả",      type:"workshop", skill_tags:["communication"],        class_ids:["strategist","builder","operator","connector","explorer"], start_date:"2026-06-23", time:"09:30–12:00", location:"Phòng Saigon, Tầng 10", host:"Lan Nguyễn",        audience:"Junior",           url:"#" },
    { event_id:"EV-004", title:"Data Storytelling Bootcamp",        type:"bootcamp", skill_tags:["analytics","data"],    class_ids:["builder"],                                               start_date:"2026-07-07", time:"09:00–16:00", location:"Tầng 12, Garena VN HQ",    host:"Data Team",         audience:"Senior phân tích", url:"#" },
    { event_id:"EV-005", title:"Nền Tảng Lãnh Đạo — Module 1",    type:"workshop", skill_tags:["leadership"],           class_ids:["strategist","operator","connector"],                     start_date:"2026-07-14", time:"13:30–17:00", location:"Phòng Hanoi, Tầng 11",  host:"Leadership Academy", audience:"Lead tiềm năng",  url:"#" },
    { event_id:"EV-006", title:"Product Thinking Clinic",           type:"webinar",  skill_tags:["product"],             class_ids:["strategist","explorer"],                                 start_date:"2026-07-21", time:"15:00–16:30", location:"Google Meet",            host:"Product Guild",     audience:"PM, Designer",     url:"#" },
    { event_id:"EV-007", title:"Esports Insider Talk",              type:"talk",     skill_tags:["foundations"],          class_ids:["strategist","builder","operator","connector","explorer"], start_date:"2026-08-04", time:"16:00–17:00", location:"Auditorium, Tầng 1",    host:"Esports Team",      audience:"Mọi cấp độ",      url:"#" },
    { event_id:"EV-008", title:"Vận Hành Xuất Sắc — Hội Thảo",    type:"workshop", skill_tags:["ops_excellence"],       class_ids:["operator"],                                              start_date:"2026-08-18", time:"09:00–12:00", location:"Phòng Saigon, Tầng 10", host:"Game Ops",           audience:"Ops Lead",         url:"#" },
    { event_id:"EV-009", title:"Chiến Lược & Ra Quyết Định",       type:"workshop", skill_tags:["strategy"],             class_ids:["strategist","operator","connector"],                     start_date:"2026-09-08", time:"09:00–16:00", location:"Tầng 12, Garena VN HQ",    host:"BD Leadership",     audience:"Manager",          url:"#" },
    { event_id:"EV-010", title:"Facilitation Skills Lab",           type:"workshop", skill_tags:["facilitation"],        class_ids:["connector"],                                             start_date:"2026-09-22", time:"13:30–17:00", location:"Phòng Hanoi, Tầng 11",  host:"L&D Team",          audience:"Trainer nội bộ",  url:"#" },
  ];

  /* ---------- Placement quiz — 3 bước (Role, Rank, Mục tiêu) ---------- */
  export const QUIZ = [
    {
      id:"q1", group:"Vai trò", icon:"building",
      text:"Bạn đang làm việc ở bộ phận nào?",
      options:[
        { label:"Marketing / Esports / Brand", cls:"strategist", pers:"explorer" },
        { label:"Engineering / Data / Tech", cls:"builder", pers:"analyst" },
        { label:"Operations / Finance / Legal", cls:"operator", pers:"achiever" },
        { label:"HR / L&D / People", cls:"connector", pers:"collaborator" },
      ],
    },
    {
      id:"q2", group:"Cấp bậc", icon:"chart",
      text:"Bạn đang ở cấp bậc nào trong công ty?",
      options:[
        { label:"Fresher / dưới 1 năm", rank:1, pers:"explorer" },
        { label:"Junior (1–3 năm)", rank:2, pers:"achiever" },
        { label:"Senior (3–6 năm)", rank:3, pers:"analyst" },
        { label:"Lead / Manager (6+ năm)", rank:4, pers:"collaborator" },
      ],
    },
    {
      id:"q3", group:"Mục tiêu", icon:"target",
      text:"Trong 1 năm tới, điều bạn muốn phát triển nhất là gì?",
      options:[
        { label:"Giỏi hơn trong chuyên môn hiện tại", cls:"builder", pers:"achiever" },
        { label:"Mở rộng sang kỹ năng mới", cls:"explorer", pers:"explorer" },
        { label:"Hiểu rõ hơn toàn bộ business", cls:"strategist", pers:"analyst" },
        { label:"Phát triển kỹ năng lãnh đạo", cls:"connector", pers:"collaborator" },
      ],
    },
  ];

  /* ---------- XP rules ---------- */
  export const XP = {
    quiz_complete: 50,
    course_complete_default: 20,
    event_register: 10,
  };

  /* ---------- Character creation options ---------- */
  export const CHAR_OPTIONS = {
    hair: [
      { id: "short", name: "Tóc ngắn" },
      { id: "ponytail", name: "Tóc buộc" },
      { id: "spiky", name: "Tóc dựng" },
      { id: "bun", name: "Tóc búi" },
      { id: "cap", name: "Đội mũ" },
    ],
    outfit: [
      { id: "red", name: "Đỏ", color: "#E41E26" },
      { id: "indigo", name: "Chàm", color: "#7C5CFF" },
      { id: "teal", name: "Ngọc", color: "#2BB6A3" },
      { id: "navy", name: "Xanh", color: "#3B6FB0" },
      { id: "amber", name: "Hổ phách", color: "#F5A623" },
    ],
    accessory: [
      { id: "none", name: "Không" },
      { id: "glasses", name: "Kính" },
      { id: "headset", name: "Tai nghe" },
      { id: "visor", name: "Kính bảo hộ" },
    ],
    skin: [
      { id: "s1", name: "Da 1", color: "#F2C9A0" },
      { id: "s2", name: "Da 2", color: "#E0A878" },
      { id: "s3", name: "Da 3", color: "#B97A4E" },
    ],
  };

  /* ---------- Skill metadata — color by competency domain ---------- */
  export const SKILL_META = {
    foundations:    { color: "#8A93A8", label: "Nền tảng" },
    data:           { color: "#2E546D", label: "Dữ liệu" },
    analytics:      { color: "#2E546D", label: "Phân tích" },
    communication:  { color: "#2BB6A3", label: "Giao tiếp" },
    facilitation:   { color: "#2BB6A3", label: "Đào tạo" },
    product:        { color: "#7C5CFF", label: "Sản phẩm" },
    strategy:       { color: "#7C5CFF", label: "Chiến lược" },
    ai:             { color: "#F5A623", label: "AI" },
    leadership:     { color: "#E41E26", label: "Lãnh đạo" },
    mentoring:      { color: "#E41E26", label: "Dẫn dắt" },
    ops_excellence: { color: "#3B6FB0", label: "Vận hành" },
  };

  /* ---------- Course extended metadata (rating, testimonial, location) ---------- */
  export const COURSE_META = {
    "LC-001": { rating: 4.7, location: "Tự học — LMS Portal",
      testimonial: { quote: "Giúp tôi hiểu Garena nhanh hơn 3 tháng tự tìm hiểu.", author: "Minh T.", role: "Marketing Executive" } },
    "LC-002": { rating: 4.5, location: "Zoom / Google Meet",
      testimonial: { quote: "Cách đặt câu hỏi với số liệu thay đổi hoàn toàn cách tôi làm báo cáo.", author: "Linh N.", role: "Business Analyst" } },
    "LC-003": { rating: 4.8, location: "Phòng Saigon, Tầng 10",
      testimonial: { quote: "Workshop thực chiến, feedback thẳng — tôi tiến bộ thấy rõ.", author: "Hà P.", role: "HR Executive" } },
    "LC-004": { rating: 4.4, location: "Zoom / Google Meet",
      testimonial: { quote: "Framework ưu tiên hóa thực sự hữu ích trong sprint planning hằng tuần.", author: "Tuấn L.", role: "Product Manager" } },
    "LC-005": { rating: 4.6, location: "Zoom / Google Meet",
      testimonial: { quote: "Từ không biết gì → dùng AI hằng ngày chỉ sau 1 buổi học.", author: "Thu H.", role: "Content Specialist" } },
    "LC-006": { rating: 4.3, location: "Tầng 12, Garena HQ",
      testimonial: { quote: "Level up tư duy phân tích, không chỉ đơn giản là biết dùng Excel.", author: "Duy K.", role: "Data Analyst" } },
    "LC-007": { rating: 4.9, location: "Phòng Hanoi, Tầng 11",
      testimonial: { quote: "Thay đổi hoàn toàn cách tôi làm việc với đội nhóm. Khuyến khích mạnh.", author: "Lan A.", role: "Team Lead" } },
    "LC-008": { rating: 4.7, location: "Phòng Saigon, Tầng 10",
      testimonial: { quote: "Tự dẫn workshop lần đầu ngay sau khóa học — thành công ngoài kỳ vọng.", author: "Nam V.", role: "Internal Trainer" } },
    "LC-009": { rating: 4.5, location: "Tầng 12, Garena HQ",
      testimonial: { quote: "Học cách bảo vệ quyết định bằng lập luận rõ ràng, không chỉ cảm tính.", author: "Phong D.", role: "BD Manager" } },
    "LC-010": { rating: 4.4, location: "Zoom / Google Meet",
      testimonial: { quote: "Quy trình mới sau khóa học giúp team tiết kiệm ~2 giờ mỗi tuần.", author: "Trang B.", role: "Ops Lead" } },
    "LC-011": { rating: 4.8, location: "Phòng Hanoi, Tầng 11",
      testimonial: { quote: "Thực sự thay đổi cách tôi retain và phát triển người trong team.", author: "Khánh M.", role: "People Manager" } },
    "LC-012": { rating: 4.6, location: "Tự học — LMS Portal",
      testimonial: { quote: "Hiểu ecosystem game rộng hơn nhiều, kết nối được các mảng trước giờ tôi không biết.", author: "Bảo T.", role: "Esports Coordinator" } },
  };

  export const GLH_DATA = {
    CLASSES, PERSONALITIES, RANKS, SKILLS, SKILL_EDGES,
    COURSES, CALENDAR, QUIZ, XP, CHAR_OPTIONS,
    SKILL_META, COURSE_META,
  };

  // Fetch live data from backend and overlay on static fallback
  (async function loadLiveData() {
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        fetch("/api/courses?limit=100", { credentials: "include" }),
        fetch("/api/sessions", { credentials: "include" }),
      ]);

      if (coursesRes.ok) {
        const { courses } = await coursesRes.json();
        if (courses && courses.length) {
          GLH_DATA.COURSES = courses.map((c) => ({
            course_id: c.id,
            title: c.title,
            description: c.description || "",
            class_ids: c.role_targets && c.role_targets.length ? c.role_targets.map((r) => r.toLowerCase()) : ["strategist", "builder", "connector", "operator", "explorer"],
            rank_ids: c.rank_targets && c.rank_targets.length ? c.rank_targets.map((r) => r.toLowerCase()) : ["rank_01"],
            skill_tags: c.skill_tags || [],
            format: c.format || "online",
            duration_minutes: c.duration_hours != null ? Math.round(Number(c.duration_hours) * 60) : (c.duration_minutes || 60),
            xp_reward: c.xp_reward || 30,
            trainer: c.trainer || "",
            audience: c.audience || "Mọi cấp độ",
            url: c.registration_url || "#",
            rating: c.rating || null,
            _id: c.id,
          }));
        }
      }

      if (sessionsRes.ok) {
        const { sessions } = await sessionsRes.json();
        if (sessions && sessions.length) {
          GLH_DATA.CALENDAR = sessions.map((s) => ({
            event_id: s.id,
            title: s.title,
            type: s.type || "workshop",
            skill_tags: s.skill_tags || [],
            start_date: s.session_date ? s.session_date.split("T")[0] : "",
            time: s.session_time || "",
            location: s.location || "",
            host: s.trainer || "",
            audience: s.audience || "Mọi cấp độ",
            url: s.registration_url || "#",
            _id: s.id,
          }));
        }
      }
    } catch (e) {
      // silently fall back to static data
    }
  })();