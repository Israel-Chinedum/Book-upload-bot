import express from "express";
import http from "http";
import { Server } from "socket.io";
import { socketConnection } from "./sockets/socket.controller.js";
import dotenv from "dotenv";

export const envConfig = dotenv.config();
export let state = "running";
export const setState = (newState) => (state = newState);
export let _sheetTitle;
export let _pathToBooks;
export let _pathToExcelSheet;
export const setPaths = ({ pathToBooks, pathToExcelSheet }) => {
  _pathToBooks = pathToBooks || process.env.PATH_TO_BOOKS;
  _pathToExcelSheet = pathToExcelSheet || process.env.PATH_TO_EXCEL_SHEET;
  console.log("PATHS: ", pathToBooks, pathToExcelSheet);
};

export const setSheetTitle = (sheetTitle) => {
  _sheetTitle = sheetTitle;
};

const app = express();
let port = 3500;

const startServer = () => {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  socketConnection(io);

  app.use(express.static("./src/static"));
  app.set("views", "./src/static");
  app.set("view engine", "ejs");

  app.get("", (req, res) => {
    res.render("landing_page");
  });

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(
        `Port ${port} is already in use, switching to a different port`
      );
      port += 1;
      startServer();
    } else {
      console.log("SERVER ERROR: ", err);
    }
  });

  httpServer.listen(port, () => console.log(`Port ${port} is now active!`));

  return io;
};

startServer();
