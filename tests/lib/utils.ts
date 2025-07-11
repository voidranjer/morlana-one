export function generateTimestampFilename() {
  const now = new Date();

  const pad = (n: number) => n.toString().padStart(2, '0');

  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1); // months are 0-indexed
  const year = now.getFullYear();
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${day}-${month}-${year}-${hours}${minutes}-${seconds}`;
}

