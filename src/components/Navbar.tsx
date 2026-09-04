import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  BookOpen, 
  Code2, 
  Activity, 
  BarChart3, 
  Globe2, 
  Settings, 
  Volume2, 
  VolumeX,
  RefreshCw,
  Clock,
  Compass,
  FileCheck2
} from 'lucide-react';
import { UserProfile, KnowledgeSource } from '../types';
import { PlannerEngine } from '../services/plannerEngine';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  profile: UserProfile;
  healthScore: number;
  sources: KnowledgeSource[];
  onToggleSound: () => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  profile,
  healthScore,
  sources,
  onToggleSound,
  onTriggerSync,
  isSyncing
}) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const daysRemaining = PlannerEngine.getDaysRemaining(profile.examDate);
  const hasUpdateAvailable = sources.some(s => s.status === 'update_available');

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');

  const navItems = [
    { id: 'dashboard', label: 'Today', icon: Calendar },
    { id: 'gate', label: 'GATE Syllabus', icon: BookOpen },
    { id: 'tests', label: 'Test Papers', icon: FileCheck2 },
    { id: 'dsa', label: 'DSA', icon: Code2 },
    { id: 'health', label: 'Health', icon: Activity },
    { id: 'analytics', label: 'Review', icon: BarChart3 },
    { id: 'sources', label: 'Sources', icon: Globe2, alert: hasUpdateAvailable },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-subtle bg-[#090a0f]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-primary font-heading">
                GatePlanner
              </span>
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-white/5 text-primary border border-subtle">
                {profile.paper}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-primary font-semibold'
                      : 'text-secondary hover:text-primary hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-tertiary'}`} />
                  <span>{item.label}</span>
                  {item.alert && (
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full ml-0.5" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status */}
          <div className="flex items-center gap-2.5">
            {/* Live Time Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-subtle border border-subtle text-xs text-secondary font-mono">
              <Clock className="w-3.5 h-3.5 text-tertiary" />
              <span>{displayHours}:{minutes}:{seconds} {ampm}</span>
            </div>

            {/* Exam Countdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-subtle border border-subtle text-xs text-secondary">
              <span className="text-primary font-semibold">{daysRemaining}d</span>
              <span className="text-tertiary">remaining</span>
            </div>

            {/* Health Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-subtle border border-subtle text-xs text-secondary">
              <span className="text-tertiary">Health</span>
              <span className="text-emerald-400 font-semibold">{healthScore}%</span>
            </div>

            {/* Sync Action */}
            <button
              onClick={onTriggerSync}
              title={hasUpdateAvailable ? "Official update available. Click to review." : "Check official sources"}
              className={`p-1.5 rounded-md border border-subtle text-secondary hover:text-primary hover:bg-subtle transition-colors ${
                hasUpdateAvailable ? 'text-amber-400 border-amber-500/30' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-accent' : ''}`} />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={profile.soundEnabled ? 'Mute audio' : 'Enable audio'}
              className="p-1.5 rounded-md border border-subtle text-secondary hover:text-primary hover:bg-subtle transition-colors"
            >
              {profile.soundEnabled ? <Volume2 className="w-4 h-4 text-secondary" /> : <VolumeX className="w-4 h-4 text-tertiary" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
