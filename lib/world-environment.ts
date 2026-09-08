import type { Weather } from './civilization-model';
/** Art direction derived from the selected, explicitly sourced market/news state. */
export function environmentFor(weather: Weather, change = 0) {
  const market = Math.max(
    -1,
    Math.min(1, Number.isFinite(change) ? change / 8 : 0),
  );
  const down =
    weather === 'storm'
      ? Math.max(0.55, -market)
      : weather === 'attack'
        ? 0.78
        : Math.max(0, -market);
  const up = weather === 'tide' ? Math.max(0.55, market) : Math.max(0, market);
  const information = weather === 'news' || weather === 'nvda';
  const expansion = weather === 'chain';
  return {
    sky:
      down > 0.25
        ? '#171823'
        : expansion
          ? '#17302E'
          : information
            ? '#142A38'
            : up > 0.25
              ? '#30241C'
              : '#18212C',
    fog: down > 0.25 ? '#2F2930' : up > 0.25 ? '#4A3329' : '#34333A',
    sun: 1.95 + up * 0.7 - down * 0.82,
    exposure: 1.08 + up * 0.1 - down * 0.18,
    flow:
      1 + up * 0.75 - down * 0.35 + (information ? 0.2 : expansion ? 0.35 : 0),
    clouds: 0.25 + down * 0.28,
    risk: down,
  };
}
