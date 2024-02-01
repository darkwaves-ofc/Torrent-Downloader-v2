import express, { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { AppTypes } from "../../../structures/App";
import torrentDownloadSetup from "../../../functions/torrentDownloadSetup";
import generateTorrentId from "../../../utils/generateTorrentId";
import Download from "../../../schema/Download";

class Route {
  constructor(client: AppTypes) {
    const router: Router = express.Router();

    router.put("/torrent", async (req: Request, res: Response) => {
      const notFoundError = function (message: string, code: number): Response {
        return res.status(code).json({ error: true, message });
      };

      try {
        const { magnetLink } = req.body;

        if (!magnetLink) {
          console.error("No Magnet Link Request");
          notFoundError("Magnet Link Not Found", 404);
        }

        if (!magnetLink.startsWith("magnet:?")) {
          console.error("Incorrect Magnet Link:", magnetLink);
          notFoundError("Incorrect magnet link format", 400);
        }

        const torrentId = generateTorrentId(magnetLink);
        const existingTorrent = client.torrents[torrentId];
        if (existingTorrent) {
          notFoundError(`Torrent with ID ${torrentId} already exists.`, 400);
        }

        const existdownload = await Download.findOne({ torrentId: torrentId });
        let download;
        if (existdownload) {
          download = existdownload;
        } else {
          download = new Download({
            torrentId,
            magnetLink,
          });
        }

        console.log(client.details);
        torrentDownloadSetup(
          torrentId,
          magnetLink,
          client.TorrentHandler,
          client.downloadState,
          client.torrents,
          client.wsevents,
          client.details,
          download
        );

        // console.log(torrentData);
        res.status(200).json({ torrentId });
      } catch (error) {
        console.error("Error starting torrent:", error);
        res.status(500).json({ error: "Download error" });
      }
    });

    return router;
  }
}

export = { route: Route, name: "torrent-put" };
