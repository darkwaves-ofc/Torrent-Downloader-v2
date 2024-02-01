import express, { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { AppTypes } from "../../../structures/App";
import fs from "fs";
import path from "path";
import Download from "../../../schema/Download";
import { Mongoose } from "mongoose";

class Route {
  constructor(client: AppTypes) {
    const router: Router = express.Router();

    router.post(
      "/torrent/:action/:torrentID",
      async (req: Request, res: Response) => {
        const notFoundError = function (
          message: string,
          code: number
        ): Response {
          return res.status(code).json({ error: true, message });
        };
        const torrentID = req.params.torrentID;
        const action = req.params.action;
        if (!torrentID) {
          notFoundError("Torrent Id Not Found", 404);
        }
        const torrent = client.torrents[torrentID];
        if (!torrent) {
          notFoundError("Torrent for Torrent Id Not Found", 404);
        }
        try {
          switch (action) {
            case "stop":
              break;
            case "pause":
              torrent.pause();
              // Also puse the state in the database
              res.status(200).json({ message: "Download paused" });
              break;
            case "resume":
              if (torrent && torrent.paused) {
                torrent.resume();
                // Also resume the in the database
                res.status(200).json({ message: "Download resumed" });
              } else {
                notFoundError("Your dowload is already paused", 400);
              }
              break;
            case "remove":
              try {
                const filePath = path.join(
                  __dirname,
                  "../../temp",
                  torrentID + ".zip"
                );

                // Check if the file exists and delete it
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted file: ${filePath}`);
                }

                if (torrent) {
                  torrent.destroy(
                    {
                      destroyStore: true, // Set to true if you want to remove the data from disk
                    },
                    (err) => {
                      if (err) {
                        console.error("Error occurred during destroy:", err);
                      } else {
                        delete client.torrents[torrentID];
                        console.log("Download deleted ", torrentID);
                      }

                      // Now, delete the corresponding torrent data from the MongoDB database
                    }
                  );
                } else {
                  res
                    .status(400)
                    .json({ error: "No active download to delete" });
                }
                Download.findOneAndDelete(
                  { torrentID },
                  (err: Error, deletedDownload: any) => {
                    if (err) {
                      console.error(
                        `Error deleting download from MongoDB: ${err}`
                      );
                      res
                        .status(500)
                        .json({ error: "Error deleting download" });
                    } else if (!deletedDownload) {
                      res.status(400).json({
                        error: "No download found for the provided ID",
                      });
                    } else {
                      res.status(200).json({ message: "Download deleted" });
                    }
                  }
                );
              } catch (err) {
                console.error(`Error deleting file or torrent: ${err}`);
                res
                  .status(500)
                  .json({ error: "Error deleting file or torrent" });
              }
              break;
            default:
              break;
          }
        } catch (error) {
          return console.log(error);
        }
      }
    );

    return router;
  }
}

export = { route: Route, name: "torrent-post" };
