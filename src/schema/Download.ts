import mongoose from "mongoose";

const downloadSchema = new mongoose.Schema({
  torrentId: {
    type: String,
    required: true,
    unique: true,
  },
  downloadPath: String,
  torrentName: String,
  state: {
    type: String,
    enum: ["Setting Up", "Ready", "Achiving", "Done!", "Downloading", "Error"],
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
  // Add other fields as needed, e.g., timestamps, progress, etc.
});
const Download = mongoose.model("Download", downloadSchema);
export default Download;
