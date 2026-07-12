import { useEffect, useRef, useState } from "react";
import type { SeasonId } from "../game/seasons";

interface SeasonalBgmProps {
  season: SeasonId;
}

type ScreenBgmId = "report" | "ending";

const BGM_VOLUME = 0.34;
const BGM_PREF_KEY = "library-management-sim.bgm.enabled.v1";
let sharedAudio: HTMLAudioElement | null = null;
let sharedFadeFrame: number | null = null;
let sharedTrackRequest = 0;

const getSharedAudio = () => {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.loop = true;
    sharedAudio.preload = "auto";
    sharedAudio.volume = 0;
  }

  return sharedAudio;
};

const clearSharedFade = () => {
  if (sharedFadeFrame !== null) {
    window.cancelAnimationFrame(sharedFadeFrame);
    sharedFadeFrame = null;
  }
};

const fadeSharedAudio = (
  audio: HTMLAudioElement,
  targetVolume: number,
  duration = 700,
  onDone?: () => void,
) => {
  clearSharedFade();
  const startVolume = audio.volume;
  const startedAt = window.performance.now();

  const step = (time: number) => {
    const progress = Math.max(0, Math.min(1, (time - startedAt) / duration));
    const nextVolume = startVolume + (targetVolume - startVolume) * progress;
    audio.volume = Math.max(0, Math.min(1, nextVolume));

    if (progress < 1) {
      sharedFadeFrame = window.requestAnimationFrame(step);
      return;
    }

    sharedFadeFrame = null;
    onDone?.();
  };

  sharedFadeFrame = window.requestAnimationFrame(step);
};

const waitUntilPlayable = (audio: HTMLAudioElement) =>
  new Promise<void>((resolve, reject) => {
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      resolve();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("BGM loading timed out."));
    }, 5000);
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
    const handleCanPlay = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("BGM could not be loaded."));
    };

    audio.addEventListener("canplay", handleCanPlay, { once: true });
    audio.addEventListener("error", handleError, { once: true });
  });

const startPlayback = async (audio: HTMLAudioElement) => {
  try {
    await audio.play();
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "AbortError") {
      throw error;
    }

    await waitUntilPlayable(audio);
    await audio.play();
  }
};

interface TrackCallbacks {
  onStarted?: () => void;
  onBlocked?: () => void;
}

const switchSharedTrack = (
  trackId: string,
  trackUrl: string,
  fadeInDuration = 900,
  callbacks: TrackCallbacks = {},
) => {
  const audio = getSharedAudio();
  const request = ++sharedTrackRequest;

  const startTrack = async () => {
    if (request !== sharedTrackRequest) return;
    clearSharedFade();

    if (audio.dataset.track !== trackId) {
      audio.autoplay = true;
      audio.dataset.track = trackId;
      audio.src = trackUrl;
      audio.currentTime = 0;
      audio.volume = 0;
    }

    try {
      await startPlayback(audio);
      if (request !== sharedTrackRequest) return;
      callbacks.onStarted?.();
      fadeSharedAudio(audio, BGM_VOLUME, fadeInDuration);
    } catch {
      if (request === sharedTrackRequest) callbacks.onBlocked?.();
    }
  };

  if (!audio.paused && audio.dataset.track !== trackId && audio.volume > 0) {
    fadeSharedAudio(audio, 0, 420, () => {
      void startTrack();
    });
    return;
  }

  void startTrack();
};

const loadBgmPreference = () => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(BGM_PREF_KEY) !== "off";
};

export const BgmPreferenceButton = () => {
  const [enabled, setEnabled] = useState(loadBgmPreference);

  const handleToggle = () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    window.localStorage.setItem(BGM_PREF_KEY, nextEnabled ? "on" : "off");
    if (!nextEnabled) stopSeasonalBgm();
  };

  return (
    <button
      type="button"
      className={`ghost-button bgm-button bgm-preference-button ${enabled ? "is-enabled" : ""}`}
      onClick={handleToggle}
      aria-pressed={enabled}
      title="オープニング以降のBGMのON/OFF"
    >
      <span className="material-symbols-rounded" aria-hidden="true">{enabled ? "volume_up" : "volume_off"}</span>
      {enabled ? "BGM ON" : "BGM OFF"}
    </button>
  );
};

export const playScreenBgm = (track: ScreenBgmId) => {
  if (!loadBgmPreference()) return;
  const trackUrl = `${import.meta.env.BASE_URL}assets/bgm/${track}.mp3`;
  switchSharedTrack(`screen:${track}`, trackUrl, 1000);
};

export const stopSeasonalBgm = () => {
  sharedTrackRequest += 1;
  if (!sharedAudio) return;

  clearSharedFade();
  sharedAudio.pause();
  sharedAudio.volume = 0;
};

export const SeasonalBgm = ({ season }: SeasonalBgmProps) => {
  const [enabled, setEnabled] = useState(loadBgmPreference);
  const [needsGesture, setNeedsGesture] = useState(false);
  const mountedRef = useRef(true);
  const seasonUrl = `${import.meta.env.BASE_URL}assets/bgm/${season}.mp3`;
  const seasonTrackId = `season:${season}`;

  const playSeason = (fadeInDuration = 900) => {
    switchSharedTrack(seasonTrackId, seasonUrl, fadeInDuration, {
      onStarted: () => {
        if (mountedRef.current) setNeedsGesture(false);
      },
      onBlocked: () => {
        if (mountedRef.current) setNeedsGesture(true);
      },
    });
  };

  const stopBgm = () => {
    sharedTrackRequest += 1;
    if (!sharedAudio) return;

    fadeSharedAudio(sharedAudio, 0, 420, () => {
      sharedAudio?.pause();
    });
  };

  useEffect(() => {
    window.localStorage.setItem(BGM_PREF_KEY, enabled ? "on" : "off");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      stopBgm();
      return;
    }

    playSeason();
  }, [enabled, seasonTrackId, seasonUrl]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleToggle = () => {
    if (enabled && !needsGesture) {
      setEnabled(false);
      stopBgm();
      return;
    }

    setEnabled(true);
    playSeason(500);
  };

  const label = !enabled ? "BGM OFF" : needsGesture ? "BGM開始" : "BGM ON";
  const icon = !enabled ? "volume_off" : needsGesture ? "play_circle" : "volume_up";

  return (
    <button
      type="button"
      className={`ghost-button bgm-button ${enabled && !needsGesture ? "is-playing" : ""}`}
      onClick={handleToggle}
      aria-pressed={enabled && !needsGesture}
      title={needsGesture ? "クリックするとBGMを再生します" : "BGMのON/OFF"}
    >
      <span className="material-symbols-rounded" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
};
