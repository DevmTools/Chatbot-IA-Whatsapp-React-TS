import fs from "fs";
import readline from "readline";

export async function askBrowserPathClient(): Promise<string> {
  while (true) {
    const path = await new Promise<string>((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(
        "\nDigite o caminho completo do navegador (ex: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe):\n> ",
        (browserPath) => {
          rl.close();
          resolve(browserPath.trim());
        }
      );
    });

    if (fs.existsSync(path)) {
      console.log("✅ Caminho válido encontrado:", path);
      return path;
    } else {
      console.log("❌ Caminho inválido. Por favor, digite um caminho válido.");
    }
  }
}