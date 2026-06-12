// ─── Knowledge Transfer Guide — Structured Data ───
// Extracted from the ISB PGP Co'28 KT Booklet (34 pages, April 2026)

export interface KTContactBlock {
  type: "contact";
  label: string;
  value: string;
  action?: "call" | "email";
}

export interface KTCalloutBlock {
  type: "callout";
  text: string;
  variant: "tip" | "warning" | "info";
}

export interface KTParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface KTListBlock {
  type: "list";
  items: string[];
  ordered?: boolean;
}

export interface KTTableBlock {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface KTHeadingBlock {
  type: "heading";
  text: string;
}

export type KTContentBlock =
  | KTParagraphBlock
  | KTListBlock
  | KTTableBlock
  | KTCalloutBlock
  | KTContactBlock
  | KTHeadingBlock;

export interface KTSubsection {
  id: string;
  title: string;
  content: KTContentBlock[];
}

export interface KTSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  emoji: string;
  subsections: KTSubsection[];
}

// ─── Section 1: Academics ───

const ACADEMICS: KTSection = {
  id: "academics",
  title: "Academics",
  icon: "GraduationCap",
  color: "text-blue-600",
  emoji: "📚",
  subsections: [
    {
      id: "acad-overview",
      title: "Programme Overview",
      content: [
        {
          type: "paragraph",
          text: "The ISB Post Graduate Programme (PGP) is a fast-paced, full-time, one-year residential management programme. Students will complete 33 credits through a mix of core courses, flexi courses, and electives (including block weeks) across multiple terms.",
        },
      ],
    },
    {
      id: "acad-core",
      title: "1.1 Core Courses",
      content: [
        {
          type: "paragraph",
          text: "The core courses form the foundation of business education at ISB and are spread across four terms. These are mandatory for all students and build grounding across key management disciplines. All core courses require working in study groups. For core courses, the study group (OGSG) is allocated by ISB.",
        },
        { type: "heading", text: "Tentative Core Courses" },
        {
          type: "list",
          items: [
            "Financial Accounting in Decision Making",
            "Managerial Economics",
            "Statistical Methods for Business Decision Making",
            "Foundations of Finance: Opportunity Cost, Risk and Valuation",
            "Marketing Management",
            "Operations Management",
            "Strategy",
            "Leading Self and Teams",
            "Sustainability and Ethics",
            "Written Analysis and Communication (0.6 credit)",
            "Mastering Verbal Communication (0.4 credit)",
          ],
        },
      ],
    },
    {
      id: "acad-flexi",
      title: "1.2 Flexi Core Courses",
      content: [
        {
          type: "paragraph",
          text: "Flexi Core courses are offered in Terms 2 and 3 in addition to the two mandatory core courses in each term. These courses allow students to tailor their academic experience based on their interests and career goals. Students select Flexi Core courses through the Registro portal. There is no bidding points involved in this process.",
        },
        {
          type: "paragraph",
          text: "Course outlines are made available on Atrium prior to the selection round, and the number of sections offered for each course depends on student demand. Faculty allocation is completed after the selection process. Flexi Core courses do not count toward concentrations or industry specialisations, although some may serve as prerequisites for electives.",
        },
        {
          type: "paragraph",
          text: "In both Term 2 and Term 3, students are required to select a minimum of two and a maximum of three Flexi Core courses. Each course carries one credit.",
        },
        { type: "heading", text: "Term 2 — External Environment" },
        {
          type: "list",
          items: [
            "Business, Society and Non-Market Strategies",
            "Frontier Technologies",
            "Navigating Macro-economic Uncertainty",
          ],
        },
        { type: "heading", text: "Term 3 — Decisions" },
        {
          type: "list",
          items: [
            "Business Analytics for Accounting",
            "Business Analytics for Finance",
            "Business Analytics for Marketing and Growth",
            "Business Analytics for Technology Management",
            "Business Analytics for Strategy",
            "Managerial Accounting in Decision Making",
            "Prescriptive Analytics for Business Decision Making",
            "The Art and Science of Managerial Decision-Making",
          ],
        },
        {
          type: "callout",
          text: "Students may select only one course from the Business Analytics offerings.",
          variant: "warning",
        },
        { type: "heading", text: "Conversion to Electives" },
        {
          type: "paragraph",
          text: "If you select three Flexi Core courses in a term, one must be converted into an Elective via the Registro portal. The converted course will count toward elective credits for graduation. No bidding points are required or deducted for this conversion.",
        },
        { type: "heading", text: "Pass/Fail Option" },
        {
          type: "paragraph",
          text: "For certain electives, ISB gives you the option to take the course on a Pass/Fail basis — meaning your result will simply show as \"Pass\" or \"Fail\" on your transcript, without affecting your GPA. It can be to Pass/Fail only after they have first been converted to Electives. Faculty approval is required, a limited proportion of students may opt in, and Pass/Fail courses do not count toward graduation credit or CGPA.",
        },
      ],
    },
    {
      id: "acad-electives",
      title: "1.3 Electives",
      content: [
        {
          type: "paragraph",
          text: "After completing the core courses, students can select electives by bidding using their bidding points from Term 4 onwards across different specialisations:",
        },
        {
          type: "list",
          items: [
            "Finance",
            "Marketing",
            "Strategy & Leadership",
            "Operations & Supply Chain",
            "Information Technology",
          ],
        },
        {
          type: "callout",
          text: "Declaring a Major is not a mandatory requirement.",
          variant: "info",
        },
      ],
    },
    {
      id: "acad-bidding",
      title: "1.4 Bidding for Electives",
      content: [
        {
          type: "paragraph",
          text: "Electives are allocated through a bidding process. Here is what you need to know upfront:",
        },
        {
          type: "list",
          items: [
            "Each student receives 4,500 bidding points for the entire year",
            "It is a closed/blind bidding system — you cannot see what your peers are bidding, and the number of available seats per course is not disclosed",
            "Points should be allocated strategically based on your priorities",
          ],
        },
        { type: "heading", text: "Bidding Rounds" },
        {
          type: "list",
          ordered: true,
          items: [
            "Round 1 (Main Bidding Round) — Students place real bids using their allocated bidding points",
            "Round 2 (Pre-Sample Drop) — Students can drop any courses won in Round 1",
            "Round 3 (Post-Sample Drop) — Students can drop courses after sampling",
            "Round 4 (Post-Sample Add) — Students can add courses after sampling",
            "Round 5 (Final Drop) — Final opportunity to drop courses",
          ],
        },
        {
          type: "callout",
          text: "Strategy tip: Before bidding opens, initiate open conversations within your cohort — use WhatsApp polls, group discussions, or informal surveys to gauge interest in electives. In a blind system, transparency with your peers is your biggest edge.",
          variant: "tip",
        },
      ],
    },
    {
      id: "acad-grading",
      title: "1.5 Grading System",
      content: [
        {
          type: "paragraph",
          text: "ISB follows a relative grading system, ensuring fairness and academic rigor. Students are graded on a CGPA scale (0–4), with professors awarding grades based on student performance in assignments, exams, and class participation.",
        },
      ],
    },
    {
      id: "acad-attendance",
      title: "1.6 Attendance Policy",
      content: [
        {
          type: "paragraph",
          text: "Attendance is mandatory and directly impacts your grades. ISB considers classroom participation a core part of learning.",
        },
        {
          type: "table",
          headers: ["Sessions Missed", "Consequence"],
          rows: [
            ["1 session", "1 grade lower than awarded"],
            ["2 sessions", "2 grades lower than awarded"],
            ["3 or more", "Automatic F / Fail"],
          ],
        },
        { type: "heading", text: "Valid Reasons for Absence" },
        {
          type: "list",
          items: [
            "Medical emergencies",
            "Family bereavement",
            "Hardship / trauma",
            "Approved case competitions",
            "Professional certification exams (CA, CFA, CMA, etc.)",
            "National / international sports tournaments",
          ],
        },
        { type: "heading", text: "Not Valid" },
        {
          type: "list",
          items: [
            "Job interviews, travel, personal celebrations, or any voluntary activity",
          ],
        },
        { type: "heading", text: "How to Apply for an Excuse" },
        {
          type: "list",
          items: [
            "Unplanned absence: Submit the Attendance Excuse Form within 72 hours of missing class",
            "Planned absence: Submit at least 7 working days in advance (for competitions, professional exams, sports)",
          ],
        },
        {
          type: "callout",
          text: "Approved absence covers only class attendance — not assignments, class participation scores, or exams. Submission does not guarantee approval. Faculty can set their own stricter or more relaxed attendance rules — always check the course outline.",
          variant: "warning",
        },
      ],
    },
    {
      id: "acad-specialisation",
      title: "1.7 Specialisation & Concentration",
      content: [
        {
          type: "paragraph",
          text: "Concentration: A functional/management focus area you declare to deepen expertise in a specific business discipline (e.g., Finance, Marketing). Reflected on transcript.",
        },
        {
          type: "paragraph",
          text: "Industry Specialisation: A sector-focused track signalling deep knowledge in a particular industry vertical (e.g., Healthcare, Manufacturing). Also reflected on transcript.",
        },
        {
          type: "callout",
          text: "You can opt for a maximum of 2 concentrations and 1 industry specialisation, but it is not mandatory.",
          variant: "info",
        },
        { type: "heading", text: "Concentration Areas" },
        {
          type: "list",
          items: [
            "Entrepreneurship",
            "Finance",
            "Information & Tech Management",
            "Marketing",
            "Operations Management",
            "Strategy & Leadership",
          ],
        },
        { type: "heading", text: "Industry Specialisations" },
        {
          type: "list",
          items: [
            "Healthcare",
            "Infrastructure",
            "Manufacturing",
            "Public Policy",
          ],
        },
        {
          type: "paragraph",
          text: "Requirements for Concentration: Complete 6 credit units from designated elective courses. Of those, certain mandatory electives specific to the concentration must be completed. Finalise concentrations during Term 7 for transcript inclusion.",
        },
        {
          type: "paragraph",
          text: "Requirements for Industry Specialisation: Complete 6 credits from designated courses. Double-count up to 3 credits between specialisation and concentration. Finalise during Term 7.",
        },
      ],
    },
    {
      id: "acad-blockweeks",
      title: "1.8 Block Weeks",
      content: [
        {
          type: "paragraph",
          text: "Block Week at ISB is a one-week intensive academic module where a full elective course is completed within a single week. Unlike regular terms where multiple courses run in parallel, Block Week is designed for deep immersion into one subject at a time.",
        },
        { type: "heading", text: "Typical Block Week Structure" },
        {
          type: "list",
          items: [
            "Monday to Wednesday — Full-day classes",
            "Thursday — Break / No class",
            "Friday and Saturday — Classes continue",
            "Sunday (if applicable) — Exams or final evaluations",
          ],
        },
        { type: "heading", text: "What to Expect" },
        {
          type: "list",
          items: [
            "Two sessions per day focused on a single subject",
            "Study Treks — visits to companies, startups, and ecosystems with live interactions and field exposure",
            "Many courses taught by industry experts, visiting faculty, or practitioners",
            "Daily debrief sessions and logbooks/reflections submitted every day",
            "Multi-dimensional evaluation: logbooks, social media reflections (e.g., LinkedIn), group videos, presentations, and final write-ups",
            "Interaction with startups, VCs, incubators, and corporates",
          ],
        },
        {
          type: "callout",
          text: "Block Weeks are credit-bearing electives that help fulfil the minimum graduation credit requirement (33 credits).",
          variant: "info",
        },
      ],
    },
    {
      id: "acad-exchange",
      title: "1.9 International Exchange Programme",
      content: [
        {
          type: "paragraph",
          text: "The International Exchange Programme allows students to spend a term at a partner business school abroad. Students are not charged additional tuition fees but must bear their own travel and living expenses (approximately INR 3–6 lakhs).",
        },
        { type: "heading", text: "Key Parameters" },
        {
          type: "list",
          items: [
            "Preference Round: Select 3–10 schools (mandatory to participate in Bidding Round)",
            "Bidding Round: Bid for 1–3 schools; total bid points range from 400 to 1,200",
            "Allocation rule: Highest bid wins; tie-breaker is system-generated",
            "Clearing price rule: All winners charged the lowest successful bid for that school",
            "Vacant Seat Round: First-come-first-serve with fixed 400 points",
          ],
        },
        {
          type: "paragraph",
          text: "Eligibility: Students may be disqualified for receiving an F grade, academic probation, or Honour Code violations. Bid points are returned without penalty upon disqualification.",
        },
        {
          type: "paragraph",
          text: "Sample partner schools include Wharton, London Business School, HEC Paris, Bocconi, NUS, and HKUST, among others.",
        },
        {
          type: "contact",
          label: "Exchange Queries",
          value: "ASA_InternationalExchange@isb.edu",
          action: "email",
        },
      ],
    },
    {
      id: "acad-elp",
      title: "1.10 Experiential Learning Programme (ELP)",
      content: [
        {
          type: "paragraph",
          text: "The ELP is a live consulting engagement undertaken by ISB students as part of the curriculum. A team of 4–5 students works with a client to develop implementable solutions to real business problems. It is a 1-credit mandatory course administered by the Office of Experiential Learning (The LAB).",
        },
        { type: "heading", text: "Tentative ELP Timeline" },
        {
          type: "list",
          items: [
            "Project Charter / Scoping: August 2025",
            "Mid-Term Progress Assessment: October 2025",
            "Final Presentation: December / January 2026",
            "Final Assessment Report: January 2026",
            "Peer Evaluation: January 2026",
            "Immersion Report: Within one week after immersion",
          ],
        },
      ],
    },
    {
      id: "acad-lrc",
      title: "1.11 Learning Research Centre (LRC)",
      content: [
        {
          type: "paragraph",
          text: "The LRC (also called the Bajaj Auto Library) is ISB's central knowledge hub — one of the most well-resourced business school libraries in India.",
        },
        {
          type: "table",
          headers: ["Resource Type", "Volume"],
          rows: [
            ["Printed Books", "60,000+"],
            ["E-Books", "2,500+"],
            ["Printed Journals", "50+"],
            ["E-Journals", "2,000+"],
            ["Audio-Visual Resources", "6,800+"],
            ["Databases", "80+"],
          ],
        },
        { type: "heading", text: "Key Resources" },
        {
          type: "list",
          items: [
            "Databases: Statista, Factiva, Bloomberg, Capital IQ, EBSCO, JSTOR, Scopus, Compustat, Prowess, MarketLine",
            "Journals: 2,000+ e-journals and 176 print journals covering business, management, and social sciences",
            "AV Resources: Educational content from Stanford, Harvard; Henry Stewart Talks for on-demand lectures",
            "Global InfoWatch: Curated updates on industry trends, market research, recruiter profiles, and course guides",
            "Off-campus access via RemoteXs at isblrc.remotexs.in using your ISB credentials",
          ],
        },
        {
          type: "paragraph",
          text: "Access Hours: Mon–Sun, 8:00 AM – 2:00 AM (till 4:00 AM during exam days). LRC is located on the 2nd to 5th floors above the atrium at the Hyderabad campus.",
        },
        {
          type: "contact",
          label: "LRC",
          value: "lrc_hyd@isb.edu",
          action: "email",
        },
        {
          type: "callout",
          text: "You can email the LRC team for specific research papers or articles needed for assignments, case competitions, or personal research. They typically share relevant materials within a day.",
          variant: "tip",
        },
      ],
    },
    {
      id: "acad-atrium",
      title: "1.12 Atrium — The ISB Intranet",
      content: [
        {
          type: "paragraph",
          text: "Atrium is ISB's internal intranet portal. Access it via the ISB campus network or VPN. All PGP resources are under the ASA-PGP section for your batch year.",
        },
        {
          type: "table",
          headers: ["Section", "Sub-sections"],
          rows: [
            [
              "Student Manual",
              "Fees, Policies, Honour Code, Graduation, Awards, Counselling, Facilities, Preterm Course",
            ],
            ["CAS", "Recent Placement Statistics, Companies Posted Jobs"],
            [
              "Students Affairs",
              "Exchange, GSA, Competitions, Shadow-a-CEO, SFA, Awards, Young Leaders, Photo Gallery",
            ],
            ["Knowledge Management", "Faculty research and working papers"],
            ["Archives", "Past academic year records (2003-04 onwards)"],
            ["Contact Us", "Directory of all ISB teams"],
            ["Site Contents", "Full index of all pages on Atrium"],
          ],
        },
        {
          type: "callout",
          text: "When in doubt, start with the Left Sidebar — it has everything.",
          variant: "tip",
        },
      ],
    },
  ],
};

