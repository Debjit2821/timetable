# 🚀 GATE & DSA Master Prep Platform (2026 Edition)

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Electron Ready](https://img.shields.io/badge/Electron-Desktop_Ready-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

An intelligent, all-in-one preparation workstation and adaptive schedule engine designed specifically for **GATE CS/IT & DA 2026** aspirants and **DSA / Software Engineering** candidates.

---

## 🌟 Key Features

### 1. 🎯 Dynamic Daily Planner & Time-Blocking
- **Smart Time Blocks**: Granular breakdown of study sessions (Core Concepts, Problem Solving, Revision, DSA, Rest).
- **Interactive Checklists**: Real-time progress calculation and celebration effects (Confetti, sound alerts).
- **Next Best Action Widget**: Automatically suggests the most optimal high-yield task based on current progress.

### 2. 📚 Authoritative GATE 2026 Syllabus Browser
- **11 Complete Subject Modules**: Engineering Mathematics, Discrete Math, Digital Logic, COA, Programming & DS, Algorithms, TOC, Compiler Design, OS, DBMS, Computer Networks.
- **Section Weightage & High-Yield Tags**: Identifies highest return-on-investment topics.
- **Topic Mastery Tracking**: Mark topics as *Not Started*, *In Progress*, *Revision Needed*, or *Completed*.

### 3. 📝 Official GATE PYQs & Mock Test Papers (2015 – 2025)
- **Extensive PYQ Repository**: Over a decade of curated GATE questions with official answer keys and step-by-step explanations.
- **Mock Exam Environment**: Filter questions by Year, Subject, Difficulty, and Topic.
- **Instant Evaluation & Marking**: Track accuracy, negative marking, and weak area analysis.

### 4. 🗺️ 5-Phase Master Roadmap
- **Phase 1**: Core Foundations & Heavyweights (Discrete Math, Algo, DS, OS, DBMS).
- **Phase 2**: Systems & Architecture (COA, Digital Logic, Networks, TOC, Compiler).
- **Phase 3**: Advanced Mastery & Intensive PYQ Blitz (2015–2025 deep dive).
- **Phase 4**: Full-Length Mock Exams & Rapid Revision Cycles.
- **Phase 5**: Final Polish, Mental Peak & Formula Sheet Drills.

### 5. 💻 Curated DSA & Coding Interview Track
- **Striver SDE Sheet & Blind 75 Alignment**: LeetCode-style categorization across Arrays, Linked Lists, Trees, Graphs, DP, and Greedy.
- **Integrated Problem Solver**: Track status (*Unsolved*, *Attempted*, *Solved*), record completion time, and review optimal time/space complexity notes.

### 6. 🧘 Health Guardian & Cognitive Energy Engine
- **Cognitive Energy Score**: Live health metric (0–100) balancing study load with physical well-being.
- **Hydration Tracker**: Interactive visual water tracker with daily targets.
- **20-20-20 Eye Rest & Posture Prompts**: Mitigates digital eye strain and posture fatigue.
- **Burnout Detection**: Automated warnings if study hours exceed safe recovery thresholds without adequate breaks or sleep.

### 7. 🔄 Adaptive Rescheduling & Recovery System
- **Graceful Redistribution**: Automatically reallocates missed topics across future study windows without panic.
- **High-Yield Compression Mode**: Reschedules remaining topics focusing strictly on high-weightage chapters when time is constrained.
- **Spaced Repetition Scheduler (SRS)**: Automatic revision intervals scheduled at **Day 1, 3, 7, 21, and 60** post topic completion.

### 8. 📊 Weekly Analytics & Insight Reports
- **Consistency Heatmap**: Visual streak and daily study hours tracking.
- **Subject Coverage Radar**: Identifies under-prepared subjects vs. mastered domains.
- **Study vs. Health Correlation**: Compares productivity trends against sleep and hydration quality.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 6](https://vitejs.dev/)
- **Styling**: Tailwind CSS & Modern Vanilla CSS (Glassmorphism, Dark Mode, Glow Effects)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visual FX**: Canvas Confetti
- **Desktop Packaging**: [Electron](https://www.electronjs.org/)
- **Deployment**: [Vercel](https://vercel.com/) / Static Web Hosting

---

## 📂 Project Structure

```
TIMETABLE/
├── electron/               # Electron main process & desktop entry
│   ├── main.js
│   └── preload.js
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # Modular UI components
│   │   ├── Analytics/      # Weekly reports & consistency analytics
│   │   ├── Dashboard/      # Main dashboard & interactive time blocks
│   │   ├── Dsa/            # DSA problem tracker & LeetCode hub
│   │   ├── Gate/           # Syllabus browser & 5-phase roadmap
│   │   ├── Health/         # Health guardian & energy score monitor
│   │   ├── Knowledge/      # Official GATE updates & source transparency
│   │   ├── Onboarding/     # Quick-start setup modal
│   │   ├── Settings/       # User profile, data backup & reset
│   │   └── TestPapers/     # Real PYQ test bank & mock assessments
│   ├── data/               # Seed data, syllabus tree & PYQ sets (2015-2025)
│   ├── services/           # Business logic & core engines
│   │   ├── adaptationEngine.ts   # Missed task reallocation
│   │   ├── dsaEngine.ts          # DSA progress tracking
│   │   ├── healthEngine.ts       # Health scoring & habit calculations
│   │   ├── knowledgeUpdater.ts   # Authoritative notification updater
│   │   ├── plannerEngine.ts      # Schedule generation & daily plans
│   │   ├── revisionEngine.ts     # Spaced repetition scheduling (SRS)
│   │   └── storageService.ts     # LocalStorage persistence & sync
│   ├── types/              # TypeScript interfaces and data models
│   ├── utils/              # Date formatters, sound FX, helpers
│   ├── App.tsx             # Root application orchestrator
│   ├── index.css           # Global design system & theme variables
│   └── main.tsx            # Vite React DOM entry point
├── package.json
├── tsconfig.json
├── vercel.json             # Vercel SPA routing configuration
└── vite.config.ts          # Vite build configuration
```

---

## ⚡ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Debjit2821/TIMETABLE.git
   cd TIMETABLE
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run as Desktop App (Electron):**
   ```bash
   npm run electron:dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🚀 Deployment

### Deploying to Vercel
The repository includes a ready-to-use [`vercel.json`](./vercel.json) for Single Page Application (SPA) routing:

1. Push your repository to GitHub.
2. Import the repository in [Vercel Dashboard](https://vercel.com/new).
3. Framework Preset: **Vite**.
4. Click **Deploy**.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
