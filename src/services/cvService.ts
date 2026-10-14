import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CV } from '../types';

export async function getUserCV(userId: string): Promise<CV | null> {
  const path = 'cvs';
  try {
    const q = query(collection(db, 'cvs'), where('userId', '==', userId), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as CV;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveUserCV(cvData: Omit<CV, 'id'>, existingId?: string): Promise<string> {
  const cvId = existingId || `${cvData.userId}_primary_cv`;
  const path = `cvs/${cvId}`;
  try {
    const record = {
      ...cvData,
      updatedAt: new Date().toISOString(),
      createdAt: cvData.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'cvs', cvId), record, { merge: true });
    return cvId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