// ─── Section 2: Student Life ───

const STUDENT_LIFE: KTSection = {
  id: "student-life",
  title: "Student Life",
  icon: "Users",
  color: "text-purple-600",
  emoji: "🎓",
  subsections: [
    {
      id: "sl-depts",
      title: "2.1 Key Official Departments",
      content: [
        {
          type: "list",
          ordered: true,
          items: [
            "CAS (Career Advancement Services) — Supports students on their career readiness and invites organisations across India and the world to explore talent at ISB.",
            "ASA (Academic Support & Administration) — Manages academic policies, course bidding, and student-faculty interactions.",
            "Operations — Handles campus facilities, logistics, scheduling, and ensures smooth day-to-day functioning across ISB.",
            "Alum Affairs Office — Strengthens alumni relations, organises reunions, and facilitates networking between alumni and current students.",
            "Admissions & Financial Aid Office — Manages student admissions and financial aid / support services.",
            "LRC (Library & Research Centre) — Provides access to academic journals, business cases, and databases like Bloomberg, Capital IQ, and EBSCO.",
          ],
        },
      ],
    },
    {
      id: "sl-gsb",
      title: "2.2 GSB — Graduate Student Board",
      content: [
        {
          type: "paragraph",
          text: "The GSB Core is the highest student-led body, responsible for your year here at ISB. It is the nerve centre of student governance — the team that keeps everything ticking. From coordinating with ISB leadership to ensuring clubs have what they need to thrive, the GSB Core is where the buck stops for student life on campus.",
        },
      ],
    },
    {
      id: "sl-councils",
      title: "2.3 Student Committees — Councils",
      content: [
        {
          type: "list",
          ordered: true,
          items: [
            "Academic Affairs Council — The bridge between students and the academic world. They work closely with professors on curriculum feedback, facilitate the bidding process, facilitate peer-to-peer learning sessions, and champion holistic academic goals for the batch.",
            "Alum Affairs Council — Your connection to the wider ISB family. This council nurtures relationships with alumni through curated events and drives the flagship alumni celebration, Solstice.",
            "Career Advancement Council — From polishing your CV and reaching out to potential recruiters to organising company pre-placement talks and facilitating the placement process, this council is your career's best ally.",
            "Finance & Governance Council — The quiet backbone of campus operations. They manage budgets, allocate resources across councils and clubs, and ensure everything runs with financial discipline and transparency.",
            "Marketing & Communications Council — ISB's storytellers. They keep campus life buzzing through channels like Inside the Atrium (ISB's Instagram presence), craft external blogs, and make sure every event gets the spotlight it deserves.",
            "Operations & Sustainability Council — Making sure your day-to-day life at ISB is comfortable, clean, and well-run. From campus amenities to housekeeping to sustainability initiatives, they handle the things that matter most when you live and learn on campus.",
            "Student Life Council — The party planners you didn't know you needed. This council brings the fun — organising festivals, themed events, Diwali, Holi, Christmas celebrations, and everything in between that makes ISB feel like home.",
          ],
        },
      ],
    },
    {
      id: "sl-prof-clubs",
      title: "2.4 Professional Clubs",
      content: [
        {
          type: "list",
          ordered: true,
          items: [
            "Business Analytics Club — Your go-to community for all things data. Whether you're brushing up on Excel, diving into SQL, or mastering Tableau, this club blends analytics fundamentals with hands-on learning.",
            "Business Technology Club (BTC) — Built for the curious and the tech-forward. Whether you're heading into product management or just fascinated by how technology shapes business, BTC delivers speaker sessions, competitions, and resources on PM skills, AI, product strategy, and design thinking.",
            "Consulting Club — The hub for aspiring consultants and strategy enthusiasts. Through case resources, meetups, and industry connections, the Consulting Club helps you crack the code on consulting and allied careers.",
            "Entrepreneurship & Venture Capital Club (EVC) — Where founders meet funders. EVC connects you with the right people, sparks the right conversations, and builds a community where big ideas find their footing.",
            "Finance Club — From investment banking to corporate finance and treasury, the Finance Club is where financial ambitions come to life. Expect financial modelling workshops and industry deep-dives.",
            "Marketing Club — For everyone from FMCG marketers to product marketers and beyond. The Marketing Club sharpens your instincts through competitions, skill-building sessions, and industry exposure.",
            "Net Impact Club — For those who believe business can be a force for good. Net Impact brings together sustainability-minded students at the intersection of impact and industry.",
            "Operations Management Club — The community for students headed into operations and supply chain roles. Resources, discussions, and connections that help you navigate one of business's most essential functions.",
            "Public Speaking Club — Your stage to find your voice. Whether you're looking to ace that boardroom presentation or just get more comfortable in front of a crowd.",
            "Senior Executive Club (SEC) — An exclusive community for students with professional experience of 8 years or more. Rich conversations, senior perspectives, and a network that reflects your journey.",
            "Women in Business Club (WIB) — A powerful platform for women across industries and backgrounds. WIB champions confidence, community, and career success.",
          ],
        },
      ],
    },
    {
      id: "sl-social-clubs",
      title: "2.5 Social Clubs",
      content: [
        {
          type: "list",
          ordered: true,
          items: [
            "Arts & Creativity Club — From canvas painting to tote bag art, this club is where ISB gets creative.",
            "Dance Club — Leads all dance-related activities on campus. Also conducts auditions for Footwork Factory, ISB's official dance troupe.",
            "Fashion & Lifestyle Club — Setting the aesthetic pulse of campus life through themed events and curated experiences.",
            "Music Club — Leads all music-related activities on campus. Also conducts auditions for The Jukebox Project, ISB's official performing band.",
            "Photography Club — Photo walks, tips and techniques, and documenting the stories that make this year unforgettable.",
            "Quiz Club — Keeps your mind sharp and competitive with quizzes that range from the serious to the wildly obscure.",
            "Radio Club — ISB's own voice. Covers campus news, conducts interviews, and keeps the community informed.",
            "Spectrum Club (LGBTQ+) — A safe, celebratory, and inclusive space for LGBTQ+ students and allies at ISB.",
            "Sports Club — Section-level tournaments, the beloved Nostalgia Games (yes, old-school games included), and more.",
            "Stand-up Comedy Club — Stand-up shows, improv sessions, and proof that business school doesn't have to be too serious.",
            "Theatre Club — Bringing the drama (the good kind) to ISB's biggest events. Performances that remind everyone that storytelling is one of the most powerful skills.",
          ],
        },
      ],
    },
    {
      id: "sl-sigs",
      title: "2.6 Special Interest Groups (SIGs)",
      content: [
        {
          type: "paragraph",
          text: "SIGs are student-led communities built around specific interests, industries, or emerging themes. Unlike clubs, which are more structured and career-focused, SIGs are informal and exploration-driven — allowing students to engage with topics of interest without high entry barriers or rigid roles. This list changes every year based on the interest of the batch.",
        },
        {
          type: "table",
          headers: ["Professional SIGs", "Social SIGs"],
          rows: [
            ["Mobility & Automotive SIG", "You@ISB — The Mental Health SIG"],
            ["Healthcare SIG", "Aerospace & Astronomy SIG"],
            ["Media & Entertainment SIG", "Board Games SIG"],
            ["Law & Business SIG", "Cooking & Baking SIG"],
            ["Family Business SIG", "Embrace Well-being: Yoga & Wellness SIG"],
            ["Real Estate & Infrastructure SIG", "Esports & Gaming Tech SIG"],
            ["The Everything Macro SIG", "The Foodie Circle SIG"],
            ["Energy & Sustainability SIG", "Chess SIG"],
            ["Blockchain & Web3 SIG", "Poetry & Creative Writing SIG"],
            ["AI SIG", ""],
            ["Retail, E-Commerce & Consumer Products (RECP) SIG", ""],
            ["Public Policy SIG", ""],
            ["Fintech SIG", ""],
          ],
        },
      ],
    },
    {
      id: "sl-events",
      title: "2.7 Marquee Events & Initiatives",
      content: [
        {
          type: "paragraph",
          text: "These are flagship, campus-wide events where students can take up roles as lead coordinators, core team members, or volunteers. Participation offers hands-on experience and officially recognised Positions of Responsibility (PORs) approved by ASA.",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "ISB Leadership Summit — A flagship two-day summit where top executives and industry leaders share perspectives and inspire the next generation of business leaders.",
            "Aikya — ISB's initiative to build deeper connections with prominent business families from Hyderabad and beyond. Students are paired with these families, hosting them on campus.",
            "Bandhan — Students host underprivileged children on campus for a day filled with workshops, performances, and shared joy.",
            "One Club Conclave — All professional clubs join forces for a power-packed two-day event featuring incredible speakers, learning sessions, and networking opportunities.",
            "Shadow a Leader — Bid your way into spending a full day shadowing a top executive and get an up-close, unfiltered look at leadership in action.",
            "Solstice — ISB Hyderabad's flagship alumni event. Alumni return for concerts, comedy shows, and reunions, while students get unparalleled access to the ISB network.",
            "ISB Sports League — Think IPL, but on campus. Students and alumni bid for players, form teams, compete across sports like basketball, volleyball, swimming, rugby, and esports — with cash prizes.",
            "Yearbook — The keepsake that captures it all. The Yearbook team documents the people, moments, and memories of the year.",
          ],
        },
      ],
    },
  ],
};

