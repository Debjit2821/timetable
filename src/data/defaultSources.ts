import { KnowledgeSource } from '../types';

export const DEFAULT_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'src_gate_cs_official',
    name: 'Official GATE 2027 CS & IT Syllabus',
    authority: 'IIT Madras (Official GATE 2027 Organizing Institute)',
    officialUrl: 'https://gate2027.iitm.ac.in/exam_papers_and_syllabus',
    lastCheckedDate: '2026-09-02',
    version: 'GATE 2027 (Official)',
    status: 'verified',
    description: 'Official 11-section syllabus covering General Aptitude, Engineering Mathematics, Digital Logic, COA, Programming & DS, Algorithms, TOC, Compiler Design, OS, Databases, and Computer Networks.',
    guidelinesSummary: '100 marks total: 15 marks General Aptitude + 13 marks Engineering Mathematics + 72 marks CS Core Engineering Subjects. 3-hour Computer Based Test (CBT).'
  },
  {
    id: 'src_who_lifestyle_2020',
    name: 'WHO Guidelines on Physical Activity and Sedentary Behaviour',
    authority: 'World Health Organization (WHO Geneva)',
    officialUrl: 'https://www.who.int/publications/i/item/9789240015128',
    lastCheckedDate: '2026-09-02',
    version: 'WHO 2020 Guidelines',
    status: 'verified',
    description: 'Evidence-based global recommendations on physical activity, sedentary behavior, and cognitive restoration.',
    guidelinesSummary: '150-300 min moderate intensity physical activity per week (30-45 min daily for sedentary knowledge workers). Regular posture interrupts every 50 min.'
  },
  {
    id: 'src_efsa_hydration',
    name: 'EFSA Scientific Opinion on Dietary Reference Values for Water',
    authority: 'European Food Safety Authority',
    officialUrl: 'https://www.efsa.europa.eu/en/efsajournal/pub/1459',
    lastCheckedDate: '2026-09-02',
    version: 'EFSA 2010 Consensus',
    status: 'verified',
    description: 'Scientific standard for adequate daily fluid intake to prevent cognitive impairment and fatigue.',
    guidelinesSummary: '2.5 Liters/day for adult males, 2.0 Liters/day for adult females under moderate physical activity and climate.'
  },
  {
    id: 'src_dsa_core_index',
    name: 'Curated Standard Algorithms & Coding Index',
    authority: 'Standard Competitive & Technical Interview Benchmark',
    officialUrl: 'https://leetcode.com/problemset/all/',
    lastCheckedDate: '2026-09-02',
    version: 'Standard Blind/Neet 150 Index',
    status: 'verified',
    description: 'Curated 150+ standard algorithm problems spanning 14 essential algorithmic paradigms.',
    guidelinesSummary: 'Adaptive daily rotation targeting low-accuracy categories with progressive difficulty.'
  }
];
