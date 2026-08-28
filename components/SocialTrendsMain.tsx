import EventCard, { type EventCardData } from "./EventCard";

type Dict = {
  title: string;
  subtitle: string;
};

/**
 * Главное окошко «Социальные тренды и общество» на странице категории Общество.
 * Внутри — окошки в том же стиле, что и на главной странице:
 * «Демография: тренды рождаемости», «Демография: тренды миграции» —
 * размытое фото-фон по названию и кнопка «Открыть» → страница прогноза.
 */
export default function SocialTrendsMain({
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {cards.map((e) => (
          <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
        ))}
      </div>
    </section>
  );
}