// ─── Section 3: O-Week ───

const O_WEEK: KTSection = {
  id: "o-week",
  title: "O-Week",
  icon: "Calendar",
  color: "text-amber-600",
  emoji: "🗓️",
  subsections: [
    {
      id: "ow-overview",
      title: "First Week at ISB",
      content: [
        {
          type: "paragraph",
          text: "The first week at ISB is designed to help students transition into the academic, social, and operational environment of the program. It is structured, fast-paced, and information-dense.",
        },
      ],
    },
    {
      id: "ow-day0",
      title: "3.1 Day 0 — Registration Day",
      content: [
        {
          type: "paragraph",
          text: "Based on past experience, Registration Day is expected to be around April 11, 2026. Registrations run from 8 AM to 5 PM. You are free to leave campus before 5 PM but not after. Exact dates will be confirmed by the administration in your admits portal.",
        },
        {
          type: "list",
          items: [
            "Parents are allowed on campus and in your room on Registration Day",
            "Campus tours will be arranged by the O-Week team for parents",
            "Welcome Dinner for students and parents on Registration Day (runs until approximately 10 PM, after which parents need to leave campus)",
            "All eateries are open to parents and students alike on Registration Day",
            "Executive Housing (EH) is available for parents/guests who wish to stay overnight — book early",
          ],
        },
        {
          type: "contact",
          label: "Executive Housing Booking",
          value: "frontoffice_EH@isb.edu",
          action: "email",
        },
      ],
    },
    {
      id: "ow-docs",
      title: "3.2 Mandatory Documents for Registration",
      content: [
        {
          type: "callout",
          text: "You will not be able to complete registration without the required documents. Refer to the official admin mail for final details.",
          variant: "warning",
        },
        { type: "heading", text: "Documents for Verification (Originals Required)" },
        {
          type: "list",
          items: [
            "Identity Proof — Passport, Driver's Licence, PAN Card, Voter ID, or Aadhaar Card",
            "Proof of Date of Birth — Passport or any government-issued document",
            "Original Academic Transcripts / Mark Sheets — Bachelor's, Master's, and Professional Education (all semesters/years)",
            "Degree Certificates — Originals of Bachelor's, Master's, and Professional Education",
          ],
        },
        {
          type: "callout",
          text: "Do not courier originals — bring them with you.",
          variant: "warning",
        },
        { type: "heading", text: "Documents to Submit for ISB's Records" },
        {
          type: "list",
          items: [
            "Medical History and Examination Form — Completed and signed by a registered medical practitioner. Upload scanned copy in the admits portal.",
            "For International Students: Copy of Student Visa or valid permit for full-time study in India",
            "Employment Documents: Recent salary slip and relieving letter from last employer, or self-declaration if self-employed",
          ],
        },
      ],
    },
    {
      id: "ow-schedule",
      title: "3.3 What Happens During O-Week",
      content: [
        {
          type: "paragraph",
          text: "After years navigating the corporate world, this is your reentry point into academia — and ISB makes sure it's anything but ordinary. This week is carefully curated to ease you back into the rhythm of campus life while setting the tone for the transformative journey ahead.",
        },
        { type: "heading", text: "Section Bonding & Peer Interaction" },
        {
          type: "paragraph",
          text: "Icebreakers, group activities, and section-level engagement designed to help students get to know their immediate peer group.",
        },
        { type: "heading", text: "Academic & Institutional Orientation" },
        {
          type: "paragraph",
          text: "Sessions covering the academic structure, grading system, course bidding, and key processes required to navigate the ISB curriculum.",
        },
        { type: "heading", text: "Clubs, SIGs & Campus Opportunities" },
        {
          type: "paragraph",
          text: "Introductions to professional clubs, social clubs, SIGs, and various avenues for involvement during the year.",
        },
        { type: "heading", text: "Alumni & Industry Sessions" },
        {
          type: "paragraph",
          text: "Interactions with alumni and industry speakers to provide perspective on career pathways and the ISB experience.",
        },
        { type: "heading", text: "Social Events & Informal Engagements" },
        {
          type: "paragraph",
          text: "Evening events, mixers, and cultural activities that facilitate broader networking across sections.",
        },
      ],
    },
    {
      id: "ow-curfew",
      title: "3.4 Curfew & Movement",
      content: [
        {
          type: "paragraph",
          text: "A curfew is in effect throughout O-Week. Once students enter campus at the start of the week, movement outside campus is restricted, except for approved or documented situations.",
        },
        {
          type: "list",
          items: [
            "Complete all essential errands prior to arrival",
            "Carry required items for the entire week (though you can order online via Amazon or quick commerce delivery platforms)",
            "Plan your arrival accordingly",
          ],
        },
        {
          type: "callout",
          text: "Any updates or relaxations to this policy will be communicated officially.",
          variant: "info",
        },
      ],
    },
  ],
};

