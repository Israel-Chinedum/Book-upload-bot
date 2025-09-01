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

    const bot = new Bot({
      xlPath: _pathToExcelSheet,
      path: _pathToBooks,
      url: "https://ebookquet.com/admin",
      socket,
    });

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
        _pathToBooks = pathToBooks || process.env.PATH_TO_BOOKS;
        _pathToExcelSheet = pathToExcelSheet || process.env.PATH_TO_EXCEL_SHEET;

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
