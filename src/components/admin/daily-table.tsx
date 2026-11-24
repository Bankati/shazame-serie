import { ADMIN_TEXT } from "@/content/fr/admin";

export type DailyRow = {
  day: string;
  dayLabel: string;
  identifications: number;
  shown: number;
  counted: number;
  fromCache: number;
  aiCalls: number;
  aiCost: string;
};

const HEAD = "px-3 py-2 text-right font-medium";
const CELL = "px-3 py-2 text-right tabular-nums";

// Tableau dense de l'activité par jour (U25). Défilement horizontal sur petit écran.
export function DailyTable({ rows }: { rows: DailyRow[] }) {
  const text = ADMIN_TEXT.dashboard.table;
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[40rem] text-sm text-card-foreground">
        <caption className="sr-only">{text.caption}</caption>
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              {text.day}
            </th>
            <th scope="col" className={HEAD}>
              {text.identifications}
            </th>
            <th scope="col" className={HEAD}>
              {text.shown}
            </th>
            <th scope="col" className={HEAD}>
              {text.counted}
            </th>
            <th scope="col" className={HEAD}>
              {text.fromCache}
            </th>
            <th scope="col" className={HEAD}>
              {text.aiCalls}
            </th>
            <th scope="col" className={HEAD}>
              {text.aiCost}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.day} className="border-b border-border last:border-b-0">
              <th scope="row" className="px-3 py-2 text-left font-normal whitespace-nowrap">
                <time dateTime={row.day}>{row.dayLabel}</time>
              </th>
              <td className={CELL}>{row.identifications}</td>
              <td className={CELL}>{row.shown}</td>
              <td className={CELL}>{row.counted}</td>
              <td className={CELL}>{row.fromCache}</td>
              <td className={CELL}>{row.aiCalls}</td>
              <td className={CELL}>{row.aiCost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
