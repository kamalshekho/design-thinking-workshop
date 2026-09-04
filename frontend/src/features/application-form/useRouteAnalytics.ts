import { useEffect, useRef } from 'react';

import { reportRouteSelection } from './api';
import { isFixedRoute } from './routes';

/** Reports each distinct route or category the applicant picks, once per selection. */
export function useRouteAnalytics(route: string) {
  const reportedRoute = useRef<string | null>(null);

  useEffect(() => {
    if (route === '' || route === reportedRoute.current) return;
    reportedRoute.current = route;
    reportRouteSelection(
      isFixedRoute(route)
        ? { type: 'fixed', route }
        : { type: 'category', categoryId: route },
    );
  }, [route]);
}
