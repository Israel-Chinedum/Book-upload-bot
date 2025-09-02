import { chromium } from "playwright";
import { getFileNames } from "../utils/get-filenames.util.js";
import { MetaDataApi } from "../utils/meta-data-api.util.js";
import { Filer } from "../utils/filer.util.js";
import { socketServe } from "../sockets/socket.service.js";
import { bestMatch } from "../utils/compare.util.js";

const filer = new Filer({ path: "./proof.json" });
const meta = new MetaDataApi();

export class BotServices {
  page;
  url;
  path;
  xlPath;
  numOfBooksUploaded;
  socket;

  constructor(page, url, path, xlPath, socket) {
    this.page = page;
    this.url = url;
    this.path = path;
    this.xlPath = xlPath;
    this.numberOfBooksUploaded = 0;
    this.socket = socket;
  }

  async login(email, password) {
    await this.page.goto(this.url);
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await Promise.all([
      this.page.waitForSelector(".trailer button", { timeout: 0 }),
      this.page.click("button"),
    ]);
  }

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
    await fileInput.setInputFiles("../book uploads.xlsx");

    const fileNames = await getFileNames(this.path, this.socket);
    const genre = await meta.getGenre(this.xlPath, this.socket);
    const desc = await meta.getDesc(this.xlPath, this.socket);

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
      console.log("FILE NAME: ", fileName);

      if (fileName) {
        const pdf = fileNames.filter((name) => {
          if (
            name.toLowerCase().includes(fileName.toLowerCase()) &&
            name.toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
          if (
            `The ${name}`.toLowerCase().includes(fileName.toLowerCase()) &&
            name.toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }

          if (
            `A ${name}`.toLowerCase().includes(fileName.toLowerCase()) &&
            name.toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
        });
        const photo = fileNames.filter((name) => {
          if (
            name.toLowerCase().includes(fileName.toLowerCase()) &&
            !name.toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
          if (
            `The ${name}`.toLowerCase().includes(fileName.toLowerCase()) &&
            !name.toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
          if (
            `A ${name}`.toLowerCase().includes(fileName.toLowerCase()) &&
            !name.toLowerCase().endsWith(".pdf")
          ) {
            return name;
          }
        });

        //=====CHECK IF FILE EXISTS=====
        if (pdf.length) {
          let mainPDF = pdf[0];
          if (pdf.length > 1) {
            mainPDF = bestMatch(pdf, desc[i]);
          }
          await fileInputSrc.setInputFiles(`${this.path}/${mainPDF}`);
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
            mainPhoto = bestMatch(photo, desc[i]);
          }
          await fileInputPhoto.setInputFiles(`${this.path}/${mainPhoto}`);
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
          opt.toLowerCase().includes(genre[i].toLowerCase().trim())
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

    Promise.all([
      await this.page.click('text="Import All"'),
      await this.page.waitForNavigation({ timeout: 0 }),
    ]);

    await filer.sign();

    await socketServe.G_sheet().colorUploadedRows();

    this.numberOfBooksUploaded += 10;
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
      xlPath: "../book uploads.xlsx",
      data,
    });

    await this.page.waitForTimeout(5000);

    this.socket.emit("console-msg", response);

    this.uploadBook();
  }

  async start(email, password) {
    try {
      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      this.page = await context.newPage();
      this.page.setDefaultTimeout(0);

      this.socket.emit("console-msg", "Logging in...");
      await this.login(email, password);
      this.socket.emit("console-msg", "logged in! ✔");
      await this.uploadBook();
    } catch (error) {
      console.log("Error: ", error);
      this.socket.emit("console-msg", {
        error: "an error occured while bot was running!",
      });
    }
  }

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
