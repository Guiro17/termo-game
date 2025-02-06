const GAME_CONFIG = {
    mode: "sequence",
    fixedWords: ["TESTE", "PROVA", "FALAR", "MUNDO", "CORPO"]
};
class TermoGame {
    constructor() {
        this.height = 6;
        this.width = 5;
        this.row = 0;
        this.col = 0;
        this.gameOver = false;
        this.wordList = [];
        this.word = "";
        this.gameMode = GAME_CONFIG.mode;
        this.currentWordIndex = 0;
        this.fixedWords = GAME_CONFIG.fixedWords;
        this.playerName = "";
        this.startTime = null;
        this.wordsCompleted = 0;
        this.showNamePrompt();
    }
    showNamePrompt() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        const content = document.createElement('div');
        content.style.cssText = `
            background: var(--primary-bg);
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
        `;
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Digite seu nome';
        input.style.cssText = `
            padding: 0.5rem;
            margin: 1rem;
            font-size: 1.2rem;
            border-radius: 5px;
            border: none;
        `;
        const button = document.createElement('button');
        button.textContent = 'Começar';
        button.style.cssText = `
            padding: 0.5rem 1rem;
            background: var(--correct-color);
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
            font-size: 1.2rem;
        `;
        button.onclick = () => {
            if (input.value.trim()) {
                this.playerName = input.value.trim();
                document.body.removeChild(modal);
                this.initialize();
                this.startTime = Date.now();
            } else {
                alert('Por favor, digite seu nome!');
            }
        };
        content.appendChild(document.createElement('h2')).textContent = 'Bem-vindo ao Termo!';
        content.appendChild(input);
        content.appendChild(document.createElement('br'));
        content.appendChild(button);
        modal.appendChild(content);
        document.body.appendChild(modal);
        input.focus();
    }
    showRanking() {
        const rankings = this.getRankings();
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        const content = document.createElement('div');
        content.style.cssText = `
            background: var(--primary-bg);
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
        `;
        content.innerHTML = `
            <h2>Top 10 Jogadores</h2>
            <table style="width: 100%; margin-top: 1rem;">
                <tr>
                    <th>Posição</th>
                    <th>Nome</th>
                    <th>Tempo</th>
                </tr>
                ${rankings.map((rank, index) => `
                    <tr style="background: ${this.playerName === rank.name ? 'var(--correct-color)' : 'transparent'}">
                        <td>${index + 1}º</td>
                        <td>${rank.name}</td>
                        <td>${this.formatTime(rank.time)}</td>
                    </tr>
                `).join('')}
            </table>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--correct-color); border: none; border-radius: 5px; color: white; cursor: pointer;">
                Jogar Novamente
            </button>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);
    }
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    getRankings() {
        const rankings = JSON.parse(localStorage.getItem('termoRankings') || '[]');
        return rankings.sort((a, b) => a.time - b.time).slice(0, 10);
    }
    saveScore(time) {
        const rankings = JSON.parse(localStorage.getItem('termoRankings') || '[]');
        rankings.push({
            name: this.playerName,
            time: time
        });
        rankings.sort((a, b) => a.time - b.time);
        localStorage.setItem('termoRankings', JSON.stringify(rankings.slice(0, 10)));
    }
    updateTimer() {
        if (!this.startTime || this.gameOver) return;
        const elapsed = Date.now() - this.startTime;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.formatTime(elapsed);
        }
    }
    // ... [resto dos métodos anteriores permanecem iguais] ...
    checkGuess(guess) {
        const letterCount = {};
        [...this.word].forEach(letter => {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        });
        let correct = 0;
        for (let i = 0; i < this.width; i++) {
            const tile = document.getElementById(`${this.row}-${i}`);
            const letter = this.normalizeWord(tile.innerText);
            if (this.word[i] === letter) {
                this.updateTile(tile, letter, "correct");
                letterCount[letter]--;
                correct++;
            }
        }
        for (let i = 0; i < this.width; i++) {
            const tile = document.getElementById(`${this.row}-${i}`);
            const letter = this.normalizeWord(tile.innerText);
            if (!tile.classList.contains("correct")) {
                if (letterCount[letter] > 0) {
                    this.updateTile(tile, letter, "present");
                    letterCount[letter]--;
                } else {
                    this.updateTile(tile, letter, "absent");
                }
            }
        }
        this.row++;
        this.col = 0;
        if (correct === this.width) {
            this.wordsCompleted++;
            if (this.wordsCompleted === this.fixedWords.length) {
                this.gameOver = true;
                const finalTime = Date.now() - this.startTime;
                this.saveScore(finalTime);
                setTimeout(() => {
                    alert(`Parabéns ${this.playerName}! Você completou todas as palavras em ${this.formatTime(finalTime)}!`);
                    this.showRanking();
                }, 500);
            } else {
                setTimeout(() => {
                    alert("Palavra correta! Próxima palavra...");
                    this.resetForNextWord();
                }, 500);
            }
        } else if (this.row === this.height) {
            this.gameOver = true;
            document.getElementById("answer").innerText = this.word;
            setTimeout(() => {
                alert("Fim de jogo! A palavra era: " + this.word);
                location.reload();
            }, 500);
        }
    }
    resetForNextWord() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.innerText = '';
            tile.className = 'tile';
        });
        const keys = document.querySelectorAll('.key-tile, .enter-key-tile');
        keys.forEach(key => {
            key.className = key.className.includes('enter') ? 'enter-key-tile' : 'key-tile';
        });
        this.row = 0;
        this.col = 0;
        this.selectWord();
    }
    async initialize() {
        await this.loadWordList();
        this.createControls();
        this.createBoard();
        this.createKeyboard();
        this.setupEventListeners();
        this.selectWord();
        this.createTimer();
        setInterval(() => this.updateTimer(), 1000);
    }
    createTimer() {
        const timer = document.createElement('div');
        timer.id = 'timer';
        timer.style.cssText = `
            font-size: 1.5rem;
            margin: 1rem;
            font-weight: bold;
        `;
        timer.textContent = '0:00';
        document.getElementById('controls').appendChild(timer);
    }
}
window.onload = () => new TermoGame();