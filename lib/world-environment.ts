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
            ? '#193448'
            : up > 0.25
              ? '#382A20'
              : '#142A3B',
    fog: down > 0.25 ? '#312B34' : up > 0.25 ? '#51392F' : '#263B4A',
    sun: 1.94 + up * 0.46 - down * 0.6,
    exposure: 0.98 + up * 0.07 - down * 0.13,
    flow:
      1 + up * 0.75 - down * 0.35 + (information ? 0.2 : expansion ? 0.35 : 0),
    clouds: 0.25 + down * 0.28,
    risk: down,
  };
}
