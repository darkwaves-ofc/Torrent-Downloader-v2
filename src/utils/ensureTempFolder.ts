import fs from "fs";
import path from "path";

interface FileList {
  [fileName: string]: string;
}

export default function ensureTempFolder() {
  const tempFolderPath = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath);
  }
}

export function findFilesWithExtension(folderPath: string, extension: string): string[] {
  const files = fs.readdirSync(folderPath);
  const matchingFiles: string[] = [];

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      const subdirectoryFiles = findFilesWithExtension(filePath, extension);
      matchingFiles.push(...subdirectoryFiles); // Add files from subdirectories
    } else if (path.extname(file) === `.${extension}`) {
      matchingFiles.push(filePath); // Add file path to the list
    }
  });

  return matchingFiles;
}
