export type SoundEffectId =
  | "ui_select"
  | "ui_cancel"
  | "calendar_advance"
  | "report_open"
  | "event";

const soundVolumes: Record<SoundEffectId, number> = {
  ui_select: 0.18,
  ui_cancel: 0.16,
  calendar_advance: 0.2,
  report_open: 0.2,
  event: 0.22,
};

const audioCache = new Map<SoundEffectId, HTMLAudioElement>();

const getAudio = (sound: SoundEffectId) => {
  const cached = audioCache.get(sound);
  if (cached) return cached;

  const audio = new Audio(`${import.meta.env.BASE_URL}assets/SE/${sound}.mp3`);
  audio.preload = "auto";
  audio.volume = soundVolumes[sound];
  audioCache.set(sound, audio);
  return audio;
};

export const playSoundEffect = (sound: SoundEffectId) => {
  const audio = getAudio(sound);
  audio.pause();
  audio.currentTime = 0;
  audio.volume = soundVolumes[sound];
  void audio.play().catch(() => {
    // Browsers may block audio until the first user gesture.
  });
};
