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
import EventEmitter from "events";

interface TorrentInfo {
  ready: boolean;
  torrentId: string;
  infoHash: string;
  name: string;
  totalSize: string;
  files: { name: string; length: string }[];
}

async function handleTorrentDone(
  torrent: Torrent,
  torrents: Torrents,
  torrentId: string,
  wsevents: EventEmitter,
  downloadState: DownloadState,
  torrentInfo: TorrentInfo
): Promise<void> {
  try {
    downloadState[torrentId] = "Achiving";
    console.log("Torrent download finished");
    ensureTempFolder();

    function removeFileExtension(fileName: string) {
      const lastDotIndex = fileName.lastIndexOf(".");
      if (lastDotIndex === -1) {
        return fileName; // No file extension found
      } else {
        return fileName.substring(0, lastDotIndex);
      }
    }

    const zipFileName = removeFileExtension(torrentInfo.name);
    const filePath = path.join(__dirname, `../../temp`, torrentId, "/*/**");

    console.log("file path", filePath);
    const folderPath = `../../temp/${torrentId}`;

    const zipFilePath = path.join(__dirname, "../../download", torrentId);
    console.log("Zip File Path ", zipFilePath);

    console.log(removeFileExtension(torrentInfo.name));
    wsevents.emit(`public`, {
      type: "torrentUpdate",
      payload: {
        torrentId: torrentId,
        torrentInfo,
        state: downloadState[torrentId],
      },
    });
    const achived = await createZipArchive(
      filePath,
      zipFilePath,
      torrentId,
      torrentInfo,
      downloadState,
      wsevents,
      zipFileName
    );
    const archivePath = zipFilePath + ".zip";
    console.log("achive path ", archivePath);

    if (achived) {
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
      }
      console.log("Archive created successfully");
      downloadState[torrentId] = "Done!";

      const existingDownload = await Download.findOne({ torrentId });
      if (existingDownload) {
        existingDownload.torrentName = torrent.name;
        existingDownload.totalSize = formatBytes(torrent.length);
        existingDownload.state = downloadState[torrentId];
        existingDownload.torrentInfo = torrentInfo;
        await existingDownload.save();
        console.log(`Updated torrent info for ID ${torrentId}`);
      } else {
        console.log("Torrent Not Found On the Database");
        const download = new Download({
          torrentId,
          torrentName: torrent.name,
          totalSize: formatBytes(torrent.length),
          state: downloadState[torrentId],
          torrentInfo: torrentInfo,
        });
        await download.save();
        console.log("New Download Info Created: ", download);
      }
      wsevents.emit("torrentUpdate", {
        torrentId: torrentId,
        state: downloadState[torrentId],
        torrentInfo,
      });
    } else {
      downloadState[torrentId] = "Done!";
      wsevents.emit("torrentUpdate", {
        torrentId: torrentId,
        state: downloadState[torrentId],
        torrentInfo,
      });
    }
  } catch (err) {
    console.error("Error handling torrent done event:", err);
    // Handle error
  }
}

export default handleTorrentDone;
