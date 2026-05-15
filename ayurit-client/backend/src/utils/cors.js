const normalizeOrigin = (value) => String(value || '').trim().replace(/\/$/, '');

const getLoopbackAlias = (origin) => {
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost') {
      return `${url.protocol}//127.0.0.1${url.port ? `:${url.port}` : ''}`;
    }

    if (url.hostname === '127.0.0.1') {
      return `${url.protocol}//localhost${url.port ? `:${url.port}` : ''}`;
    }
  } catch {
    return null;
  }

  return null;
};

export const createCorsOriginMatcher = (allowedOrigin) => {
  const normalized = normalizeOrigin(allowedOrigin || '*');

  if (!normalized || normalized === '*') {
    return () => true;
  }

  const allowedOrigins = normalized
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return (origin) => {
    if (!origin) {
      return true;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin)) {
      return true;
    }

    const alias = getLoopbackAlias(normalizedOrigin);
    return alias ? allowedOrigins.includes(alias) : false;
  };
};