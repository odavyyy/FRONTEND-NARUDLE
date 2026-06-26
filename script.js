import { PersonagemItem } from './PersonagemItem.js';

// domdomdomdom dom domdom eu tava aqnobaile 
const form = document.getElementsByTagName('form')[0];
const input = document.getElementById('input-personagem');
const listaSugestoes = document.getElementById('lista-sugestoes');
const imgCard = document.getElementById('img-personagem');
const nomeCard = document.getElementById('nome-personagem');
const generoCard = document.getElementById('genero-personagem');
const claCard = document.getElementById('cla-personagem');
const vilaCard = document.getElementById('vila-personagem');
const resultado = document.getElementById('resultado');
const erro = document.getElementById('erro');
const tbody = document.getElementById('tabela-corpo');
const resetBtn = document.getElementById('btn-reset');
const desistirBtn = document.getElementById('btn-desistir');

let personagens = [];
let personagemSecreto = null;
let palpites = [];

// LS

function carregarEstado() {
    const secreto = localStorage.getItem('narutodle_secreto');
    if (secreto) {
        personagemSecreto = JSON.parse(secreto);
    }
    const salvos = localStorage.getItem('narutodle_palpites');
    if (salvos && personagemSecreto) {
        palpites = JSON.parse(salvos).map(p => new PersonagemItem(p));
        palpites.forEach(p => adicionarLinhaTabela(p, personagemSecreto));
    }
}

function salvarEstado() {
    localStorage.setItem('narutodle_palpites', JSON.stringify(palpites));
    if (personagemSecreto) {
        localStorage.setItem('narutodle_secreto', JSON.stringify(personagemSecreto));
    }
}

// apI
function buscarPersonagens() {
    fetch('https://dattebayo-api.onrender.com/characters?limit=100')
        .then(response => {
            if (!response.ok) throw new Error('Erro na API');
            return response.json();
        })
        .then(data => {
            const raw = data.characters || [];
            personagens = raw.map(char => ({
                id: char.id,
                nome: char.name || 'Desconhecido',
                sexo: char.personal?.sex || char.sex || 'Desconhecido',
                cla: char.personal?.clan || char.clan || 'Sem Clã',
                vila: Array.isArray(char.personal?.affiliation) 
                    ? char.personal.affiliation[0] 
                    : (char.personal?.affiliation || char.affiliation || 'Desconhecida'),
                imagem: char.images?.[0] || ''
            }));
            iniciarJogo();
        })
        .catch(error => {
            console.error('Falha ao carregar personagens:', error);
            erro.style.display = 'block';
            erro.textContent = 'Não foi possível carregar os personagens. Tente novamente mais tarde.';
        });
}

// aleatoriedade
function sortearPersonagem() {
    if (personagens.length === 0) return null;
    const idx = Math.floor(Math.random() * personagens.length);
    return { ...personagens[idx] };
}

// card
function exibirPersonagem(personagem, revelado = false) {
    if (!personagem) return;
    document.getElementById('card').style.display = 'block';

    imgCard.src = personagem.imagem || '';
    imgCard.alt = personagem.nome;

    if (revelado) {
        imgCard.classList.remove('silhouette');
        nomeCard.textContent = personagem.nome;
        generoCard.textContent = personagem.sexo;
        claCard.textContent = personagem.cla;
        vilaCard.textContent = personagem.vila;
    } else {
        imgCard.classList.add('silhouette');
        nomeCard.textContent = '????';
        generoCard.textContent = '?';
        claCard.textContent = '?';
        vilaCard.textContent = '?';
    }
}

