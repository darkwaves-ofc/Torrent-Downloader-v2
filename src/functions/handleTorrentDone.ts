import Download from "../schema/Download";
import fs from "fs";
import path from "path";
import tmp from "tmp-promise";
import ensureTempFolder from "../utils/ensureTempFolder";
import createZipArchive from "../utils/createZipArchive";
import formatBytes from "../utils/formatBytes";
import saveFile from "../utils/saveFile";
import { DownloadState, Torrents } from "./type";
import { Torrent } from "webtorrent";

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

async function handleTorrentDone(
  torrent: Torrent,
  torrents: Torrents,
  torrentId: string,
  wsevents: WSEvents,
  downloadState: DownloadState,
  torrentInfo: TorrentInfo
): Promise<void> {
  try {
    let extension: string | undefined;
    downloadState[torrentId] = "Achiving";
    console.log("Torrent download finished");
    ensureTempFolder();
    console.log();

    const zipFileName = torrent.name;
    const filePath = path.join(__dirname, "../../temp/downloads", zipFileName);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        extension = ".zip";
      } else if (stats.isFile()) {
        extension = "";
      }
    }

    const zipFilePath = path.join(
      __dirname,
      "../../temp",
      zipFileName + (extension || "")
    );
    console.log("Zip File Path ", zipFilePath);

    wsevents.emit("torrentUpdate", {
      torrentId: torrentId,
      torrentInfo,
      state: downloadState[torrentId],
    });

    createZipArchive(
      filePath,
      zipFilePath,
      extension || "",
      torrentId,
      torrentInfo,
      downloadState[torrentId]
    )
      .then(async () => {
        const archivePath = zipFileName + (extension || "");
        downloadState[torrentId] = "Done!";

        const existingDownload = await Download.findOne({ torrentId });
        if (existingDownload) {
          existingDownload.torrentName = torrent.name;
          existingDownload.totalSize = formatBytes(torrent.length);
          existingDownload.state = downloadState[torrentId];
          existingDownload.downloadPath = archivePath;
          existingDownload.torrentInfo = torrentInfo;
          await existingDownload.save();
          console.log(`Updated torrent info for ID ${torrentId}`);
        } else {
          console.log("Torrent Not Found On the Database");
          const download = new Download({
            torrentId,
            downloadPath: archivePath,
            torrentName: torrent.name,
            totalSize: formatBytes(torrent.length),
            state: downloadState[torrentId],
            torrentInfo: torrentInfo,
          });
          await download.save();
          console.log("New Download Info Created: ", download);
        }
        if (torrents[torrentId]) {
          const destroyOptions = {
            destroyStore: true, // Set to true if you want to remove the data from disk
          };

          if (torrents[torrentId] && typeof torrents[torrentId] !== "string") {
            torrents[torrentId].destroy(destroyOptions, (err) => {
              if (err) {
                console.error("Error occurred during destroy:", err);
              } else {
                delete torrents[torrentId];
                console.log("Download deleted ", torrentId);
              }
            });
          }

          wsevents.emit("torrentUpdate", {
            torrentId: torrentId,
            state: downloadState[torrentId],
            downloadPath: archivePath,
            torrentInfo,
          });
        } else {
          console.log("Download Not Found with the id ", torrentId);
        }
      })
      .catch((zipErr) => {
        console.error("Error creating ZIP archive:", zipErr);
        // Handle ZIP archive creation error
      });
  } catch (err) {
    console.error("Error handling torrent done event:", err);
    // Handle error
  }
}

export default handleTorrentDone;
