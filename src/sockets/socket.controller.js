import { io } from "../server.js";
import { SocketServices } from "./socket.service.js";
import { Bot } from "../bot/bot.controller.js";

const socketServe = new SocketServices();

export const socketConnection = () => {
  io.on("connection", (socket) => {
    console.log("New user connected!");

    const bot = new Bot({
      xlPath: "../book uploads.xlsx",
      path: "../books 4/04/sheet 5/Mishael/current/301-400",
      url: "https://ebookquet.com/admin",
      socket,
    });

    //start-bot
    socket.on("start-bot", async ({ initial, sheetTitle, spreadsheetId }) => {
      socketServe.startBot({
        initial,
        bot,
        socket,
        sheetTitle,
        spreadsheetId,
      });
    });

    //restart-bot
    socket.on("restart-bot", ({ sheetTitle, spreadsheetId }) => {
      socketServe.restartBot({ bot, socket, sheetTitle, spreadsheetId });
    });
  });
};
