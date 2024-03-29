"use strict";

import { readdir } from "fs";
import { AppTypes } from "../structures/App";
// import WebTorrent from "webtorrent";
import path from "path";
import ensureTempFolder from "../utils/ensureTempFolder";

export = class WebTorrentInitializer {
  private client: AppTypes;

  constructor(client: AppTypes) {
    if (!client) throw new Error(`client is required`);
    this.client = client;
  }

  public async start() {
    const { default: WebTorrent } = await import("webtorrent");
    this.client.TorrentHandler = new WebTorrent();

    const tempPath = path.join(__dirname, `../../temp`);
    ensureTempFolder(tempPath);

    const downloadPath = path.join(__dirname, "../../download");
    ensureTempFolder(tempPath);
    // this.client.downloadPath = path.join(__dirname, "../../downloads");
    this.client.downloadState = {};
    this.client.torrents = {};
    this.client.details = {
      tempPath: tempPath,
      downloadPath: downloadPath,
    };
    this.client.logger.log("[ • ] WebTorrent Loaded:");
  }
};
