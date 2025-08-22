import * as fs from "fs/promises";

export const getFileNames = async (path, socket) => {
  try {
    const fileNames = await fs.readdir(path);
    return fileNames;
  } catch (error) {
    console.log("ERROR: ", error);
    socket.emit(
      "console-msg",
      "Error: unable to get files, path may be invalid!"
    );
  }
};
