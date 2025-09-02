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
      }) => {
        console.log("PATH TO SHEET: ", process.env.PATH_TO_EXCEL_SHEET);
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
        });
      }
    );

    //restart-bot
    socket.on(
      "restart-bot",
      ({ sheetTitle, spreadsheetId, pathToBooks, pathToExcelSheet }) => {
        _pathToBooks = pathToBooks || process.env.PATH_TO_BOOKS;
        _pathToExcelSheet = pathToExcelSheet || process.env.PATH_TO_EXCEL_SHEET;
        socketServe.restartBot({ bot, socket, sheetTitle, spreadsheetId });
      }
    );
  });
};
