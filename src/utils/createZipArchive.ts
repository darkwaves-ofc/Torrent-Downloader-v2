import EventEmitter from "events";
import fs from "fs";
import archiver from "archiver";
import ensureTempFolder from "./ensureTempFolder";

async function createZipArchive(
  sourcePath: string,
  zipFilePath: string,
  torrentId: string,
  torrentInfo: any,
  downloadState: any,
  wsevents: EventEmitter,
  zipFileName: string
) {
  return new Promise((resolve, reject) => {
    console.log("sourcePath ", sourcePath);
    console.log("zipFilePath ", zipFilePath);
    ensureTempFolder(zipFilePath);
    const output = fs.createWriteStream(zipFilePath + `/${zipFileName}.zip`);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    output.on("close", function () {
      resolve(archive.pointer() + " total bytes");
      console.log(archive.pointer() + " total bytes");
      console.log(
        "archiver has been finalized and the output file descriptor has closed."
      );
    });

    output.on("end", function () {
      console.log("Data has been drained");
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        // log warning
        console.log("warning achive ", err);
      } else {
        console.log("error achive ", err);
        reject(err);
        // throw error
      }
    });

    // good practice to catch this error explicitly
    archive.on("error", function (err) {
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    archive.directory(sourcePath, zipFileName);

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
  });
}

export default createZipArchive;
