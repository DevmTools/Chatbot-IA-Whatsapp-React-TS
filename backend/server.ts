import express from "express";
import path from "path";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import { exec } from "child_process";
import qrcode from "qrcode";
import { askBrowserPathClient } from "./utils/askBrowserPathClient"
import fs from "fs"

const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});
const PORT = 3000;

let isClientReady = false;
let wsocketInstance : WebSocket | null = null;
let wwebInstance: typeof Client | null = null;
let browserPath = null;
let qrUrl: string | null = null
let ignorarBotsPara: Set<string> = new Set();

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

    wwebInstance!.on("authenticated", () => {
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

app.get("/disconnect", async (_, res ) => {
  try 
  {
    if(!wwebInstance)
    {
      wsocketInstance?.send(JSON.stringify({type:"disconnect-false", message:"[🌐] > Não existe Conexao Pronta! ❌"}));
      return res.json({message:"[💻] - Não existe Conexão Pronta! ❌"});
    }
    await wwebInstance.destroy();
    wwebInstance = null;
    qrUrl = null;
    
    wsocketInstance?.send(JSON.stringify({type:"disconnect-true", message:"[🌐] > Sessão desconectada com Sucesso! ✅"}));
    return res.json({message:"[💻] - Sessão desconectada! ✅"});
  } catch (error) {
    return res.status(500).json({ message: "[💻] - Erro ao excluir sessão. ❌"});
  }
})

app.get("/delete-session", async (_, res) => {
  try 
  {
    const authPath = path.join(process.cwd(), ".wwebjs_auth");
    const cachePath = path.join(process.cwd(), ".wwebjs_cache");
    
    if(!wwebInstance)
    {
      if(fs.existsSync(authPath))
      {
        fs.rmSync(authPath,{recursive:true, force: true});
      }
      if(fs.existsSync(cachePath))
      {
        fs.rmSync(cachePath,{recursive:true, force: true});
      }
      wsocketInstance?.send(JSON.stringify({type:"delete-true", message:"[🌐] > Histórico de Autenticação e Cache apagados com sucesso! ✅"}));
      return res.status(200).json({message:"[💻] - Histórico de Autenticação e Cache apagados com sucesso! ✅"})
    } 

    await wwebInstance.destroy();
    
    wwebInstance = null;
    qrUrl = null

    if(fs.existsSync(authPath))
    {
      fs.rmSync(authPath,{recursive:true, force: true});
    }
    if(fs.existsSync(cachePath))
    {
      fs.rmSync(cachePath,{recursive:true, force: true});
    }
    wsocketInstance?.send(JSON.stringify({type:"delete-true", message:"[🌐] > Sessão desconectada e Excluido com Sucesso! ✅"}));
    return res.status(200).json({message:"[💻] - Sessão desconectada e Excluido com Sucesso! ✅"})
  } catch (error) 
  {
    return res.status(500).json({ message: "[💻] - Erro ao excluir sessão. ❌"});
  }
})

app.get("/chats", async (_, res) => {
  
  if(!wwebInstance || !isClientReady)
  {
    wsocketInstance?.send(JSON.stringify({type:"chats-false", message:"[🌐] > Não existe Conexao Pronta para buscar Chats! ❌"}));
    return res.status(400).json({ message: "[💻] - Não existe Conexao Pronta para buscar Chats! ❌"})
  }  

  const chats = await wwebInstance?.getChats();

  const listChats = chats.map((chat:any) =>(
    {
      id: chat.id._serialized,
      name:(chat.name || chat.id.user),
      isGroup:chat.isGroup,
      bot_ignorado: ignorarBotsPara.has(chat.id._serialized)
    }
  ));
  wsocketInstance?.send(JSON.stringify({type:"chats-true", message:"[🌐] > Lista com Chats contruida com sucesso! ✅"}));
  res.json(listChats);
})

app.get("/allow/:id", async (req, res) => {
  const id = req.params.id;
  ignorarBotsPara.delete(id);
  wsocketInstance?.send(JSON.stringify({type:"botenable-true", message:"[🌐] > Bot habilitado para ${id} ✅"}));
  return res.status(200).json({message: `json({ message: "[💻] - Bot habilitado para ${id} ✅"})`})
});

app.get("/ignore/:id", async (req, res) => {
  const id = req.params.id;
  ignorarBotsPara.add(id);
  wsocketInstance?.send(JSON.stringify({type:"botignore-true", message:"[🌐] > Bot desabilitado para ${id} ❌"}));
  return res.status(200).json({message: `json({ message: "[💻] - Bot desabilitado para ${id} ❌"})`})
});










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