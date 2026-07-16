import { randomEvents } from "../data/randomEvents";
import type { RandomEventId } from "./types";

const STORAGE_KEY = "library-management-sim.memories.v1";

export const endingRanks = ["S", "A", "B", "C", "D", "E"] as const;
export type EndingRank = (typeof endingRanks)[number];

export interface MemoryCollection {
  randomEventIds: RandomEventId[];
  endingRanks: EndingRank[];
}

const emptyCollection = (): MemoryCollection => ({
  randomEventIds: [],
  endingRanks: [],
});

const isEndingRank = (value: string): value is EndingRank =>
  endingRanks.includes(value as EndingRank);

const randomEventIds = new Set(randomEvents.map((event) => event.id));
const isRandomEventId = (value: string): value is RandomEventId =>
  randomEventIds.has(value as RandomEventId);

export const loadMemoryCollection = (): MemoryCollection => {
  if (typeof window === "undefined") {
    return emptyCollection();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyCollection();
    }

    const parsed = JSON.parse(raw) as Partial<MemoryCollection>;
    return {
      randomEventIds: Array.isArray(parsed.randomEventIds)
        ? [...new Set(parsed.randomEventIds.filter(isRandomEventId))]
        : [],
      endingRanks: Array.isArray(parsed.endingRanks)
        ? [...new Set(parsed.endingRanks.filter(isEndingRank))]
        : [],
    };
  } catch {
    return emptyCollection();
  }
};

const saveMemoryCollection = (collection: MemoryCollection) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
};

export const unlockRandomEventMemory = (eventId: RandomEventId) => {
  const collection = loadMemoryCollection();
  if (collection.randomEventIds.includes(eventId)) {
    return;
  }

  saveMemoryCollection({
    ...collection,
    randomEventIds: [...collection.randomEventIds, eventId],
  });
};

export const unlockEndingMemory = (rank: string) => {
  if (!isEndingRank(rank)) {
    return;
  }

  const collection = loadMemoryCollection();
  if (collection.endingRanks.includes(rank)) {
    return;
  }

  saveMemoryCollection({
    ...collection,
    endingRanks: [...collection.endingRanks, rank],
  });
};
