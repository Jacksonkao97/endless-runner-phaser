import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { authReady, db } from "../firebase";

export interface LeaderboardEntry {
  name: string;
  score: number;
  duration: number; // seconds
}

export interface LeaderboardRecord extends LeaderboardEntry {
  id: string;
  timestamp: number | null; // ms since epoch, null if not yet resolved server-side
}

const SCORES_COLLECTION = "scores";

export async function submitScore(entry: LeaderboardEntry): Promise<void> {
  await authReady; // ensure we have an auth token before writing

  await addDoc(collection(db, SCORES_COLLECTION), {
    name: entry.name,
    score: entry.score,
    duration: entry.duration,
    timestamp: serverTimestamp(),
  });
}

export async function fetchTopScores(
  limitCount = 10,
): Promise<LeaderboardRecord[]> {
  await authReady;

  const q = query(
    collection(db, SCORES_COLLECTION),
    orderBy("score", "desc"),
    limit(limitCount),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name ?? "???",
      score: data.score ?? 0,
      duration: data.duration ?? 0,
      timestamp: data.timestamp?.toMillis?.() ?? null,
    };
  });
}
