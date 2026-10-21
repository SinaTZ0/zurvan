import { useCallback, useEffect, useRef, useState } from "react";

/*===== Types =====*/
/** A card on the page, each with its own dog on its top edge. */
export type ProfileCard = "name" | "password" | "sheba";

/** What the speaking dog says: what his card is for, that a save failed, or that it went through. */
export type VoiceMood = "intro" | "error" | "saved";

export type CardVoice = {
  /** The card whose dog is speaking; the others are quiet. */
  card: ProfileCard;
  mood: VoiceMood;
  /** Counts every new line, so the speaking bubble is keyed by it and pops again. 0 is the load moment's line. */
  take: number;
  /**
   * What each card's dog said last. A dog that has spoken keeps his last words while his bubble fades out; one that
   * never spoke has no bubble at all, so nothing flashes on load.
   */
  said: Partial<Record<ProfileCard, VoiceMood>>;
};

/** How long «ثبت شد!» stays before the dog goes back to what his card is for. */
const SAVED_MS = 2800;

/*===== Card Voice =====*/
/**
 * Which card's dog speaks, and what he says. The section the person is in is the one whose dog speaks: focus entering
 * another card hands him the word (focus moving inside the same card changes nothing, so an error or «ثبت شد!» stays
 * while the person fixes the field). A failed submit makes that card's dog say the error line, a save «ثبت شد!» for a
 * moment. On load the name card's dog speaks.
 */
export function useCardVoice() {
  const [voice, setVoice] = useState<CardVoice>({ card: "name", mood: "intro", take: 0, said: { name: "intro" } });
  // The speaking card, read by `enter` without waiting for a render (focus events come in bursts).
  const speaking = useRef<ProfileCard>("name");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  /*------ Speak ------*/
  const speak = useCallback((card: ProfileCard, mood: VoiceMood) => {
    clearTimeout(timer.current);
    speaking.current = card;
    setVoice((current) => ({
      card,
      mood,
      take: current.take + 1,
      said: { ...current.said, [card]: mood },
    }));
  }, []);

  /*------ Focus ------*/
  const enter = useCallback(
    (card: ProfileCard) => {
      if (speaking.current !== card) speak(card, "intro");
    },
    [speak],
  );

  /*------ Failed and Saved ------*/
  const fail = useCallback((card: ProfileCard) => speak(card, "error"), [speak]);

  const celebrate = useCallback(
    (card: ProfileCard) => {
      speak(card, "saved");
      timer.current = setTimeout(() => speak(card, "intro"), SAVED_MS);
    },
    [speak],
  );

  return { voice, enter, fail, celebrate };
}
