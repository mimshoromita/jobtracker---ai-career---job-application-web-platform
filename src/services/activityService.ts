import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ActivityEvent } from '../types';

export function subscribeToUserActivities(
  userId: string,
  onUpdate: (activities: ActivityEvent[]) => void
): () => void {
  const path = 'activities';
  const q = query(collection(db, path), where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as ActivityEvent[];

      // Sort client-side by timestamp descending to avoid compound index errors
      items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export async function logActivity(
  activity: Omit<ActivityEvent, 'id'>
): Promise<string> {
  const path = 'activities';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteActivity(activityId: string): Promise<void> {
  const path = `activities/${activityId}`;
  try {
    await deleteDoc(doc(db, 'activities', activityId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
