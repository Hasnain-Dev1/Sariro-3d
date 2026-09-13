export type PassageTopic = 'Story' | 'Science & nature' | 'History & people' | 'Everyday life' | 'India & the world' | 'Big ideas';

/**
 * About a minute of reading — roughly 150 words.
 *
 * Written to be SAID: no digits (a recogniser hears "nineteen forty-seven",
 * not "1947", and pronunciation would mark the child wrong for reading it
 * correctly), straight apostrophes only, and enough full stops and commas that
 * a reader has somewhere to breathe.
 */
export interface Passage {
  id: string;
  title: string;
  topic: PassageTopic;
  text: string;
}
