// validação do email
const URL_API = "http://127.0.0.1:8000";

// Função de troca de exibição da tela de cadastro ou login 
function alternarAbas(){
    document.getElementById("container-login").classList.toggle("escondido");
    document.getElementById("container-cadastro").classList.toggle("escondido"); 
}

//MODO DE CADASTRO 
document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
    e.preventDefault(); // Impedir a página de recarregar
    
    const nome = document.getElementById("cad-nome").value;
    const email = document.getElementById("cad-email").value;
    const senha = document.getElementById("cad-senha").value;
    const status_usuario = document.getElementById("cad-status").value;
    
    try {
        const resposta = await fetch(`${URL_API}/cadastro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha, status_usuario })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert("Cadastro realizado com sucesso! Agora faça seu login.");
            alternarAbas(); // Retorna para a tela de login
        } else {
            alert("Erro no cadastro: " + dados.detail);
        }
    } catch(erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
});

//MODO DE LOGIN 
document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault(); // Impedir a página de recarregar
    
    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;
    
    try {
        // Corrigido para usar crases ` em vez de aspas
        const resposta = await fetch(`${URL_API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });
        
        const dados = await resposta.json();
        
        if (resposta.ok) {
            // Guarda os dados do usuário e o STATUS no navegador
            localStorage.setItem("usuario_logado", JSON.stringify(dados.usuario));
            
            // Corrigido para usar crases ` no alerta
            alert(`Bem-vindo, ${dados.usuario.nome}! Seu perfil é: ${dados.usuario.status}.`);
            
            // ATIVADO: Redireciona o usuário para a dashboard principal (Corrigido de linux.location para window.location)
            window.location.href = "dashboard.html";
        } else {
            alert("Erro no login: " + dados.detail);
        }
    } catch(erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
});
	
		
		
		
		
		
		
		
		
		
		
