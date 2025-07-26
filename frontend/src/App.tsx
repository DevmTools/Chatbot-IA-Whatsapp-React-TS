import { useEffect, useState } from 'react';
import loading from "./assets/img/loading_gif.gif";

export default function App() {
  //C:\Program Files\Google\Chrome\Application\chrome.exe
  const [qrCode, setQrCode] = useState <string | null> (null);
  const [isLoadingConnect, setIsLoadingConnect] = useState<boolean>(false);
  const [isLoadingDisconnect, setIsLoadingDisconnect] = useState<boolean>(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState<boolean>(false);
  const [isClientReady, setIsClientReady] = useState<boolean>(false);

  const fetchGlobal = async(url:string) => {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  }

  const handleConnection = async (url: string) => {
    setIsLoadingConnect(true);
    const data = await fetchGlobal(url);
    if (data.qr) {
      setIsLoadingConnect(false);
      setQrCode(data.qr);
    } else {
      setQrCode(null); 
    }
     //fetchChats();
  }

  const handleDisconnect = async (url: string) => {
    setIsLoadingDisconnect(true)
    await fetchGlobal(url);
    //fetchChats();
  }

  const handleDelete = async (url: string) => {
    setIsLoadingDelete(true);
    await fetchGlobal(url);
    //fetchChats();
  }

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    socket.onmessage = (event) => {
      const wsComunication:{type:string, message:string} = JSON.parse(event.data.toString());
      console.log(wsComunication.message);
      if(wsComunication.type === "scanqr-true" || wsComunication.type === "instance-true")
        {
        setQrCode(null);
        setIsLoadingConnect(false);
        setIsClientReady(true);
        return
      }
      if(wsComunication.type === "disconnect-true" || wsComunication.type === "delete-true")
        {
        setIsClientReady(false);
        setQrCode(null);
        if(wsComunication.type === "disconnect-true")
        {
          setIsLoadingDisconnect(false);
        }
        if(wsComunication.type === "delete-true")
          {
          setIsLoadingDelete(false);
        }
        return
      }
    }
    socket.onerror = (error) => {
      console.error(`Socket error => ${error}`)
    }
  },[])
  
  return (
    <>
      {/* Actions */}
      <div id="area_actions_app">
        {/*Connect*/}
        <div id="btn_start" 
          className={isClientReady || (qrCode || isLoadingConnect || isLoadingDisconnect || isLoadingDelete) ? "disabled" : ""}
          onClick={isClientReady || (qrCode || isLoadingConnect || isLoadingDisconnect || isLoadingDelete) ? (() => {}) : (() => handleConnection("/getQRCode"))}
        >
          {!isClientReady && (qrCode || isLoadingConnect || isLoadingDisconnect || isLoadingDelete) ? (<>Conectando... <img id="qrImage" src={loading} alt="Carregando" className="mx-auto" /> </>) : isClientReady ? "Pronto ✅" : "Conectar"}
        </div>

        {/*Disconnect*/}
        <div id="btn_disconnect" 
          className={!isClientReady || (qrCode || isLoadingConnect || isLoadingDisconnect || isLoadingDelete) ? "disabled" : ""}
          onClick={!isClientReady || (qrCode || isLoadingConnect || isLoadingDisconnect || isLoadingDelete) ? (() => {}) : (() => handleDisconnect("/disconnect"))}
        >
          {isLoadingDisconnect ? "Desconectando Sessão..." : "Desconectar"}
        </div>

        {/*Delete */}
        <div id="btn_delete_sesion"
          className={qrCode || isLoadingConnect || isLoadingDisconnect || isLoadingDelete ? "disabled" : ""}
          onClick={qrCode || isLoadingConnect || isLoadingDisconnect || isLoadingDelete ? ()=>{} : () => handleDelete("/delete-session")}
        >
          {isLoadingDelete ? "Exluindo Sessão..." : "Excluir Sessão"}
        </div>
      </div>

      {/* Panel */}
      <div id="content_wrapper">
        {/* Área QRCode */}
        <div id="area_qrcode">
          <h3>{ qrCode ? "Escanear QRCode:" : !qrCode && isLoadingConnect ? "Gerando QRCode..." : qrCode && !isLoadingConnect ? "Aguarde, autenticando com a Meta..." : !qrCode && !isLoadingConnect && isClientReady ? "Conectado e Pronto!" : "Não Conectado!" }</h3>
          {
            qrCode || isLoadingConnect 
            ?
              <img id="qrImage" src={qrCode && !isLoadingConnect ? qrCode : loading} alt="QR Code" className="mx-auto" />
            :
              <></>
          }
        </div>

        {/* Tabela de usuários */}
        <div id="area_users_chat">
          <h3>Usuários Conectados</h3>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Id</th>
                <th>Time Ultima Mensagem</th>
                <th>Bot Ativado/Desativado</th>
              </tr>
            </thead>
            <tbody>
              {/* Lista dinâmica futura */}
              <tr>
                <td>Nome</td>
                <td>99999999999@z_zz</td>
                <td>99/99/99 99:99</td>
                <td><button className="toggle-btn enabled">Habilitado</button></td>
              </tr>
              <tr>
                <td>Nome</td>
                <td>99999999999@z_zz</td>
                <td>99/99/99 99:99</td>
                <td><button className="toggle-btn disabled">Desabilitado</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
