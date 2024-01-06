import { Torrent } from "webtorrent";

export interface Torrents {
  [key: string]: Torrent;
}
[];
export interface DownloadState {
  [key: string]:
    | "Setting Up"
    | "Ready"
    | "Achiving"
    | "Done!"
    | "Downloading"
    | "Error";
}
