import { exec } from "child_process";
import express from "express";
import { readFile } from "fs";
import http from "http";
import path from "path";
import readline from "readline";
import { WebSocket, WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});
const PORT = 3000;

let wsClient : WebSocket | null = null;
let browserPathGlobalPath: string | null = null;







/* CONECT WS / FRONTEND START */
/**
 * Function ask Browser
*/
function askBrowserPathClient(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "\nDigite o caminho completo do navegador (ex: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe):\n> ",
      (browserPathGlobal) => {
        rl.close();
        resolve(browserPathGlobal.trim());
      }
    );
  });
};

/**
 * Server local Websocket
*/
wss.on("connection", (ws) => {
    console.log("🌐 WebSocket Conectado!");    
    wsClient = ws;

    ws.on("close", () => {
        console.log("❌ WebSocket Desconectado!");
        wsClient = null;
    });
});
(async () => {
    browserPathGlobalPath = await askBrowserPathClient();
    const url = `http://localhost:${PORT}`;

    server.listen(PORT, () =>{
        console.log(`Servidor Rodando em ${url}. Nagegador encontrado e executando.`);
    });

    if(process.platform === 'win32'){
        exec(`start "${url}"`)
    }else{
        exec(`xdg-open "${url}"`)
    }
})();

/**
 * Define local to frontend start in server instance
 */
app.use(express.static(path.resolve(__dirname, "../frontend/dist")));
app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
});
/* CONNECT WS / FRONTEND END */