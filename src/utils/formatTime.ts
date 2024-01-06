export default function formatTime(ms: number) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];

  if (days > 0) {
    parts.push(days + "d");
  }
  if (hours > 0) {
    parts.push(hours + "h");
  }
  if (minutes > 0) {
    parts.push(minutes + "m");
  }
  if (seconds > 0) {
    parts.push(seconds + "s");
  }

  return parts.join(" ");
}
