import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  ShieldAlert, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onResetProgress: () => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetProgress,
  onResetAllData
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showProgressResetConfirm, setShowProgressResetConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gateplanner_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = StorageService.importFullBackupJSON(content);
        if (success) {
          window.location.reload();
        } else {
          alert('Failed to import backup file. Please ensure it is a valid JSON export.');
        }
      } catch {
        alert('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-primary font-heading">
          Settings & Preferences
        </h1>
        <p className="text-xs text-secondary mt-0.5">
          Configure daily exam target parameters, study boundaries, and data management.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-5 space-y-4">
        <h2 className="text-sm font-semibold text-primary font-heading">
          Study & Exam Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-secondary font-medium mb-1">
              Aspirant Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-secondary font-medium mb-1">
              Target GATE Paper
            </label>
            <input
              type="text"
              value={formData.paper}
              onChange={e => setFormData({ ...formData, paper: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-secondary font-medium mb-1">
              Exam Date
            </label>
            <input
              type="date"
              value={formData.examDate}
              onChange={e => setFormData({ ...formData, examDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-secondary font-medium mb-1">
              Daily Target High-Yield Study (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={formData.dailyTargetStudyMinutes / 60}
              onChange={e => setFormData({ ...formData, dailyTargetStudyMinutes: Number(e.target.value) * 60 })}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-secondary font-medium mb-1">
              Daily DSA Problem Target
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.dsaDailyCount}
              onChange={e => setFormData({ ...formData, dsaDailyCount: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-secondary font-medium mb-1">
              Default Wake-Up Time
            </label>
            <input
              type="time"
              value={formData.wakeTime}
              onChange={e => setFormData({ ...formData, wakeTime: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-secondary font-medium mb-1">
              Default Bedtime (Sleep Boundary)
            </label>
            <input
              type="time"
              value={formData.bedTime}
              onChange={e => setFormData({ ...formData, bedTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-secondary">
            <input
              type="checkbox"
              checked={formData.soundEnabled}
              onChange={e => setFormData({ ...formData, soundEnabled: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span>Enable audio chimes on focus complete and break reminders</span>
          </label>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-subtle">
          {savedSuccess ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-4 h-4" />
              <span>Preferences saved</span>
            </span>
          ) : <span />}

          <button type="submit" className="btn-primary text-xs px-4 py-2 font-medium">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* Backup & Data Reset Section */}
      <section className="space-y-4 pt-2">
        <h2 className="text-sm font-semibold text-primary font-heading">
          Data Management
        </h2>

        <div className="panel p-5 space-y-4">
          {/* Start From Beginning (Reset Progress to 0%) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
            <div>
              <div className="text-xs font-semibold text-accent flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                <span>Start Journey From Beginning (0% Progress)</span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Reset all syllabus topics, practice stats, DSA logs, and daily schedules to 0%. Sets today as Day 1 of your journey while preserving your profile settings.
              </p>
            </div>
            {showProgressResetConfirm ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onResetProgress();
                    setShowProgressResetConfirm(false);
                  }}
                  className="btn-primary text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-500 border-amber-400 font-medium"
                >
                  Yes, Start from Day 1
                </button>
                <button
                  onClick={() => setShowProgressResetConfirm(false)}
                  className="btn-ghost text-xs px-2.5 py-1.5 font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowProgressResetConfirm(true)}
                className="btn-secondary text-xs px-3.5 py-1.5 shrink-0 text-accent hover:bg-indigo-500/10 whitespace-nowrap font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Day 1</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-subtle">
            <div>
              <div className="text-xs font-semibold text-primary">Export JSON Backup</div>
              <p className="text-xs text-secondary">Download your complete study logs and syllabus progress offline.</p>
            </div>
            <button onClick={handleExportBackup} className="btn-secondary text-xs px-3 py-1.5 shrink-0 font-medium">
              <Download className="w-4 h-4" />
              <span>Export Backup</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-subtle">
            <div>
              <div className="text-xs font-semibold text-primary">Import JSON Backup</div>
              <p className="text-xs text-secondary">Restore progress from a previous GatePlanner JSON export.</p>
            </div>
            <label className="btn-secondary text-xs px-3 py-1.5 cursor-pointer shrink-0 font-medium">
              <Upload className="w-4 h-4" />
              <span>Import File</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-subtle">
            <div>
              <div className="text-xs font-semibold text-danger">Reset to Defaults</div>
              <p className="text-xs text-secondary">Erase all progress and re-initialize zero-setup default plan.</p>
            </div>
            {showResetConfirm ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onResetAllData();
                    setShowResetConfirm(false);
                  }}
                  className="btn-primary text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 border-red-400 font-medium"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-ghost text-xs px-2.5 py-1.5 font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="btn-ghost text-xs text-danger px-3 py-1.5 shrink-0 hover:bg-red-500/10 font-medium"
              >
                Reset App Data
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
