import express from "express";
import path from "path";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import { exec } from "child_process";
import qrcode from "qrcode";
import { askBrowserPathClient } from "./utils/askBrowserPathClient"
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});
const PORT = 3000;

let isClientReady = false;
let wsocketInstance : WebSocket | null = null;
let wwebInstance: any = null;
let browserPath = null;
let qrUrl: string | null = null

//✨ IA
//🤖 Robo
//🌐 WebSocket
//💻 Servidor
//✅ Sucesso
//❌ Falha

app.get("/getQRCode", async (_, res) => {

  // 1 verifica instancia existente
  if(wwebInstance){
    qrUrl = null;
    wsocketInstance?.send(JSON.stringify({type:"instance-true", message:"[🌐] > Já Existe uma instância Pronta!"}));
    return res.json({qr: qrUrl, message:"[💻] - Já Existe uma Instância Rodando"});
  }
  // 2 Cria nova instancia
  wwebInstance = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      executablePath: browserPath!,
      args: ["--no-sandbox", "--disable-setuid-sandbox" ],
    },
  });
  
  // 3 Inicializa nova Instancia
  wwebInstance.initialize();

  // 4 Instancia pronta
  wwebInstance.on("ready", () => {
    wsocketInstance?.send(JSON.stringify({type:"wweb-true", message:"[🌐] > Instancia Whatsapp Ready!"}));
    isClientReady = true;
  });

  // Criando qrCode com url do Whatsapp
  const qrPromise = new Promise<string>((resolve, reject) => {
    
    wwebInstance!.on("qr", async (qr:any) => {
      try {
        const dataURL = await qrcode.toDataURL(qr);
        wsocketInstance?.send(JSON.stringify({type:"qr-true", message:"[🌐] > QRCode Gerado!"}));
        resolve(dataURL);
      } catch (err:any) {
        wsocketInstance?.send(JSON.stringify({type:"qr-false", message:"[🌐] > QRCode Não Gerado!"}));
        reject(err);
      }
    });

    wwebInstance.on("authenticated", () => {
      wsocketInstance?.send(JSON.stringify({type:"scanqr-true", message:"[🌐] > QR Code escaneado com sucesso! ✅"}));
      qrUrl = null;
    });

    wwebInstance!.on("auth_failure", (err:any) => {
      wsocketInstance?.send(JSON.stringify({type:"scanqr-false", message:"[🌐] > Falha na autenticação do QRCode! ❌"}));
      reject(new Error("Falha na autenticação: " + err))  
    });
  });

  try 
  {
    qrUrl = await qrPromise;
    res.json({qr:qrUrl, message: "[💻] - QRCode gerado. Aguardando autenticação"})
  }catch (error:any) 
  {
    res.json({qr:null, message: `[💻] - QRCode gerado. Aguardando autenticação ${error.message}`})
  }
})









/*
 * Define server local Websocket
*/
wss.on("connection", (ws) => {
    wsocketInstance?.send(JSON.stringify({type:"ws-true", message:"[WS] > 🌐 WebSocket Conectado!"}));   
    console.log("[💻] - WebSocket Conectado! ✅");
    wsocketInstance = ws;
    ws.on("close", () => 
    {
      console.log("[💻] - WebSocket Desconectado! ❌");
      wsocketInstance = null;
    });
});

/*
 * Run Server in Browser
*/
(async () => {
    browserPath = await askBrowserPathClient();
    const url = `http://localhost:${PORT}`;

    server.listen(PORT, () => {
        wsocketInstance?.send(JSON.stringify({type:"server-true", message:`[WS] > 🌐 Servidor Rodando em ${url}`}));   
        console.log(`[💻] - Servidor Rodando em ${url}.`);
    });
    if (browserPath) 
    {
      console.log("[💻] - Navegador encontrado e executado.")
      exec(`start "" "${browserPath}" ${url}`);
    }else 
    {
      console.warn("[💻] - Navegador informado não identificado.\n[💻] - Navegador padrao do sistema acionado.")
      exec(`start "" "${url}"`); // Usa o navegador padrão
    }
})();

/**
 * Define local to frontend
 */
app.use(express.static(path.resolve(__dirname, "../frontend/dist")));
app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
});