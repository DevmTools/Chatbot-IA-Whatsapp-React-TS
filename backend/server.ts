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

type SubResposta = {
  gatilho: string;
  resposta: string;
  subrespostas?: SubResposta[];
};
type AutomacaoItem = {
  gatilho: string;
  resposta: string;
  subrespostas?: SubResposta[];
};
let configuracoesBot: AutomacaoItem[] = [];
const contextoUsuario = new Map<string, SubResposta[]>();


/* VERSÃO PARA SIMULAÇÃO DE IMÓVEIS */
type AtendimentoAuto = {
  etapaAtual: any;
  historico: { chave: string; valor: string }[];
};

const atendimentosAuto = new Map<string, AtendimentoAuto>();

const configPath = path.join(process.cwd(), "botconfig.json");
const botConfig = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
  : { respostas: [] };

  async function handleAutoFlow(msg: any): Promise<boolean> {
  const numero = msg.from;
  const textoRaw = msg.body.trim();
  const texto = textoRaw.toLowerCase();

  // === iniciar ===
  if (!atendimentosAuto.has(numero)) {
    const respostaRaiz = botConfig.respostas.find((r: any) => {
      if (!r.gatilho || typeof r.gatilho !== "string") return false;
      const [gatilho, tipo] = r.gatilho.toLowerCase().split("|");
      return tipo === "auto" && texto === gatilho;
    });

    if (respostaRaiz) {
      atendimentosAuto.set(numero, {
        etapaAtual: respostaRaiz,
        historico: []
      });
      await msg.reply(respostaRaiz.resposta);
      return true; // consumido
    }
  }

  // === continuar ===
  if (atendimentosAuto.has(numero)) {
    const atendimento = atendimentosAuto.get(numero)!;
    const etapaAtual = atendimento.etapaAtual;
    const subrespostas = etapaAtual.subrespostas || [];

    let proximaEtapa: any = null;

    const textoRaw = msg.body.trim();
    const texto = textoRaw.toLowerCase();

    // 1. Se o próprio nó atual é campo livre ([nome], [cidade], etc.), consome ele primeiro
    if (
      typeof etapaAtual.gatilho === "string" &&
      etapaAtual.gatilho.startsWith("[") &&
      etapaAtual.gatilho.endsWith("]")
    ) {
      const campo = etapaAtual.gatilho.replace(/\[|\]/g, "");
      atendimento.historico.push({ chave: campo, valor: textoRaw });

      // desce para o próximo dentro das subrespostas dele
      if (etapaAtual.subrespostas && etapaAtual.subrespostas.length > 0) {
        proximaEtapa = etapaAtual.subrespostas[0];
      } else {
        // finalizou no próprio campo livre
        const resumo = atendimento.historico
          .map((d) => `• ${d.chave.replace(/_/g, " ")}: ${d.valor}`)
          .join("\n");
        await msg.reply(
          `✅ Obrigado pelas informações!\n\n📋 *Resumo do atendimento:*\n${resumo}\n\nEm breve um consultor entrará em contato.`
        );
        atendimentosAuto.delete(numero);
        return true;
      }
    } else {
      // 2. tenta casar com uma subresposta explícita (opção)
      const encontrada = subrespostas.find((r: any) => {
        if (!r.gatilho || typeof r.gatilho !== "string") return false;
        return r.gatilho.toLowerCase() === texto;
      });

      if (encontrada) {
        atendimento.historico.push({
          chave: etapaAtual.gatilho.replace(/\|auto$/, ""),
          valor: textoRaw
        });

        if (!encontrada.subrespostas || encontrada.subrespostas.length === 0) {
          // final
          const resumo = atendimento.historico
            .map((d) => `• ${d.chave.replace(/_/g, " ")}: ${d.valor}`)
            .join("\n");
          await msg.reply(
            `✅ Obrigado pelas informações!\n\n📋 *Resumo do atendimento:*\n${resumo}\n\nEm breve um consultor entrará em contato.`
          );
          atendimentosAuto.delete(numero);
          return true;
        }
        proximaEtapa = encontrada;
      } else {
        // 3. se não casou e o nó atual tem um filho campo livre, assume que o texto é resposta desse campo
        const livre = subrespostas.find(
          (r: any) =>
            typeof r.gatilho === "string" &&
            r.gatilho.startsWith("[") &&
            r.gatilho.endsWith("]")
        );
        if (livre) {
          const campo = livre.gatilho.replace(/\[|\]/g, "");
          atendimento.historico.push({ chave: campo, valor: textoRaw });

          if (livre.subrespostas && livre.subrespostas.length > 0) {
            proximaEtapa = livre.subrespostas[0];
          } else {
            // finalizou no campo livre filho
            const resumo = atendimento.historico
              .map((d) => `• ${d.chave.replace(/_/g, " ")}: ${d.valor}`)
              .join("\n");
            await msg.reply(
              `✅ Obrigado pelas informações!\n\n📋 *Resumo do atendimento:*\n${resumo}\n\nEm breve um consultor entrará em contato.`
            );
            atendimentosAuto.delete(numero);
            return true;
          }
        }
      }
    }

    if (!proximaEtapa) {
      await msg.reply("❌ Opção inválida. Tente novamente.");
      return true;
    }

    atendimento.etapaAtual = proximaEtapa;
    await msg.reply(proximaEtapa.resposta);
    return true;
  }

  return false; // não era auto fluxo
}
/* VERSÃO PARA SIMULAÇÃO DE IMÓVEIS */


