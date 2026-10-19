// Deterministic outline from three answers. No prose is generated here: it returns the questions the writer must answer.
export function plan({ kind = "guide", does = "", reader = "", say = "" } = {}) {
  const q = (s) => String(s || "").trim().replace(/\s+/g, " ").slice(0, 240);
  does = q(does); reader = q(reader); say = q(say);
  if (kind === "adventure") {
    return {
      kind, target: "30+ pages, 5 to 7 endings, one twist at the midpoint",
      parts: [
        { n: 1, title: "The hook", ask: `Who is the hero, and what do they want tonight? Keep it to what a ${reader || "reader"} can picture in one line.` },
        { n: 2, title: "The first choice", ask: "Three doors. Make one funny, one brave, one sneaky. All three must lead somewhere good." },
        { n: 3, title: "The middle", ask: `Where does what you want to say land? You said: "${say || "..."}". Hide it in the story, not in a speech.` },
        { n: 4, title: "The twist", ask: "What does the reader believe that turns out to be wrong? Plant it on page 3, reveal it past page 15." },
        { n: 5, title: "The big choice", ask: "One decision with a real cost. No choice that is obviously right." },
        { n: 6, title: "The endings", ask: "Five to seven. One best, one funny, one that makes them go back and try again." },
      ],
    };
  }
  return {
    kind, target: "7 chapters, about 12 to 30 printed pages",
    parts: [
      { n: 1, title: "Who this is for", ask: `Describe ${reader || "your reader"} on the day they most need this. One real person, not a type.` },
      { n: 2, title: "What goes wrong", ask: `You ${does ? "work on: " + does : "do this work"}. List the three mistakes you see most often.` },
      { n: 3, title: "Your method", ask: "Walk through one real job from start to finish, in the order you did it." },
      { n: 4, title: "What you want to say", ask: `Your words: "${say || "..."}". Which chapter proves it? Put the proof there.` },
      { n: 5, title: "A case", ask: "One client, one number, one before and after. Names only if they agree." },
      { n: 6, title: "The checklist", ask: "What can the reader do in the next ten minutes? Five lines at most." },
      { n: 7, title: "About you", ask: "Three sentences, in your voice, with how to reach you." },
    ],
  };
}
