import { chromium } from "playwright";
import { getFileNames } from "../utils/get-filenames.util.js";
import { MetaDataApi } from "../utils/meta-data-api.util.js";
import { Filer } from "../utils/filer.util.js";
import { socketServe } from "../sockets/socket.service.js";
import { bestMatch } from "../utils/compare.util.js";
import { setState, state } from "../server.js";
import { _pathToBooks, _pathToExcelSheet } from "../server.js";

const filer = new Filer({ path: "./proof.json" });
const meta = new MetaDataApi();
export let nobku = 0; //nobku stands for number of books uploaded or numOfBooksUploaded;

export class BotServices {
  page;
  url;
  numOfBooksUploaded;
  socket;

  constructor(url, socket) {
    this.url = url;
    this.numberOfBooksUploaded = 0;
    this.socket = socket;
  }

  //=====LOGIN METHOD=====
  async login(email, password) {
    await this.page.goto(this.url);
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await Promise.all([
      this.page.waitForSelector(".trailer button", { timeout: 0 }),
      this.page.click("button"),
    ]);
  }

  //=====UPLOAD METHOD=====
  async uploadBook() {
    await this.page.screenshot({
      path: `./screenshots/proof-${Date.now()}.png`,
      fullPage: true,
    });

    await Promise.all([
      this.page.waitForNavigation({ timeout: 0 }),
      this.page.click(".trailer button"),
    ]);

    const fileInput = this.page.locator('input[type="file"][name="doc"]');
    await fileInput.setInputFiles(_pathToExcelSheet);

    const fileNames = await getFileNames(_pathToBooks, this.socket);
    const genre = await meta.getGenre(_pathToExcelSheet, this.socket);
    const desc = await meta.getDesc(_pathToExcelSheet, this.socket);
    const author = await meta.getAuthor(_pathToExcelSheet, this.socket);

    await this.page.waitForNavigation({ timeout: 0 });
    await this.page.waitForSelector("form.preview");
    this.page.waitForTimeout(5000);

    const form = await this.page.locator("form.preview");
    const formChildren = await form.locator(":scope > .item");
    const count = await formChildren.count();

    for (let i = 0; i < count; i++) {
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
      console.log("FILE NAME: ", fileName);

      if (fileName) {
        const pdf = fileNames.filter((name) => {
          if (
            name.trim().toLowerCase().includes(fileName.trim().toLowerCase()) &&
            name.trim().toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
          if (
            `The ${name}`
              .trim()
              .toLowerCase()
              .includes(fileName.trim().toLowerCase()) &&
            name.trim().toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }

          if (
            `A ${name}`
              .trim()
              .toLowerCase()
              .includes(fileName.trim().toLowerCase()) &&
            name.trim().toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
        });
        const photo = fileNames.filter((name) => {
          if (
            name.trim().toLowerCase().includes(fileName.trim().toLowerCase()) &&
            !name.trim().toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
          if (
            `The ${name}`
              .trim()
              .toLowerCase()
              .includes(fileName.trim().toLowerCase()) &&
            !name.trim().toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
          if (
            `A ${name}`
              .trim()
              .toLowerCase()
              .includes(fileName.trim().toLowerCase()) &&
            !name.trim().toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
        });

        //=====CHECK IF FILE EXISTS=====
        if (pdf.length) {
          let mainPDF = pdf[0];
          if (pdf.length > 1) {
            console.log("PDF: ", pdf);
            mainPDF = bestMatch({
              argArr: pdf,
              desc: desc[i],
              author: author[i],
            });
            console.log("mainPDF: ", mainPDF);
          }
          await fileInputSrc.setInputFiles(`${_pathToBooks}/${mainPDF}`);
          console.log({ fileName, "OG-fileName": mainPDF, index: i });
          this.socket.emit("console-msg", {
            fileName,
            "OG-fileName": mainPDF,
            index: i,
          });
        } else {
          console.log({ error: "pdf Not found!", fileName, index: i });
          this.socket.emit("console-msg", {
            error: "pdf not found! skipping...",
            fileName,
            index: i,
          });
        }
        if (photo.length) {
          let mainPhoto = photo[0];
          if (photo.length > 1) {
            mainPhoto = bestMatch({
              argArr: photo,
              desc: desc[i],
              author: author[i],
            });
          }
          await fileInputPhoto.setInputFiles(`${_pathToBooks}/${mainPhoto}`);
          console.log({ fileName, "OG-fileName": mainPhoto, index: i });
          this.socket.emit("console-msg", {
            fileName,
            "OG-fileName": mainPhoto,
            index: i,
          });
        } else {
          console.log({ error: "Thumbnail not found!", fileName, index: i });
          this.socket.emit("console-msg", {
            error: "Thumbnail not found! skipping...",
            fileName,
            index: i,
          });
        }

        const options = await this.page
          .locator(`select[name="import[${i}][genre]"] option`)
          .allTextContents();

        const currGenre = options.find((opt) =>
          genre[i].toLowerCase().trim().includes(opt.toLowerCase())
        );

        if (currGenre) {
          await this.page
            .locator(`select[name="import[${i}][genre]"]`)
            .selectOption({ label: `${currGenre}` });
        } else {
          console.log(`Genre "${genre[i]}" not found! skipping...`);
          this.socket.emit(
            "console-msg",
            `Genre "${genre[i]}" not found! skipping...`
          );
        }
      }
    }

    await Promise.all([
      this.page.waitForNavigation({ timeout: 0 }),
      this.page.click('text="Import All"'),
      console.log("Waiting for navigation..."),
    ]);

    console.log("About to sign proof...");
    await filer.sign();
    console.log("Done signing proof");

    await socketServe.G_sheet().colorUploadedRows(this.socket);

    this.numberOfBooksUploaded += genre.length;
    nobku += this.numOfBooksUploaded;
    console.log("GENRE LENGTH: ", genre.length);
    console.log(`Done! ${this.numberOfBooksUploaded} have been uploaded!`);
    this.socket.emit(
      "console-msg",
      `Done! ${this.numberOfBooksUploaded} have been uploaded!`
    );

    console.log("Retrieving meta data for books...");
    this.socket.emit("console-msg", "Retrieving meta data for books...");

    const data = await socketServe.G_sheet().getSheetData();

    console.log("Updating excel upload sheet...");
    this.socket.emit("console-msg", "Updating excel upload sheet...");

    const response = await meta.updateSheet({
      xlPath: _pathToExcelSheet,
      data,
      socket: this.socket,
    });

    if (!response) {
      setState("paused");
      return;
    }

    await this.page.waitForTimeout(5000);
    this.socket.emit("console-msg", response);
  }

  //=====START BOT METHOD=====
  async start(email, password) {
    try {
      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      this.page = await context.newPage();
      this.page.setDefaultTimeout(0);

      this.socket.emit("console-msg", "Logging in...");
      await this.login(email, password);
      this.socket.emit("console-msg", "logged in! ✔");

      while (this.numberOfBooksUploaded < 100 && state == "running") {
        await this.uploadBook();
      }

      if (this.numOfBooksUploaded > 0) {
        console.log(
          `Successfully uploaded ${this.numberOfBooksUploaded} books!`
        );
        this.socket.emit(
          "console-msg",
          `Successfully uploaded ${this.numberOfBooksUploaded} books and bot operations have been paused!`
        );
        this.socket.emit(
          "console-msg",
          'If you wish to continue click on the "continue uploading button above!"'
        );
      }
      this.socket.emit("continue");
    } catch (error) {
      console.log("Error: ", error);
      this.socket.emit("console-msg", {
        error: "an error occured while bot was running!",
      });
    }
  }

  //=====RESTART BOT METHOD=====
  async restart(email, password) {
    try {
      this.page && (await this.page.close());
      await this.start(email, password);
    } catch (error) {
      console.log("Error: ", error);
      this.socket.emit("console-msg", {
        error: "an error occured while trying to restart bot!",
      });
    }
  }
}
