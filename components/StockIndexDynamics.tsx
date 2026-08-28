import EventCard, { type EventCardData } from "./EventCard";

type Dict = {
  title: string;
  subtitle: string;
};

/**
 * Окно «Динамика фондовых индексов» — три окошка (акции, мировые биржи,
 * российские биржи) в том же стиле, что и окна на главной странице:
 * размытое фото-фон по названию и кнопка «Открыть» → страница прогноза.
 */
export default function StockIndexDynamics({
  locale,
  dict,
  cards,
  cardLabels,
}: {
  locale: string;
  dict: Dict;
  cards: EventCardData[];
  cardLabels: { from: string; current: string; open: string; closed: string };
}) {
  if (!cards.length) return null;
  return (
    <section className="neon-card p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{dict.title}</h2>
        <p className="mt-1 text-sm text-white/60">{dict.subtitle}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((e) => (
          <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
        ))}
      </div>
    </section>
  );
}
