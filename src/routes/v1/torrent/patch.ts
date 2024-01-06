import express, { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { AppTypes } from "../../../structures/App";

class Route {
  constructor(client: AppTypes) {
    const router: Router = express.Router();

    router.patch("/torrent/:torrentID", async (req: Request, res: Response) => {
      const notFoundError = function (message: string, code: number): Response {
        return res.status(code).json({ error: true, message });
      };

      try {
      } catch (error) {
        return console.log(error);
      }
    });

    return router;
  }
}

export = { route: Route, name: "torrent-patch" };
