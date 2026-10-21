/*===== Card Voice Props =====*/
/** What a card's bubble needs from the page's `useCardVoice`: its words, whether it has the word now, and its take. */
export type CardVoiceProps = {
  line: string;
  speaking: boolean;
  hasSpoken: boolean;
  take: number;
};
