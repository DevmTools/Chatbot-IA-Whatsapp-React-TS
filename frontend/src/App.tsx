import { useEffect } from 'react'


function App() {
  


  useEffect(()=>{
    const socket = new WebSocket("ws://localhost:3000");
    
    socket.onmessage = (event) =>{
      console.log(`Socket => ${event}`)
    }

    socket.onerror = (error) => {
      console.error(`Socket error => ${error}`)
    }

  },[])
  
  return (
    <>
      {/* Painel Ações Bot */}
      <div id="area_actions_app">
        <div id="btn_start">Iniciar Bot</div>
        <div id="btn_disconnect">Desconectar</div>
        <div id="btn_delete_sesion">Excluir Sessão</div>
      </div>

      {/* Conteúdo dividido */}
      <div id="content_wrapper">
        {/* Área QRCode */}
        <div id="area_qrcode">
          <h3>Escaneie o QR Code</h3>
          {/* Aqui vai o QRCode futuramente */}
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

export default App
