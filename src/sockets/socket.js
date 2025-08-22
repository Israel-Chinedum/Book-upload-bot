import { io } from "../server.js";
import { Bot } from "../bot/bot.controller.js";

export const socketConnection = () => {
  io.on("connection", (socket) => {
    console.log("New user connected!");

    const bot = new Bot({
      xlPath: "../book uploads.xlsx",
      path: "../edidiong/5/301-400",
      url: "https://ebookquet.com/admin",
      socket,
    });

    socket.on("start-bot", (initial = true) => {
      if (initial) {
        console.log("starting bot...");
        socket.emit("console-msg", "Starting bot...");
        bot.start("ebookquetnetwork@gmail.com", "123456");
      } else {
        bot.uploadBook(true);
        socket.emit("console-msg", "uploading...");
      }
    });

    socket.on("restart-bot", () => {
      console.log("restarting bot...");
      socket.emit("console-msg", "restarting bot...");
      bot.restart("ebookquetnetwork@gmail.com", "123456");
    });
  });
};
