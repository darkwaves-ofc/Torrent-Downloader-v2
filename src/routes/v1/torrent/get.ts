import express, { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { AppTypes } from "../../../structures/App";
import path from "node:path";
import fs from "fs";

class Route {
  constructor(client: AppTypes) {
    const router: Router = express.Router();

    router.get("/torrents", async (req: Request, res: Response) => {
      const notFoundError = function (message: string, code: number): Response {
        return res.status(code).json({ error: true, message });
      };

      try {
        const torrentId = req.params.torrentId;
        // Get the current directory of the project
        const filePath = path.join(__dirname, "../../../../temp", torrentId);

        console.log("Download requested for file:", filePath);

        // Check if the response has already been sent
        if (res.headersSent) {
          notFoundError("Download request already completed.", 400);
        }

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
          console.log("File not found:", filePath);
          notFoundError("Not Found", 404);
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
          res.download(filePath, (err) => {
            if (err) {
              console.error("Error sending file:", err);
              if (!res.headersSent) {
                res.status(500).json({ error: "Error sending file" });
              }
            } else {
              console.log("File sent successfully:", filePath);
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
