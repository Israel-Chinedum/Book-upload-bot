import express from "express";
import http from "http";
import { Server } from "socket.io";
import { socketConnection } from "./sockets/socket.controller.js";
import dotenv from "dotenv";

export const envConfig = dotenv.config();
export let state = "running";
export const setState = (newState) => (state = newState);
export let _pathToBooks;
export let _pathToExcelSheet;
export const setPaths = ({ pathToBooks, pathToExcelSheet }) => {
  _pathToBooks = pathToBooks || process.env.PATH_TO_BOOKS;
  _pathToExcelSheet = pathToExcelSheet || process.env.PATH_TO_EXCEL_SHEET;
  console.log("PATHS: ", pathToBooks, pathToExcelSheet);
};

const app = express();

const httpServer = http.createServer(app);
export const io = new Server(httpServer);
socketConnection();

app.use(express.static("./src/static"));
app.set("views", "./src/static");
app.set("view engine", "ejs");

const port = 3500;

app.get("", (req, res) => {
  res.render("landing_page");
});

httpServer.listen(port, () => console.log(`Port ${port} is now active!`));
