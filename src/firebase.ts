import { initializeApp } from "firebase/app";
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

const firebaseConfig = {
  apiKey: "AIzaSyCIOXv6wwqeOpSwHc5O-Xrni1-selrYuDk",
  authDomain: "cultivated-host-2k91c.firebaseapp.com",
  projectId: "cultivated-host-2k91c",
  storageBucket: "cultivated-host-2k91c.firebasestorage.app",
  messagingSenderId: "327093382651",
  appId: "1:327093382651:web:e97f6e5c720bb5f9c72f5e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
