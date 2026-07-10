// Custom SVG Generator to generate beautiful placeholder banners offline
export const getCategoryGradient = (category) => {
  const c = (category || "").toLowerCase();
  let gradientColors = "from-blue-600 to-indigo-800";
  let title = "3BCA-B Activity";
  
  if (c.includes("workshop")) {
    gradientColors = "from-teal-600 to-cyan-800";
    title = "Technical Workshop";
  } else if (c.includes("guest") || c.includes("talk") || c.includes("lecture")) {
    gradientColors = "from-amber-600 to-rose-800";
    title = "Guest Lecture";
  } else if (c.includes("hackathon") || c.includes("competition")) {
    gradientColors = "from-violet-600 to-fuchsia-800";
    title = "Code Hackathon";
  }

  // Create an SVG string and encode it to Base64
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c.includes("workshop") ? "#0d9488" : c.includes("guest") ? "#d97706" : c.includes("hackathon") ? "#7c3aed" : "#3b7dd8"}" />
        <stop offset="100%" stop-color="${c.includes("workshop") ? "#075985" : c.includes("guest") ? "#9f1239" : c.includes("hackathon") ? "#86198f" : "#1e1b4b"}" />
      </linearGradient>
    </defs>
    <rect width="800" height="400" fill="url(#g)" />
    <circle cx="700" cy="100" r="150" fill="white" fill-opacity="0.05" />
    <circle cx="100" cy="300" r="200" fill="white" fill-opacity="0.03" />
    <rect x="50" y="320" width="700" height="40" rx="8" fill="white" fill-opacity="0.1" />
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="44" fill="#ffffff" fill-opacity="0.95">${title}</text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="500" font-size="20" fill="#ffffff" fill-opacity="0.7">Classroom 3BCA-B</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_ACTIVITIES = [
  {
    id: "act-1",
    title: "Hands-on Workshop: React & Next.js Basics",
    date: "2026-07-05",
    category: "Workshop",
    description: `### React & Next.js Hands-on Workshop
**Instructor:** Prof. Suresh Kumar
**Date:** July 5, 2026
**Duration:** 3 Hours (10:00 AM - 1:00 PM)

#### Key Topics Covered:
1. **Introduction to modern frontend frameworks** - JSX, component-based architectures, and single-page apps.
2. **State & Props Management** - Understanding how data flows in React components.
3. **Introduction to Next.js App Router** - Layouts, pages, Routing, and Client vs Server Component paradigms.
4. **Hands-on Practice** - Students successfully built a simple portfolio page.

*Overall engagement was high, with 54 students out of 60 attending. All students completed the lab exercises successfully.*`,
    photos: [],
    createdBy: "Admin Prof. Suresh",
    aiFormatted: true
  },
  {
    id: "act-2",
    title: "Guest Talk on Modern Cyber Security & OWASP Top 10",
    date: "2026-06-28",
    category: "Guest talk",
    description: `### Guest Lecture: Cyber Security & Vulnerability Analysis
**Speaker:** Mr. Rohan Mehta, Senior Security Analyst at CyberShield Labs
**Host:** Department of Computer Applications
**Date:** June 28, 2026

#### Session Summary:
The speaker introduced current threats in web architectures, focusing on the **OWASP Top 10** vulnerabilities (SQL Injection, XSS, Broken Auth, etc.).
- Demonstrated live security testing methodologies.
- Emphasized secure coding practices for future developers.
- Discussed career paths in cybersecurity and ethical hacking.

*Interactive Q&A session took place for 30 minutes at the end of the presentation.*`,
    photos: [],
    createdBy: "Admin Prof. Suresh",
    aiFormatted: true
  },
  {
    id: "act-3",
    title: "3BCA-B Internal 12-Hour Web Dev Hackathon",
    date: "2026-06-15",
    category: "Hackathon",
    description: `### 3BCA-B internal Hackathon: "Build for College"
**Event Coordinator:** Dr. Anjali Sharma
**Date:** June 15, 2026 (08:00 AM - 08:00 PM)

#### Results and Highlights:
- **Theme:** Automation tools for the college campus (roster system, attendance loggers, cafeteria queue trackers).
- **Participation:** 12 teams (4 students each) from 3BCA-B.
- **Winners:** *Team SyntaxError* (devised a smart canteen token automation portal).
- **Runners Up:** *Team NullPointer* (built an automated classroom activity logging application).

*Judges praised the technical execution and UI design. Cash prizes and certificates were distributed by the Head of Department.*`,
    photos: [],
    createdBy: "Admin Dr. Anjali",
    aiFormatted: true
  }
];