// ─── Section 4: Campus Operations ───

const CAMPUS_OPS: KTSection = {
  id: "campus-ops",
  title: "Campus Life",
  icon: "Building2",
  color: "text-emerald-600",
  emoji: "🏫",
  subsections: [
    {
      id: "co-essentials",
      title: "Quick Access — Daily Essentials",
      content: [
        {
          type: "table",
          headers: ["Need", "Quick Answer"],
          rows: [
            [
              "Food & dining",
              "Goel's Dining Hall (AC5, 7 AM–10:30 PM) is your main hub. TCC/Subway, Nescafe, MFC, and vending machines also available. Food delivery apps work 24/7 — raise DigiiCampus entry first.",
            ],
            [
              "Laundry",
              "PKC, Govind, or 3C on-campus providers pick up from your quad. Tumbledry for dry cleaning.",
            ],
            [
              "Printing",
              "Printer kiosks in K-Block of every SV — available 24/7. Full-service Documentation Centre at AC2.",
            ],
            [
              "Guest entry",
              "Register guests via DigiiCampus (Visitor Management) before they arrive. Guests not allowed after 9:30 PM.",
            ],
            [
              "Groceries",
              "Sampoorna Convenience Store at SV1 Reception (Extn 7050). All quick-commerce apps deliver to your doorstep.",
            ],
          ],
        },
      ],
    },
    {
      id: "co-packing",
      title: "4.1 Packing & Arrival",
      content: [
        { type: "heading", text: "Documents" },
        {
          type: "list",
          items: [
            "Originals: degree certificates, mark sheets, identity proof (passport/Aadhaar/PAN/Voter ID)",
            "Copies: all academic documents + employment documents (salary slip, relieving letter)",
            "Medical History Form (signed by a registered practitioner)",
            "Passport-size photographs (carry extras)",
          ],
        },
        { type: "heading", text: "Clothing" },
        {
          type: "list",
          items: [
            "Formal wear for presentations, PPTs, company visits during placement",
            "Comfortable casuals for day-to-day campus life",
            "Warm layer / jacket (campus can get cool, especially evenings and winter months)",
            "Footwear for gym and outdoor sports",
          ],
        },
        { type: "heading", text: "Electronics" },
        {
          type: "list",
          items: [
            "Laptop + charger (primary work tool throughout the year)",
            "Phone + charger + power bank",
            "Extension cord / multi-plug (limited sockets in rooms)",
            "Headphones / earphones",
          ],
        },
        { type: "heading", text: "Daily Essentials" },
        {
          type: "list",
          items: [
            "Toiletries and personal care items for the first few days",
            "Medicines / prescriptions you rely on regularly",
            "Water bottle (the campus has water dispensers)",
          ],
        },
        { type: "heading", text: "Optional / Useful" },
        {
          type: "list",
          items: [
            "Portable washing machine (large washing machines not allowed; saves laundry costs)",
            "Umbrella or raincoat (Hyderabad monsoon, June–September)",
            "Two-wheeler if you own one — highly recommended for campus mobility",
          ],
        },
        {
          type: "callout",
          text: "If you have a two-wheeler, bring it! Travelling between SVs and late-night plans become much easier.",
          variant: "tip",
        },
        { type: "heading", text: "Flea Market" },
        {
          type: "paragraph",
          text: "The outgoing Co'26 batch will be selling items they no longer need before graduation — a great way to pick up appliances and essentials at low cost. Appliances and study materials sell out fast.",
        },
      ],
    },
    {
      id: "co-accommodation",
      title: "4.2 Accommodation — Student Villages",
      content: [
        {
          type: "paragraph",
          text: "Shared accommodation is available across four student villages on campus. Each village has its own anchor amenity:",
        },
        {
          type: "table",
          headers: ["Village", "Key Amenity", "Notes"],
          rows: [
            [
              "SV 1",
              "Mini Gym",
              "Small gym; no trainers. Great for quick workouts.",
            ],
            [
              "SV 2",
              "Dance & Yoga Room + Day Care",
              "Dedicated space for dance and yoga. Day Care Centre (Sunshine) in SV2 K Block.",
            ],
            [
              "SV 3",
              "Music Room & Wellness Centre",
              "Music room with basic equipment. Wellness Centre (24/7), pharmacy, and ambulance.",
            ],
            [
              "SV 4",
              "Mail Room & MFC Cafe",
              "All campus parcels delivered here. MFC cafe for filter coffee, snacks, sandwiches.",
            ],
          ],
        },
        { type: "heading", text: "Common Facilities in All Villages" },
        {
          type: "list",
          items: [
            "K Block in each SV — printing kiosk, security desk, vending machine",
            "Recreation areas and common lounges",
            "Laundry pickup points (available in all SVs — pick up from quads)",
            "SV4 Mail Room for all campus parcel deliveries — check regularly",
          ],
        },
        {
          type: "callout",
          text: "Guests are not permitted on campus after 9:30 PM. Studio residents have no time restriction.",
          variant: "warning",
        },
      ],
    },
    {
      id: "co-room",
      title: "4.3 Room Inventory",
      content: [
        {
          type: "table",
          headers: ["Item", "Quad", "Studio"],
          rows: [
            ["Bed + mattress", "Yes", "Yes"],
            ["Study table & chair", "Yes", "Yes"],
            ["Wardrobe", "Yes", "Yes"],
            ["Bookshelf", "Yes", "Yes"],
            ["AC", "Yes", "Yes"],
            ["Attached bathroom", "Shared between 2", "Private"],
            ["Common kitchen", "Shared with 4", "Private kitchenette"],
            ["Living area", "Shared with 4", "Private living room"],
          ],
        },
        { type: "heading", text: "Kitchen & Room Assets (ISB-provided)" },
        {
          type: "list",
          items: [
            "TV + Remote, Refrigerator, Microwave Oven",
            "Split AC + Remote, TV Setup Box",
            "Gas Stove + Gas Cylinder",
            "Dinner Plates (4), Soup Bowls (4), Coffee Mugs (4), Glasses (4)",
            "Dinner Spoons (4), Forks (4), Tea Spoons (4)",
            "Handi (2), Sauce Pan, Kitchen Knife, Wooden Spatula",
            "Bucket, Mug, Bathroom accessories",
            "6 Plastic Hangers, Waste Bin, Wet Cloth Hanger",
          ],
        },
      ],
    },
    {
      id: "co-studio",
      title: "4.4 Studio Apartments",
      content: [
        {
          type: "paragraph",
          text: "Studio apartments are individual 1-BHK units available for select students. Registered dependents are allowed to reside in studios. Guests can enter at any time of day without the standard village curfew restrictions.",
        },
      ],
    },
    {
      id: "co-housekeeping",
      title: "4.5 Housekeeping",
      content: [
        {
          type: "paragraph",
          text: "Housekeeping services are provided by Bluspring.",
        },
        {
          type: "list",
          items: [
            "Bedsheets are changed every 5 days on a scheduled basis; ad-hoc changes can be requested",
            "Housekeeping staff assist with general room cleaning and maintenance",
            "Regular pest control is conducted in all rooms; on-demand pest control available 24/7 via DigiiCampus App",
          ],
        },
        { type: "heading", text: "Maintenance Escalation Matrix" },
        {
          type: "table",
          headers: ["Level", "Contact", "Use For"],
          rows: [
            [
              "Level 1",
              "DigiiCampus App",
              "First point of contact for all maintenance requests",
            ],
            [
              "Level 2",
              "reach_bluspring@isb.edu",
              "Escalation if Level 1 not resolved within 24 hrs",
            ],
            [
              "Level 3",
              "operations_hyderabad@isb.edu",
              "Final escalation for unresolved issues",
            ],
          ],
        },
      ],
    },
    {
      id: "co-utilities",
      title: "4.6 Utilities",
      content: [
        {
          type: "paragraph",
          text: "A monthly utilities bill will be sent to students, covering electricity, printing, laundry, vending machines, utensils (if opted), and any other availed services.",
        },
        {
          type: "table",
          headers: ["Service", "Basis", "Approx. Cost / Month"],
          rows: [
            ["Electricity", "Usage-based", "₹500 – ₹1,000 (varies by AC use)"],
            ["Laundry", "Usage-based", "₹1,100 – ₹1,300"],
            ["Printing", "Usage-based", "As per use"],
            [
              "Cooking + Utensil Cleaning (if opted)",
              "Fixed",
              "₹2,000 – ₹2,500 per person",
            ],
          ],
        },
        {
          type: "callout",
          text: "Electricity costs vary significantly based on AC use. Expect higher bills in peak summer (April–June) and winter (November–February).",
          variant: "info",
        },
      ],
    },
    {
      id: "co-parking",
      title: "4.7 Parking & Transportation",
      content: [
        {
          type: "paragraph",
          text: "All ride-hailing services are allowed until the entrance of the respective Student Village for doorstep pick-up (DigiiCampus approval required for entry). Students may bring their own personal vehicles. Each Student Village has a dedicated parking lot.",
        },
        {
          type: "list",
          items: [
            "Speed limit inside campus: 30 km/hr",
            "Campus is home to many bird and animal species — strictly follow speed limits",
            "Always drive on the left side of Ring Road; right side is for pedestrians",
          ],
        },
      ],
    },
    {
      id: "co-food",
      title: "4.8 Food & Dining",
      content: [
        {
          type: "paragraph",
          text: "F&B on campus is managed by Sarovar Hotels, offering a wide variety of cuisines across multiple outlets:",
        },
        {
          type: "table",
          headers: ["Eatery", "Location", "Timing", "Price Range"],
          rows: [
            [
              "Goel's Dining Hall",
              "AC5 Courtyard",
              "Mon–Sun: 7 AM – 10:30 PM",
              "₹82–₹200",
            ],
            [
              "SIPZ Juice Bar",
              "AC5 Courtyard",
              "Mon–Sun: 8 AM – 7 PM",
              "₹60–₹200",
            ],
            [
              "Campus Cafe / Subway (TCC)",
              "AC6 Courtyard",
              "Mon–Sun: 8 AM – 11 PM",
              "₹150–₹350",
            ],
            [
              "Nestle Cafe / Nescafe",
              "Rec Centre, Road #4",
              "Mon–Sun: 12:30 PM – 5 AM",
              "₹30–₹100",
            ],
            [
              "MFC",
              "SV4",
              "Post afternoon – 1–2 AM",
              "₹30–₹150",
            ],
            [
              "Vending Machines",
              "Multiple locations",
              "24/7",
              "₹20–₹70",
            ],
          ],
        },
        {
          type: "callout",
          text: "Try eating at Goel's at least once a day, especially early on — it is where you will bump into new faces and build the closest friendships of the year.",
          variant: "tip",
        },
        { type: "heading", text: "Home-Cooked Meals" },
        {
          type: "paragraph",
          text: "You can hire a campus cook. A pre-approved cook list will be shared by the administration. To grant a cook entry for the first time, email both security_maingate@isb.edu and security_servicegate@isb.edu. Once registered, the cook can enter regularly without re-approval.",
        },
        { type: "heading", text: "Food Delivery" },
        {
          type: "paragraph",
          text: "Orders from Swiggy, Zomato, Blinkit, and other apps can be placed 24/7. Delivery agents enter via the Security Service Gate. You must raise a Food Delivery request on DigiiCampus before the agent arrives.",
        },
      ],
    },
    {
      id: "co-laundry",
      title: "4.9 Laundry Services",
      content: [
        {
          type: "table",
          headers: ["Provider", "Contact", "Notes"],
          rows: [
            [
              "PKC",
              "7337316803",
              "On-campus; SV1 K Block pickup (Mon–Sat, 10 AM–8 PM)",
            ],
            [
              "Govind",
              "+91 88016 43184",
              "On-campus provider, direct pick-up from quad/studio",
            ],
            [
              "3C",
              "+91 81210 28663",
              "On-campus provider, direct pick-up from quad/studio",
            ],
            [
              "Tumbledry",
              "External",
              "Off-campus; dry cleaning & specialty cleaning (shoes, sneakers)",
            ],
          ],
        },
        {
          type: "callout",
          text: "You can purchase a portable washing machine as normal large washing machines are not allowed — this can save you a lot of money.",
          variant: "tip",
        },
      ],
    },
    {
      id: "co-sports",
      title: "4.10 Sports Facilities",
      content: [
        {
          type: "paragraph",
          text: "The Recreation Centre (Road No. 4) is the hub for most indoor sports.",
        },
        {
          type: "table",
          headers: ["Facility", "Location"],
          rows: [
            ["Tennis Courts", "Road No. 5"],
            ["Football Field", "Road No. 5"],
            ["Cricket Field", "Road No. 6"],
            ["Volleyball Court", "Road No. 5"],
            ["Basketball Courts", "Road No. 5"],
            ["Badminton Courts", "Rec Centre, Road No. 4"],
            ["Squash Courts", "Rec Centre, Road No. 4"],
            ["Table Tennis", "Rec Centre, Road No. 4"],
            ["Billiards / Snooker", "Rec Centre, Road No. 4"],
            ["Carrom & Chess", "Rec Centre, Road No. 4"],
            ["Foosball Tables", "Rec Centre, Road No. 4"],
            ["Swimming Pool", "Rec Centre, Road No. 4"],
            ["Children's Play Area", "Rec Centre, Road No. 4"],
          ],
        },
        {
          type: "callout",
          text: "Swimming Pool timings: 6:00 AM – 11:00 AM and 4:00 PM – 9:00 PM daily. Flat 5-foot depth. Lifeguard on duty. Guests are NOT permitted to use Recreation Centre facilities.",
          variant: "info",
        },
      ],
    },
    {
      id: "co-fitness",
      title: "4.11 Fitness",
      content: [
        {
          type: "paragraph",
          text: "The Recreation Centre Fitness Centre is open 24/7 and equipped with benches, weights, steppers, stationary cycles, treadmills, and a multi-station gym. A smaller gym is also available in SV1 (no trainers) for quick sessions.",
        },
        {
          type: "callout",
          text: "Trainer availability at the Rec Centre: Morning 6:30 AM – 12:00 Noon | Evening 3:00 PM – 9:00 PM. Gym itself is open 24/7.",
          variant: "info",
        },
      ],
    },
    {
      id: "co-music",
      title: "4.12 Music Room",
      content: [
        {
          type: "paragraph",
          text: "A music room is available in SV3 with music equipment. The music room is open 24/7. Students are requested to bring any specialised instruments or gear.",
        },
      ],
    },
    {
      id: "co-wellness",
      title: "4.13 Wellness & Medical",
      content: [
        {
          type: "paragraph",
          text: "ISB takes student wellbeing seriously. A comprehensive wellness and medical infrastructure is available on campus, centred at the Wellness Centre in SV3.",
        },
        {
          type: "table",
          headers: ["Service", "Details", "Timings / Contact"],
          rows: [
            [
              "Wellness Centre",
              "2-bed infirmary at SV3. All consultations free.",
              "24/7 | 040-23187222 / 8008901304",
            ],
            [
              "General Physician",
              "MBBS doctor on all working days (Mon–Sat)",
              "Morning: 8 AM – 4 PM | Evening: 4 PM – 12 AM",
            ],
            [
              "Specialist Doctor",
              "On-campus specialist every Wednesday",
              "Wednesday: 3 PM – 5 PM",
            ],
            ["Paramedic", "Available 24/7 for on-campus first response", "24/7"],
            [
              "Pharmacy",
              "Well-stocked pharmacy at SV3. Free for ISB residents.",
              "24/7",
            ],
            [
              "Ambulance",
              "Dedicated ambulance stationed at Wellness Centre. Free.",
              "24/7 | Extn 7222",
            ],
            [
              "108 Emergency",
              "State emergency service (medical, police, fire). Free.",
              "Dial 108",
            ],
          ],
        },
        { type: "heading", text: "Counselling Services" },
        {
          type: "table",
          headers: ["Counsellor", "Day", "Phone"],
          rows: [
            ["Zenobia Rustomfram", "Tuesdays", "9849637633"],
            ["Dr. Smita Sharma", "Thursdays", "9490793157"],
          ],
        },
        {
          type: "contact",
          label: "Counselling Email",
          value: "counsell@isb.edu",
          action: "email",
        },
      ],
    },
    {
      id: "co-printing",
      title: "4.14 Printing & Documentation",
      content: [
        {
          type: "table",
          headers: ["Location", "Details"],
          rows: [
            ["Central Printing Shop (AC2)", "Main campus location; full-service"],
            ["LRC (4th Floor)", "Learning Resource Centre — self-serve printers"],
            ["SV1 – K Block", "Student Village 1 printer"],
            ["SV2 – K Block", "Student Village 2 printer"],
            ["SV3 – K Block", "Student Village 3 printer"],
          ],
        },
        { type: "heading", text: "Rate Card (AC2)" },
        {
          type: "table",
          headers: ["Service", "Price (incl. tax)"],
          rows: [
            ["A4 BW Single Side", "₹1.00"],
            ["A4 BW Duplex (per side)", "₹0.75"],
            ["A3 BW Single Side", "₹1.80"],
            ["A3 BW Duplex (per side)", "₹1.35"],
            ["A4 Colour Single Side", "₹7.10"],
            ["A4 Colour Duplex (per side)", "₹6.90"],
            ["A3 Colour Single Side", "₹10.20"],
            ["A3 Colour Duplex (per side)", "₹9.95"],
          ],
        },
        {
          type: "contact",
          label: "Documentation Centre",
          value: "CentralPrinter_Hyd@isb.edu",
          action: "email",
        },
        {
          type: "callout",
          text: "Printers are available 24/7 at K-block in all SVs. LRC printer available during LRC working hours.",
          variant: "info",
        },
      ],
    },
    {
      id: "co-it",
      title: "4.15 IT Support",
      content: [
        {
          type: "paragraph",
          text: "For Wi-Fi connectivity, laptop issues, or software access problems: 24/7 IT support available for internet issues, basic device troubleshooting, and academic software.",
        },
        {
          type: "contact",
          label: "IT Support",
          value: "itsupport@isb.edu",
          action: "email",
        },
        {
          type: "callout",
          text: "If your personal laptop breaks down, IT can provide a loaner laptop — speak with the IT team to confirm availability.",
          variant: "tip",
        },
      ],
    },
    {
      id: "co-salon",
      title: "4.16 Salon",
      content: [
        {
          type: "list",
          items: [
            "Timing: All days except Tuesday, 10:00 AM – 5:00 PM",
            "Pinks and Bloos: Call / WhatsApp +91 89787 36655",
            "Urban Company professionals and off-campus providers available for in-room visits",
          ],
        },
      ],
    },
    {
      id: "co-bank",
      title: "4.17 Bank & ATM",
      content: [
        {
          type: "table",
          headers: ["Facility", "Location", "Timings"],
          rows: [
            [
              "ICICI Bank + 24hr ATM",
              "AC8, Courtyard Level",
              "Weekdays: 9 AM–6 PM | Sat: 9 AM–2 PM",
            ],
            ["SBI ATM", "AC1, Courtyard Level", "24/7"],
          ],
        },
      ],
    },
    {
      id: "co-bookstore",
      title: "4.18 Bookstore & Merchandise",
      content: [
        { type: "heading", text: "Bookstore" },
        {
          type: "list",
          items: [
            "Location: AC8, Courtyard Level",
            "Weekday timings: 9:30 AM – 7:00 PM | Saturday: 10:00 AM – 4:00 PM",
            "Custom orders available (Indian publications: ~2 weeks; international: ~1 month)",
          ],
        },
        {
          type: "contact",
          label: "Bookstore",
          value: "Book_Store@isb.edu",
          action: "email",
        },
        { type: "heading", text: "Merchandise Store" },
        {
          type: "list",
          items: [
            "Location: AC8, Courtyard Level",
            "Weekday timings: 10:00 AM – 8:00 PM | Weekends: 10:00 AM – 6:00 PM",
          ],
        },
      ],
    },
    {
      id: "co-mail",
      title: "4.19 Mail Room & Post Office",
      content: [
        { type: "heading", text: "Mail Room" },
        {
          type: "list",
          items: [
            "Location: AC3, Courtyard",
            "Timing: Mon–Fri: 9 AM – 6 PM | Sat: 9 AM – 2 PM | Closed Sundays & public holidays",
            "All parcels and couriers sent to ISB campus are delivered here",
          ],
        },
        { type: "heading", text: "Post Office" },
        {
          type: "list",
          items: [
            "Location: Service Gate, Road No. 1",
            "Timing: Mon–Fri: 10 AM – 4 PM | Sat: 10 AM – 2 PM | Closed Sundays & public holidays",
          ],
        },
      ],
    },
    {
      id: "co-daycare",
      title: "4.20 Day Care Centre",
      content: [
        {
          type: "list",
          items: [
            "Location: SV2, K Block",
            "Timing: Monday – Saturday: 8:00 AM – 8:00 PM | Closed Sundays & select public holidays",
            "Caters to children aged 3 months to 12 years",
            "Services include playgroup, daycare, health check-ups, medical insurance, and curriculum-based learning",
          ],
        },
      ],
    },
    {
      id: "co-lostandfound",
      title: "4.21 Lost & Found",
      content: [
        {
          type: "paragraph",
          text: "Administered by the Academic Centre Security Team at the Academic Centre Reception.",
        },
        { type: "heading", text: "If You Lost Something" },
        {
          type: "list",
          items: [
            "Report to Academic Centre Security immediately — in person, by phone (Extn 7777), or email",
            "File a formal Report of Loss, Theft, or Disappearance",
          ],
        },
        {
          type: "contact",
          label: "Lost & Found",
          value: "security_acreception@isb.edu",
          action: "email",
        },
        {
          type: "callout",
          text: "Items like cash and jewellery are kept in a safe for up to 3 months before disposal.",
          variant: "info",
        },
      ],
    },
    {
      id: "co-booking",
      title: "4.22 Booking Facilities",
      content: [
        { type: "heading", text: "LRC Study Room Booking" },
        {
          type: "paragraph",
          text: "The Digicampus app has an option for 'Venue Booking' under which LRC study rooms can be booked by students. No booking is required for open study spaces.",
        },
        { type: "heading", text: "Booking Rooms at MOEC / Academic Centre" },
        {
          type: "paragraph",
          text: "For sessions, club activities, or any closed-door events, meeting rooms are available at MOEC, and conference rooms are available at the academic centre. For larger crowds, lecture theatres (LTs) can be booked.",
        },
        {
          type: "contact",
          label: "Room Booking",
          value: "rakesh_bijankar@isb.edu",
          action: "email",
        },
      ],
    },
    {
      id: "co-nearby",
      title: "4.23 What's Around ISB?",
      content: [
        {
          type: "list",
          items: [
            "Petrol Bunks: 3 bunks available within a 2km radius",
            "Shopping: Sarath City Mall, Westside, Atrium Mall, InOrbit Mall, IKEA",
            "Hospitals: CARE Hospitals, Continental Hospitals",
            "Beauty Salons: Green Trends, Toni & Guy, Bubbles, Page 3, Naturals",
            "Movie Theatres: AMB Cinemas, PVR Atrium, PVR Preston Prime, INOX Prism Mall",
            "Attractions: Charminar, Golconda Fort, Ramoji Film City, Hussain Sagar Lake",
          ],
        },
      ],
    },
  ],
};

