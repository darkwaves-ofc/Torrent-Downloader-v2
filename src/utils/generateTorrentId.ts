import crypto from "crypto";

export default function generateTorrentId(magnetLink: string) {
  const hash = crypto.createHash("sha256");
  hash.update(magnetLink);
  return hash.digest("hex");
}
