import { useState } from 'react';
import type { AnalyticsPeriod } from '../types/analytics';
import { formatPeriodLabel, todayAnchor } from '../utils/analyticsPeriod';

export function useStatsPeriodFilter(initial: AnalyticsPeriod = 'MONTH') {
  const [period, setPeriod] = useState<AnalyticsPeriod>(initial);
  const [anchor, setAnchor] = useState(todayAnchor);

  return {
    period,
    anchor,
    periodLabel: formatPeriodLabel(period, anchor),
    onPeriodChange: (next: AnalyticsPeriod) => {
      setPeriod(next);
      setAnchor(todayAnchor());
    },
    onAnchorChange: setAnchor,
  };
}