// ─── Section 5: Pro Tips ───

const PRO_TIPS: KTSection = {
  id: "pro-tips",
  title: "Pro Tips",
  icon: "Lightbulb",
  color: "text-yellow-600",
  emoji: "💡",
  subsections: [
    {
      id: "pt-day0",
      title: "Day 0 Essentials",
      content: [
        {
          type: "list",
          items: [
            "Save emergency numbers on Day 0: Security 8886337070 | Wellness 8008901304 | MoD 8886447070",
            "Download the DigiiCampus App before you arrive and log in with ISBHYD — you'll need it immediately for everything from guests to maintenance",
            "Register guests and food deliveries on DigiiCampus before they arrive — guest approval can take up to 24 hours",
            "For food deliveries, always create a DigiiCampus entry before placing your order or the agent won't be let in",
          ],
        },
      ],
    },
    {
      id: "pt-campus",
      title: "Campus Life",
      content: [
        {
          type: "list",
          items: [
            "Eat at Goel's regularly early on — it is where you'll meet the most people and build friendships quickly",
            "The Nestle Cafe is open until 5 AM — your go-to for late-night studying fuel",
            "SBI ATM (AC1) is 24/7; ICICI Bank (AC8) is a full extension counter for banking during weekday hours",
            "Explore the campus map in your first week: locate eateries, printing kiosks, the Rec Centre, and your SV facilities",
            "Connect with your village management team — they are your first point of contact for day-to-day issues",
            "If you have a two-wheeler, bring it — it makes campus life significantly more convenient",
          ],
        },
      ],
    },
    {
      id: "pt-academics",
      title: "Academics",
      content: [
        {
          type: "list",
          items: [
            "Start thinking about elective priorities early — your 4,500 bidding points are finite",
            "Check the ISB Atrium archives for the previous year's elective list to get an early sense of what's offered",
            "Always read the course outline on Day 1 — attendance rules, evaluation weightages, and participation norms vary by faculty",
            "For the LRC, email the team directly for specific research papers — they usually respond within a day",
            "Block Weeks are intensive — plan your week in advance, including logbooks and reflection submissions due before midnight",
          ],
        },
      ],
    },
    {
      id: "pt-parents",
      title: "Parents & Guests",
      content: [
        {
          type: "list",
          items: [
            "Book Executive Housing for visiting parents well in advance — it fills up fast around O-Week",
            "Attend all O-Week orientation sessions — admin will brief you on services and facilities",
          ],
        },
      ],
    },
    {
      id: "pt-medical",
      title: "Medical",
      content: [
        {
          type: "list",
          items: [
            "The Wellness Centre pharmacy is open 24/7 and all consultations are free",
            "For any medical emergency, call Extn 7222 / +91 40 2318 7222, or dial 108 (state emergency, ~18 min response)",
          ],
        },
        {
          type: "callout",
          text: "DigiiCampus is your single window for all campus requests. When in doubt, raise a ticket there first. Final escalation for all issues: operations_hyderabad@isb.edu",
          variant: "tip",
        },
      ],
    },
  ],
};

