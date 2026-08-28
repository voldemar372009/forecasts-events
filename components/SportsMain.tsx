import type { ReactNode } from "react";
import EventCard, { type EventCardData } from "./EventCard";

type Dict = {
  title: string;
  subtitle: string;
  popularLeagues: string;
  popularLeaguesSubtitle: string;
  esports: string;
  esportsSubtitle: string;
  achievements: string;
  achievementsSubtitle: string;
};

type Groups = {
  top: EventCardData[];
  leagues: EventCardData[];
  esports: EventCardData[];
  achievements: EventCardData[];
};

/**
 * Главное окошко «Спорт» на странице категории Спорт.
 * Внутри — окна в том же стиле, что и на главной странице:
 * «Чемпионат мира по футболу», «Олимпийские игры», «Супербоул»,
 * а также группы окон «Популярные лиги» (НБА, АПЛ, НФЛ, Еврокубки),
 * «Киберспорт» (Dota 2, League of Legends, CS2) и
 * «Индивидуальные достижения» (Рекорды, Переходы игроков, Награды MVP).
 */
export default function SportsMain({
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

      {/* Топ-события: Чемпионат мира, Олимпиада, Супербоул */}
      {groups.top.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.top.map((e) => (
            <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
          ))}
        </div>
      )}

      {/* Популярные лиги: НБА, АПЛ, НФЛ, Еврокубки */}
      {groups.leagues.length > 0 && (
        <GroupWindow
          title={dict.popularLeagues}
          subtitle={dict.popularLeaguesSubtitle}
          cols="sm:grid-cols-2 lg:grid-cols-4"
        >
          {groups.leagues.map((e) => (
            <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
          ))}
        </GroupWindow>
      )}

      {/* Киберспорт: Dota 2, League of Legends, CS2 */}
      {groups.esports.length > 0 && (
        <GroupWindow
          title={dict.esports}
          subtitle={dict.esportsSubtitle}
          cols="sm:grid-cols-2 lg:grid-cols-3"
        >
          {groups.esports.map((e) => (
            <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
          ))}
        </GroupWindow>
      )}

      {/* Индивидуальные достижения: рекорды, переходы игроков, награды MVP */}
      {groups.achievements.length > 0 && (
        <GroupWindow
          title={dict.achievements}
          subtitle={dict.achievementsSubtitle}
          cols="sm:grid-cols-2 lg:grid-cols-3"
        >
          {groups.achievements.map((e) => (
            <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
          ))}
        </GroupWindow>
      )}
    </section>
  );
}

/** Вложенное окошко-группа внутри главного окна «Спорт». */
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
