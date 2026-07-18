import { commands } from "../data/commands";
import { policies } from "../data/policies";
import { createInitialState } from "./initialState";
import { loadMemoryCollection, type MemoryCollection } from "./memoryCollection";
import type { AssistantExpression, GameState, MilestoneEventId, Screen, StatKey, Stats } from "./types";

const STORAGE_KEY = "library-management-sim.save.v1";
const BACKUP_FORMAT = "university-library-maker.save";
const BACKUP_VERSION = 1;
const SAVE_FILE_MAGIC = "ULMSAVE/1";
const SAVE_FILE_EXTENSION = "ulmsave";

type SaveEncoding = "gzip" | "plain";

const statKeys: StatKey[] = [
  "budget",
  "collection",
  "studentSatisfaction",
  "facultyTrust",
  "executiveTrust",
  "publicity",
  "staffMorale",
  "staffFatigue",
  "facility",
  "researchSupport",
  "dx",
  "reputation",
];
const screens = new Set<Screen>(["title", "intro", "main", "help", "yearEnd", "ending", "gameOver"]);
const expressions = new Set<AssistantExpression>(["normal", "smile", "worried", "surprised", "explain", "cheer"]);
const commandIds = new Set(commands.map((command) => command.id));
const policyIds = new Set(policies.map((policy) => policy.id));
const milestoneEventIds = new Set<MilestoneEventId>(["faculty_thanks", "student_thanks"]);

export interface GameSaveBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  gameState: GameState;
  memoryCollection: MemoryCollection;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStats = (value: unknown): value is Stats =>
  isRecord(value) && statKeys.every((key) => typeof value[key] === "number" && Number.isFinite(value[key]));

const validateGameState = (value: unknown): GameState => {
  if (!isRecord(value) || !isStats(value.stats)) {
    throw new Error("ゲームの進行データが見つかりません。");
  }

  if (!Number.isInteger(value.turn) || Number(value.turn) < 1 || Number(value.turn) > 36) {
    throw new Error("セーブデータの年月が正しくありません。");
  }

  if (!Array.isArray(value.log) || !Array.isArray(value.selectedCommandIds)) {
    throw new Error("セーブデータの内容が不完全です。");
  }

  const base = createInitialState();
  const assistant = isRecord(value.assistant) && typeof value.assistant.message === "string"
    ? {
        expression: expressions.has(value.assistant.expression as AssistantExpression)
          ? value.assistant.expression as AssistantExpression
          : base.assistant.expression,
        message: value.assistant.message,
      }
    : base.assistant;
  const seenMilestoneEventIds = Array.isArray(value.seenMilestoneEventIds)
    ? [...new Set(value.seenMilestoneEventIds.filter(
        (id): id is MilestoneEventId => milestoneEventIds.has(id as MilestoneEventId),
      ))]
    : [];
  const pendingMilestoneEventId = milestoneEventIds.has(value.pendingMilestoneEventId as MilestoneEventId)
    ? value.pendingMilestoneEventId as MilestoneEventId
    : null;
  const debugMilestoneEventId = milestoneEventIds.has(value.debugMilestoneEventId as MilestoneEventId)
    ? value.debugMilestoneEventId as MilestoneEventId
    : undefined;

  return {
    ...base,
    ...(value as unknown as GameState),
    screen: screens.has(value.screen as Screen) ? value.screen as Screen : "title",
    previousScreen: screens.has(value.previousScreen as Screen) ? value.previousScreen as Screen : null,
    introMessageIndex: typeof value.introMessageIndex === "number"
      ? Math.max(0, Math.min(4, Math.round(value.introMessageIndex)))
      : 0,
    turn: Number(value.turn),
    apRemaining: typeof value.apRemaining === "number"
      ? Math.max(0, Math.min(3, Math.round(value.apRemaining)))
      : 3,
    stats: { ...value.stats },
    yearStartStats: isStats(value.yearStartStats) ? { ...value.yearStartStats } : { ...value.stats },
    selectedPolicyId: typeof value.selectedPolicyId === "string"
      && policyIds.has(value.selectedPolicyId as NonNullable<GameState["selectedPolicyId"]>)
      ? value.selectedPolicyId as NonNullable<GameState["selectedPolicyId"]>
      : null,
    selectedCommandIds: value.selectedCommandIds.filter((id): id is GameState["selectedCommandIds"][number] =>
      commandIds.has(id as GameState["selectedCommandIds"][number])),
    log: value.log.filter((entry): entry is GameState["log"][number] =>
      isRecord(entry) && typeof entry.turn === "number" && typeof entry.text === "string"),
    assistant,
    pendingMilestoneEventId,
    seenMilestoneEventIds: pendingMilestoneEventId && !seenMilestoneEventIds.includes(pendingMilestoneEventId)
      ? [...seenMilestoneEventIds, pendingMilestoneEventId]
      : seenMilestoneEventIds,
    debugMilestoneEventId,
    savedAt: typeof value.savedAt === "string" ? value.savedAt : new Date().toISOString(),
  };
};

