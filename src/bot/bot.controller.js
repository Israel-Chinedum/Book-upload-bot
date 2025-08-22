import { BotServices } from "./bot.services.js";

export class Bot {
  xlPath;
  path;
  page;
  botServe;
  socket;

  constructor({ xlPath, path, url, socket }) {
    this.xlPath = xlPath;
    this.path = path;
    this.botServe = new BotServices(this.page, url, path, xlPath, socket);
    this.socket = socket;
  }

  //=====Login=====
  login(email, password) {
    try {
      return this.botServe.login(email, password);
    } catch (error) {
      console.log("Error: ", error);
      console.log("Error: an error occured while trying to login!");
      this.socket.emit("console-msg", {
        error: "an error occured while trying to login!",
      });
    }
  }

  //=====Upload books=====
  uploadBook() {
    try {
      return this.botServe.uploadBook(uploadBtn);
    } catch (error) {
      console.log("Error: ", error);
      console.log("Error: an error occured while trying to upload books!");
      this.socket.emit("console-msg", {
        error: "an error occured while trying to upload books!",
      });
    }
  }

  // =====START BOT=====
  start(email, password) {
    try {
      return this.botServe.start(email, password);
    } catch (error) {
      console.log("Error: ", error);
      console.log("Error: an error occured while trying to start bot!");
      this.socket.emit("console-msg", {
        error: "an error occured while trying to start bot! ",
      });
    }
  }

  restart(email, password) {
    try {
      return this.botServe.restart(email, password);
    } catch (error) {
      console.log("Error: ", error);
      console.log("Error: an error occured while trying to restart bot!");
      this.socket.emit("console-msg", {
        error: "an error occured while trying to restart bot! ",
      });
    }
  }
}
