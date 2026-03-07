import { useEffect, useState } from 'react';

export function useFetch(fn, deps = []) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');
  const [loading, setL]   = useState(true);

  useEffect(() => {
    let alive = true;
    setL(true); setError('');
    fn().then(d => { if (alive) setData(d); })
        .catch(e => { if (alive) setError(e.message || 'Error'); })
        .finally(() => { if (alive) setL(false); });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload: () => fn().then(setData) };
}
