// Firebase is loaded on demand (and prefetched from main.ts) to keep it out of
// the main bundle.
async function loadFirestore() {
  const [firestore, { authReady, db }] = await Promise.all([
    import("firebase/firestore"),
    import("../firebase"),
  ]);
  await authReady; // ensure we have an auth token before reading or writing
  return { ...firestore, db };
}

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
  const { addDoc, collection, db, serverTimestamp } = await loadFirestore();

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
  const { collection, db, getDocs, limit, orderBy, query } =
    await loadFirestore();

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
