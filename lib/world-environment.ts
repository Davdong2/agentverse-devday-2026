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
        ? '#8093AC'
        : expansion
          ? '#E2F7EB'
          : information
            ? '#DDF0FF'
            : up > 0.25
              ? '#FFF7E7'
              : '#F0F5FF',
    fog: down > 0.25 ? '#9DADBF' : up > 0.25 ? '#E4EAF0' : '#D9E5EF',
    sun: 2.05 + up * 0.65 - down * 0.92,
    exposure: 1.02 + up * 0.1 - down * 0.22,
    flow:
      1 + up * 0.75 - down * 0.35 + (information ? 0.2 : expansion ? 0.35 : 0),
    clouds: 0.25 + down * 0.28,
    risk: down,
  };
}
