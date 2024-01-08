import express, { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { AppTypes } from "../../../structures/App";
import path from "node:path";
import fs from "fs";
import Download from "../../../schema/Download";
import { findFilesWithExtension } from "../../../utils/ensureTempFolder";

class Route {
  constructor(client: AppTypes) {
    const router: Router = express.Router();

    router.get("/torrents", async (req: Request, res: Response) => {
      const notFoundError = function (message: string, code: number): Response {
        return res.status(code).json({ error: true, message });
      };

      try {
        const downloads = await Download.find().sort({ createdAt: -1 });
        res.status(200).json(downloads);
      } catch (error) {
        console.error("Error fetching downloads:", error);
        res.status(500).json({ error: "Error fetching downloads" });
      }
    });

    router.get("/torrent/:torrentId", async (req: Request, res: Response) => {
      const notFoundError = function (message: string, code: number): Response {
        return res.status(code).json({ error: true, message });
      };

      try {
        const torrentId = req.params.torrentId;
        const filePath = path.join(
          __dirname,
          "../../../../download/",
          torrentId
        );

        const filesWithExtension = findFilesWithExtension(filePath, "zip");

        if (filesWithExtension.length === 0) {
          console.log("No matching file found:", filePath);
          notFoundError("Not Found", 404);
          return;
        }

        const fileToSend = filesWithExtension[0]; // Choose the first file found
        console.log(fileToSend);
        if (!fs.existsSync(fileToSend)) {
          console.log("File not found:", fileToSend);
          notFoundError("Not Found", 404);
          return;
        }

        const stats = fs.statSync(fileToSend);
        const fileSize = stats.size;

        const range = req.headers.range;
        console.log(range);
        if (range) {
          const [start, end] = range.replace(/bytes=/, "").split("-");
          const startByte = parseInt(start, 10);
          const endByte = end ? parseInt(end, 10) : fileSize - 1;
          const chunkSize = endByte - startByte + 1;

          res.writeHead(206, {
            "Content-Range": `bytes ${startByte}-${endByte}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${path.basename(
              fileToSend
            )}"`,
          });

          const fileStream = fs.createReadStream(fileToSend, {
            start: startByte,
            end: endByte,
          });
          fileStream.on("open", () => {
            fileStream.pipe(res);
          });
          fileStream.on("error", (err) => {
            console.error("File stream error:", err);
            res.end(err);
          });
        } else {
          // res.download(fileToSend, (err) => {
          //   if (err) {
          //     console.error("Error sending file:", err);
          //     if (!res.headersSent) {
          //       res.status(500).json({ error: "Error sending file" });
          //     }
          //   } else {
          //     console.log("File sent successfully:", fileToSend);
          //   }
          // });
          res.writeHead(200, {
            "Content-Length": fileSize,
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${path.basename(
              fileToSend
            )}"`,
          });

          const fileStream = fs.createReadStream(fileToSend);
          fileStream.pipe(res);
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Server Error" });
      }
    });

    return router;
  }
}

export = { route: Route, name: "torrent-get" };
