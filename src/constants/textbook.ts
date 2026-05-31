export interface QuizQuestion {
  q: string;
  opts: string[];
  a: number;
  e: string;
}

export interface Chapter {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  content: string; // Markdown or handled via custom renderer
  quiz?: QuizQuestion[];
}

export const TEXTBOOK_CHAPTERS: Chapter[] = [
  {
    id: 0,
    tag: "Chapter 01 · Foundations",
    title: "Sound & Wave Principles",
    subtitle: "The physical laws governing how sound propagates through tissue — the bedrock of every diagnostic decision you make.",
    content: "...", // Truncated for structure, will be expanded in component
    quiz: [
      {q:"What is the propagation speed of sound in soft tissue?",opts:["1,480 m/s","1,540 m/s","1,620 m/s","3,500 m/s"],a:1,e:"1,540 m/s (1.54 mm/µs) is hardwired into all diagnostic scanners as the assumed propagation speed in soft tissue."},
      // ... more
    ]
  },
  // ... more
];
