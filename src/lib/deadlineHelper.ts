/**
 * Tashkent Timezone (Asia/Tashkent, UTC+5) Deadline Calculator
 */

export interface DeadlineInfo {
  hasDeadline: boolean;
  isExpired: boolean;
  text: string;
  formatted?: string;
  colorClass: string;
  badgeClass: string;
  daysRemaining?: number;
  daysLeft?: number;
}

export function getNowInTashkent(): Date {
  const now = new Date();
  try {
    const tashkentStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
    return new Date(tashkentStr);
  } catch {
    return now;
  }
}

export function getDeadlineInfo(deadlineStr?: string): DeadlineInfo {
  if (!deadlineStr || !deadlineStr.trim()) {
    return {
      hasDeadline: false,
      isExpired: false,
      text: 'Muddati belgilanmagan',
      formatted: 'Muddati belgilanmagan',
      colorClass: 'text-slate-500',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      daysRemaining: undefined,
      daysLeft: undefined,
    };
  }

  const tashkentNow = getNowInTashkent();
  const dateOnly = deadlineStr.trim();
  const dlDate = new Date(
    dateOnly.includes('T') ? dateOnly : `${dateOnly}T23:59:59`
  );

  const diffMs = dlDate.getTime() - tashkentNow.getTime();

  if (diffMs <= 0) {
    const text = '🔴 Ariza topshirish yakunlangan';
    return {
      hasDeadline: true,
      isExpired: true,
      text,
      formatted: text,
      colorClass: 'text-rose-700',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      daysRemaining: 0,
      daysLeft: 0,
    };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    const text = `⏳ Bugun oxirgi kun (${Math.max(1, diffHours)} soat qoldi)`;
    return {
      hasDeadline: true,
      isExpired: false,
      text,
      formatted: text,
      colorClass: 'text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
      daysRemaining: 1,
      daysLeft: 1,
    };
  }

  if (diffDays <= 3) {
    const text = `⏳ ${diffDays} kun qoldi`;
    return {
      hasDeadline: true,
      isExpired: false,
      text,
      formatted: text,
      colorClass: 'text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      daysRemaining: diffDays,
      daysLeft: diffDays,
    };
  }

  const text = `⏳ ${diffDays} kun qoldi`;
  return {
    hasDeadline: true,
    isExpired: false,
    text,
    formatted: text,
    colorClass: 'text-blue-700',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    daysRemaining: diffDays,
    daysLeft: diffDays,
  };
}
