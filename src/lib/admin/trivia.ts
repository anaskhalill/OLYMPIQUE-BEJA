import "server-only";

export interface TriviaQuestion {
  q: string;
  qAr: string;
  qFr: string;
  options: string[];
  correct: number;
}

const QUESTIONS: TriviaQuestion[] = [
  { q: "In which year was Olympique Béja founded?", qAr: "في أي عام تأسس الأولمبي الباجي؟", qFr: "En quelle année l'Olympique de Béja a-t-il été fondé ?", options: ["1929", "1936", "1921", "1956"], correct: 0 },
  { q: "What is the nickname of Olympique Béja?", qAr: "ما هو لقب الأولمبي الباجي؟", qFr: "Quel est le surnom de l'Olympique de Béja ?", options: ["The Eagles", "The Lions", "El Lampik (The Storks)", "The Hawks"], correct: 2 },
  { q: "What are the club's colours?", qAr: "ما هي ألوان النادي؟", qFr: "Quelles sont les couleurs du club ?", options: ["Green and white", "Red and white", "Blue and white", "Yellow and black"], correct: 1 },
  { q: "Where is Olympique Béja based?", qAr: "أين يقع مقر الأولمبي الباجي؟", qFr: "Où est basé l'Olympique de Béja ?", options: ["Algiers", "Tunis", "Béja", "Sfax"], correct: 2 },
  { q: "What is the name of their home stadium?", qAr: "ما هو اسم ملعبهم الرئيسي؟", qFr: "Quel est le nom de leur stade ?", options: ["Boujemaa Kmiti Stadium", "Olympic Stadium", "Stade 15 Octobre", "Stade Taïeb Mhiri"], correct: 0 },
  { q: "How many Tunisian Cups has Olympique Béja won?", qAr: "كم مرة فاز الأولمبي الباجي بكأس تونس؟", qFr: "Combien de Coupes de Tunisie l'Olympique de Béja a-t-il remportées ?", options: ["1", "2", "3", "5"], correct: 2 },
];

function todayKey(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function dateHash(dateStr: string): number {
  return dateStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

export function getQuestionForToday(): TriviaQuestion {
  const today = todayKey();
  const hash = dateHash(today);
  return QUESTIONS[hash % QUESTIONS.length];
}

export function isAnswerCorrect(answerIndex: number): boolean {
  const question = getQuestionForToday();
  return answerIndex === question.correct;
}

export { todayKey };
