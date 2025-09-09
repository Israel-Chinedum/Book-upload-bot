import { MetaDataApi } from "../utils/meta-data-api.util.js";
import { GSheetData } from "../utils/G-sheet-data.util.js";
import { state, setState } from "../server.js";

export let sheetRange = "";
const meta = new MetaDataApi();

class SocketServices {
  sheetTitle;
  spreadsheetId;

  G_sheet(sheetTitle, spreadsheetId) {
    const sheet_title = sheetTitle || this.sheetTitle;
    const spreadsheet_Id = spreadsheetId || this.spreadsheetId;

    const sheetData = new GSheetData({
      spreadsheetId: spreadsheet_Id,
      keyFile: "./favourite.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      sheetTitle: sheet_title,
    });
    return sheetData;
  }

  async startBot({
    initial = true,
    bot,
    socket,
    sheetTitle,
    spreadsheetId,
    range,
    pathToExcelSheet,
  }) {
    if (!sheetTitle || !spreadsheetId) {
      console.log("Sheet title or spreadsheet id not provided!");
      socket.emit(
        "console-msg",
        "Please provide sheet title and spreadsheet id!"
      );
      return;
    }

    sheetRange = range;

    console.log("Retrieving meta data for books...");
    socket.emit("console-msg", "Retrieving meta data for books...");

    this.sheetTitle = sheetTitle;
    this.spreadsheetId = spreadsheetId;
    const sheetData = this.G_sheet(sheetTitle, spreadsheetId);

    const data = await sheetData.getSheetData(sheetRange);

    console.log("Updating excel upload sheet...");
    socket.emit("console-msg", "Updating excel upload sheet...");

    const response = await meta.updateSheet({
      xlPath: pathToExcelSheet,
      data,
      socket,
    });

    if (!response) {
      setState("paused");
      return;
    } else {
      setState("running");
    }

    socket.emit("console-msg", response);

    if (initial) {
      console.log("starting bot...");
      socket.emit("console-msg", "Starting bot...");
      bot.start("ebookquetnetwork@gmail.com", "123456");
    } else {
      socket.emit("console-msg", "uploading...");
      let numberOfBooksUploaded = 0;
      while (numberOfBooksUploaded < 100 && state == "running") {
        await bot.uploadBook();
        numberOfBooksUploaded = +10;
      }

      if (numberOfBooksUploaded > 0) {
        console.log(`Successfully uploaded ${numberOfBooksUploaded} books!`);
        socket.emit(
          "console-msg",
          `Successfully uploaded ${numberOfBooksUploaded} books!`
        );
      }
      socket.emit("continue");
    }
  }

  async restartBot({
    bot,
    socket,
    sheetTitle,
    spreadsheetId,
    range,
    pathToExcelSheet,
  }) {
    if (!sheetTitle || !spreadsheetId) {
      console.log("Sheet title or spreadsheet id not provided!");
      socket.emit(
        "console-msg",
        "Please provide sheet title and spreadsheet id!"
      );
      return;
    }

    sheetRange = range;

    console.log("Retrieving meta data for books...");
    socket.emit("console-msg", "Retrieving meta data for books...");

    this.sheetTitle = sheetTitle;
    this.spreadsheetId = spreadsheetId;
    const sheetData = this.G_sheet(sheetTitle, spreadsheetId);

    const data = await sheetData.getSheetData(sheetRange);

    console.log("Updating excel upload sheet...");
    socket.emit("console-msg", "Updating excel upload sheet...");

    const response = await meta.updateSheet({
      xlPath: pathToExcelSheet,
      data,
      socket,
    });

    if (!response) {
      setState("paused");
      return;
    } else {
      setState("running");
    }

    socket.emit("console-msg", response);

    console.log("restarting bot...");
    socket.emit("console-msg", "restarting bot...");
    try {
      await bot.restart("ebookquetnetwork@gmail.com", "123456");
    } catch (error) {
      console.log("Error: ", error);
      console.log("Cannot restart bot, make sure bot has already started!");
      socket.emit(
        "console-msg",
        "Cannot restart bot, make sure bot has already started!"
      );
    }
  }
}

export const socketServe = new SocketServices();
