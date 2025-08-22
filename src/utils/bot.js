import { chromium } from "playwright";
import ExcelJS from "exceljs";
import * as fs from "fs/promises";

export class Bot {
  xlPath;
  path;
  url;
  numOfBooksUploaded;
  page;

  constructor({ xlPath, path, url }) {
    this.xlPath = xlPath;
    this.path = path;
    this.url = url;
    this.numberOfBooksUploaded = 0;
  }

  // =====GET FILE NAMES=====
  async getFileNames(socket) {
    try {
      const fileNames = await fs.readdir(this.path);
      return fileNames;
    } catch (error) {
      console.log("ERROR: ", error);
      socket.emit(
        "console-msg",
        "Error: unable to get files, path may be invalid!"
      );
    }
  }

  async getGenre(xlPath, socket) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(xlPath);

      const sheet = workbook.getWorksheet(1);

      const genreArr = [];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber != 1) {
          genreArr.push(row.values[row.values.length - 1]);
        }
      });
      return genreArr;
    } catch (error) {
      console.log("Error: ", error);
      socket.emit("console-msg", "Error: unable to get worksheet data!");
    }
  }

  //=====Login=====
  async login(email, password) {
    await this.page.goto(this.url);
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await Promise.all([
      this.page.waitForSelector(".trailer button", { state: "visible" }),
      this.page.click("button"),
    ]);
  }

  //=====Upload books=====
  async uploadBook(socket, uploadBtn = false) {
    if (uploadBtn) {
      await this.page.screenshot({
        path: `./screenshots/proof-${Date.now()}.png`,
        fullPage: true,
      });
    }

    await Promise.all([
      this.page.waitForNavigation({ timeout: 60000 }),
      this.page.click(".trailer button"),
    ]);

    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles("../book uploads.xlsx");

    const fileNames = await this.getFileNames();
    const genre = await this.getGenre(this.xlPath, socket);

    await this.page.waitForTimeout(5000);

    for (let i = 0; i < 10; i++) {
      console.log("I: ", i);
      const fileInputPhoto = this.page.locator(
        `input[name="import[${i}][photo]"]`
      );
      const fileInputSrc = this.page.locator(
        `input[name="import[${i}][source]"]`
      );
      const fileName = await this.page
        .locator(`input[name="import[${i}][title]"]`)
        .inputValue();

      if (fileName) {
        const pdf = fileNames.filter(
          (name) =>
            name.toLocaleLowerCase().includes(fileName.toLocaleLowerCase()) &&
            name.toLocaleLowerCase().includes(".pdf")
        );
        const photo = fileNames.filter(
          (name) =>
            name.toLocaleLowerCase().includes(fileName) &&
            !name.toLocaleLowerCase().includes(".pdf")
        );
        //=====CHECK IF FILE EXISTS=====
        if (!pdf.length && !photo.length) {
          console.log({ error: "File not found!", fileName, index: i });
          socket.emit("console-msg", {
            error: "File not found! skipping...",
            fileName,
            index: i,
          });
        }
        if (pdf.length && !photo.length) {
          await fileInputSrc.setInputFiles(`${this.path}/${pdf[0]}`);
          console.log({ fileName, "OG-fileName": pdf[0], index: i });
          socket.emit("console-msg", {
            fileName,
            "OG-fileName": pdf[0],
            index: i,
          });
          console.log({ error: "Thumbnail not found!", fileName });
          socket.emit("console-msg", {
            error: "Thumbnail Not found! skipping...",
            index: i,
          });
        }
        if (photo.length && !pdf.length) {
          await fileInputPhoto.setInputFiles(`${this.path}/${photo[0]}`);
          console.log({ fileName, "OG-fileName": photo[0], index: i });
          socket.emit("console-msg", {
            fileName,
            "OG-fileName": photo[0],
            index: i,
          });
          console.log({ error: "pdf Not found!", fileName, index: i });
          socket.emit("console-msg", {
            error: "pdf Not found! skipping...",
            fileName,
            index: i,
          });
        }
        if (photo.length && pdf.length) {
          await fileInputSrc.setInputFiles(`${this.path}/${pdf[0]}`);
          console.log({ fileName, "OG-fileName": pdf[0], index: i });
          socket.emit("console-msg", {
            fileName,
            "OG-fileName": pdf[0],
            index: i,
          });

          await fileInputPhoto.setInputFiles(`${this.path}/${photo[0]}`);
          console.log({ fileName, "OG-fileName": photo[0], index: i });
          socket.emit("console-msg", {
            fileName,
            "OG-fileName": photo[0],
            index: i,
          });
        }

        const options = await this.page
          .locator(`select[name="import[${i}][genre]"]`)
          .allTextContents();

        if (options[0].toLowerCase().includes(genre[i].toLowerCase())) {
          await this.page
            .locator(`select[name="import[${i}][genre]"]`)
            .selectOption({ label: `${genre[i]}` });
        } else {
          console.log(`Genre "${genre[i]}" not found! skipping...`);
          socket.emit(
            "console-msg",
            `Genre "${genre[i]}" not found! skipping...`
          );
        }
      }
    }
    await this.page.click('text="Import All"');
    this.numberOfBooksUploaded += 10;
    console.log(`Done! ${this.numberOfBooksUploaded} have been uploaded!`);
    socket.emit(
      "console-msg",
      `Done! ${this.numberOfBooksUploaded} have been uploaded!`
    );
    socket.emit("done");
  }

  // =====START BOT=====
  async start(email, password, socket) {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    this.page = await context.newPage();
    this.page.setDefaultTimeout(60000);

    socket.emit("console-msg", "Logging in...");
    await this.login(email, password);
    socket.emit("console-msg", "logged in! ✔");
    await this.uploadBook(socket);
  }
}
