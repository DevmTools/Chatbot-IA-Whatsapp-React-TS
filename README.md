
# 🤖 Chatbot WhatsApp - Automação Inteligente via WhatsApp Web

By **Devm Tecnologia** — [🌐 devm.com.br](https://devm.com.br)

Um chatbot completo para automação de atendimento via WhatsApp, com painel em React, backend em Node.js/TypeScript e integração com IA (opcional).

---

## ✨ Funcionalidades

- Conexão automática com WhatsApp Web
- Painel de controle com React + Vite
- Controle de ativação/desativação do bot por usuário
- Integração com IA generativa (API externa)
- Respostas inteligentes e organizadas via `botconfig.json`
- WebSocket para comunicação em tempo real
- Geração de `.exe` via `pkg` (executável portátil)

---

## 🧰 Tecnologias Utilizadas

- **Node.js** (v20+)
- **TypeScript**
- **Express**
- **React + Vite**
- **WebSocket (ws)**
- **whatsapp-web.js**

---

## ⚙️ Instalação e Execução

### 1. Clone o projeto
```bash
git clone https://github.com/seu-usuario/chatbot-whatsapp.git
cd chatbot-whatsapp
```

### 2. Instale as dependências

**Na raiz:**
```bash
npm install
```

**Na pasta frontend:**
```bash
cd frontend
npm install
cd ..
```

---

## 🔧 Build e Empacotamento

### 3. Compile a aplicação inteira
```bash
npm run build
```

### 4. Inicie o servidor localmente
```bash
npm start
```

Acesse via navegador: [http://localhost:3000](http://localhost:3000)

---

## 📦 Gerar Executável `.exe` (Windows 64 bits)

Certifique-se de que você já rodou `npm run build`.

### 5. Execute o comando abaixo na raiz:
```bash
npx pkg . --targets node18-win-x64
```

O arquivo `chatbot-whatsapp.exe` será gerado e pode ser executado diretamente em qualquer máquina com Windows 64 bits.

---

## 💬 Configurações do Bot

Edite o arquivo `botconfig.json` para personalizar as respostas, gatilhos e estrutura do seu atendimento automatizado.

---

## ❤️ Apoie este projeto!

Se este projeto te ajudou, considere apoiar com uma doação espontânea 💖

### Faça um PIX com qualquer valor
📲 **Chave Pix**: [livepix.gg/curtosecortes](https://livepix.gg/curtosecortes)

[![Doação Espontanea](https://widget.livepix.gg/embed/0a637a6d-beaf-4476-b332-3bcdad850ff6)](https://widget.livepix.gg)


---

## 📄 Licença

Este projeto está licenciado sob a **ISC License**.

---

> Desenvolvido com 💻 por Jorge Mira – Devm Tecnologia
