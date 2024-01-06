import fs from "fs";
import archiver from "archiver";
import path from "path";

export default function createZipArchive(
  sourcePath: string,
  zipFilePath: string,
  extention: string,
  torrentId: string,
  torrentInfo: any,
  downloadState: any
) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Set compression level (maximum compression)
    });
    archive.pipe(output);

    if (extention === ".zip") {
      archive.directory(sourcePath, false);
    } else if (extention === "") {
      archive.file(sourcePath, { name: path.basename(sourcePath) });
    } else {
      reject(new Error("Invalid sourcePath"));
      return;
    }
    // Check if the sourcePath is a directory or a file
    // Listen for the 'data' event to track progress
    archive.on("data", (chunk) => {
      // Calculate the progress based on the data emitted
      //   const progress = archive.pointer() / archive.totalSize;
      // You can emit this progress or store it for further use
      // Example: emit a progress event
      // You can send this progress to the front end to display it
      // This is just a simple example, you can adjust it as needed
      // In this example, we're sending a progress event with the progress percentage
      // You can customize this as per your requirements
      //   if (progress) {
      //     console.log(`ZIP archive progress: ${Math.round(progress * 100)}%`);
      //     wsevents.emit("torrentUpdate", {
      //       torrentId: torrentId,
      //       torrentInfo,
      //       state: downloadState[torrentId],
      //       achiveState: `${Math.round(progress * 100)}%`,
      //     });
      //   }
    });

    archive.finalize();

    output.on("close", () => {
      console.log("ZIP archive created:", zipFilePath);
      resolve(extention);
    });

    archive.on("error", (err) => {
      console.error("Error creating ZIP archive:", err);
      reject(err);
    });
  });
}
