import formatTime from "../utils/formatTime";
import formatBytes from "../utils/formatBytes";
import handleTorrentDone from "./handleTorrentDone";
import { Torrent } from "webtorrent";
import { DownloadState, Torrents } from "./type";

interface TorrentInfo {
  ready: boolean;
  torrentId: string;
  infoHash: string;
  name: string;
  totalSize: string;
  files: { name: string; length: string }[];
}

interface WSEvents {
  emit(event: string, data: any): void;
}

function handleTorrentEvents(
  torrent: Torrent,
  torrentId: string,
  torrents: Torrents,
  downloadState: DownloadState,
  wsevents: WSEvents,
  torrentInfo: TorrentInfo
): void {
  let downloadDataTimeout: NodeJS.Timeout | null = null;

  torrent.on("download", async () => {
    if (!downloadDataTimeout) {
      downloadDataTimeout = setTimeout(() => {
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
          downloadState[torrentId] = "Downloading";
          console.log("Downloading:", downloadData); // Debugging statement
          wsevents.emit("torrentUpdate", {
            torrentId: torrentId,
            torrentInfo,
            downloadData,
            state: downloadState[torrentId],
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
        torrentInfo
      );
    } catch (error) {
      console.error("Error in handleTorrentDone:", error); // Debugging statement
    }
  });
}

export default handleTorrentEvents;
