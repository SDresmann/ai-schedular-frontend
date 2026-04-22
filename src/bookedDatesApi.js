import axios from 'axios';

const BOOKED_DATES_TTL_MS = 60 * 1000;

let bookedDatesCache = null;
let bookedDatesCacheAt = 0;
let inFlightRequest = null;

function normalizeBookedDates(data) {
  return data && typeof data === 'object' ? data : {};
}

export function seedBookedDatesCache(data) {
  bookedDatesCache = normalizeBookedDates(data);
  bookedDatesCacheAt = Date.now();
}

export function clearBookedDatesCache() {
  bookedDatesCache = null;
  bookedDatesCacheAt = 0;
}

export async function getBookedDates(apiBase, { forceRefresh = false } = {}) {
  const now = Date.now();
  const hasFreshCache =
    bookedDatesCache && now - bookedDatesCacheAt < BOOKED_DATES_TTL_MS;

  if (!forceRefresh && hasFreshCache) {
    return bookedDatesCache;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = axios
    .get(`${apiBase}/api/booked-dates`)
    .then((res) => {
      bookedDatesCache = normalizeBookedDates(res?.data);
      bookedDatesCacheAt = Date.now();
      return bookedDatesCache;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}
