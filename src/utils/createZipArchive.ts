import EventEmitter from "events";
import path from "path";

async function createZipArchive(
  sourcePath: string,
  zipFilePath: string,
  torrentId: string,
  torrentInfo: any,
  downloadState: any,
  wsevents: EventEmitter
) {
  const { default: gulp } = await import("gulp");
  const { default: zip } = await import("gulp-zip");

  return new Promise((resolve, reject) => {
    gulp
      .src(sourcePath)
      .pipe(zip("archive.zip"))
      .pipe(gulp.dest(zipFilePath))
      .on("finish", () => {
        console.log("Zip creation complete");
        resolve(true);
      })
      .on("error", (err) => {
        console.log("Error archiving: ", err);
        reject(err);
      });
  });
}

export default createZipArchive;
