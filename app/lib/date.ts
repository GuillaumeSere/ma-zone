export function formatFrenchDateTime(date?: string, time?: string): string {
  if (!date && !time) return "";

  let formattedDate = date || "";
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-");
    formattedDate = `${d}-${m}-${y}`;
  }

  let formattedTime = time || "";
  if (time && /^\d{2}:\d{2}$/.test(time)) {
    formattedTime = `${time}:00`;
  }

  if (formattedDate && formattedTime) {
    return `${formattedDate} à ${formattedTime}`;
  }

  return formattedDate || formattedTime;
}
