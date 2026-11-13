const carrossel = document.querySelector('.carrossel');
const cards = document.querySelectorAll('.replay');
const videos = document.querySelectorAll('video');
const introducao = document.querySelector('.introducao');
const anterior = document.querySelector('#anterior');
const proximo = document.querySelector('#proximo');
const pausar = document.querySelector('#pausar');
const som = document.querySelector('#som');
const aviso = document.querySelector('#aviso');
const cabecalho = document.querySelector('header');
const navegacao = document.querySelector('nav');
const rodape = document.querySelector('footer');
let atual = 0;
let animando = false;
let semSom = false;
let ultimoScroll = 0;
let toqueInicial = 0;

function pararVideos() {
    videos.forEach(function(video) {
        video.pause();
        video.currentTime = 0;
    });
}

function tocarVideo() {
    const video = videos[atual];
    aviso.hidden = true;
    video.muted = semSom;
    video.volume = 0.65;
    pausar.textContent = 'Pausar';
    video.play().catch(function(erro) {
        if (video !== videos[atual] || animando || !introducao.hidden) return;
        pausar.textContent = 'Reproduzir';
        if (erro.name === 'AbortError') return;
        aviso.textContent = 'Clique em Reproduzir para iniciar o replay.';
        aviso.hidden = false;
    });
}

function atualizar() {
    anterior.disabled = atual === 0;
    proximo.disabled = atual === cards.length - 1;
    document.querySelector('#posicao').textContent = (10 - atual) + 'º lugar';
    cards.forEach(function(card, indice) {
        card.inert = indice !== atual;
    });
}

function comecar() {
    if (animando || introducao.classList.contains('aberta')) return;
    atual = 0;
    carrossel.scrollLeft = 0;
    atualizar();
    introducao.classList.add('aberta');
}

introducao.addEventListener('transitionend', function(evento) {
    if (evento.target !== introducao || !introducao.classList.contains('aberta')) return;
    introducao.hidden = true;
    carrossel.inert = false;
    cabecalho.inert = false;
    navegacao.inert = false;
    rodape.inert = false;
    carrossel.focus({ preventScroll: true });
    tocarVideo();
});

function voltarAoInicio() {
    if (animando) return;
    pararVideos();
    aviso.hidden = true;
    introducao.classList.remove('aberta');
    introducao.hidden = false;
    carrossel.inert = true;
    cabecalho.inert = true;
    navegacao.inert = true;
    rodape.inert = true;
    document.querySelector('#comecar').focus();
}

function irPara(indice) {
    if (animando || !introducao.hidden || indice < 0 || indice >= cards.length || indice === atual) return;
    animando = true;
    pararVideos();
    aviso.hidden = true;
    carrossel.classList.add('animando');
    const inicio = carrossel.scrollLeft;
    const tempoInicial = performance.now();

    function deslizar(tempo) {
        const progresso = Math.min((tempo - tempoInicial) / 850, 1);
        const suavidade = progresso * progresso * (3 - 2 * progresso);
        carrossel.scrollLeft = inicio + (cards[indice].offsetLeft - inicio) * suavidade;
        if (progresso < 1) {
            requestAnimationFrame(deslizar);
        } else {
            atual = indice;
            animando = false;
            carrossel.classList.remove('animando');
            atualizar();
            if (!document.hidden) tocarVideo();
        }
    }

    requestAnimationFrame(deslizar);
}

document.querySelector('#comecar').onclick = comecar;
document.querySelector('#inicio').onclick = function(evento) {
    evento.preventDefault();
    voltarAoInicio();
};
document.querySelectorAll('.voltar').forEach(function(botao) {
    botao.onclick = voltarAoInicio;
});
anterior.onclick = function() { irPara(atual - 1); };
proximo.onclick = function() { irPara(atual + 1); };

pausar.onclick = function() {
    if (!introducao.hidden || animando) return;
    if (videos[atual].paused) {
        tocarVideo();
    } else {
        videos[atual].pause();
        pausar.textContent = 'Reproduzir';
    }
};

som.onclick = function() {
    semSom = !semSom;
    videos.forEach(function(video) { video.muted = semSom; });
    som.textContent = semSom ? 'Som desligado' : 'Som ligado';
    som.setAttribute('aria-pressed', semSom);
};

window.addEventListener('wheel', function(evento) {
    if (evento.ctrlKey || !introducao.hidden) return;
    evento.preventDefault();
    const tempo = performance.now();
    const intervalo = tempo - ultimoScroll;
    ultimoScroll = tempo;
    const movimento = Math.abs(evento.deltaX) > Math.abs(evento.deltaY) ? evento.deltaX : evento.deltaY;
    if (animando || Math.abs(movimento) < 8 || intervalo < 180) return;
    irPara(atual + (movimento > 0 ? 1 : -1));
}, { passive: false });

window.addEventListener('keydown', function(evento) {
    if (evento.ctrlKey || evento.altKey || evento.metaKey || !introducao.hidden) return;
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
        evento.preventDefault();
        irPara(atual + 1);
    }
    if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
        evento.preventDefault();
        irPara(atual - 1);
    }
});

carrossel.addEventListener('touchstart', function(evento) {
    toqueInicial = evento.changedTouches[0].clientX;
}, { passive: true });

carrossel.addEventListener('touchend', function(evento) {
    const movimento = toqueInicial - evento.changedTouches[0].clientX;
    if (Math.abs(movimento) > 50) irPara(atual + (movimento > 0 ? 1 : -1));
});

window.addEventListener('resize', function() {
    if (!animando) carrossel.scrollLeft = cards[atual].offsetLeft;
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        videos[atual].pause();
        pausar.textContent = 'Reproduzir';
    }
});

videos.forEach(function(video) {
    video.addEventListener('ended', function() {
        if (video === videos[atual]) pausar.textContent = 'Reproduzir';
    });
    video.addEventListener('error', function() {
        if (video !== videos[atual] || !introducao.hidden) return;
        aviso.textContent = 'Não foi possível abrir este vídeo. Confira se a pasta videos foi extraída junto com a página.';
        aviso.hidden = false;
    });
});

carrossel.scrollLeft = 0;
carrossel.inert = true;
cabecalho.inert = true;
navegacao.inert = true;
rodape.inert = true;
atualizar();
