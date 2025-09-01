const socket = io();

const startBtn = document.querySelector("#start-btn");
const msgConsole = document.querySelector("#console");
const uploadBks = document.querySelector("#upload-books");
const restartBtn = document.querySelector("#restart-btn");
const sheetTitle = document.querySelector("#sheet-title");
const spreadsheetId = document.querySelector("#spreadsheet-id");
const pathToBooks = document.querySelector("#path-to-books");
const pathToExcelSheet = document.querySelector("#path-to-excel-sheet");

const createText = (text, color = "darkcyan") => {
  const p = document.createElement("p");
  p.innerText = text;
  p.style.minWidth = "max-content";
  p.style.marginRight = "15px";
  p.style.marginTop = "2px";
  p.style.marginBottom = "2px";
  p.style.color = `${color}`;
  return p;
};

startBtn.addEventListener("click", () => {
  socket.emit("start-bot", {
    sheetTitle: sheetTitle.value,
    spreadsheetId: spreadsheetId.value,
    pathToBooks: pathToBooks.value,
    pathToExcelSheet: pathToExcelSheet.value,
  });
  startBtn.style.display = "none";
  restartBtn.style.display = "block";
  uploadBks.style.display = "block";
  uploadBks.disabled = true;
});

restartBtn.addEventListener("click", () => {
  socket.emit("restart-bot", {
    sheetTitle: sheetTitle.value,
    spreadsheetId: spreadsheetId.value,
    pathToBooks: pathToBooks.value,
    pathToExcelSheet: pathToExcelSheet.value,
  });
  uploadBks.disabled = true;
});

uploadBks.addEventListener("click", () => {
  socket.emit("start-bot", {
    initial: false,
    sheetTitle: sheetTitle.value,
    spreadsheetId: spreadsheetId.value,
  });
  uploadBks.disabled = true;
});

socket.on("done", () => {
  uploadBks.disabled = false;
});

socket.on("console-msg", (msg) => {
  if (msg instanceof Object) {
    msgConsole.appendChild(createText("\n{"));
    for (let key in msg) {
      const consoleDiv = document.createElement("div");
      consoleDiv.style.display = "flex";
      consoleDiv.appendChild(createText(`${key}:`, key == "error" && "orange"));
      consoleDiv.appendChild(
        createText(msg[`${key}`], key == "error" ? "darkred" : "grey")
      );
      msgConsole.appendChild(consoleDiv);
    }
    msgConsole.appendChild(createText("}"));
  } else {
    msgConsole.appendChild(createText("\n" + msg));
  }

  msgConsole.scrollTo({ top: msgConsole.scrollHeight, behavior: "smooth" });
});
