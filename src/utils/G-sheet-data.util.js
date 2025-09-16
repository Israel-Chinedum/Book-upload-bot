import { google } from "googleapis";
import { Filer } from "./filer.util.js";
import { sheetRange } from "../sockets/socket.service.js";

const filer = new Filer({ path: "./worksheet.json" });

export class GSheetData {
  keyFile;
  scopes;
  spreadsheetId;
  sheetTitle;
  range;

  constructor({ spreadsheetId, keyFile, scopes, sheetTitle }) {
    this.keyFile = keyFile;
    this.scopes = scopes;
    this.spreadsheetId = spreadsheetId;
    this.sheetTitle = sheetTitle;
  }

  authorize() {
    const auth = new google.auth.GoogleAuth({
      keyFile: this.keyFile,
      scopes: this.scopes,
    });
    const sheets = google.sheets({ version: "v4", auth });
    return sheets;
  }

  async getSheetData(range = sheetRange) {
    const sheets = this.authorize();

    let ranges;

    if (range) {
      ranges = `${this.sheetTitle}!${range}`;
    } else {
      console.log("Range not provided, sheet title will be used!");
      ranges = this.sheetTitle;
    }

    const res = await sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      includeGridData: true,
      ranges: [ranges],
    });

    const rows = res.data.sheets[0].data[0].rowData;
    const sheetData = [];

    let startIndex = 0;
    let i;

    if (range) {
      const splitRange = range.split(":")[0];
      let startIndexStr = "";
      for (let i = 0; i < splitRange.split("").length; i++) {
        if (i != 0) {
          startIndexStr += splitRange.split("")[i];
        }
      }
      startIndex = Number(startIndexStr);
      i = 0;
    } else {
      i = 1;
    }

    while (i < rows.length) {
      const cellColor = rows[i]?.values[0]?.effectiveFormat?.backgroundColor;
      const isRed = this.isRed(cellColor);
      if (!isRed) {
        const row = rows[i].values;
        if (
          row[0]?.userEnteredValue &&
          row[1]?.userEnteredValue &&
          // row[2]?.userEnteredValue &&
          // row[4]?.userEnteredValue &&
          // row[5]?.userEnteredValue &&
          // row[7]?.userEnteredValue &&
          row[8]?.userEnteredValue
        ) {
          sheetData.push({
            book_title: row[0].userEnteredValue.stringValue,
            author: row[1].userEnteredValue.stringValue,
            description: row[2]?.userEnteredValue?.stringValue,
            year: "",
            type: "FREE",
            price: 0,
            ISBN: "",
            status: "ACTIVE",
            genre: row[8].userEnteredValue.stringValue,
            index: startIndex,
          });
        }
      }
      startIndex++;
      i++;
    }

    return { sheetData, length: sheetData.length };
  }

  async getSheetId() {
    const sheets = this.authorize();
    const res = await sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });
    const sheetIdArr = new Map();

    for (let sheet of res.data.sheets) {
      sheetIdArr.set(`${sheet.properties.title}`, sheet.properties.sheetId);
    }
    return sheetIdArr.get(this.sheetTitle);
  }

  isRed(rgb) {
    let isRed = true;
    if (!(rgb instanceof Object) || rgb.constructor !== Object) return !isRed;
    const keys = Object.keys(rgb);
    if (keys.length > 1) return !isRed;
    for (let key of keys) {
      key == "red" && rgb[`${key}`] == 1 ? isRed : (isRed = false);
    }
    return isRed;
  }

  async colorUploadedRows(socket) {
    const data = await filer.readFile();
    for (let i of JSON.parse(data)) {
      if (i) {
        await this.setRowColors({
          startRowIndex: i.index - 1,
          endRowIndex: i.index,
          backgroundColor: { red: 1 },
        });
      }
      console.log("Row", i.index, "has been colored!");
      socket.emit("console-msg", `Row ${i.index} has been colored!`);
    }
  }

  async setRowColors({ startRowIndex, endRowIndex, backgroundColor }) {
    try {
      !startRowIndex ||
        (typeof startRowIndex !== "number" && {
          error: "Please provide valid argument for startRowIndex!",
        });
      !endRowIndex ||
        (typeof endRowIndex !== "number" && {
          error: "Please provide valid argument for endRowIndex!",
        });
      !backgroundColor ||
        (!backgroundColor instanceof Object && {
          error: "background color must be an object!",
        });

      const sheets = this.authorize();
      const sheetId = await this.getSheetId();
      !sheetId && { error: "could not get sheetId!" };

      const requestBody = {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex,
                endRowIndex,
              },
              cell: {
                userEnteredFormat: { backgroundColor },
              },
              fields: "userEnteredFormat.backgroundColor",
            },
          },
        ],
      };

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody,
      });
    } catch (error) {
      console.log("Error: ", error);
      console.log("An error occured while trying to set rows!");
    }
  }

  async getAllRowColors() {
    const sheets = this.authorize();
    const res = await sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      includeGridData: true,
      fields:
        "sheets.properties,sheets.data.rowData.values.userEnteredFormat.backgroundColor",
    });

    const sheet = res.data.sheets.find(
      (sheet) => sheet.properties.title == this.sheetTitle
    );

    const rows = sheet.data[0].rowData;

    rows.forEach((row, index) => {
      if (!row.values) return;
      const colors = row.values.map(
        (cell) => cell.userEnteredFormat?.backgroundColor || null
      );
      row.values[0];
      console.log(`ROW ${index + 1}: `, colors);
    });
  }
}
