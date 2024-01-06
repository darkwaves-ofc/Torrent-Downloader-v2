"use strict";

import { readdir } from "fs";
import { AppTypes } from "../structures/App";
// import WebTorrent from "webtorrent";
import path from "path";

export = class WebTorrentInitializer {
  private client: AppTypes;

  constructor(client: AppTypes) {
    if (!client) throw new Error(`client is required`);
    this.client = client;
  }

  public async start() {
    const { default: WebTorrent } = await import("webtorrent");
    this.client.TorrentHandler = new WebTorrent();

    this.client.downloadPath = path.join(__dirname, "../../temp/downloads");
    this.client.downloadState = {};
    this.client.torrents = {};

    this.client.logger.log("[ • ] WebTorrent Loaded:");
  }
};
