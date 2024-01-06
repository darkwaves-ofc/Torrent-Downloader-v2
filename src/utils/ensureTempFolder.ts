import fs from "fs";
import path from "path";

export default function ensureTempFolder() {
  const tempFolderPath = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath);
  }
}
