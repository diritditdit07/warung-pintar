function padDatePart(value) {
  return String(value).padStart(2, '0');
}

export function getDayKey(date = new Date()) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join('-');
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

export function formatTodayLabel() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
}