//✨ IA
//🤖 Robo
//🌐 WebSocket
//💻 Servidor
//✅ Sucesso
//❌ Falha

/***********************Endpoints/Ouvintes****************************** */
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
  wwebInstance.on("ready", async () => {
    wsocketInstance?.send(JSON.stringify({type:"wweb-true", message:"[🌐] > Instancia Whatsapp Ready!"}));
    isClientReady = true;

       const chats = await wwebInstance!.getChats();
        chats.forEach((chat: any) => {
          ignorarBotsPara.add(chat.id._serialized);
        });

    wwebInstance!.on("message", async (msg:any) => 
    {
      const numero = msg.from;
      const texto = msg.body.trim();
      

      //Campo |auto para financiamento
      if (await handleAutoFlow(msg)) {
        return;
      }

      //Ignora mensagens de grupos
      if (numero.endsWith("@g.us")) {
        wsocketInstance?.send(JSON.stringify({message:`[🌐] > 🙈 Robo Ignorando Grupo com ${numero}!`}));
        console.log(`🙈 Robo Ignorando conversa com ${numero}!`);
        return;
      }
      //Números Bloueados
      if (ignorarBotsPara.has(numero)) {
        wsocketInstance?.send(JSON.stringify({message:`[🌐] > 🙈 Robo Ignorando conversa com ${numero}!`}));
        console.log(`🙈 Robo Ignorando conversa com ${numero}!`);
        return;
      }
      
      const contextoAtual = contextoUsuario.get(numero);

      //Gatilho Bot
      function responderGatilhoInicial(texto: string, msg: any) 
      {
        msgReply(msg, `${texto === '0' 
          ? 'Você retornou ao Menu Inicial' 
          : "Ola tudo bem?\nVocê esta em um atendimento automatizado.\nDigite e envie o numero opção desejada."}`);
        const menu = configuracoesBot.map((item, index) => `[ *${index + 1}* ] - ${item.gatilho}`).join("\n");
        contextoUsuario.set(msg.from, configuracoesBot);
        msgSend(msg.from, msgMenu(menu, "MENU INICIAL"));
      }
     
      //Comando para voltar ao início
      if (texto === "0") {
        contextoUsuario.delete(numero);
        return responderGatilhoInicial(texto, msg);
      }
      
       //Verifica se tem contexto salvo
      if (contextoAtual && Array.isArray(contextoAtual)) {
        const index = Number(texto) - 1;

        if (!isNaN(index) && contextoAtual[index]) {
          const sub = contextoAtual[index];

          if (sub.subrespostas) {
            // se o item escolhido tem uma única subresposta e ela é do tipo auto, entra direto no fluxo auto
            if (sub.subrespostas.length === 1 && typeof sub.subrespostas[0].gatilho === "string" && sub.subrespostas[0].gatilho.toLowerCase().includes("|auto")) {
              const respostaRaiz = sub.subrespostas[0];
              // inicia o fluxo automático como se o usuário tivesse digitado o gatilho
              atendimentosAuto.set(numero, {
                etapaAtual: respostaRaiz,
                historico: []
              });
              msgReply(msg, respostaRaiz.resposta);
              return;
            }

            if (sub.subrespostas.length > 0) {
              msgReply(msg, `${sub.resposta}`);
            }

            contextoUsuario.set(numero, sub.subrespostas);
            const menu = sub.subrespostas
              .map((opcao, idx) => `[ *${idx + 1}* ] - ${opcao.gatilho}`)
              .join("\n");
            msgSend(
              numero,
              msgMenu(
                sub.subrespostas.length > 0 ? menu : sub.resposta,
                sub.subrespostas.length > 0 ? "ESCOLHA UMA OPÇÃO" : `VOLTE AO MENU`
              )
            );
          } else {
            contextoUsuario.delete(numero);
          }
          return;
        } else {
          const menu = contextoAtual
            .map((item, idx) => `[ *${idx + 1}* ] - ${item.gatilho}`)
            .join("\n");
          msgSend(numero, msgMenu(menu, "OPÇÕES DISPONÍVEIS", "❌ OPÇÃO INVÁLIDA", texto));
          return;
        }
      }

      // Procurando resposta no nível inicial
      responderGatilhoInicial(texto, msg);
      
    });
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
    isClientReady = false;
    
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
    isClientReady = false;

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
    return res.json({ message: "[💻] - Não existe Conexao Pronta para buscar Chats! ❌"})
  }  

  const chats = await wwebInstance?.getChats();

  const listChats = chats.map((chat:any) => (
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
  wsocketInstance?.send(JSON.stringify({type:"botenable-true", message:`[🌐] > Bot habilitado para ${id} ✅`}));
  return res.status(200).json({message: `json({ message: "[💻] - Bot habilitado para ${id} ✅"})`})
});

app.get("/ignore/:id", async (req, res) => {
  const id = req.params.id;
  ignorarBotsPara.add(id);
  wsocketInstance?.send(JSON.stringify({type:"botignore-true", message:`[🌐] > Bot desabilitado para ${id} ❌`}));
  return res.status(200).json({message: `json({ message: "[💻] - Bot desabilitado para ${id} ❌"})`})
});
/***********************Endpoints/Ouvintes****************************** */


/***********************BOT/Configuração****************************** */
try {
  const configPath = path.join(process.cwd(), "botconfig.json");
  if (fs.existsSync(configPath)) 
  {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed?.respostas && Array.isArray(parsed.respostas)) 
    {
      configuracoesBot = parsed.respostas;
      console.log("[🤖] - Configuração de atendimento carregada com sucesso.✅");
    }else
    {
      console.log("[🤖] - Estrutura de atendimento do JSON inválida. ❌");
    }
  } else 
  {
    console.log("[🤖] - Arquivo de atendimento botconfig.json não encontrado. ❌");
  }
} catch (err) {
  console.error("[🤖] - Erro ao ler Devm-automacao.json: ❌ ", err);
}
/***********************BOT/Configuração****************************** */

/***********************Conexao/Socket****************************** */
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
/***********************Conexao/Socket****************************** */

/***********************Funções Utilitarias************************** */
function msgSend(number: string, text: string) {
  wwebInstance?.sendMessage(number, text);
}

function msgReply(msg:any,text:string){
  msg.reply(text);
}

const msgMenu = (menu:string, title?:string, titleSecond?:string, text?:string):string => {
  return`
📋 ${titleSecond && text ? `[ *${text}* ] - *${titleSecond}*` : `*${title}*`}
\n${menu}\n
════════════════════════
💬 Digite o número da opção   
↩️ Digite *0* para menu inicial
  `
}
/***********************Funções Utilitarias************************** */