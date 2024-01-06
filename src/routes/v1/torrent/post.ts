import express, { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { AppTypes } from "../../../structures/App";

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
        if (!torrentID) {
          return notFoundError("Torrent Id Not Found", 404);
        }
        try {
        } catch (error) {
          return console.log(error);
        }
      }
    );

    return router;
  }
}

export = { route: Route, name: "torrent-post" };
