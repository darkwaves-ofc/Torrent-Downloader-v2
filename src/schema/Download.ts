import mongoose, { Document, Schema } from "mongoose";

export interface Download extends Document {
  torrentId: string;
  downloadPath: string;
  torrentName: string;
  state:
    | "Setting Up"
    | "Ready"
    | "Archiving"
    | "Done!"
    | "Downloading"
    | "Error";
  torrentInfo: Object;
  createdAt: Date;
  totalSize: string;
  downloadData: Object;
}

const downloadSchema = new mongoose.Schema({
  torrentId: {
    type: String,
    required: true,
    unique: true,
  },
  // downloadPath: String,
  torrentName: String,
  state: {
    type: String,
    enum: ["Setting Up", "Ready", "Archiving", "Done!", "Downloading", "Error"],
    default: "Setting Up",
  },
  torrentInfo: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  totalSize: {
    type: String,
  },
  downloadData: {
    type: Object,
  },
  // Add other fields as needed, e.g., timestamps, progress, etc.
});
const DownloadModel = mongoose.model<Download>("Download", downloadSchema);
export default DownloadModel;
