import { Torrent } from "webtorrent";
import formatBytes from "../utils/formatBytes";
import { checkStorange } from "../utils/getSystemSpecs";
import handleTorrentEvents from "./handleTorrentEvents";
// import saveTorrentInfoToDatabase from "./saveTorrentInfoToDatabase";
import { DownloadState, Torrents } from "./type";
import EventEmitter from "events";
import path from "path";
import { AppTypes } from "../structures/App";
import { SaveOptions } from "mongoose";
import { Download } from "../schema/Download";


async function torrentDownloadSetup(
  torrentId: string,
  magnetLink: string,
  client: any,
  downloadState: DownloadState,
  torrents: Torrents,
  wsevents: EventEmitter,
  details: AppTypes["details"],
  downloadSchema: Download
): Promise<any> {
  try {
    if (torrents[torrentId]) {
      return console.log(`Torrent with ID ${torrentId} already exists.`);
    }

    downloadState[torrentId] = "Setting Up";

    wsevents.emit(`public`, {
      type: "torrentUpdate",
      payload: {
        torrentId: torrentId,
        state: downloadState[torrentId],
      },
    });

    const tempDownloadPath = path.join(__dirname, `../../temp/${torrentId}`);
    console.log("temp download path ", tempDownloadPath);
    const torrent: Torrent = client.add(magnetLink, {
      uploadLimit: 1024 * 100,
      destroyStoreOnDestroy: true,
      path: tempDownloadPath,
    });
    return new Promise((resolve, reject) => {
      torrent.on("ready", async () => {
        const torrentInfo = {
          ready: true,
          torrentId: torrentId,
          infoHash: torrent.infoHash,
          name: torrent.name,
          totalSize: formatBytes(torrent.length),
          files: torrent.files.map((file) => ({
            name: file.name,
            length: formatBytes(file.length),
          })),
        };

        downloadSchema.torrentName = torrentInfo.name;
        downloadSchema.totalSize = torrentInfo.totalSize;
        downloadSchema.torrentInfo = torrentInfo

        const storangecheck = await checkStorange(torrent.length);
        if (!storangecheck) {
          console.log("Storage Error");
          downloadState[torrentId] = "Error";
          wsevents.emit(`public`, {
            type: "torrentUpdate",
            payload: {
              torrentId: torrentId,
              torrentInfo,
              state: downloadState[torrentId],
            },
          });
          downloadSchema.state = downloadState[torrentId];
          await downloadSchema.save()
          return;
        }

        // const existingDownload = await Download.findOne({ torrentId });
        // if (existingDownload) {
        //   existingDownload.torrentName = torrent.name;
        //   existingDownload.totalSize = formatBytes(torrent.length);
        //   await existingDownload.save();
        //   console.log(`Updated torrent info for ID ${torrentId}`);
        // } else {
        //   // saveTorrentInfoToDatabase(torrentInfo);
        //   console.log("New Download Info Created: ", torrentInfo);
        // }
        downloadState[torrentId] = "Ready";
        downloadSchema.state = downloadState[torrentId];
        await downloadSchema.save()

        wsevents.emit(`public`, {
          type: "torrentUpdate",
          payload: {
            torrentId: torrentId,
            torrentInfo,
            state: downloadState[torrentId],
          },
        });

        resolve(torrentInfo);
        console.log("Handle Torrent Events ", torrentId);

        torrents[torrentId] = torrent;

        handleTorrentEvents(
          torrent,
          torrentId,
          torrents,
          downloadState,
          wsevents,
          torrentInfo,
          details,
          downloadSchema
        );
        console.log("After registering 'done' event handler:");
      });
    });
  } catch (error) {
    console.error("Error during torrent setup:", error);
    throw error;
  }
}

export default torrentDownloadSetup;
