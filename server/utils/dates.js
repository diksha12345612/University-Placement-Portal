// Date helpers. The college is in India, but the server on Render runs in UTC,
// so we always say "+05:30" explicitly instead of trusting the server's time zone.

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isDateString = (value) => DATE_REGEX.test(String(value));

// "2026-10-05" -> 00:00 on that day in India
const startOfDayIST = (dateString) => new Date(`${dateString}T00:00:00.000+05:30`);

// "2026-10-05" -> 23:59:59 on that day in India
const endOfDayIST = (dateString) => new Date(`${dateString}T23:59:59.999+05:30`);

// Today's date in India as "YYYY-MM-DD"
const todayIST = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

module.exports = { isDateString, startOfDayIST, endOfDayIST, todayIST };
