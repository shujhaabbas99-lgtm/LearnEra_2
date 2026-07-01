import { initializeApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  type User,
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { Curriculum, StudyLog, UserStats } from "./types";

// ── Firebase project configuration ────────────────────────────────────────
// Project: cultivated-host-2k91c (managed via Google AI Studio)
const firebaseConfig = {
  apiKey: "AIzaSyCIOXv6wwqeOpSwHc5O-Xrni1-selrYuDk",
  authDomain: "cultivated-host-2k91c.firebaseapp.com",
  projectId: "cultivated-host-2k91c",
  storageBucket: "cultivated-host-2k91c.firebasestorage.app",
  messagingSenderId: "327093382651",
  appId: "1:327093382651:web:e97f6e5c720bb5f9c72f5e"
};

// ── Initialize Firebase app ────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

// ── Firestore ──────────────────────────────────────────────────────────────
export const db = getFirestore(app);

// ── Firebase Auth — browserLocalPersistence so sessions survive mobile ────
// webview restarts and tab refreshes without requiring re-login.
export const auth = getAuth(app);

// Apply localStorage persistence immediately (async; safe to call at module load)
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Firebase Auth: could not set browserLocalPersistence:", err?.message);
});

/**
 * Subscribe to Firebase Auth state changes.
 * Returns the unsubscribe function — call it in a useEffect cleanup.
 *
 * Usage:
 *   const unsub = onFirebaseAuthChange((user) => setCurrentUser(user));
 *   return () => unsub();
 */
export function onFirebaseAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign in anonymously with Firebase Auth.
 * Returns the stable uid that persists across sessions via browserLocalPersistence.
 * Falls back gracefully — if Firebase is unreachable the caller handles the error.
 */
export async function firebaseSignIn(): Promise<string> {
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

/**
 * Sign out the current Firebase user and clear the persisted session.
 */
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

// ── User Profile — full app state stored per authenticated user ────────────
// Collection: userProfiles/{uid}  (one document per user, replaces localStorage blob)

export interface UserProfileData {
  uid: string;
  userName: string;
  userEmail: string;
  curriculumLevel: string;
  quizHistory: any[];
  subjectDifficulties: Record<string, string>;
  customSubjects: Array<{ id: string; name: string; description: string; colorClass: string; topics: any[] }>;
  topicsLearnedCount: number;
  topicStatuses: Record<string, string>;
  totalTimeStudied: number;
  timeSpentPerTopic: Record<string, number>;
  timeStudiedByDate: Record<string, number>;
  savedFlashcards: any[];
  questionBank: any[];
  updatedAt: string;
}

const USER_PROFILES_COL = "userProfiles";

export async function saveUserProfile(
  uid: string,
  data: Omit<UserProfileData, "uid" | "updatedAt">
): Promise<void> {
  try {
    await setDoc(doc(db, USER_PROFILES_COL, uid), {
      ...data,
      uid,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Firestore: error saving user profile:", err);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  try {
    const snap = await getDoc(doc(db, USER_PROFILES_COL, uid));
    if (snap.exists()) return snap.data() as UserProfileData;
    return null;
  } catch (err) {
    console.error("Firestore: error fetching user profile:", err);
    return null;
  }
}

// COLLECTION NAMES
const CURRICULA_COL = "curricula";
const STUDY_LOGS_COL = "studyLogs";
const STATS_COL = "userStats";

/**
 * Curricula DB Operations
 */
export async function saveCurriculum(curriculum: Curriculum): Promise<void> {
  await setDoc(doc(db, CURRICULA_COL, curriculum.id), curriculum);
}

export async function getUserCurricula(userId: string): Promise<Curriculum[]> {
  try {
    const q = query(collection(db, CURRICULA_COL), where("userId", "==", userId));
    const snap = await getDocs(q);
    const list: Curriculum[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Curriculum);
    });
    return list;
  } catch (err) {
    console.error("Error fetching curricula:", err);
    return [];
  }
}

export async function updateCurriculum(curriculumId: string, updatedModules: any[]): Promise<void> {
  const ref = doc(db, CURRICULA_COL, curriculumId);
  await updateDoc(ref, { modules: updatedModules });
}

export async function deleteCurriculum(curriculumId: string): Promise<void> {
  await deleteDoc(doc(db, CURRICULA_COL, curriculumId));
}

/**
 * Study Logs Operations
 */
export async function addStudyLog(log: StudyLog): Promise<void> {
  await setDoc(doc(db, STUDY_LOGS_COL, log.id), log);
}

export async function getUserStudyLogs(userId: string): Promise<StudyLog[]> {
  try {
    const q = query(
      collection(db, STUDY_LOGS_COL), 
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const list: StudyLog[] = [];
    snap.forEach((d) => {
      list.push(d.data() as StudyLog);
    });
    // Sort client-side by date descending
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error("Error fetching study logs:", err);
    return [];
  }
}

/**
 * User Stats DB Operations
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const d = await getDoc(doc(db, STATS_COL, userId));
    if (d.exists()) {
      return d.data() as UserStats;
    }
    return null;
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return null;
  }
}

export async function saveUserStats(stats: UserStats): Promise<void> {
  await setDoc(doc(db, STATS_COL, stats.userId), stats);
}
