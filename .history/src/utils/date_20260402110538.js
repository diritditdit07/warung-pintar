function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function shiftDate(baseDate, dayOffset) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + dayOffset);
  return nextDate;
}

export function getDayKey(date = new Date()) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join('-');
}

export function getEntryDayKey(entry) {
  if (!entry) {
    return '';
  }

  if (entry.dayKey) {
    return entry.dayKey;
  }

  const targetDate = getEntryDate(entry);
  return targetDate ? getDayKey(targetDate) : '';
}

export function isToday(dateString) {
  const target = new Date(dateString);

  if (Number.isNaN(target.getTime())) {
    return false;
  }

  return getDayKey(target) === getDayKey();
}

export function isTodayEntry(entry) {
  if (!entry) {
    return false;
  }

  if (entry.dayKey) {
    return entry.dayKey === getDayKey();
  }

  return isToday(entry.createdAt);
}

export function getEntryDate(entry) {
  if (!entry?.createdAt) {
    return null;
  }

  const target = new Date(entry.createdAt);
  return Number.isNaN(target.getTime()) ? null : target;
}

export function isYesterdayEntry(entry) {
  const targetDate = getEntryDate(entry);

  if (!targetDate) {
    return false;
  }

  return getDayKey(targetDate) === getDayKey(shiftDate(new Date(), -1));
}

export function isThisMonthEntry(entry) {
  const targetDate = getEntryDate(entry);

  if (!targetDate) {
    return false;
  }

  const today = new Date();

  return (
    targetDate.getFullYear() === today.getFullYear() &&
    targetDate.getMonth() === today.getMonth()
  );
}

export function getReportPeriodLabel(periodKey) {
  if (periodKey === 'yesterday') {
    return 'Kemarin';
  }

  if (periodKey === 'thisMonth') {
    return 'Bulan Ini';
  }

  if (periodKey === 'custom') {
    return 'Tanggal Pilihan';
  }

  return 'Hari Ini';
}

export function formatEntryDateTime(dateString) {
  const targetDate = new Date(dateString);

  if (Number.isNaN(targetDate.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(targetDate);
}

export function formatTodayLabel() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
}