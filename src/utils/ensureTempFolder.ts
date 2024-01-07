import fs from "fs";
import path from "path";

interface FileList {
  [fileName: string]: string;
}

export default function ensureTempFolder(folderPath: string) {
  const tempFolderPath = path.resolve(folderPath); // Using path.resolve() for correct path resolution
  try {
    if (!fs.existsSync(tempFolderPath)) {
      fs.mkdirSync(tempFolderPath, { recursive: true }); // Create folder and its parents if they don't exist
    }
  } catch (err) {
    console.error("Error creating folder:", err);
    // Handle the error accordingly based on your use case
  }
}

export function findFilesWithExtension(
  folderPath: string,
  extension: string
): string[] {
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
