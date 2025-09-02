import ExcelJS from "exceljs";
import { Filer } from "./filer.util.js";

const filer = new Filer({ path: "./worksheet.json" });

export class MetaDataApi {
  async getGenre(xlPath, socket) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(xlPath);

      const sheet = workbook.getWorksheet(1);

      const genreArr = [];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber != 1) {
          genreArr.push(row.values[row.values.length - 1]);
        }
      });
      return genreArr;
    } catch (error) {
      console.log("Error: ", error);
      socket.emit("console-msg", "Error: unable to get worksheet data!");
    }
  }

  async getDesc(xlPath, socket) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(xlPath);

      const sheet = workbook.getWorksheet(1);

      const descArr = [];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber != 1) {
          descArr.push(row.values[2]);
        }
      });
      return descArr;
    } catch (error) {
      console.log("Error: ", error);
      socket.emit("console-msg", "Error: unable to get worksheet data!");
    }
  }

  async updateSheet({ xlPath, data, socket }) {
    if (!data.sheetData || !data.sheetData.length) {
      console.log("No rows available!");
      socket.emit("console-msg", "No rows available!");
      return;
    }

    const rows = data.sheetData;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(xlPath);

      const sheet = workbook.getWorksheet(1);

      let tenRows = [];

      for (let i = 0; i < 10; i++) {
        const setRow = [];

        for (let key of Object.keys(rows[i])) {
          key != "index" && setRow.push(rows[i][`${key}`]);
        }
        sheet.getRow(i + 2).values = setRow;
        sheet.getRow(i + 2).commit();
        tenRows.push(rows[i]);
      }

      try {
        await filer.writeFile({ data: JSON.stringify(tenRows) });
      } catch (error) {
        console.log("Error: ", error);
      }

      await workbook.xlsx.writeFile("../book uploads.xlsx");
      console.log("Sheet has been updated!");
      return "Sheet has been updated!";
    } catch (error) {
      console.log("Error: ", error);
    }
  }
}