function adicionarLinhaTabela(palpite, secreto) {
    const checar = (a, b) => a.toLowerCase() === b.toLowerCase() ? 'correto' : 'errado';

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><strong>${palpite.nome}</strong></td>
        <td class="${checar(palpite.sexo, secreto.sexo)}">${palpite.sexo}</td>
        <td class="${checar(palpite.cla, secreto.cla)}">${palpite.cla}</td>
        <td class="${checar(palpite.vila, secreto.vila)}">${palpite.vila}</td>
        <td><button onclick="apagarPalpite(${palpite.id})">Apagar</button></td>
    `;
    tbody.prepend(tr);
}

// process
function processarPalpite(palpite) {
    if (!personagemSecreto) return;

    const nomeDigitado = palpite.trim();
    if (nomeDigitado === '') return;

    const palpiteChar = personagens.find(p => p.nome.toLowerCase() === nomeDigitado.toLowerCase());
    if (!palpiteChar) {
        erro.style.display = 'block';
        erro.textContent = 'Personagem não encontrado!';
        return;
    }
    if (palpites.some(p => p.id === palpiteChar.id)) {
        erro.style.display = 'block';
        erro.textContent = 'Você já tentou esse personagem!';
        return;
    }

    erro.style.display = 'none';
    const acertou = palpiteChar.id === personagemSecreto.id;

    const item = new PersonagemItem(palpiteChar);
    palpites.push(item);
    adicionarLinhaTabela(item, personagemSecreto);
    salvarEstado();

    if (acertou) {
        exibirPersonagem(personagemSecreto, true);
        resultado.textContent = '✅ Acertou!';
        resultado.className = 'acerto';
        input.disabled = true;
        input.placeholder = 'Você acertou!';
        desistirBtn.disabled = true; // desabilita desistir
    }
    input.value = '';
    listaSugestoes.style.display = 'none'; // esconde sugestões
}

// autocompletar( puro gpt professor, eu nao sabia fazer isso sozinho)
input.addEventListener('input', function() {
    const termo = input.value.trim().toLowerCase();
    listaSugestoes.innerHTML = '';
    
    if (termo === '') {
        listaSugestoes.style.display = 'none';
        return;
    }

    const filtrados = personagens.filter(p => p.nome.toLowerCase().includes(termo));
    if (filtrados.length === 0) {
        listaSugestoes.style.display = 'none';
        return;
    }

    filtrados.slice(0, 10).forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.nome;
        li.addEventListener('click', function() {
            input.value = p.nome;
            listaSugestoes.style.display = 'none';
            input.focus();
        });
        listaSugestoes.appendChild(li);
    });
    listaSugestoes.style.display = 'block';
});

// gpt me recomendou por isso tbm
document.addEventListener('click', function(e) {
    if (!e.target.closest('.input-wrapper')) {
        listaSugestoes.style.display = 'none';
    }
});

// palpite delete
window.apagarPalpite = function(id) {
    palpites = palpites.filter(p => p.id !== id);
    tbody.innerHTML = '';
    palpites.forEach(p => adicionarLinhaTabela(p, personagemSecreto));
    salvarEstado();
};

// Desistir tristeza
function desistirJogo() {
    if (!personagemSecreto) return;
    exibirPersonagem(personagemSecreto, true);
    resultado.textContent = `Você desistiu! O personagem era: ${personagemSecreto.nome}.`;
    resultado.className = 'erro';
    input.disabled = true;
    input.placeholder = 'Jogo encerrado.';
    desistirBtn.disabled = true;
    listaSugestoes.style.display = 'none';
}

// reiniciar
function reiniciarJogo() {
    palpites = [];
    tbody.innerHTML = '';
    resultado.textContent = '';
    resultado.className = '';
    erro.style.display = 'none';
    input.disabled = false;
    input.placeholder = 'Digite o nome do personagem';
    input.value = '';
    desistirBtn.disabled = false;
    listaSugestoes.style.display = 'none';

    const novo = sortearPersonagem();
    if (novo) {
        personagemSecreto = novo;
        exibirPersonagem(personagemSecreto, false);
        salvarEstado();
    } else {
        buscarPersonagens();
    }
}

// começar(importante né)
function iniciarJogo() {
    carregarEstado();

    if (!personagemSecreto || !personagens.some(p => p.id === personagemSecreto.id)) {
        personagemSecreto = sortearPersonagem();
        salvarEstado();
    }

    const jaAcertou = palpites.some(p => p.id === personagemSecreto.id);
    if (jaAcertou) {
        exibirPersonagem(personagemSecreto, true);
        resultado.textContent = '✅ Acertou!';
        resultado.className = 'acerto';
        input.disabled = true;
        input.placeholder = 'Você acertou!';
        desistirBtn.disabled = true;
    } else {
        exibirPersonagem(personagemSecreto, false);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        processarPalpite(input.value);
    });

    resetBtn.addEventListener('click', reiniciarJogo);
    desistirBtn.addEventListener('click', desistirJogo);
}

// go
buscarPersonagens();