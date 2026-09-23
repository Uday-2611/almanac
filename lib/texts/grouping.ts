export type TextNoteForGrouping = {
  id: string;
  journalDate: string;
};

export function monthKeyFromJournalDate(journalDate: string) {
  return journalDate.slice(0, 7);
}

export function groupTextNotesByMonth<T extends TextNoteForGrouping>(notes: T[]) {
  const groups: { key: string; notes: T[] }[] = [];

  for (const note of notes) {
    const key = monthKeyFromJournalDate(note.journalDate);
    const current = groups.at(-1);
    if (current?.key === key) current.notes.push(note);
    else groups.push({ key, notes: [note] });
  }

  return groups;
}

export function formatJournalMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}
