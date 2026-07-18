export interface MonthTransitionData {
  currentLabel: string;
  nextLabel: string;
  icon: string;
  season: "spring" | "summer" | "autumn" | "winter";
  progress: number;
}

interface MonthTransitionProps {
  transition: MonthTransitionData;
}

export const getMonthTransitionDuration = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 900 : 1540;

export const MonthTransition = ({ transition }: MonthTransitionProps) => (
  <div className={`month-transition month-transition--${transition.season}`} aria-hidden="true">
    <div className="month-transition__light" />
    <div className="month-transition__calendar">
      <div className="month-transition__heading">
        <span className="material-symbols-rounded">{transition.icon}</span>
        <span>MONTHLY CALENDAR</span>
      </div>
      <div className="month-transition__date-window">
        <strong className="month-transition__date month-transition__date--current">{transition.currentLabel}</strong>
        <strong className="month-transition__date month-transition__date--next">{transition.nextLabel}</strong>
      </div>
      <div className="month-transition__progress">
        <span><span style={{ width: `${Math.max(0, Math.min(100, (transition.progress / 36) * 100))}%` }} /></span>
        <small>{transition.progress} / 36 MONTHS</small>
      </div>
    </div>
  </div>
);
