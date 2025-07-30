window.requestAnimationFrame =
  window.__requestAnimationFrame ||
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (function () {
    return function (callback, element) {
      var lastTime = element.__lastTime || 0;
      var currTime = Date.now();
      var timeToCall = Math.max(1, 33 - (currTime - lastTime));
      window.setTimeout(callback, timeToCall);
      element.__lastTime = currTime + timeToCall;
    };
  })();

window.isDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
  (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
);

let loaded = false;
const init = () => {
  if (loaded) return;
  loaded = true;

  const mobile = window.isDevice;
  const koef = mobile ? 0.5 : 1;
  const canvas = document.getElementById("heart");
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = innerWidth * koef);
  let height = (canvas.height = innerHeight * koef);

  // Fundo inicial
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);

  // Parâmetros de texto
  const messages = ["Saranghae", "Valen"];
  const messageColors = ["#cc88ff", "#8800cc"];
  let messageIndex = 0;
  let textTimer = 0;
  const textDelay = 4; // segundos

  // Reajusta canvas no resize
  window.addEventListener("resize", () => {
    width = canvas.width = innerWidth * koef;
    height = canvas.height = innerHeight * koef;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);
  });

  // Função paramétrica do coração
  const heartPosition = (rad) => [
    Math.pow(Math.sin(rad), 3),
    -(15 * Math.cos(rad) -
      5 * Math.cos(2 * rad) -
      2 * Math.cos(3 * rad) -
      Math.cos(4 * rad)),
  ];

  const scaleAndTranslate = (pos, sx, sy, dx, dy) => [
    dx + pos[0] * sx,
    dy + pos[1] * sy,
  ];

  // Gera pontos de referência
  const dr = mobile ? 0.3 : 0.1;
  const pointsOrigin = [];
  for (let i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
  for (let i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
  for (let i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
  const heartPointsCount = pointsOrigin.length;

  let targetPoints = [];
  const pulse = (kx, ky) => {
    targetPoints = pointsOrigin.map(([x, y]) => [
      kx * x + width / 2,
      ky * y + height / 2,
    ]);
  };

  // Cria partículas
  const traceCount = mobile ? 20 : 50;
  const particles = [];
  for (let i = 0; i < heartPointsCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    particles.push({
      vx: 0,
      vy: 0,
      speed: Math.random() + 5,
      q: ~~(Math.random() * heartPointsCount),
      D: 2 * (i % 2) - 1,
      force: 0.2 * Math.random() + 0.7,
      // cor roxa semitransparente
      f: "hsla(280, 80%, 70%, .3)",
      trace: Array.from({ length: traceCount }, () => ({ x, y })),
    });
  }

  const config = {
    traceK: 0.4,
    timeDelta: 0.01,
  };

  let time = 0;
  const loop = () => {
    // Calcula batimento
    const n = -Math.cos(time);
    pulse((1 + n) * 0.5, (1 + n) * 0.5);
    time +=
      (Math.sin(time) < 0
        ? 9
        : n > 0.8
        ? 0.2
        : 1) * config.timeDelta;

    // Fade do fundo
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, width, height);

    // Atualiza partículas
    for (const p of particles) {
      const qpt = targetPoints[p.q];
      const dx = p.trace[0].x - qpt[0];
      const dy = p.trace[0].y - qpt[1];
      const dist = Math.hypot(dx, dy) || 1;

      // Muda alvo quando chega
      if (dist < 10) {
        if (Math.random() < 0.05) {
          p.q = ~~(Math.random() * heartPointsCount);
        } else {
          if (Math.random() < 0.01) p.D *= -1;
          p.q = (p.q + p.D + heartPointsCount) % heartPointsCount;
        }
      }

      // Física simples
      p.vx += (-dx / dist) * p.speed;
      p.vy += (-dy / dist) * p.speed;
      p.trace[0].x += p.vx;
      p.trace[0].y += p.vy;
      p.vx *= p.force;
      p.vy *= p.force;

      // Rastro
      for (let k = 0; k < p.trace.length - 1; k++) {
        const T = p.trace[k];
        const N = p.trace[k + 1];
        N.x -= config.traceK * (N.x - T.x);
        N.y -= config.traceK * (N.y - T.y);
      }

      ctx.fillStyle = p.f;
      for (const t of p.trace) {
        ctx.fillRect(t.x, t.y, 1, 1);
      }
    }

    textTimer += config.timeDelta;
    if (textTimer >= textDelay) {
      textTimer = 0;
      messageIndex = (messageIndex + 1) % messages.length;
    }
    const text = messages[messageIndex];
    ctx.font = "60px 'Great Vibes', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = messageColors[messageIndex];
    ctx.fillText(text, width / 2, height / 2);

    window.requestAnimationFrame(loop, canvas);
  };

  loop();
};

if (
  document.readyState === "complete" ||
  document.readyState === "loaded" ||
  document.readyState === "interactive"
) {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init, false);
}
