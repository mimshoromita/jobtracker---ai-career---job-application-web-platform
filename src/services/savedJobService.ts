import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SavedJob } from '../types';
import { logActivity } from './activityService';

export function subscribeToSavedJobs(
  userId: string,
  onUpdate: (savedJobs: SavedJob[]) => void
): () => void {
  const path = 'saved_jobs';
  const q = query(collection(db, path), where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as SavedJob[];

      items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export async function toggleSaveJob(
  userId: string,
  job: { id: string; title: string; company: string },
  currentlySaved: boolean
): Promise<boolean> {
  const docId = `${userId}_${job.id}`;
  const path = `saved_jobs/${docId}`;

  try {
    if (currentlySaved) {
      await deleteDoc(doc(db, 'saved_jobs', docId));
      await logActivity({
        userId,
        type: 'job_unsaved',
        title: `Removed ${job.title} from bookmarks`,
        description: `Unsaved position at ${job.company}`,
        timestamp: new Date().toISOString(),
        metadata: {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
        },
      });
      return false;
    } else {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'saved_jobs', docId), {
        userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        createdAt: now,
      });
      await logActivity({
        userId,
        type: 'job_saved',
        title: `Bookmarked: ${job.title}`,
        description: `Saved role at ${job.company} to your favorites`,
        timestamp: now,
        metadata: {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
        },
      });
      return true;
    }
  } catch (error) {
    handleFirestoreError(
      error,
      currentlySaved ? OperationType.DELETE : OperationType.WRITE,
      path
    );
  }
}
