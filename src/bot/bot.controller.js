import { BotServices } from "./bot.service.js";

export class Bot {
  botServe;
  socket;

  constructor({ url, socket }) {
    this.botServe = new BotServices(url, socket);
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
      return this.botServe.uploadBook();
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
