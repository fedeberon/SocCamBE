export const COFRE_LETRA_ID_MAP: Record<string, string> = {
  '0': 'A',
  '1': 'B',
  '2': 'C',
  '3': 'D',
  '4': 'E',
  '5': 'F',
  '6': 'G',
  '7': 'H',
  '8': 'I',
  '9': 'J',
  '24': 'X',
  '26': 'Z',
};

export function cofreLetraDesdeCodigo(raw: unknown): string | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const directa = value.toUpperCase();
  if (/^[A-Z]$/.test(directa)) return directa;
  const mapeada = COFRE_LETRA_ID_MAP[value];
  return mapeada || null;
}

export function parseCajaCode(raw: unknown): { letra: string | null; numero: number | null } {
  const code = String(raw ?? '').trim().toUpperCase();
  if (!code) return { letra: null, numero: null };

  const match = code.match(/^([A-Z])\s*[-/]?\s*(\d+)$/);
  if (match) {
    return { letra: match[1], numero: Number(match[2]) };
  }

  const dashes = code.match(/^([A-Z])\s*[-/]?\s*(\d+)/);
  if (dashes) {
    return { letra: dashes[1], numero: Number(dashes[2]) };
  }

  const puro = code.match(/^(\d+)$/);
  if (puro) {
    return { letra: null, numero: Number(puro[1]) };
  }

  const cualquierNumero = code.match(/(\d+)/);
  if (cualquierNumero) {
    return { letra: /^[A-Z]/.test(code) ? code[0] : null, numero: Number(cualquierNumero[1]) };
  }

  return { letra: null, numero: null };
}

export function componerCodigoCaja(letra: string | null | undefined, numero: number | null | undefined): string | null {
  const letraNorm = String(letra ?? '').trim().toUpperCase();
  const numeroValido = numero != null && Number.isFinite(Number(numero)) && Number(numero) > 0;

  if (letraNorm && numeroValido) return `${letraNorm}-${numero}`;
  if (letraNorm) return letraNorm;
  if (numeroValido) return String(numero);
  return null;
}