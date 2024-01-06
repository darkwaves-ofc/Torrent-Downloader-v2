import fs from "fs";

export default async function saveFile(file: any, filePath: string) {
  return new Promise((resolve, reject) => {
    const fileStream = file.createReadStream();
    const writeStream = fs.createWriteStream(filePath);

    fileStream.pipe(writeStream);

    writeStream.on("error", (err) => {
      reject(err);
    });

    writeStream.on("finish", () => {
      resolve(true);
    });
  });
}
