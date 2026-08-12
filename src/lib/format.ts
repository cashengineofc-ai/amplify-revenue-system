export const brl = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));

export const num = (value: number | null | undefined, digits = 0) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value ?? 0));

export const pct = (value: number | null | undefined, digits = 2) => `${num(value, digits)}%`;

export const dateBR = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";

export const dayBR = (value: string | Date | null | undefined) =>
  value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(value)) : "—";

export const PLATFORMS = {
  meta_facebook: { label: "Meta Ads — Facebook", short: "Facebook" },
  meta_instagram: { label: "Meta Ads — Instagram", short: "Instagram" },
  tiktok: { label: "TikTok Ads", short: "TikTok" },
  kwai: { label: "Kwai Ads", short: "Kwai" },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;
export const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];
