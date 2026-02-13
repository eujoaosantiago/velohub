type FipeModelLike = {
  nome?: string;
};

export const maskPlate = (value: string) => {
  const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (v.length > 7) return v.slice(0, 7);
  return v;
};

export const splitModelVersion = (fullName: string) => {
  const trimmed = fullName.trim();
  if (!trimmed) return { model: '', version: '' };
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 1) {
    return { model: trimmed, version: '' };
  }

  const isMarker = (token: string) => /\d/.test(token) || (/^[A-Z]{2,}$/.test(token) && token.length >= 2);
  let splitIndex = tokens.findIndex((token, index) => index > 0 && isMarker(token));
  if (splitIndex === -1) {
    splitIndex = 1;
  }

  const model = tokens.slice(0, splitIndex).join(' ');
  const version = tokens.slice(splitIndex).join(' ');
  return { model, version };
};

export const getBestModelPrefix = (fullName: string, models: FipeModelLike[]) => {
  const normalizedFull = fullName.toLowerCase();
  let bestMatch = '';

  models.forEach((m) => {
    const name = (m.nome || '').trim();
    if (!name) return;
    const normalizedName = name.toLowerCase();
    if (normalizedFull.startsWith(normalizedName) && name.length > bestMatch.length) {
      bestMatch = name;
    }
  });

  return bestMatch;
};
