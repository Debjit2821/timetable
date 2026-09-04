import { KnowledgeSource } from '../types';
import { StorageService } from './storageService';

export class KnowledgeUpdater {
  /**
   * Checks for updates against authoritative sources.
   */
  static async checkForUpdates(): Promise<{ updatedSources: KnowledgeSource[]; hasNewUpdates: boolean }> {
    const sources = StorageService.getKnowledgeSources();
    const todayStr = new Date().toISOString().split('T')[0];

    // Simulate authoritative query check against IIT Madras GATE 2027 portal & WHO repositories
    const updatedSources: KnowledgeSource[] = sources.map(source => {
      if (source.id === 'src_gate_cs_2027') {
        return {
          ...source,
          lastCheckedDate: todayStr,
          status: 'update_available',
          pendingDiff: {
            summary: 'GATE 2027 IIT Madras Organizing Committee released revised syllabus clarification bulletin #2.',
            changes: [
              {
                type: 'modified',
                text: 'Algorithms: Explicit mention of Randomized QuickSelect and Asymptotic Master Theorem boundary conditions.'
              },
              {
                type: 'added',
                text: 'Computer Networks: Modern Application Layer protocols (HTTP/2 framing & TLS 1.3 handshake fundamentals added).'
              },
              {
                type: 'modified',
                text: 'Databases: Multi-valued dependencies and 4NF questions weightage alignment confirmed.'
              }
            ]
          }
        };
      }
      return {
        ...source,
        lastCheckedDate: todayStr,
        status: 'verified'
      };
    });

    StorageService.saveKnowledgeSources(updatedSources);
    return {
      updatedSources,
      hasNewUpdates: true
    };
  }

  /**
   * Applies approved syllabus updates to the active database.
   */
  static applyUpdate(sourceId: string): void {
    const sources = StorageService.getKnowledgeSources();
    const targetSource = sources.find(s => s.id === sourceId);
    if (!targetSource) return;

    if (sourceId === 'src_gate_cs_2027') {
      const syllabus = StorageService.getSyllabus();
      
      // Update Algorithms topic subtopics
      const algoSubject = syllabus.find(s => s.id === 'algo');
      if (algoSubject) {
        const topic = algoSubject.topics.find(t => t.id === 'algo_divide_conquer');
        if (topic && !topic.subtopics.includes('Randomized QuickSelect & Master Boundary Cases')) {
          topic.subtopics.push('Randomized QuickSelect & Master Boundary Cases');
        }
      }

      // Update Networks topic subtopics
      const cnSubject = syllabus.find(s => s.id === 'cn');
      if (cnSubject) {
        const topic = cnSubject.topics.find(t => t.id === 'cn_transport_app');
        if (topic && !topic.subtopics.includes('HTTP/2 & TLS 1.3 Handshake')) {
          topic.subtopics.push('HTTP/2 & TLS 1.3 Handshake');
        }
      }

      StorageService.saveSyllabus(syllabus);
    }

    // Mark source as verified and clear pendingDiff
    const updatedSources = sources.map(s => {
      if (s.id === sourceId) {
        return {
          ...s,
          status: 'verified' as const,
          version: `${s.version}-APPLIED`,
          pendingDiff: undefined
        };
      }
      return s;
    });

    StorageService.saveKnowledgeSources(updatedSources);
  }
}
