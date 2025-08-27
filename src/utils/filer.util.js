import * as fs from "fs/promises";

export class Filer {
  path;

  constructor({ path }) {
    this.path = path;
  }

  async readFile(path) {
    if (!path) {
      console.log({ message: "Path not provided, resolving to default path!" });
      path = this.path;
    }

    try {
      const data = await fs.readFile(path);
      return data;
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async writeFile({ path, data }) {
    if (!path) {
      console.log({ message: "Path not provided, resolving to default path!" });
      path = this.path;
    }

    try {
      await fs.writeFile(path, data);
      console.log(`${path} has been updated!`);
    } catch (error) {
      console.log(error);
    }
  }

  async stash(proofData) {
    try {
      const data = await this.readFile(this.path);
      if (!data.toString()) {
        await this.writeFile({
          path: this.path,
          data: JSON.stringify(proofData),
        });
      } else {
        let jsonData = JSON.parse(data);
        jsonData = [...jsonData, ...proofData];
        await this.writeFile({
          path: this.path,
          data: JSON.stringify(jsonData),
        });
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async sign() {
    try {
      const data = await this.readFile("./proof.json");
      const worksheetData = await this.readFile("./worksheet.json");
      if (!data.toString()) {
        await this.writeFile({
          path: "./proof.json",
          data: JSON.stringify(JSON.parse([worksheetData])),
        });
      } else {
        const proofData = await this.readFile("./proof.json");
        const jsonData = JSON.parse(proofData);
        jsonData.push(worksheetData);
        await this.writeFile({
          path: "./proof.json",
          data: JSON.stringify(jsonData),
        });
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  }
}
