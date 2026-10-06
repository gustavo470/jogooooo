/**
 * ============================================================================
 * PAC-MAN ARCADE STYLE - JOGO DE LABIRINTO CLÁSSICO
 * 100% HTML, CSS E JAVASCRIPT PURO (SEM DEPENDÊNCIAS EXTERNAS)
 * ============================================================================
 */

// ============================================================================
// 1. SISTEMA DE ÁUDIO SINTETIZADO (WEB AUDIO API)
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.chompToggle = false;
    this.lastChompTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Som ao comer ponto normal (Waka-waka alternado)
  playChomp() {
    if (this.isMuted || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastChompTime < 110) return;
    this.lastChompTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    const freq = this.chompToggle ? 480 : 310;
    this.chompToggle = !this.chompToggle;

    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Som ao comer ponto especial (energizer / power pellet)
  playPowerPellet() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      const start = t + idx * 0.06;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.13);
    });
  }

  // Som ao comer fantasma vulnerável
  playEatGhost() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  // Som de colisão / perda de vida
  playDeath() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const steps = 11;
    for (let i = 0; i < steps; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      const start = t + i * 0.09;
      const freq = 600 - i * 45;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.09);
    }
  }

  // Fanfarra de início de partida
  playStart() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const melody = [
      { f: 493.88, d: 0.12 }, // B4
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.12 }, // D#5
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.22 }, // D#5
      { f: 523.25, d: 0.12 }, // C5
      { f: 1046.5, d: 0.12 }, // C6
      { f: 783.99, d: 0.12 }, // G5
      { f: 659.25, d: 0.12 }, // E5
      { f: 1046.5, d: 0.12 }, // C6
      { f: 783.99, d: 0.12 }, // G5
      { f: 659.25, d: 0.22 }, // E5
      { f: 493.88, d: 0.12 }, // B4
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.12 }, // D#5
      { f: 987.77, d: 0.18 }, // B5
    ];

    let offset = 0;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';

      const startTime = t + offset;
      osc.frequency.setValueAtTime(note.f, startTime);

      gain.gain.setValueAtTime(0.13, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d - 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + note.d);

      offset += note.d;
    });
  }

  // Som ao avançar de fase (Level Clear)
  playLevelClear() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      const start = t + i * 0.1;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  // Som de Game Over
  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [440, 415, 392, 349];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      const start = t + i * 0.2;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.28);
    });
  }
}

// ============================================================================
// 2. CONFIGURAÇÃO DO LABIRINTO (28 COLUNAS x 31 LINHAS)
// ============================================================================
// 0: Vazio (caminho sem item)
// 1: Parede Azul
// 2: Ponto Normal (+10 pts)
// 3: Ponto Especial / Energizer (+50 pts)
// 4: Porta da Casa dos Fantasmas (bloqueia Pacman, transitável por fantasmas)
// 5: Interior da Casa dos Fantasmas

const MAP_TEMPLATE = [
  // Linha 0 a 4
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  // Linha 5 a 9
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  // Linha 10 a 14 (Área da Casa e Túnel Lateral)
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,5,5,5,5,5,5,1,0,0,0,2,0,0,0,0,0,0], // TÚNEL LATERAL (Linha 14)
  // Linha 15 a 19
  [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  // Linha 20 a 24
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1], // Pac-Man inicia em (13.5, 23.5)
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  // Linha 25 a 30
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const COLS = 28;
const ROWS = 31;
const TILE_SIZE = 20;

// ============================================================================
// 3. CLASSE PAC-MAN (JOGADOR)
// ============================================================================

