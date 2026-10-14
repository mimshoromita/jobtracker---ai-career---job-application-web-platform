import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Application, ApplicationStatus, StatusLog } from '../types';
import { logActivity } from './activityService';

export async function submitApplication(
  appData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = 'applications';
  try {
    const now = new Date().toISOString();
    const initialStatusLog: StatusLog = {
      status: 'submitted',
      timestamp: now,
      note: 'Application received and recorded in pipeline.',
      updatedBy: appData.candidateName || 'Candidate',
    };

    const docRef = await addDoc(collection(db, 'applications'), {
      ...appData,
      statusHistory: [initialStatusLog],
      createdAt: now,
      updatedAt: now,
    });

    // Log recent activity event in real-time Firestore
    try {
      await logActivity({
        userId: appData.candidateId,
        type: 'application_update',
        title: `Applied to ${appData.jobTitle}`,
        description: `Application submitted to ${appData.company} with ${appData.matchScore}% TF-IDF match score.`,
        timestamp: now,
        metadata: {
          jobId: appData.jobId,
          jobTitle: appData.jobTitle,
          company: appData.company,
          status: 'submitted',
        },
      });
    } catch (logErr) {
      console.warn('Activity log notice:', logErr);
    }

    // Increment applicantsCount on the referenced job document
    try {
      await updateDoc(doc(db, 'jobs', appData.jobId), {
        applicantsCount: increment(1),
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Could not increment job applicant counter:', err);
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToCandidateApplications(
  candidateId: string,
  onUpdate: (apps: Application[]) => void
): () => void {
  const path = 'applications';
  const q = query(collection(db, path), where('candidateId', '==', candidateId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Application)
      );
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function getCandidateApplications(
  candidateId: string
): Promise<Application[]> {
  const path = 'applications';
  try {
    const q = query(
      collection(db, 'applications'),
      where('candidateId', '==', candidateId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Application)
    );
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getRecruiterApplications(
  recruiterId: string
): Promise<Application[]> {
  const path = 'applications';
  try {
    const q = query(
      collection(db, 'applications'),
      where('recruiterId', '==', recruiterId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Application)
    );
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getAllApplications(): Promise<Application[]> {
  const path = 'applications';
  try {
    const snap = await getDocs(collection(db, 'applications'));
    const list = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Application)
    );
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateApplicationStatus(
  appId: string,
  newStatus: ApplicationStatus,
  note: string,
  updatedBy: string,
  existingHistory: StatusLog[] = [],
  candidateId?: string,
  jobTitle?: string,
  company?: string
): Promise<void> {
  const path = `applications/${appId}`;
  try {
    const now = new Date().toISOString();
    const newEntry: StatusLog = {
      status: newStatus,
      timestamp: now,
      note: note || `Application status changed to ${newStatus.replace('_', ' ')}`,
      updatedBy,
    };

    const updatedHistory = [...existingHistory, newEntry];

    await updateDoc(doc(db, 'applications', appId), {
      status: newStatus,
      notes: note,
      statusHistory: updatedHistory,
      updatedAt: now,
    });

    // If candidateId is provided, log activity directly to their feed
    if (candidateId) {
      try {
        await logActivity({
          userId: candidateId,
          type: 'application_update',
          title: `Status: ${newStatus.replace('_', ' ').toUpperCase()} (${jobTitle || 'Role'})`,
          description: note || `Your application at ${company || 'the company'} was updated to ${newStatus.replace('_', ' ')} by ${updatedBy}.`,
          timestamp: now,
          metadata: {
            jobTitle,
            company,
            status: newStatus,
          },
        });
      } catch (logErr) {
        console.warn('Candidate activity log error:', logErr);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