// ─── Export ───

// ─── O-Week Resource Guide (PGP YL Co'28) ───
// Sourced from the official PGP YL O-Week Welcome Resource Guide.

const RESOURCE_GUIDE: KTSection = {
  id: "resource-guide",
  title: "O-Week Resource Guide",
  icon: "BookOpen",
  color: "text-primary-600",
  emoji: "📘",
  subsections: [
    {
      id: "rg-welcome",
      title: "Welcome to PGP YL, Co '28",
      content: [
        {
          type: "paragraph",
          text: "Greetings from the Academic and Student Affairs (ASA) Team at ISB. Congratulations on your admission to the PGP Young Leaders Programme — you are about to begin a transformative 20-month journey at the Indian School of Business.",
        },
        {
          type: "paragraph",
          text: "Orientation Week (Sat 13 June – Sun 21 June 2026, Hyderabad campus) is designed to help you build a strong foundation through academic sessions, community-building activities, leadership interactions, and campus experiences. You will engage with faculty, alumni, administrators, and fellow students while settling into academic and residential life.",
        },
        {
          type: "callout",
          variant: "info",
          text: "Attendance is mandatory for all O-Week sessions and is recorded through this app.",
        },
        {
          type: "contact",
          label: "Academic & Student Affairs",
          value: "asa_studentaffairs@isb.edu",
          action: "email",
        },
      ],
    },
    {
      id: "rg-registration",
      title: "Registration Process",
      content: [
        {
          type: "paragraph",
          text: "Saturday, 13 June 2026 | 2:00 pm – 4:00 pm. Registration takes place at the Motilal Oswal Executive Centre (MOEC), Level 1. On arrival, proceed to your allotted accommodation and complete check-in before reporting for registration in your designated slot.",
        },
        { type: "heading", text: "Registration flow — follow in order" },
        {
          type: "list",
          ordered: true,
          items: [
            "ASA, Admissions & Finance — Lecture Theatre (LT) 3, Level 1, MOEC",
            "IT setup (carry your laptop)",
            "Collect your welcome kit and room key from the Operations Desk (K Block, SV4)",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          text: "Registration cannot be completed without original documents for verification.",
        },
        {
          type: "list",
          items: [
            "Parents and guardians may accompany students on Registration Day and may be seated in the Atrium.",
            "The Welcome Address is for students only.",
            "Guests are not permitted in Quads or Shared Accommodation. Guest visiting hours: 8:00 am – 9:30 pm.",
            "On-campus accommodation is not available for parents and guardians.",
          ],
        },
      ],
    },
    {
      id: "rg-after-registration",
      title: "After Registration — Day 0",
      content: [
        {
          type: "table",
          headers: ["Time", "Activity", "Venue"],
          rows: [
            ["4:00 – 5:30 pm", "Campus Tour", "Starts from MOEC"],
            ["6:00 – 6:30 pm", "Welcome Address — Dean Madan Pillutla", "Khemka Auditorium"],
            ["6:30 – 7:00 pm", "Welcome Address — Associate Dean (Programmes), Prof. Sripad Devalkar", "Khemka Auditorium"],
            ["7:30 – 9:30 pm", "Welcome Dinner — Students, Family & Faculty", "Atrium"],
          ],
        },
      ],
    },
    {
      id: "rg-documents",
      title: "Mandatory Documents",
      content: [
        { type: "heading", text: "A — Originals required for verification" },
        {
          type: "list",
          items: [
            "Identity Proof: Passport preferred / Aadhaar Card",
            "Proof of Date of Birth: Passport or any government-issued document",
            "Original academic transcripts / mark sheets: Class XII, Bachelor's, Master's and professional education (all semesters/years)",
            "Degree certificates: originals of Bachelor's, Master's and professional education degrees",
          ],
        },
        { type: "heading", text: "B — Submit for ISB records" },
        {
          type: "list",
          items: [
            "Medical History and Examination Form, completed and signed by a registered medical practitioner (scan and upload via the Admits Portal)",
            "International students: copy of Student Visa, PIO Card, or other valid permit",
            "Employment documents: recent salary slip and relieving letter (or sabbatical permission / self-declaration if applicable)",
          ],
        },
      ],
    },
    {
      id: "rg-campus",
      title: "Campus, Villages & Daily Services",
      content: [
        {
          type: "paragraph",
          text: "The Hyderabad campus is built around a central Academic Centre, surrounded by four Student Villages, the Recreation Centre, and a central lake. Pylon signage at major intersections will guide you across campus.",
        },
        {
          type: "table",
          headers: ["Service", "Location"],
          rows: [
            ["Operations Desk — room key collection", "K Block, SV4"],
            ["Laundry pickup & drop", "K Block, SV1"],
            ["Mailroom & Courier", "K Block, SV3"],
            ["Dance & Yoga Room", "K Block, SV2"],
            ["Music Room", "K Block, SV3"],
            ["Printing", "Each SV common area"],
          ],
        },
      ],
    },
    {
      id: "rg-food",
      title: "Food & Beverage",
      content: [
        {
          type: "table",
          headers: ["Outlet", "Location"],
          rows: [
            ["Student Dining Room", "AC5 Courtyard"],
            ["SIPZ", "AC5 Courtyard"],
            ["The Campus Café", "AC6 Courtyard"],
            ["The Farm Bowl", "AC4 Courtyard"],
            ["Nescafé", "Recreation Centre"],
            ["The Madras Filter Coffee", "SV4 Parking, Road No. 2"],
          ],
        },
      ],
    },
    {
      id: "rg-recreation",
      title: "Recreation Centre",
      content: [
        {
          type: "list",
          items: [
            "Swimming Pool — 6:00 AM to 10:00 PM",
            "Gymnasium — 6:00 AM to 9:00 PM",
            "Basketball, Badminton, Squash; Lawn Tennis",
            "Billiards, Table Tennis, Carrom; Mini Football & Volleyball",
            "Cricket Ground and Amphitheatre",
            "Ladies' Parlour & Gents' Salon — 10:00 AM to 7:00 PM (closed Tuesdays)",
          ],
        },
      ],
    },
    {
      id: "rg-medical",
      title: "Medical & Wellness Centre (SV3)",
      content: [
        {
          type: "table",
          headers: ["Service", "Availability"],
          rows: [
            ["General Physician", "8:00 AM – 12:00 AM weekdays; 8 hrs weekends"],
            ["Paramedic", "24×7"],
            ["BLS Ambulance", "24×7"],
            ["Pharmacy (basic medicines)", "During Wellness Centre hours"],
            ["Wheelchair (manual & battery)", "On request"],
          ],
        },
        {
          type: "contact",
          label: "Wellness Centre Direct Line",
          value: "040 2318 7222",
          action: "call",
        },
      ],
    },
    {
      id: "rg-services",
      title: "Documentation, Bookstore & Banking",
      content: [
        {
          type: "table",
          headers: ["Service", "Location"],
          rows: [
            ["Documentation & Printing Centre", "AC2 Courtyard"],
            ["ICICI Bank & 24-hour ATM", "Academic Centre"],
            ["SBI ATM", "AC1 Courtyard"],
            ["ISB Bookstore", "Near Academic Centre"],
          ],
        },
      ],
    },
    {
      id: "rg-emergency",
      title: "Emergency & Support Contacts",
      content: [
        { type: "contact", label: "Duty Manager — 24×7", value: "9731000688", action: "call" },
        { type: "contact", label: "Security Officer — 24×7", value: "9618001345", action: "call" },
        { type: "contact", label: "Medical Emergency — 24×7", value: "9133011972", action: "call" },
        { type: "contact", label: "Wellness Centre", value: "040 2318 7222", action: "call" },
        { type: "contact", label: "Housekeeping & Maintenance", value: "040 2318 7070", action: "call" },
      ],
    },
    {
      id: "rg-counselling",
      title: "Counselling Services",
      content: [
        {
          type: "table",
          headers: ["Counsellor", "Day", "Timings"],
          rows: [
            ["Ms. Zenobia Rustomfram", "Tuesdays — Hyderabad", "10:00 – 19:00"],
            ["Dr. Smita Sharma", "Fridays — Hyderabad", "09:00 – 18:00"],
          ],
        },
        { type: "contact", label: "Online Counselling — deTalks", value: "https://isb.detalks.com", action: "email" },
      ],
    },
    {
      id: "rg-faqs",
      title: "FAQs — Operations",
      content: [
        { type: "heading", text: "Can I change my accommodation after allotment?" },
        { type: "paragraph", text: "No. Seek approval from Operations before any change. Unauthorized changes are subject to penalties." },
        { type: "heading", text: "Are guests allowed in student housing?" },
        { type: "paragraph", text: "Not in Quads or Shared Accommodation. Guest timings are 8:00 AM – 9:30 PM, bookings through Executive Housing only." },
        { type: "heading", text: "Can I smoke or drink alcohol on campus?" },
        { type: "paragraph", text: "Smoking and drinking alcohol are prohibited on campus." },
        { type: "heading", text: "What are the housekeeping timings?" },
        { type: "paragraph", text: "Daily 0900–1700 hrs. Bed linen is changed once every 5 days." },
      ],
    },
  ],
};

export const KT_SECTIONS: KTSection[] = [
  RESOURCE_GUIDE,
  ACADEMICS,
  STUDENT_LIFE,
  O_WEEK,
  CAMPUS_OPS,
  PRO_TIPS,
];

/** Flat list of all searchable text keyed by subsection id */
export function buildSearchIndex(): {
  subsectionId: string;
  sectionId: string;
  sectionTitle: string;
  sectionEmoji: string;
  subsectionTitle: string;
  text: string;
}[] {
  const index: {
    subsectionId: string;
    sectionId: string;
    sectionTitle: string;
    sectionEmoji: string;
    subsectionTitle: string;
    text: string;
  }[] = [];

  for (const section of KT_SECTIONS) {
    for (const sub of section.subsections) {
      const texts: string[] = [sub.title];
      for (const block of sub.content) {
        switch (block.type) {
          case "paragraph":
          case "heading":
            texts.push(block.text);
            break;
          case "callout":
            texts.push(block.text);
            break;
          case "contact":
            texts.push(block.label, block.value);
            break;
          case "list":
            texts.push(...block.items);
            break;
          case "table":
            texts.push(...block.headers);
            for (const row of block.rows) {
              texts.push(...row);
            }
            break;
        }
      }
      index.push({
        subsectionId: sub.id,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionEmoji: section.emoji,
        subsectionTitle: sub.title,
        text: texts.join(" ").toLowerCase(),
      });
    }
  }

  return index;
}
