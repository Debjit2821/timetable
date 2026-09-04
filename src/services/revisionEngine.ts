import { RevisionQueueItem, Topic } from '../types';
import { StorageService } from './storageService';

const SPACING_INTERVALS_DAYS = [1, 3, 7, 14, 30]; // Leitner spaced repetition stages

export class RevisionEngine {
  /**
   * Called when a topic is marked completed. Automatically schedules 5 future spaced revisions.
   */
  static scheduleSpacedRevisions(topic: Topic, completionDateStr: string = new Date().toISOString().split('T')[0]): RevisionQueueItem[] {
    const baseDate = new Date(completionDateStr);
    const newItems: RevisionQueueItem[] = [];

    SPACING_INTERVALS_DAYS.forEach((days, index) => {
      const scheduledDate = new Date(baseDate);
      scheduledDate.setDate(scheduledDate.getDate() + days);
      const dateStr = scheduledDate.toISOString().split('T')[0];

      newItems.push({
        id: `rev_${topic.id}_stage_${index + 1}_${Date.now()}_${index}`,
        topicId: topic.id,
        topicName: topic.name,
        subjectName: topic.subjectName,
        stage: index + 1,
        scheduledDate: dateStr,
        isCompleted: false
      });
    });

    StorageService.addRevisionItems(newItems);

    // Update topic with next revision date (Stage 1: +1 day)
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);
    StorageService.updateTopic(topic.id, {
      status: 'completed',
      revisionLevel: 1,
      nextRevisionDate: nextDate.toISOString().split('T')[0],
      lastStudiedAt: completionDateStr
    });

    return newItems;
  }

  /**
   * Retrieves all spaced repetition items due on or before a given date.
   */
  static getRevisionsDueOn(dateStr: string): RevisionQueueItem[] {
    const queue = StorageService.getRevisionQueue();
    return queue.filter(item => !item.isCompleted && item.scheduledDate <= dateStr);
  }

  /**
   * Marks a revision item as completed and promotes topic revision level.
   */
  static completeRevision(itemId: string): void {
    const queue = StorageService.getRevisionQueue();
    const item = queue.find(q => q.id === itemId);
    if (!item) return;

    const updatedQueue = queue.map(q => (q.id === itemId ? { ...q, isCompleted: true } : q));
    StorageService.saveRevisionQueue(updatedQueue);

    // Update topic revision level
    const nextDue = updatedQueue.find(q => q.topicId === item.topicId && !q.isCompleted);
    StorageService.updateTopic(item.topicId, {
      revisionLevel: item.stage,
      nextRevisionDate: nextDue ? nextDue.scheduledDate : null
    });
  }
}
