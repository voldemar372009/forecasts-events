import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import NewForecastForm from "@/components/NewForecastForm";

export default async function NewForecastPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);

  return (
    <div className="fade-in space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">{dict.newForecast.title}</h1>
        <p className="mt-2 text-white/60">{dict.newForecast.subtitle}</p>
      </div>
      <NewForecastForm
        locale={locale}
        categories={[...CATEGORIES]}
        categoryLabels={dict.category}
        price={10}
        currency="EUR"
        dict={{
          marketName: dict.newForecast.marketName,
          marketNamePlaceholder: dict.newForecast.marketNamePlaceholder,
          category: dict.newForecast.category,
          currentPrice: dict.newForecast.currentPrice,
          currentPriceHint: dict.newForecast.currentPriceHint,
          chooseDate: dict.eventPage.chooseDate,
          dateHint: dict.eventPage.dateHint,
          priceLabel: dict.eventPage.priceLabel,
          buy: dict.eventPage.buy,
          buyPending: dict.eventPage.buyPending,
          nameRequired: dict.newForecast.nameRequired,
          priceInvalid: dict.newForecast.priceInvalid,
          dateRequired: dict.eventPage.dateRequired,
          note: dict.newForecast.note,
          autoCategory: dict.newForecast.autoCategory,
          autoSource: dict.newForecast.autoSource,
        }}
      />
    </div>
  );
}
