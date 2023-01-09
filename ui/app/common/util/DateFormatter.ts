import {DateTime} from 'luxon';

export function formatDate(date: string): string {
  return DateTime.fromISO(date).setLocale('de').toLocaleString(DateTime.DATETIME_MED)
}

export function formatDateHuge(date: string): string {
  return DateTime.fromISO(date).setLocale('de').toLocaleString(DateTime.DATETIME_FULL)
}
