/** First-open app tour (re-open from Settings). */
export interface TourSlide {
  icon: string;
  title: string;
  body: string;
}

export const TOUR_SLIDES: TourSlide[] = [
  { icon: '💗', title: 'Welcome to Fit Mamma', body: 'Your own plan to your goal weight by Eid. Small steps, every day.' },
  { icon: '🍛', title: 'Log food in two taps', body: 'Tap Log, pick a dish, then choose ½, 1 or 2 portions. Desi food is already there.' },
  { icon: '▶️', title: 'Start workout', body: 'On Train, press Start workout. The app shows each set, counts your rest and speaks to you.' },
  { icon: '🔁', title: 'Machine busy?', body: "Tap “Can't use this machine?” and pick another exercise for the same muscles. Its animation shows too." },
  { icon: '🎬', title: 'Hindi videos', body: 'Every exercise and warm-up has a Hindi video button. Tap a warm-up to see how to do it.' },
  { icon: '🌙', title: 'Ramadan ready', body: 'In Ramadan the plan moves to after iftar: fewer sets, lighter, with sehri and iftar tips.' },
  { icon: '🔒', title: 'Only on your phone', body: 'Everything stays on this phone. Nothing is shared with anyone.' },
];
