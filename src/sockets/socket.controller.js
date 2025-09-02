import { io } from "../server.js";
import { socketServe } from "./socket.service.js";
import { Bot } from "../bot/bot.controller.js";
import { envConfig } from "../server.js";

export const socketConnection = () => {
  envConfig;
  let _pathToBooks;
  let _pathToExcelSheet;

  io.on("connection", (socket) => {
    console.log("New user connected!");

    let bot;

    //start-bot
    socket.on(
      "start-bot",
      async ({
        initial,
        sheetTitle,
        spreadsheetId,
        pathToBooks,
        pathToExcelSheet,
        range,
      }) => {
        _pathToBooks = pathToBooks || process.env.PATH_TO_BOOKS;
        _pathToExcelSheet = pathToExcelSheet || process.env.PATH_TO_EXCEL_SHEET;

        bot = new Bot({
          xlPath: _pathToExcelSheet,
          path: _pathToBooks,
          url: "https://ebookquet.com/admin",
          socket,
        });

        socketServe.startBot({
          initial,
          bot,
          socket,
          sheetTitle,
          spreadsheetId,
          range,
        });
      }
    );

    //restart-bot
    socket.on(
      "restart-bot",
      ({ sheetTitle, spreadsheetId, pathToBooks, pathToExcelSheet, range }) => {
        _pathToBooks = pathToBooks || process.env.PATH_TO_BOOKS;
        _pathToExcelSheet = pathToExcelSheet || process.env.PATH_TO_EXCEL_SHEET;
        socketServe.restartBot({
          bot,
          socket,
          sheetTitle,
          spreadsheetId,
          range,
        });
      }
    );

    socket.on("get-path-to-books", () => {
      socket.emit("path-to-books", `${process.env.PATH_TO_BOOKS}`);
    });

    socket.on("get-path-to-excel-sheet", () => {
      socket.emit("path-to-excel-sheet", `${process.env.PATH_TO_EXCEL_SHEET}`);
    });
  });
};
