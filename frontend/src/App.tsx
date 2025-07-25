import { useEffect, useState } from 'react';
import loading from "./assets/img/loading_gif.gif";

export default function App() {
  
  const [qrCode, setQrCode] = useState <string | null> (null);
  const [isLoadingConnect, setIsLoadingConnect] = useState<boolean>(false);
  const [isClientReady, setIsClientReady] = useState<boolean>(false)

  const handleActionConnection = async (url: string) => {
    setIsLoadingConnect(true);
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.qr) {
      setIsLoadingConnect(false);
      setQrCode(data.qr);
    } else {
      setQrCode(null); 
    }
  }

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    socket.onmessage = (event) => {
      const wsComunication:{type:string, message:string} = JSON.parse(event.data.toString());
      console.log(wsComunication.message);
      if(wsComunication.type === "scanqr-true" || wsComunication.type === "instance-true"){
        setQrCode(null);
        setIsLoadingConnect(false);
        setIsClientReady(true);
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
        <div id="btn_start" 
          className={isClientReady ? "disabled" : ""}
          onClick={isClientReady ? () => {} : () => handleActionConnection("/getQRCode")}
        >
          {isClientReady ? "Pronto ✅" : "Conectar"}
        </div>
        <div id="btn_disconnect">Desconectar</div>
        <div id="btn_delete_sesion">Excluir Sessão</div>
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
