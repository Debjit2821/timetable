import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Subject, 
  DsaProblem, 
  DailyPlan, 
  KnowledgeSource, 
  Topic,
  AdaptiveScheduleOptions
} from './types';
import { StorageService } from './services/storageService';
import { PlannerEngine } from './services/plannerEngine';
import { DsaEngine } from './services/dsaEngine';
import { HealthEngine } from './services/healthEngine';
import { RevisionEngine } from './services/revisionEngine';
import { KnowledgeUpdater } from './services/knowledgeUpdater';
import { AdaptationEngine } from './services/adaptationEngine';
import { getTodayDateString } from './utils/dateUtils';

import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { SyllabusBrowser } from './components/Gate/SyllabusBrowser';
import { RoadmapView } from './components/Gate/RoadmapView';
import { DsaHubView } from './components/Dsa/DsaHubView';
import { HealthDashboard } from './components/Health/HealthDashboard';
import { WeeklyReportView } from './components/Analytics/WeeklyReportView';
import { SourceTransparency } from './components/Knowledge/SourceTransparency';
import { SettingsView } from './components/Settings/SettingsView';
import { QuickStartModal } from './components/Onboarding/QuickStartModal';
import { TestPapersHubView } from './components/TestPapers/TestPapersHubView';

export const App: React.FC = () => {
  const todayStr = getTodayDateString();
  const [currentDateStr, setCurrentDateStr] = useState<string>(todayStr);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Core App State
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [syllabus, setSyllabus] = useState<Subject[]>(() => StorageService.getSyllabus());
  const [dsaBank, setDsaBank] = useState<DsaProblem[]>(() => StorageService.getDsaBank());
  const [dailyPlans, setDailyPlans] = useState<Record<string, DailyPlan>>(() => StorageService.getDailyPlans());
  const [sources, setSources] = useState<KnowledgeSource[]>(() => StorageService.getKnowledgeSources());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Initialize or retrieve today's plan
  const [currentPlan, setCurrentPlan] = useState<DailyPlan>(() => {
    return PlannerEngine.getOrCreateDailyPlan(todayStr);
  });

  // Calculate Health Score live
  const healthBreakdown = HealthEngine.calculateScore(currentPlan.healthHabits);

  // Sync state whenever date changes
  useEffect(() => {
    const plan = PlannerEngine.getOrCreateDailyPlan(currentDateStr);
    setCurrentPlan(plan);
  }, [currentDateStr]);

  // Check for authoritative updates on initial launch
  useEffect(() => {
    const checkInitialUpdates = async () => {
      try {
        const { updatedSources } = await KnowledgeUpdater.checkForUpdates();
        setSources(updatedSources);
      } catch (err) {
        console.error('Failed to check knowledge updates', err);
      }
    };
    checkInitialUpdates();
  }, []);

  // --- ACTIONS & HANDLERS ---

  const handleToggleTimeBlock = (blockId: string) => {
    const updatedBlocks = currentPlan.timeBlocks.map(block => {
      if (block.id === blockId) {
        const nextState = !block.isCompleted;
        
        if (nextState && block.topicId) {
          const allTopics = syllabus.flatMap(s => s.topics);
          const matchedTopic = allTopics.find(t => t.id === block.topicId);
          if (matchedTopic && matchedTopic.status !== 'completed') {
            RevisionEngine.scheduleSpacedRevisions(matchedTopic, currentDateStr);
            const updatedSyllabus = StorageService.getSyllabus();
            setSyllabus(updatedSyllabus);
          }
        }

        return { ...block, isCompleted: nextState };
      }
      return block;
    });

    const completedGateMin = updatedBlocks
      .filter(b => b.category === 'gate' && b.isCompleted)
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    const updatedPlan: DailyPlan = {
      ...currentPlan,
      timeBlocks: updatedBlocks,
      actualStudyMinutes: completedGateMin
    };

    StorageService.saveDailyPlan(updatedPlan);
    setCurrentPlan(updatedPlan);
  };

  const handleDeleteTimeBlock = (blockId: string) => {
    const updatedBlocks = currentPlan.timeBlocks.filter(block => block.id !== blockId);

    const completedGateMin = updatedBlocks
      .filter(b => b.category === 'gate' && b.isCompleted)
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    const updatedPlan: DailyPlan = {
      ...currentPlan,
      timeBlocks: updatedBlocks,
      actualStudyMinutes: completedGateMin
    };

    StorageService.saveDailyPlan(updatedPlan);
    setCurrentPlan(updatedPlan);
  };

  const handleToggleHealthHabit = (habitKey: keyof DailyPlan['healthHabits']) => {
    const currentVal = currentPlan.healthHabits[habitKey];
    let newVal: any = !currentVal;

    if (habitKey === 'studyBreaksTaken') {
      const currentBreaks = currentPlan.healthHabits.studyBreaksTaken;
      newVal = currentBreaks >= 4 ? 0 : currentBreaks + 1;
    }

    const updatedHabits = {
      ...currentPlan.healthHabits,
      [habitKey]: newVal
    };

    const updatedPlan: DailyPlan = {
      ...currentPlan,
      healthHabits: updatedHabits
    };

    StorageService.saveDailyPlan(updatedPlan);
    setCurrentPlan(updatedPlan);
  };

  const handleAddWaterGlass = () => {
    const current = currentPlan.healthHabits.hydrationGlasses;
    if (current >= 12) return;
    const updatedHabits = {
      ...currentPlan.healthHabits,
      hydrationGlasses: current + 1
    };
    const updatedPlan: DailyPlan = {
      ...currentPlan,
      healthHabits: updatedHabits
    };
    StorageService.saveDailyPlan(updatedPlan);
    setCurrentPlan(updatedPlan);
  };

  const handleRemoveWaterGlass = () => {
    const current = currentPlan.healthHabits.hydrationGlasses;
    if (current <= 0) return;
    const updatedHabits = {
      ...currentPlan.healthHabits,
      hydrationGlasses: current - 1
    };
    const updatedPlan: DailyPlan = {
      ...currentPlan,
      healthHabits: updatedHabits
    };
    StorageService.saveDailyPlan(updatedPlan);
    setCurrentPlan(updatedPlan);
  };

  const handleRecordDsaAttempt = (problemId: string, success: boolean) => {
    const updatedBank = DsaEngine.recordAttempt(problemId, success, 25);
    setDsaBank(updatedBank);
  };

  const handleUpdateTopicStatus = (topicId: string, status: Topic['status'], pyqSolved?: number) => {
    const allTopics = syllabus.flatMap(s => s.topics);
    const targetTopic = allTopics.find(t => t.id === topicId);

    if (status === 'completed' && targetTopic) {
      RevisionEngine.scheduleSpacedRevisions(targetTopic, currentDateStr);
    } else {
      StorageService.updateTopic(topicId, {
        status,
        pyqSolved: pyqSolved ?? 0,
        revisionLevel: 0
      });
    }

    const updatedSyllabus = StorageService.getSyllabus();
    setSyllabus(updatedSyllabus);
  };

  const handleApplyRedistribution = () => {
    const updatedPlan = AdaptationEngine.applyGracefulRedistribution(currentDateStr);
    setCurrentPlan(updatedPlan);
  };

  const handleApplyHighYieldReschedule = () => {
    const updatedPlan = AdaptationEngine.generateHighYieldReschedule(currentPlan, new Date());
    setCurrentPlan(updatedPlan);
  };

  const handleApplyAdaptiveSchedule = (options: AdaptiveScheduleOptions) => {
    const { updatedPlan } = PlannerEngine.adaptDailySchedule(currentDateStr, options);
    setCurrentPlan(updatedPlan);
  };

  const handlePrepareTomorrow = () => {
    const nextDate = new Date(currentDateStr);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    setCurrentDateStr(nextDateStr);
    setCurrentTab('dashboard');
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const { updatedSources } = await KnowledgeUpdater.checkForUpdates();
      setSources(updatedSources);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleApplySourceUpdate = (sourceId: string) => {
    KnowledgeUpdater.applyUpdate(sourceId);
    setSources(StorageService.getKnowledgeSources());
    setSyllabus(StorageService.getSyllabus());
  };

  const handleToggleSound = () => {
    const updatedProfile = {
      ...profile,
      soundEnabled: !profile.soundEnabled
    };
    StorageService.saveProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    StorageService.saveProfile(updated);
    setProfile(updated);
  };

  const handleResetAllData = () => {
    StorageService.resetToDefault();
    setProfile(StorageService.getProfile());
    setSyllabus(StorageService.getSyllabus());
    setDsaBank(StorageService.getDsaBank());
    setSources(StorageService.getKnowledgeSources());
    setCurrentPlan(PlannerEngine.getOrCreateDailyPlan(todayStr));
  };

  const handleCompleteInitialSetup = (name: string, paper: string) => {
    const updated = {
      ...profile,
      name,
      paper,
      setupCompleted: true
    };
    StorageService.saveProfile(updated);
    setProfile(updated);
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sleek Top Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        profile={profile}
        healthScore={healthBreakdown.score}
        sources={sources}
        onToggleSound={handleToggleSound}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
      />

      {/* Sub Navigation Bar for GATE Section Tabs */}
      {currentTab === 'gate' && (
        <div className="border-b border-white/5 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 py-2 text-xs">
            <button
              onClick={() => setCurrentTab('gate')}
              className="text-indigo-400 font-semibold border-b-2 border-indigo-500 pb-1"
            >
              Interactive Syllabus Tree (11 Sections)
            </button>
            <button
              onClick={() => setCurrentTab('roadmap')}
              className="text-slate-400 hover:text-white pb-1"
            >
              5-Phase Master Roadmap
            </button>
          </div>
        </div>
      )}

      {currentTab === 'roadmap' && (
        <div className="border-b border-white/5 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 py-2 text-xs">
            <button
              onClick={() => setCurrentTab('gate')}
              className="text-slate-400 hover:text-white pb-1"
            >
              Interactive Syllabus Tree (11 Sections)
            </button>
            <button
              onClick={() => setCurrentTab('roadmap')}
              className="text-indigo-400 font-semibold border-b-2 border-indigo-500 pb-1"
            >
              5-Phase Master Roadmap
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            plan={currentPlan}
            profile={profile}
            syllabus={syllabus}
            dsaBank={dsaBank}
            onToggleTimeBlock={handleToggleTimeBlock}
            onDeleteTimeBlock={handleDeleteTimeBlock}
            onToggleHealthHabit={handleToggleHealthHabit}
            onAddWaterGlass={handleAddWaterGlass}
            onRemoveWaterGlass={handleRemoveWaterGlass}
            onPrepareTomorrow={handlePrepareTomorrow}
            onApplyRedistribution={handleApplyRedistribution}
            onApplyHighYieldReschedule={handleApplyHighYieldReschedule}
            onApplyAdaptiveSchedule={handleApplyAdaptiveSchedule}
            soundEnabled={profile.soundEnabled}
          />
        )}

        {currentTab === 'gate' && (
          <SyllabusBrowser
            syllabus={syllabus}
            onUpdateTopicStatus={handleUpdateTopicStatus}
          />
        )}

        {currentTab === 'roadmap' && (
          <RoadmapView
            syllabus={syllabus}
            profile={profile}
          />
        )}

        {currentTab === 'tests' && (
          <TestPapersHubView
            syllabus={syllabus}
          />
        )}

        {currentTab === 'dsa' && (
          <DsaHubView
            dsaBank={dsaBank}
            todaysProblemIds={currentPlan.dsaProblemIds}
            onRecordAttempt={handleRecordDsaAttempt}
          />
        )}

        {currentTab === 'health' && (
          <HealthDashboard
            plan={currentPlan}
            profile={profile}
            onToggleHealthHabit={handleToggleHealthHabit}
            onAddWaterGlass={handleAddWaterGlass}
            onRemoveWaterGlass={handleRemoveWaterGlass}
            soundEnabled={profile.soundEnabled}
          />
        )}

        {currentTab === 'analytics' && (
          <WeeklyReportView
            syllabus={syllabus}
            profile={profile}
            dailyPlans={dailyPlans}
          />
        )}

        {currentTab === 'sources' && (
          <SourceTransparency
            sources={sources}
            onTriggerSync={handleTriggerSync}
            onApplyUpdate={handleApplySourceUpdate}
            isSyncing={isSyncing}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Zero-Friction Quick Start Modal if first launch */}
      {!profile.setupCompleted && (
        <QuickStartModal
          onCompleteSetup={handleCompleteInitialSetup}
        />
      )}
    </div>
  );
};
