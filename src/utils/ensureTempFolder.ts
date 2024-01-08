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
  let matchingFiles: string[] = [];

  // Check if folder exists
  try {
    if (!fs.existsSync(folderPath)) {
      throw new Error("Folder does not exist");
    }

    const files = fs.readdirSync(folderPath);

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
  } catch (error: any) {
    console.error("Error:", error.message);
    // Handle the case where the folder doesn't exist or is empty
    // You can choose to log an error or take specific action here
    // For now, returning an empty array
    matchingFiles = [];
  }

  return matchingFiles;
}
