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
        // Get the current directory of the project
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

        if (!fs.existsSync(fileToSend)) {
          console.log("File not found:", fileToSend);
          notFoundError("Not Found", 404);
          return;
        }
        // Check for the 'Range' header in the request
        const range = req.headers.range;
        if (range) {
          // Parse the range header
          const [start, end] = range.replace(/bytes=/, "").split("-");
          const fileSize = fs.statSync(filePath).size;
          const chunkSize = end
            ? parseInt(end) - parseInt(start) + 1
            : fileSize;

          // Set headers for partial content
          res.status(206);
          res.setHeader(
            "Content-Range",
            `bytes ${start}-${end || fileSize - 1}/${fileSize}`
          );
          res.setHeader("Accept-Ranges", "bytes");
          res.setHeader("Content-Length", chunkSize);

          // Create a readable stream for the requested chunk and pipe it to the response
          const fileStream = fs.createReadStream(filePath, {
            start: parseInt(start),
            end: end ? parseInt(end) : undefined,
          });
          fileStream.pipe(res);
        } else {
          // Listen for 'aborted' event and log a custom message
          res.on("aborted", () => {
            console.log("Download request was aborted by the client.");
          });
          // If no 'Range' header, send the entire file
          res.download(fileToSend, (err) => {
            if (err) {
              console.error("Error sending file:", err);
              if (!res.headersSent) {
                res.status(500).json({ error: "Error sending file" });
              }
            } else {
              console.log("File sent successfully:", fileToSend);
            }
          });
        }
      } catch (error) {
        return console.log(error);
      }
    });

    return router;
  }
}

export = { route: Route, name: "torrent-get" };
