import express from "express";
import http from "http";
import { Server } from "socket.io";
import { socketConnection } from "./sockets/socket.controller.js";

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