const validateMemoryCollection = (value: unknown): MemoryCollection => {
  if (!isRecord(value)) {
    return { randomEventIds: [], endingRanks: [] };
  }

  return {
    randomEventIds: Array.isArray(value.randomEventIds)
      ? value.randomEventIds.filter((id): id is MemoryCollection["randomEventIds"][number] => typeof id === "string")
      : [],
    endingRanks: Array.isArray(value.endingRanks)
      ? value.endingRanks.filter((rank): rank is MemoryCollection["endingRanks"][number] => typeof rank === "string")
      : [],
  };
};

export const loadGame = (): GameState => {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }

    return validateGameState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
};

export const saveGame = (state: GameState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const deleteGame = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const hasSavedGame = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) !== null;
};

export const createGameSaveBackup = (state: GameState): GameSaveBackup => ({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  gameState: state,
  memoryCollection: loadMemoryCollection(),
});

const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return window.btoa(binary);
};

const decodeBase64 = (value: string): Uint8Array => {
  try {
    const binary = window.atob(value.replace(/\s/g, ""));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("セーブファイルの内容を読み取れませんでした。");
  }
};

const createChecksum = async (bytes: Uint8Array): Promise<string> => {
  const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await window.crypto.subtle.digest("SHA-256", source);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const compressBytes = async (bytes: Uint8Array): Promise<{ encoding: SaveEncoding; bytes: Uint8Array }> => {
  if (typeof CompressionStream === "undefined") {
    return { encoding: "plain", bytes };
  }

  const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const stream = new Blob([source]).stream().pipeThrough(new CompressionStream("gzip"));
  return { encoding: "gzip", bytes: new Uint8Array(await new Response(stream).arrayBuffer()) };
};

const decompressBytes = async (bytes: Uint8Array, encoding: SaveEncoding): Promise<Uint8Array> => {
  if (encoding === "plain") {
    return bytes;
  }

  if (typeof DecompressionStream === "undefined") {
    throw new Error("このブラウザでは圧縮されたセーブファイルを読み込めません。");
  }

  try {
    const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const stream = new Blob([source]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    throw new Error("セーブファイルを展開できませんでした。ファイルが破損している可能性があります。");
  }
};

const buildSaveFile = async (backup: GameSaveBackup): Promise<string> => {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(backup));
  const encoded = await compressBytes(jsonBytes);
  const checksum = await createChecksum(encoded.bytes);

  return [
    SAVE_FILE_MAGIC,
    `encoding:${encoded.encoding}`,
    `checksum:${checksum}`,
    "",
    encodeBase64(encoded.bytes),
  ].join("\n");
};

export const downloadGameSaveBackup = async (state: GameState): Promise<void> => {
  const backup = createGameSaveBackup(state);
  const file = await buildSaveFile(backup);
  const blob = new Blob([file], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = backup.exportedAt.slice(0, 16).replace(/[-:T]/g, "");

  link.href = url;
  link.download = `university-library-maker-save-${timestamp}.${SAVE_FILE_EXTENSION}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const parseBackupObject = (parsed: unknown): GameSaveBackup => {
  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT) {
    throw new Error("University Library Makerのセーブファイルではありません。");
  }

  if (parsed.version !== BACKUP_VERSION) {
    throw new Error("このバージョンでは読み込めないセーブファイルです。");
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
    gameState: validateGameState(parsed.gameState),
    memoryCollection: validateMemoryCollection(parsed.memoryCollection),
  };
};

const parseLegacyJsonBackup = (raw: string): GameSaveBackup => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("セーブファイルを読み込めませんでした。");
  }

  return parseBackupObject(parsed);
};

export const parseGameSaveBackup = async (raw: string): Promise<GameSaveBackup> => {
  const trimmed = raw.trim();

  // Version 1 initially shipped as readable JSON. Keep it importable for existing players.
  if (trimmed.startsWith("{")) {
    return parseLegacyJsonBackup(trimmed);
  }

  const match = trimmed.match(
    /^ULMSAVE\/1\r?\nencoding:(gzip|plain)\r?\nchecksum:([a-f0-9]{64})\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)$/,
  );
  if (!match) {
    throw new Error("University Library Makerのセーブファイルではありません。");
  }

  const [, encodingValue, expectedChecksum, encodedPayload] = match;
  if (!encodingValue || !expectedChecksum || !encodedPayload) {
    throw new Error("セーブファイルの内容を読み取れませんでした。");
  }

  const encoding = encodingValue as SaveEncoding;
  const payloadBytes = decodeBase64(encodedPayload);
  const actualChecksum = await createChecksum(payloadBytes);

  if (actualChecksum !== expectedChecksum) {
    throw new Error("セーブファイルが破損しているため、取り込みを中止しました。");
  }

  const jsonBytes = await decompressBytes(payloadBytes, encoding);
  return parseLegacyJsonBackup(new TextDecoder().decode(jsonBytes));
};
