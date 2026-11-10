# Simulador de artroscopia de joelho — versão web (GitHub Pages)

`index.html` é a página publicada (arquivo único; carrega three.js r128 do cdnjs e, para ligar o celular, PeerJS do unpkg).

- Computador: abrir a página; o cartão "Celular como probe" mostra um código de 4 dígitos.
- Celular: abrir a mesma página, tocar em "Usar este aparelho como probe", digitar o código e conectar. O modo "Giro (sensor)" usa o sensor de orientação do aparelho.

`src/` guarda as fontes: `core.js` (anatomia procedural, cinemática), `app.js` (render, modos, controle), `template.html` e `build.py` (junta tudo em `index.html`; rodar de dentro de `src/` e mover o resultado para a raiz).

Esta versão usa anatomia procedural. A anatomia real do espécime oks001 (Open Knee(s)) continua em `03-controle-remoto/` no ramo principal.
