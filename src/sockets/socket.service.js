import { MetaDataApi } from "../utils/meta-data-api.util.js";
import { GSheetData } from "../utils/G-sheet-data.util.js";
const meta = new MetaDataApi();

export class SocketServices {
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

  async startBot({ initial = true, bot, socket, sheetTitle, spreadsheetId }) {
    if (!sheetTitle || !spreadsheetId) {
      console.log("Sheet title or spreadsheet id not provided!");
      socket.emit(
        "console-msg",
        "Please provide sheet title and spreadsheet id!"
      );
      return;
    }

    console.log("Retrieving meta data for books...");
    socket.emit("console-msg", "Retrieving meta data for books...");

    this.sheetTitle = sheetTitle;
    this.spreadsheetId = spreadsheetId;
    const sheetData = this.G_sheet(sheetTitle, spreadsheetId);

    const data = await sheetData.getSheetData();

    console.log("Updating excel upload sheet...");
    socket.emit("console-msg", "Updating excel upload sheet...");

    const response = await meta.updateSheet({
      xlPath: "../book uploads.xlsx",
      data,
    });
    socket.emit("console-msg", response);

    if (initial) {
      console.log("starting bot...");
      socket.emit("console-msg", "Starting bot...");
      bot.start("ebookquetnetwork@gmail.com", "123456");
    } else {
      socket.emit("console-msg", "uploading...");
      bot.uploadBook();
    }
  }

  async restartBot({ bot, socket, sheetTitle, spreadsheetId }) {
    if (!sheetTitle || !spreadsheetId) {
      console.log("Sheet title or spreadsheet id not provided!");
      socket.emit(
        "console-msg",
        "Please provide sheet title and spreadsheet id!"
      );
      return;
    }

    console.log("Retrieving meta data for books...");
    socket.emit("console-msg", "Retrieving meta data for books...");

    this.sheetTitle = sheetTitle;
    this.spreadsheetId = spreadsheetId;
    const sheetData = this.G_sheet(sheetTitle, spreadsheetId);

    const data = await sheetData.getSheetData();

    console.log("Updating excel upload sheet...");
    socket.emit("console-msg", "Updating excel upload sheet...");

    const response = await meta.updateSheet({
      xlPath: "../book uploads.xlsx",
      data,
    });
    socket.emit("console-msg", response);

    console.log("restarting bot...");
    socket.emit("console-msg", "restarting bot...");
    bot.restart("ebookquetnetwork@gmail.com", "123456");
  }
}
