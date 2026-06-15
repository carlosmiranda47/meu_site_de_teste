const URL_API = "http://127.0.0.1:8000";

function alternarAbas(){
    document.getElementById("container-login").classList.toggle("escondido");
    document.getElementById("container-cadastro").classList.toggle("escondido"); 
}

document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
    e.preventDefault();
    
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
            localStorage.setItem("usuario_logado", JSON.stringify(dados.usuario));
            alert("Cadastro realizado com sucesso! Entrando no sistema...");
            window.location.href = "dashboard.html";
        } else {
            const mensagemErro = typeof dados.detail === "string" ? dados.detail : dados.detail[0].msg;
            alert("Erro no cadastro: " + mensagemErro);
        }
    } catch(erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
});

document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;
    
    try {
        const resposta = await fetch(`${URL_API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            localStorage.setItem("usuario_logado", JSON.stringify(dados.usuario));
            alert("Login efetuado com sucesso! Bem-vindo.");
            window.location.href = "dashboard.html";
        } else {
            alert("Erro no login: " + dados.detail);
        }
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
});
