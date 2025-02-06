const GAME_CONFIG = {
    mode: "random", // "random" para aleatório, "sequence" para sequência fixa
    fixedWords: [] // Palavras que serão usadas no modo sequence
};
class TermoGame {
    constructor() {
        this.height = 6;    // número de tentativas
        this.width = 5;     // tamanho das palavras
        this.row = 0;       // tentativa atual
        this.col = 0;       // letra atual
        this.gameOver = false;
        this.wordList = [];
        this.word = "";
        this.gameMode = GAME_CONFIG.mode;
        this.currentWordIndex = 0;
        this.fixedWords = GAME_CONFIG.fixedWords;
        this.initialize();
    }
    async initialize() {
        await this.loadWordList();
        this.createControls();
        this.createBoard();
        this.createKeyboard();
        this.setupEventListeners();
        this.selectWord();
    }
    async loadWordList() {
        if (this.gameMode === "sequence") {
            this.wordList = this.fixedWords.map(word => this.normalizeWord(word));
            console.log("Usando lista fixa de palavras:", this.wordList);
            return;
        }
        try {
            const response = await fetch('palavras.txt');
            const text = await response.text();
            this.wordList = text.split('\n')
                               .filter(word => word.trim().length === 5)
                               .map(word => this.normalizeWord(word));
            console.log(`Carregadas ${this.wordList.length} palavras válidas`);
        } catch (error) {
            console.error('Erro ao carregar lista de palavras:', error);
            this.wordList = ["TERMO", "TESTE", "PLANO", "CAMPO", "VERDE"];
        }
    }
    normalizeWord(word) {
        return word.trim()
                  .toUpperCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '');
    }
    createControls() {
        const controls = document.getElementById('controls');
        const randomBtn = document.createElement('button');
        randomBtn.innerText = 'Modo Aleatório';
        randomBtn.className = 'control-btn active';
        randomBtn.onclick = () => this.setGameMode('random');
        const sequenceBtn = document.createElement('button');
        sequenceBtn.innerText = 'Próximas 5 Palavras';
        sequenceBtn.className = 'control-btn';
        sequenceBtn.onclick = () => this.setGameMode('sequence');
        controls.appendChild(randomBtn);
        controls.appendChild(sequenceBtn);
        this.controlButtons = {
            random: randomBtn,
            sequence: sequenceBtn
        };
    }
    setGameMode(mode) {
        this.gameMode = mode;
        this.currentWordIndex = 0;
        Object.keys(this.controlButtons).forEach(key => {
            this.controlButtons[key].classList.toggle('active', key === mode);
        });
        this.resetGame();
    }
    selectWord() {
        if (this.gameMode === 'random') {
            const randomIndex = Math.floor(Math.random() * this.wordList.length);
            this.word = this.wordList[randomIndex];
        } else {
            this.word = this.wordList[this.currentWordIndex];
            if (this.currentWordIndex < this.wordList.length - 1) {
                this.currentWordIndex++;
            } else {
                this.currentWordIndex = 0;
            }
        }
        console.log("Palavra selecionada:", this.word);
    }
    createBoard() {
        const board = document.getElementById("board");
        board.innerHTML = '';
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const tile = document.createElement("span");
                tile.id = `${r}-${c}`;
                tile.classList.add("tile");
                board.appendChild(tile);
            }
        }
    }
    createKeyboard() {
        const keyboard = [
            ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
            ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ç"],
            ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
        ];
        keyboard.forEach(row => {
            const keyboardRow = document.createElement("div");
            keyboardRow.classList.add("keyboard-row");
            row.forEach(key => {
                const keyTile = document.createElement("div");
                keyTile.innerText = key;
                if (key === "Enter") {
                    keyTile.id = "Enter";
                    keyTile.classList.add("enter-key-tile");
                } else if (key === "⌫") {
                    keyTile.id = "Backspace";
                    keyTile.classList.add("key-tile");
                } else {
                    keyTile.id = "Key" + key;
                    keyTile.classList.add("key-tile");
                }
                keyTile.addEventListener("click", () => this.processInput({ code: keyTile.id }));
                keyboardRow.appendChild(keyTile);
            });
            document.body.appendChild(keyboardRow);
        });
    }
    setupEventListeners() {
        document.addEventListener("keyup", (e) => this.processInput(e));
    }
    processInput(e) {
        if (this.gameOver) return;
        if (("KeyA" <= e.code && e.code <= "KeyZ") || e.code === "KeyÇ") {
            this.addLetter(e.code === "KeyÇ" ? "Ç" : e.code[3]);
        } else if (e.code === "Backspace") {
            this.removeLetter();
        } else if (e.code === "Enter") {
            this.submitGuess();
        }
    }
    addLetter(letter) {
        if (this.col < this.width) {
            const tile = document.getElementById(`${this.row}-${this.col}`);
            if (!tile.innerText) {
                tile.innerText = letter;
                this.col++;
            }
        }
    }
    removeLetter() {
        if (this.col > 0) {
            this.col--;
            const tile = document.getElementById(`${this.row}-${this.col}`);
            tile.innerText = "";
        }
    }
    submitGuess() {
        const guess = Array.from({ length: this.width }, (_, i) => 
            document.getElementById(`${this.row}-${i}`).innerText
        ).join("");
        if (guess.length < this.width) {
            alert("Palavra muito curta!");
            return;
        }
        const normalizedGuess = this.normalizeWord(guess);
        if (!this.wordList.includes(normalizedGuess)) {
            alert("Palavra não encontrada na lista!");
            return;
        }
        this.checkGuess(normalizedGuess);
    }
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
            this.gameOver = true;
            setTimeout(() => {
                alert("Parabéns! Você acertou!");
                this.resetGame();
            }, 500);
        } else if (this.row === this.height) {
            this.gameOver = true;
            document.getElementById("answer").innerText = this.word;
            setTimeout(() => {
                alert("Fim de jogo! A palavra era: " + this.word);
                this.resetGame();
            }, 500);
        }
    }
    updateTile(tile, letter, status) {
        tile.classList.add(status);
        const keyTile = document.getElementById(`Key${letter}`);
        if (keyTile) {
            if (status === "correct") {
                keyTile.classList.remove("present");
                keyTile.classList.add("correct");
            } else if (status === "present" && !keyTile.classList.contains("correct")) {
                keyTile.classList.add("present");
            } else if (status === "absent" && !keyTile.classList.contains("correct") && !keyTile.classList.contains("present")) {
                keyTile.classList.add("absent");
            }
        }
    }
    resetGame() {
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
        this.gameOver = false;
        document.getElementById("answer").innerText = '';
        this.selectWord();
    }
}
window.onload = () => new TermoGame();