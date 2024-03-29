import formatTime from "../utils/formatTime";
import formatBytes from "../utils/formatBytes";
import handleTorrentDone from "./handleTorrentDone";
import { Torrent } from "webtorrent";
import { DownloadState, Torrents } from "./type";
import EventEmitter from "events";
import { Download } from "../schema/Download";
import { AppTypes } from "../structures/App";

interface TorrentInfo {
  ready: boolean;
  torrentId: string;
  infoHash: string;
  name: string;
  totalSize: string;
  files: { name: string; length: string }[];
}

async function handleTorrentEvents(
  torrent: Torrent,
  torrentId: string,
  torrents: Torrents,
  downloadState: DownloadState,
  wsevents: EventEmitter,
  torrentInfo: TorrentInfo,
  details: AppTypes["details"],
  downloadSchema: Download
): Promise<void> {
  let downloadDataTimeout: NodeJS.Timeout | null = null;

  downloadState[torrentId] = "Downloading";
  downloadSchema.state = downloadState[torrentId];
  await downloadSchema.save();

  torrent.on("download", async () => {
    if (!downloadDataTimeout) {
      downloadDataTimeout = setTimeout(async () => {
        const downloadData = {
          downloading: true,
          torrentId: torrentId,
          name: torrent.name,
          received: formatBytes(torrent.downloaded),
          uploaded: formatBytes(torrent.uploaded),
          downloadSpeed: formatBytes(torrent.downloadSpeed),
          uploadSpeed: formatBytes(torrent.uploadSpeed),
          timeRemaining: formatTime(torrent.timeRemaining),
          progress: (torrent.progress * 100).toFixed(2) + "%",
          totalSize: formatBytes(torrent.length),
        };
        if (!torrent.done) {
          console.log("Downloading:", downloadData); // Debugging statement
          downloadSchema.downloadData = downloadData
          await downloadSchema.save();
          wsevents.emit(`public`, {
            type: "torrentUpdate",
            payload: {
              torrentId: torrentId,
              torrentInfo,
              downloadData,
              state: downloadState[torrentId],
            },
          });
        } else {
          return;
        }
        if (downloadDataTimeout) {
          clearTimeout(downloadDataTimeout);
          downloadDataTimeout = null;
        }
      }, 4000);
    }

    // Handle download event, send data using socket.io
  });

  torrent.on("done", async () => {
    console.log("Torrent download finished"); // Debugging statement

    try {
      await handleTorrentDone(
        torrent,
        torrents,
        torrentId,
        wsevents,
        downloadState,
        torrentInfo,
        details,
        downloadSchema
      );
    } catch (error) {
      console.error("Error in handleTorrentDone:", error); // Debugging statement
    }
  });
}

export default handleTorrentEvents;
