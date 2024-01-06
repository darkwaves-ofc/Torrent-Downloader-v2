import express, { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { AppTypes } from "../../../structures/App";
import torrentDownloadSetup from "../../../functions/torrentDownloadSetup";
import generateTorrentId from "../../../utils/generateTorrentId";

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
          return res.status(400).json({ error: "Magnet Link Not Found" });
        }

        if (!magnetLink.startsWith("magnet:?")) {
          console.error("Incorrect Magnet Link:", magnetLink);
          return res
            .status(400)
            .json({ error: "Incorrect magnet link format" });
        }

        const torrentId = generateTorrentId(magnetLink);
        const existingTorrent = client.torrents[torrentId];
        if (existingTorrent) {
          return res
            .status(400)
            .json({ error: `Torrent with ID ${torrentId} already exists.` });
        }

        torrentDownloadSetup(
          torrentId,
          magnetLink,
          client.downloadPath,
          client.TorrentHandler,
          client.downloadState,
          client.torrents,
          client.wsevents
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
