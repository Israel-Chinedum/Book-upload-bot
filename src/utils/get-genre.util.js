import ExcelJS from "exceljs";

export const getGenre = async (xlPath, socket) => {
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
};
