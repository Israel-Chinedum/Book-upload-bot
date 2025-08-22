import { chromium } from "playwright";
import { getFileNames } from "../utils/get-filenames.util.js";
import { getGenre } from "../utils/get-genre.util.js";

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
      this.page.waitForSelector(".trailer button", { state: "visible" }),
      this.page.click("button"),
    ]);
  }

  async uploadBook(uploadBtn = false) {
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

    const fileNames = await getFileNames(this.path, this.socket);
    const genre = await getGenre(this.xlPath, this.socket);

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
            name.toLowerCase().includes(fileName.toLowerCase()) &&
            name.toLowerCase().includes(".pdf")
        );
        const photo = fileNames.filter(
          (name) =>
            name.toLowerCase().includes(fileName.toLowerCase()) &&
            !name.toLowerCase().includes(".pdf")
        );

        //=====CHECK IF FILE EXISTS=====
        if (pdf.length) {
          await fileInputSrc.setInputFiles(`${this.path}/${pdf[0]}`);
          console.log({ fileName, "OG-fileName": pdf[0], index: i });
          this.socket.emit("console-msg", {
            fileName,
            "OG-fileName": pdf[0],
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
          await fileInputPhoto.setInputFiles(`${this.path}/${photo[0]}`);
          console.log({ fileName, "OG-fileName": photo[0], index: i });
          this.socket.emit("console-msg", {
            fileName,
            "OG-fileName": photo[0],
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
          .locator(`select[name="import[${i}][genre]"]`)
          .allTextContents();

        if (options[0].toLowerCase().includes(genre[i].toLowerCase())) {
          await this.page
            .locator(`select[name="import[${i}][genre]"]`)
            .selectOption({ label: `${genre[i]}` });
        } else {
          console.log(`Genre "${genre[i]}" not found! skipping...`);
          this.socket.emit(
            "console-msg",
            `Genre "${genre[i]}" not found! skipping...`
          );
        }
      }
    }
    await this.page.click('text="Import All"');
    this.numberOfBooksUploaded += 10;
    console.log(`Done! ${this.numberOfBooksUploaded} have been uploaded!`);
    this.socket.emit(
      "console-msg",
      `Done! ${this.numberOfBooksUploaded} have been uploaded!`
    );
    this.socket.emit("done");
  }

  async start(email, password) {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    this.page = await context.newPage();
    this.page.setDefaultTimeout(60000);

    this.socket.emit("console-msg", "Logging in...");
    await this.login(email, password);
    this.socket.emit("console-msg", "logged in! ✔");
    await this.uploadBook();
  }

  async restart(email, password) {
    this.page.close();
    this.start(email, password);
  }
}
