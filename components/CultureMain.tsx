import type { ReactNode } from "react";
import EventCard, { type EventCardData } from "./EventCard";

type Dict = {
  title: string;
  subtitle: string;
  awards: string;
  awardsSubtitle: string;
  cinemaTv: string;
  cinemaTvSubtitle: string;
  celebrity: string;
  celebritySubtitle: string;
};

type Groups = {
  awards: EventCardData[];
  cinemaTv: EventCardData[];
  celebrity: EventCardData[];
};

/**
 * Главное окошко «Культура» на странице категории Культура.
 * Внутри — окна в том же стиле, что и на главной странице:
 * «Кинопремии» (Оскар, Грэмми, Эмми),
 * «Кино и ТВ» (Кассовые сборы: рекорды фильмов в прокате, Финалы реалити-шоу),
 * «Светская жизнь» (Скандалы, Слухи о знаменитостях).
 */
export default function CultureMain({
  locale,
  dict,
  groups,
  cardLabels,
}: {
  locale: string;
  dict: Dict;
  groups: Groups;
  cardLabels: { from: string; current: string; open: string; closed: string };
}) {
  const hasCards = Object.values(groups).some((arr) => arr.length > 0);
  if (!hasCards) return null;

  return (
    <section className="neon-card p-6 sm:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">{dict.title}</h2>
        <p className="mt-1 text-sm text-white/60">{dict.subtitle}</p>
      </div>

      {/* Кинопремии: Оскар, Грэмми, Эмми */}
      {groups.awards.length > 0 && (
        <GroupWindow
          title={dict.awards}
          subtitle={dict.awardsSubtitle}
          cols="sm:grid-cols-2 lg:grid-cols-3"
        >
          {groups.awards.map((e) => (
            <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
          ))}
        </GroupWindow>
      )}

      {/* Кино и ТВ: кассовые сборы, финалы реалити-шоу */}
      {groups.cinemaTv.length > 0 && (
        <GroupWindow
          title={dict.cinemaTv}
          subtitle={dict.cinemaTvSubtitle}
          cols="sm:grid-cols-2"
        >
          {groups.cinemaTv.map((e) => (
            <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
          ))}
        </GroupWindow>
      )}

      {/* Светская жизнь: скандалы, слухи о знаменитостях */}
      {groups.celebrity.length > 0 && (
        <GroupWindow
          title={dict.celebrity}
          subtitle={dict.celebritySubtitle}
          cols="sm:grid-cols-2"
        >
          {groups.celebrity.map((e) => (
            <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
          ))}
        </GroupWindow>
      )}
    </section>
  );
}

/** Вложенное окошко-группа внутри главного окна «Культура». */
function GroupWindow({
  title,
  subtitle,
  cols,
  children,
}: {
  title: string;
  subtitle: string;
  cols: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-night-line bg-night-light/40 p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="h-1.5 w-6 rounded-full bg-accent shadow-glowAccent" />
          {title}
        </h3>
        <p className="mt-1 pl-8 text-sm text-white/60">{subtitle}</p>
      </div>
      <div className={`grid gap-6 ${cols}`}>{children}</div>
    </div>
  );
}
