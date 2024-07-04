export function localDateTimeISOString(localDateString) {
  const localDate = new Date(localDateString);
  let d = new Date();
  d.setUTCFullYear(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate()
  );
  d.setUTCHours(localDate.getHours());
  d.setUTCMinutes(localDate.getMinutes());
  d.setUTCSeconds(localDate.getSeconds());
  d.setUTCMilliseconds(localDate.getMilliseconds());
  return d.toISOString().substring(0, 19);
}
