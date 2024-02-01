// import Download from "../schema/Download";

// interface TorrentInfo {
//   torrentId: string;
//   name: string;
//   totalSize: string;
//   files: { name: string; length: string }[];
//   // Add other fields as needed
// }

// async function saveTorrentInfoToDatabase(
//   torrentInfo: TorrentInfo
// ): Promise<void> {
//   try {
//     const download = new Download({
//       torrentId: torrentInfo.torrentId,
//       torrentName: torrentInfo.name,
//       totalSize: torrentInfo.totalSize,
//       files: torrentInfo.files,
//       // Add other fields as needed
//     });

//     await download.save();
//   } catch (error) {
//     console.error("Error saving torrent info to the database:", error);
//     // Handle database save error
//   }
// }

// export default saveTorrentInfoToDatabase;