class Pacman {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.x = 13.5;
    this.y = 23.5;
    this.dirX = -1;
    this.dirY = 0;
    this.nextDirX = -1;
    this.nextDirY = 0;
    this.speed = 4.4; // Azulejos por segundo
    this.radius = 9;
    this.mouthAngle = 0.2;
    this.isDying = false;
    this.deathAngle = 0;
  }

  setDirection(dx, dy) {
    this.nextDirX = dx;
    this.nextDirY = dy;

    // Se estiver parado ou se a direção for oposta, pode aplicar imediatamente
    if (this.dirX === 0 && this.dirY === 0) {
      const curTileX = Math.floor(this.x);
      const curTileY = Math.floor(this.y);
      if (this.game.isWalkableForPacman(curTileX + dx, curTileY + dy)) {
        this.dirX = dx;
        this.dirY = dy;
      }
    } else if (this.nextDirX === -this.dirX && this.nextDirY === -this.dirY) {
      this.dirX = this.nextDirX;
      this.dirY = this.nextDirY;
    }
  }

  update(dt) {
    if (this.isDying) {
      this.deathAngle += dt * 3.5;
      return;
    }

    let remainingStep = (this.speed + (this.game.level - 1) * 0.15) * dt;

    while (remainingStep > 0) {
      const curTileX = Math.floor(this.x);
      const curTileY = Math.floor(this.y);
      const centerX = curTileX + 0.5;
      const centerY = curTileY + 0.5;

      // Túnel lateral infinito (linha 14)
      if (curTileY === 14) {
        if (this.x < -0.5) {
          this.x = COLS - 0.5;
          break;
        } else if (this.x > COLS - 0.5) {
          this.x = -0.5;
          break;
        }
      }

      // Verifica se está alinhado no centro do azulejo
      const atCenter = Math.abs(this.x - centerX) < 0.001 && Math.abs(this.y - centerY) < 0.001;

      if (atCenter) {
        // Tenta virar para a direção requisitada pelo jogador
        if (this.nextDirX !== 0 || this.nextDirY !== 0) {
          if (this.game.isWalkableForPacman(curTileX + this.nextDirX, curTileY + this.nextDirY)) {
            this.dirX = this.nextDirX;
            this.dirY = this.nextDirY;
          }
        }

        // Se a direção atual colidir com parede, interrompe o movimento
        if (!this.game.isWalkableForPacman(curTileX + this.dirX, curTileY + this.dirY)) {
          this.dirX = 0;
          this.dirY = 0;
          break;
        }
      }

      if (this.dirX === 0 && this.dirY === 0) {
        break;
      }

      // Calcula a distância até o próximo centro de azulejo
      let distToNextCenter;
      let targetCenter;

      if (this.dirX > 0) {
        targetCenter = this.x < centerX ? centerX : centerX + 1;
        distToNextCenter = targetCenter - this.x;
      } else if (this.dirX < 0) {
        targetCenter = this.x > centerX ? centerX : centerX - 1;
        distToNextCenter = this.x - targetCenter;
      } else if (this.dirY > 0) {
        targetCenter = this.y < centerY ? centerY : centerY + 1;
        distToNextCenter = targetCenter - this.y;
      } else if (this.dirY < 0) {
        targetCenter = this.y > centerY ? centerY : centerY - 1;
        distToNextCenter = this.y - targetCenter;
      }

      if (distToNextCenter <= 0.0001) {
        distToNextCenter = 1.0;
        if (this.dirX > 0) targetCenter = centerX + 1;
        else if (this.dirX < 0) targetCenter = centerX - 1;
        else if (this.dirY > 0) targetCenter = centerY + 1;
        else if (this.dirY < 0) targetCenter = centerY - 1;
      }

      if (remainingStep < distToNextCenter) {
        this.x += this.dirX * remainingStep;
        this.y += this.dirY * remainingStep;
        remainingStep = 0;
      } else {
        if (this.dirX !== 0) this.x = targetCenter;
        if (this.dirY !== 0) this.y = targetCenter;
        remainingStep -= distToNextCenter;
      }
    }

    // Coleta de pontos
    this.game.checkPelletCollision(Math.floor(this.x), Math.floor(this.y));

    // Animação da boca abrindo e fechando
    if (this.dirX !== 0 || this.dirY !== 0) {
      this.mouthAngle = (Math.sin(performance.now() * 0.018) + 1) * 0.14 + 0.03;
    }
  }

  draw(ctx) {
    const pixelX = this.x * TILE_SIZE;
    const pixelY = this.y * TILE_SIZE;

    ctx.save();
    ctx.translate(pixelX, pixelY);

    if (this.isDying) {
      // Animação clássica de dobradura/desaparecimento na morte
      ctx.fillStyle = '#ffee00';
      ctx.beginPath();
      const open = Math.min(Math.PI, this.deathAngle);
      ctx.arc(0, 0, this.radius, open, Math.PI * 2 - open, false);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Rotação com base na direção atual
    let angle = 0;
    if (this.dirX === 1) angle = 0;
    else if (this.dirX === -1) angle = Math.PI;
    else if (this.dirY === 1) angle = Math.PI * 0.5;
    else if (this.dirY === -1) angle = Math.PI * 1.5;

    ctx.rotate(angle);

    // Personagem circular amarelo com boca em abertura
    ctx.fillStyle = '#ffee00';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffff00';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, this.mouthAngle * Math.PI, (2 - this.mouthAngle) * Math.PI, false);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================================
// 4. CLASSE FANTASMAS (INIMIGOS COM PERSONALIDADES DISTINTAS)
// ============================================================================

const GHOST_NAMES = {
  BLINKY: 'Blinky', // Vermelho (perseguidor agressivo)
  PINKY: 'Pinky',   // Rosa (emboscador, antecipa caminhos)
  INKY: 'Inky',     // Ciano (estrategista flanqueador)
  CLYDE: 'Clyde'    // Laranja (covarde, persegue de longe e foge de perto)
};

const GHOST_MODES = {
  IN_HOUSE: 'in_house',
  EXITING: 'exiting',
  CHASE: 'chase',
  SCATTER: 'scatter',
  FRIGHTENED: 'frightened',
  EATEN: 'eaten'
};

class Ghost {
  constructor(game, type) {
    this.game = game;
    this.type = type;
    this.reset();
  }

  reset() {
    this.mode = GHOST_MODES.IN_HOUSE;
    this.dirX = 0;
    this.dirY = -1;
    this.speed = 3.8;
    this.inHouseTimer = 0;

    switch (this.type) {
      case GHOST_NAMES.BLINKY:
        this.color = '#ff2222';
        this.x = 13.5;
        this.y = 11.5; // Começa fora da casa
        this.mode = GHOST_MODES.CHASE;
        this.dirX = -1;
        this.dirY = 0;
        this.cornerX = 26;
        this.cornerY = 0;
        break;

      case GHOST_NAMES.PINKY:
        this.color = '#ff88ff';
        this.x = 13.5;
        this.y = 14.5;
        this.inHouseDelay = 1.0;
        this.cornerX = 1;
        this.cornerY = 0;
        break;

      case GHOST_NAMES.INKY:
        this.color = '#00ffff';
        this.x = 11.5;
        this.y = 14.5;
        this.inHouseDelay = 4.0;
        this.cornerX = 26;
        this.cornerY = 30;
        break;

      case GHOST_NAMES.CLYDE:
        this.color = '#ffaa33';
        this.x = 15.5;
        this.y = 14.5;
        this.inHouseDelay = 7.0;
        this.cornerX = 1;
        this.cornerY = 30;
        break;
    }
  }

  makeVulnerable() {
    if (this.mode !== GHOST_MODES.EATEN && this.mode !== GHOST_MODES.IN_HOUSE) {
      this.mode = GHOST_MODES.FRIGHTENED;
      // Inverte a direção ao ficar vulnerável
      this.dirX = -this.dirX;
      this.dirY = -this.dirY;
    }
  }

  update(dt) {
    // 1. Esperando dentro da casa
    if (this.mode === GHOST_MODES.IN_HOUSE) {
      this.inHouseTimer += dt;
      this.y += Math.sin(performance.now() * 0.005) * 0.015;

      if (this.inHouseTimer >= this.inHouseDelay) {
        this.mode = GHOST_MODES.EXITING;
      }
      return;
    }

    // 2. Saindo da casa dos fantasmas
    if (this.mode === GHOST_MODES.EXITING) {
      const targetDoorX = 13.5;
      const targetDoorY = 11.5;

      if (Math.abs(this.x - targetDoorX) > 0.05) {
        this.x += Math.sign(targetDoorX - this.x) * this.speed * dt * 0.7;
      } else {
        this.x = targetDoorX;
        this.y -= this.speed * dt * 0.7;
        if (this.y <= targetDoorY) {
          this.y = targetDoorY;
          this.mode = GHOST_MODES.CHASE;
          this.dirX = -1;
          this.dirY = 0;
        }
      }
      return;
    }

    // 3. Olhos retornando à base após ser capturado
    if (this.mode === GHOST_MODES.EATEN) {
      const doorX = 13.5;
      const doorY = 11.5;
      const distToDoor = Math.hypot(this.x - doorX, this.y - doorY);

      if (distToDoor < 0.35) {
        this.mode = GHOST_MODES.EXITING;
        this.y = 14.5;
        return;
      }
    }

    // Velocidade dinâmica baseada no estado e fase
    let currentSpeed = this.speed + (this.game.level - 1) * 0.25;
    if (this.mode === GHOST_MODES.FRIGHTENED) {
      currentSpeed *= 0.55; // Mais lento quando vulnerável
    } else if (this.mode === GHOST_MODES.EATEN) {
      currentSpeed *= 1.85; // Rápido retornando à base
    }

    let remainingStep = currentSpeed * dt;

    while (remainingStep > 0) {
      const curTileX = Math.floor(this.x);
      const curTileY = Math.floor(this.y);
      const centerX = curTileX + 0.5;
      const centerY = curTileY + 0.5;

      // Túnel lateral infinito
      if (curTileY === 14) {
        if (this.x < -0.5) {
          this.x = COLS - 0.5;
          break;
        } else if (this.x > COLS - 0.5) {
          this.x = -0.5;
          break;
        }
      }

      const atCenter = Math.abs(this.x - centerX) < 0.001 && Math.abs(this.y - centerY) < 0.001;

      if (atCenter) {
        this.decideNextDirection(curTileX, curTileY);
      }

      if (this.dirX === 0 && this.dirY === 0) {
        break;
      }

      let distToNextCenter;
      let targetCenter;

      if (this.dirX > 0) {
        targetCenter = this.x < centerX ? centerX : centerX + 1;
        distToNextCenter = targetCenter - this.x;
      } else if (this.dirX < 0) {
        targetCenter = this.x > centerX ? centerX : centerX - 1;
        distToNextCenter = this.x - targetCenter;
      } else if (this.dirY > 0) {
        targetCenter = this.y < centerY ? centerY : centerY + 1;
        distToNextCenter = targetCenter - this.y;
      } else if (this.dirY < 0) {
        targetCenter = this.y > centerY ? centerY : centerY - 1;
        distToNextCenter = this.y - targetCenter;
      }

      if (distToNextCenter <= 0.0001) {
        distToNextCenter = 1.0;
        if (this.dirX > 0) targetCenter = centerX + 1;
        else if (this.dirX < 0) targetCenter = centerX - 1;
        else if (this.dirY > 0) targetCenter = centerY + 1;
        else if (this.dirY < 0) targetCenter = centerY - 1;
      }

      if (remainingStep < distToNextCenter) {
        this.x += this.dirX * remainingStep;
        this.y += this.dirY * remainingStep;
        remainingStep = 0;
      } else {
        if (this.dirX !== 0) this.x = targetCenter;
        if (this.dirY !== 0) this.y = targetCenter;
        remainingStep -= distToNextCenter;
      }
    }
  }

  // Tomada de decisão em cruzamentos e curvas
  decideNextDirection(tileX, tileY) {
    const candidates = [
      { dx: 0, dy: -1 }, // Cima
      { dx: -1, dy: 0 }, // Esquerda
      { dx: 0, dy: 1 },  // Baixo
      { dx: 1, dy: 0 }   // Direita
    ];

    const validMoves = [];

    candidates.forEach((move) => {
      // Evita marcha a ré imediata se houver outros caminhos
      if (move.dx === -this.dirX && move.dy === -this.dirY && (this.dirX !== 0 || this.dirY !== 0)) {
        return;
      }

      const nextTileX = tileX + move.dx;
      const nextTileY = tileY + move.dy;
      const isEaten = this.mode === GHOST_MODES.EATEN;

      if (this.game.isWalkableForGhost(nextTileX, nextTileY, isEaten)) {
        validMoves.push(move);
      }
    });

    if (validMoves.length === 0) {
      const revX = -this.dirX;
      const revY = -this.dirY;
      if (this.game.isWalkableForGhost(tileX + revX, tileY + revY, this.mode === GHOST_MODES.EATEN)) {
        this.dirX = revX;
        this.dirY = revY;
      } else {
        this.dirX = 0;
        this.dirY = 0;
      }
      return;
    }

    // Quando vulneráveis (Power Pellet), fogem ativamente do jogador
    if (this.mode === GHOST_MODES.FRIGHTENED) {
      const pac = this.game.pacman;
      let bestMove = validMoves[0];
      let maxDist = -1;

      validMoves.forEach((move) => {
        const testX = tileX + move.dx;
        const testY = tileY + move.dy;
        const dist = Math.hypot(testX - pac.x, testY - pac.y);
        const score = dist + Math.random() * 0.4; // Adiciona variação para desvio dinâmico
        if (score > maxDist) {
          maxDist = score;
          bestMove = move;
        }
      });

      this.dirX = bestMove.dx;
      this.dirY = bestMove.dy;
      return;
    }

    // Modo normal: busca o alvo definido pela personalidade
    const target = this.getTargetTile(tileX, tileY);
    let bestMove = validMoves[0];
    let bestDist = Infinity;

    validMoves.forEach((move) => {
      const testX = tileX + move.dx;
      const testY = tileY + move.dy;
      const dist = Math.hypot(testX - target.x, testY - target.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestMove = move;
      }
    });

    this.dirX = bestMove.dx;
    this.dirY = bestMove.dy;
  }

  // Personalidades únicas de cada fantasma
  getTargetTile(tileX, tileY) {
    if (this.mode === GHOST_MODES.EATEN) {
      return { x: 13.5, y: 11.5 };
    }

    if (this.game.isScatterMode) {
      return { x: this.cornerX, y: this.cornerY };
    }

    const pac = this.game.pacman;

    switch (this.type) {
      // BLINKY (Vermelho): Persegue diretamente a posição atual do jogador
      case GHOST_NAMES.BLINKY:
        return { x: pac.x, y: pac.y };

      // PINKY (Rosa): Embosca antecipando 4 azulejos à frente do jogador
      case GHOST_NAMES.PINKY:
        return {
          x: pac.x + pac.dirX * 4,
          y: pac.y + pac.dirY * 4
        };

      // INKY (Ciano): Flanqueia combinando vetor do Blinky e do Pac-man
      case GHOST_NAMES.INKY: {
        const blinky = this.game.ghosts.find((g) => g.type === GHOST_NAMES.BLINKY);
        const aheadX = pac.x + pac.dirX * 2;
        const aheadY = pac.y + pac.dirY * 2;
        const bx = blinky ? blinky.x : pac.x;
        const by = blinky ? blinky.y : pac.y;
        return {
          x: 2 * aheadX - bx,
          y: 2 * aheadY - by
        };
      }

      // CLYDE (Laranja): Persegue quando distante (> 8), mas recua quando próximo
      case GHOST_NAMES.CLYDE: {
        const distToPac = Math.hypot(tileX - pac.x, tileY - pac.y);
        if (distToPac > 8) {
          return { x: pac.x, y: pac.y };
        } else {
          return { x: this.cornerX, y: this.cornerY };
        }
      }

      default:
        return { x: pac.x, y: pac.y };
    }
  }

  draw(ctx) {
    const pixelX = this.x * TILE_SIZE;
    const pixelY = this.y * TILE_SIZE;
    const r = 9;

    ctx.save();
    ctx.translate(pixelX, pixelY);

    if (this.mode === GHOST_MODES.EATEN) {
      this.drawEyes(ctx);
      ctx.restore();
      return;
    }

    let bodyColor = this.color;
    if (this.mode === GHOST_MODES.FRIGHTENED) {
      // Pisca branco e azul nos últimos momentos de vulnerabilidade
      if (this.game.frightenedTimer < 2.5 && Math.floor(performance.now() / 250) % 2 === 0) {
        bodyColor = '#ffffff';
      } else {
        bodyColor = '#1b3eff';
      }
    }

    ctx.fillStyle = bodyColor;
    ctx.shadowBlur = 6;
    ctx.shadowColor = bodyColor;

    // Desenho clássico do corpo com formato abobadado e tentáculos ondulados
    ctx.beginPath();
    ctx.arc(0, -2, r, Math.PI, 0, false);
    ctx.lineTo(r, r - 2);

    const wave = Math.sin(performance.now() * 0.015) * 1.5;
    ctx.lineTo(r * 0.6, r - 5 + wave);
    ctx.lineTo(r * 0.2, r - 2);
    ctx.lineTo(-r * 0.2, r - 5 - wave);
    ctx.lineTo(-r * 0.6, r - 2);
    ctx.lineTo(-r, r - 5 + wave);

    ctx.lineTo(-r, -2);
    ctx.closePath();
    ctx.fill();

    // Rosto e olhos
    if (this.mode === GHOST_MODES.FRIGHTENED) {
      ctx.fillStyle = bodyColor === '#ffffff' ? '#ff3333' : '#ffb897';
      ctx.beginPath();
      ctx.arc(-3, -3, 2, 0, Math.PI * 2);
      ctx.arc(3, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = bodyColor === '#ffffff' ? '#ff3333' : '#ffb897';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, 3);
      ctx.lineTo(-2, 1);
      ctx.lineTo(0, 3);
      ctx.lineTo(2, 1);
      ctx.lineTo(5, 3);
      ctx.stroke();
    } else {
      this.drawEyes(ctx);
    }

    ctx.restore();
  }

  drawEyes(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-3.5, -3, 3, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(3.5, -3, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const lookX = this.dirX * 1.6;
    const lookY = this.dirY * 1.6;

    ctx.fillStyle = '#112288';
    ctx.beginPath();
    ctx.arc(-3.5 + lookX, -3 + lookY, 1.8, 0, Math.PI * 2);
    ctx.arc(3.5 + lookX, -3 + lookY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================
// 5. CONTROLADOR PRINCIPAL DO JOGO (GAME ENGINE)
// ============================================================================

const GAME_STATES = {
  MENU: 'menu',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DYING: 'dying',
  LEVEL_CLEAR: 'level_clear',
  GAME_OVER: 'game_over'
};

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundEngine();

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('pacman_arcade_highscore') || '0', 10);
    this.level = 1;
    this.lives = 3;
    this.state = GAME_STATES.MENU;

    this.ghostEatCombo = 200; // 200 -> 400 -> 800 -> 1600
    this.frightenedTimer = 0;
    this.frightenedDuration = 8.0;

    this.scatterTimer = 0;
    this.isScatterMode = false;
    this.floatingScores = [];

    // Handles de timeouts para limpeza segura
    this.roundTimeout = null;
    this.deathTimeout = null;
    this.levelClearTimeout = null;

    // Elementos DOM
    this.scoreDisplay = document.getElementById('score-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.startHighScore = document.getElementById('start-high-score');
    this.gameOverHighScore = document.getElementById('game-over-high-score');
    this.finalScore = document.getElementById('final-score');
    this.levelDisplay = document.getElementById('level-display');
    this.livesDisplay = document.getElementById('lives-display');
    this.startScreen = document.getElementById('start-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.readyBanner = document.getElementById('ready-banner');
    this.bannerText = document.getElementById('banner-text');
    this.soundBtn = document.getElementById('sound-btn');
    this.pauseBtn = document.getElementById('pause-btn');

    this.initEntities();
    this.bindEvents();
    this.updateHUD();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  clearAllTimeouts() {
    if (this.roundTimeout) clearTimeout(this.roundTimeout);
    if (this.deathTimeout) clearTimeout(this.deathTimeout);
    if (this.levelClearTimeout) clearTimeout(this.levelClearTimeout);
    this.roundTimeout = null;
    this.deathTimeout = null;
    this.levelClearTimeout = null;
  }

  initEntities() {
    this.pacman = new Pacman(this);
    this.ghosts = [
      new Ghost(this, GHOST_NAMES.BLINKY),
      new Ghost(this, GHOST_NAMES.PINKY),
      new Ghost(this, GHOST_NAMES.INKY),
      new Ghost(this, GHOST_NAMES.CLYDE)
    ];
    this.initMap();
  }

  initMap() {
    this.map = MAP_TEMPLATE.map((row) => [...row]);
    this.totalPellets = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map[r][c] === 2 || this.map[r][c] === 3) {
          this.totalPellets++;
        }
      }
    }
    this.remainingPellets = this.totalPellets;
  }

  isWalkableForPacman(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
      if (row === 14 && (col < 0 || col >= COLS)) return true;
      return false;
    }
    const tile = this.map[row][col];
    return tile !== 1 && tile !== 4 && tile !== 5;
  }

  isWalkableForGhost(col, row, isEaten = false) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
      if (row === 14 && (col < 0 || col >= COLS)) return true;
      return false;
    }
    const tile = this.map[row][col];
    if (tile === 1) return false;
    if (tile === 4) return isEaten;
    return true;
  }

  checkPelletCollision(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    const tile = this.map[row][col];

    if (tile === 2) {
      // Ponto normal: +10 pontos
      this.map[row][col] = 0;
      this.addScore(10);
      this.remainingPellets--;
      this.sound.playChomp();
      this.checkLevelClear();
    } else if (tile === 3) {
      // Ponto especial: +50 pontos
      this.map[row][col] = 0;
      this.addScore(50);
      this.remainingPellets--;
      this.sound.playPowerPellet();
      this.triggerEnergizer();
      this.checkLevelClear();
    }
  }

  triggerEnergizer() {
    this.ghostEatCombo = 200;
    this.frightenedDuration = Math.max(3.5, 9.0 - (this.level - 1) * 0.8);
    this.frightenedTimer = this.frightenedDuration;

    this.ghosts.forEach((ghost) => {
      ghost.makeVulnerable();
    });
  }

  checkLevelClear() {
    if (this.remainingPellets <= 0) {
      this.clearAllTimeouts();
      this.state = GAME_STATES.LEVEL_CLEAR;
      this.sound.playLevelClear();
      this.showBanner(`FASE ${this.level} CONCLUÍDA!`, 2000);

      this.levelClearTimeout = setTimeout(() => {
        this.nextLevel();
      }, 2000);
    }
  }

  nextLevel() {
    this.level++;
    this.initMap();
    this.resetPositions();
    this.updateHUD();
    this.startRound(false);
  }

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pacman_arcade_highscore', this.highScore.toString());
    }
    this.updateHUD();
  }

  updateHUD() {
    const formattedScore = this.score.toString().padStart(5, '0');
    const formattedHighScore = this.highScore.toString().padStart(5, '0');

    this.scoreDisplay.textContent = formattedScore;
    this.highScoreDisplay.textContent = formattedHighScore;
    this.startHighScore.textContent = formattedHighScore;
    this.gameOverHighScore.textContent = formattedHighScore;
    this.levelDisplay.textContent = this.level;

    let hearts = '';
    for (let i = 0; i < this.lives; i++) hearts += '❤️';
    this.livesDisplay.textContent = hearts || '---';
  }

  showBanner(text, duration = 1600) {
    this.bannerText.textContent = text;
    this.readyBanner.classList.remove('hidden');
    if (duration > 0) {
      setTimeout(() => {
        this.readyBanner.classList.add('hidden');
      }, duration);
    }
  }

  hideBanner() {
    this.readyBanner.classList.add('hidden');
  }

  startRound(playFanfare = true) {
    this.clearAllTimeouts();
    this.state = GAME_STATES.READY;
    this.showBanner(`FASE ${this.level}`, 2000);

    if (playFanfare) {
      this.sound.playStart();
    }

    this.roundTimeout = setTimeout(() => {
      this.hideBanner();
      this.state = GAME_STATES.PLAYING;
    }, 2000);
  }

  resetPositions() {
    this.pacman.reset();
    this.ghosts.forEach((g) => g.reset());
    this.frightenedTimer = 0;
  }

  handlePlayerDeath() {
    this.clearAllTimeouts();
    this.state = GAME_STATES.DYING;
    this.pacman.isDying = true;
    this.sound.playDeath();

    this.deathTimeout = setTimeout(() => {
      this.lives--;
      this.updateHUD();

      if (this.lives > 0) {
        this.resetPositions();
        this.startRound(false);
      } else {
        this.triggerGameOver();
      }
    }, 1400);
  }

  triggerGameOver() {
    this.clearAllTimeouts();
    this.state = GAME_STATES.GAME_OVER;
    this.sound.playGameOver();
    this.finalScore.textContent = this.score.toString().padStart(5, '0');
    this.gameOverHighScore.textContent = this.highScore.toString().padStart(5, '0');

    const newRecordAlert = document.getElementById('new-record-alert');
    if (this.score >= this.highScore && this.score > 0) {
      newRecordAlert.classList.remove('hidden');
    } else {
      newRecordAlert.classList.add('hidden');
    }

    this.gameOverScreen.classList.remove('hidden');
    this.gameOverScreen.classList.add('active');
  }

  restartGame() {
    this.clearAllTimeouts();
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.initMap();
    this.resetPositions();
    this.updateHUD();

    this.startScreen.classList.remove('active');
    this.startScreen.classList.add('hidden');
    this.pauseScreen.classList.remove('active');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.remove('active');
    this.gameOverScreen.classList.add('hidden');

    this.startRound(true);
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      this.pauseScreen.classList.remove('hidden');
      this.pauseScreen.classList.add('active');
    } else if (this.state === GAME_STATES.PAUSED) {
      this.resumeGame();
    }
  }

  resumeGame() {
    this.pauseScreen.classList.remove('active');
    this.pauseScreen.classList.add('hidden');
    this.state = GAME_STATES.PLAYING;
    this.lastTime = performance.now();
  }

  // ============================================================================
  // LOOP PRINCIPAL DE ATUALIZAÇÃO E DESENHO
  // ============================================================================

  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === GAME_STATES.PLAYING) {
      this.update(dt);
    } else if (this.state === GAME_STATES.DYING) {
      this.pacman.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    // 1. Temporizador de vulnerabilidade dos fantasmas
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.ghosts.forEach((ghost) => {
          if (ghost.mode === GHOST_MODES.FRIGHTENED) {
            ghost.mode = GHOST_MODES.CHASE;
          }
        });
      }
    }

    // 2. Ciclo Dispersão vs Perseguição
    this.scatterTimer += dt;
    if (this.scatterTimer > 25) {
      this.isScatterMode = !this.isScatterMode;
      this.scatterTimer = 0;
    }

    // 3. Atualização das entidades
    this.pacman.update(dt);
    this.ghosts.forEach((ghost) => ghost.update(dt));

    // 4. Detecção de Colisão
    this.ghosts.forEach((ghost) => {
      const dist = Math.hypot(this.pacman.x - ghost.x, this.pacman.y - ghost.y);

      if (dist < 0.75) {
        if (ghost.mode === GHOST_MODES.FRIGHTENED) {
          // Fantasma capturado
          ghost.mode = GHOST_MODES.EATEN;
          this.sound.playEatGhost();

          const pts = this.ghostEatCombo;
          this.addScore(pts);
          this.floatingScores.push({
            x: ghost.x * TILE_SIZE,
            y: ghost.y * TILE_SIZE,
            text: `+${pts}`,
            alpha: 1.0,
            timer: 0.9
          });

          this.ghostEatCombo *= 2;
        } else if (ghost.mode === GHOST_MODES.CHASE || ghost.mode === GHOST_MODES.SCATTER) {
          // Colisão com fantasma normal
          this.handlePlayerDeath();
        }
      }
    });

    // 5. Textos flutuantes de pontuação
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const fs = this.floatingScores[i];
      fs.y -= 25 * dt;
      fs.timer -= dt;
      fs.alpha = Math.max(0, fs.timer / 0.9);
      if (fs.timer <= 0) {
        this.floatingScores.splice(i, 1);
      }
    }
  }

  // ============================================================================
  // RENDERIZAÇÃO NO CANVAS
  // ============================================================================

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Labirinto
    this.renderMaze();

    // 2. Pac-Man
    this.pacman.draw(this.ctx);

    // 3. Fantasmas
    this.ghosts.forEach((ghost) => ghost.draw(this.ctx));

    // 4. Pontuação Flutuante
    this.floatingScores.forEach((fs) => {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(51, 255, 204, ${fs.alpha})`;
      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = '#33ffcc';
      this.ctx.fillText(fs.text, fs.x, fs.y);
      this.ctx.restore();
    });
  }

  renderMaze() {
    const pulse = (Math.sin(performance.now() * 0.008) + 1) * 0.5;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.map[r][c];
        const px = c * TILE_SIZE;
        const py = r * TILE_SIZE;

        if (tile === 1) {
          // Paredes azuis arcade com acabamento neon
          this.ctx.fillStyle = '#0a0d2c';
          this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          this.ctx.strokeStyle = '#2121ff';
          this.ctx.lineWidth = 2;
          this.ctx.shadowBlur = 4;
          this.ctx.shadowColor = 'rgba(33, 33, 255, 0.7)';
          this.ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          this.ctx.shadowBlur = 0;
        } else if (tile === 4) {
          // Porta da Casa dos Fantasmas
          this.ctx.fillStyle = '#ff88ff';
          this.ctx.fillRect(px, py + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
        } else if (tile === 2) {
          // Ponto Normal (+10 pts)
          this.ctx.fillStyle = '#ffb897';
          this.ctx.beginPath();
          this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (tile === 3) {
          // Ponto Especial (+50 pts)
          const radius = 5.5 + pulse * 2.0;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = '#ffffaa';
          this.ctx.beginPath();
          this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, radius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }
    }
  }

  // ============================================================================
  // ENTRADA DE DADOS E EVENTOS
  // ============================================================================

  bindEvents() {
    // 1. Teclado (W, A, S, D e Setas + P/Esc para Pausa)
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      this.sound.init();

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.togglePause();
        return;
      }

      if (this.state !== GAME_STATES.PLAYING) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.pacman.setDirection(0, -1);
          break;

        case 'ArrowDown':
        case 's':
        case 'S':
          this.pacman.setDirection(0, 1);
          break;

        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.pacman.setDirection(-1, 0);
          break;

        case 'ArrowRight':
        case 'd':
        case 'D':
          this.pacman.setDirection(1, 0);
          break;
      }
    });

    // 2. Botões Virtuais do D-Pad (Touch / Celular / Tablet)
    const btnUp = document.getElementById('ctrl-up');
    const btnDown = document.getElementById('ctrl-down');
    const btnLeft = document.getElementById('ctrl-left');
    const btnRight = document.getElementById('ctrl-right');

    const handleDpad = (btn, dx, dy) => {
      const activate = (e) => {
        if (e) e.preventDefault();
        this.sound.init();
        btn.classList.add('pressed');
        if (this.state === GAME_STATES.PLAYING) {
          this.pacman.setDirection(dx, dy);
        }
      };

      const deactivate = () => {
        btn.classList.remove('pressed');
      };

      btn.addEventListener('pointerdown', activate);
      btn.addEventListener('pointerup', deactivate);
      btn.addEventListener('pointerleave', deactivate);
      btn.addEventListener('touchstart', activate, { passive: false });
      btn.addEventListener('touchend', deactivate, { passive: false });
    };

    handleDpad(btnUp, 0, -1);
    handleDpad(btnDown, 0, 1);
    handleDpad(btnLeft, -1, 0);
    handleDpad(btnRight, 1, 0);

    // 3. Gestos de Deslizar (Swipe) na Tela
    let touchStartX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      this.sound.init();
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (this.state !== GAME_STATES.PLAYING) return;
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (Math.max(absX, absY) > 20) {
          if (absX > absY) {
            this.pacman.setDirection(dx > 0 ? 1 : -1, 0);
          } else {
            this.pacman.setDirection(0, dy > 0 ? 1 : -1);
          }
        }
      }
    }, { passive: true });

    // 4. Botões de Interface
    document.getElementById('start-btn').addEventListener('click', () => {
      this.sound.init();
      this.restartGame();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      this.sound.init();
      this.resumeGame();
    });

    document.getElementById('restart-from-pause-btn').addEventListener('click', () => {
      this.sound.init();
      this.restartGame();
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
      this.sound.init();
      this.restartGame();
    });

    this.pauseBtn.addEventListener('click', () => {
      this.sound.init();
      this.togglePause();
    });

    this.soundBtn.addEventListener('click', () => {
      this.sound.init();
      const muted = this.sound.toggleMute();
      this.soundBtn.textContent = muted ? '🔇' : '🔊';
      this.soundBtn.title = muted ? 'Ativar Som' : 'Desativar Som';
    });
  }
}

// ============================================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  window.pacmanGame = new Game();
});
