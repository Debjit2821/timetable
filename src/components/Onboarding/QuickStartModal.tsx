import React, { useState } from 'react';
import { 
  ArrowRight, 
  Compass, 
  Check 
} from 'lucide-react';

interface QuickStartModalProps {
  onCompleteSetup: (name: string, paper: string) => void;
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({ onCompleteSetup }) => {
  const [name, setName] = useState('Debjit');
  const [paper, setPaper] = useState('CS');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCompleteSetup(name, paper);
  };

  return (
    <div className="modal-overlay">
      <div className="panel max-w-md w-full p-8 relative bg-[#11131c] border-muted shadow-lg">
        <div className="w-10 h-10 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
          <Compass className="w-5 h-5" />
        </div>

        <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1">
          Zero-Setup Initialization
        </div>
        <h2 className="text-2xl font-bold text-primary font-heading mb-2">
          Welcome to GatePlanner
        </h2>
        <p className="text-xs text-secondary mb-6 leading-relaxed">
          Your complete syllabus, adaptive DSA bank, and healthy lifestyle routine are already pre-configured. Let's personalize your daily plan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">
              What is your name?
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">
              GATE Engineering Stream
            </label>
            <select
              value={paper}
              onChange={e => setPaper(e.target.value)}
            >
              <option value="CS">Computer Science & Information Technology (CS)</option>
              <option value="DA">Data Science & AI (DA - Coming Soon)</option>
              <option value="EC">Electronics & Communication (EC - Coming Soon)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 text-sm"
            >
              <span>Enter Today's Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
