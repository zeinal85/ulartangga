// --- KONFIGURASI DAN STATE PERMAINAN ---

const BOARD_SIZE = 100;
let PLAYER_COUNT = 2;

const snakesAndLaddersMap = {
    2: 38, 6: 27, 29: 50, 41: 60, 51: 92, 66: 86, // Tangga
    36: 4, 34: 13, 67: 36, 83: 45, 61: 42, 74: 53, 94: 87 // Ular
};

// Variabel triggerCells yang sekarang berada di bagian konfigurasi global
// Ini adalah daftar sel di mana pertanyaan akan muncul.
const triggerCells = [3, 5, 7, 9, 11, 15, 21, 23, 25, 31, 39, 43, 44, 47, 48, 49, 54, 58, 65, 75, 77, 79, 80, 85, 88, 89, 91, 95, 96, 97, 98];

const playerColors = ['bg-red-700', 'bg-blue-700', 'bg-green-700', 'bg-yellow-700'];
const additionalPlayerColors = ['bg-purple-700', 'bg-orange-700'];

// Bank Soal dan Pesan Etika Digital - AKAN DIISI DARI FILE LOKAL
let questionBank = {}; // Objek untuk menyimpan pertanyaan berdasarkan ID
let ethicsMessages = { ladders: [], snakes: [] }; // Inisialisasi sebagai objek kosong yang akan diisi

// =====================================================================
// Konfigurasi URL untuk berbagai materi pelajaran.
// URL di sini sekarang menggunakan jalur relatif untuk mengakses file lokal
// dalam struktur folder yang Anda tunjukkan (folder 'soal' dan 'pesan'
// berada di level yang sama dengan 'ulartangga.js' dan 'index.html').
// =====================================================================
const materialConfigs = {
    'literasi_digital': {
        name: 'Literasi Digital',
        //questions_url: './soal/questions_etika.json', // Path relatif ke folder 'soal'
        //ethics_url: './pesan/pesan_etika.json'       // Path relatif ke folder 'pesan'
		questions_url: 'https://gist.githubusercontent.com/zeinal85/0b3249e8d4ce99fa4275825938104717/raw/ad72c429de8de3d74ca1095babadd8b71d7aade9/questions_etika.json',
        ethics_url: 'https://gist.githubusercontent.com/zeinal85/ef639b2b58b3d283e18e88d3b66b5dd6/raw/c359737f4eb9c86e0e2c98c9f0eb0d91628635ba/pesan_etika.json'

    },
    'sejarah': {
        name: 'Sejarah',
        //questions_url: './soal/questions_sejarah.json', // Path relatif ke folder 'soal'
        //ethics_url: './pesan/pesan_sejarah.json'       // Path relatif ke folder 'pesan'
		questions_url: 'https://gist.githubusercontent.com/zeinal85/1677a4fcc262bcc2d99ca50129a65fdd/raw/7565a2a04ba66fbfff234204bf29b81d6ac4c363/questions_sejarah.json', // GANTI DENGAN URL GIST ANDA
        ethics_url: 'https://gist.githubusercontent.com/zeinal85/d8ad6fa9b090a7aad29e3dc94e32cc46/raw/f2b1ed2cd4fb7e5face1a65ee330a38ae901a4ed/pesan_sejarah.json' // GANTI DENGAN URL GIST ANDA

    },
	'sains': {
		name: 'Sains',
		//questions_url: './soal/questions_sains.json',  // Path relatif ke folder 'soal'
		//ethics_url: './pesan/pesan_sains.json'        // Path relatif ke folder 'pesan'
		questions_url: 'https://gist.githubusercontent.com/zeinal85/f362d8552cecf3fdcb6947f25b6fc085/raw/91e88a0c3b86e8c4e80cc4c367d704964ef2d096/questions_sains.json',
		ethics_url: 'https://gist.githubusercontent.com/zeinal85/0d63740f50edbb2470e6d617648a32e9/raw/7cbf19aaa4592893f63fdce545c876764b3086ba/pesan_sains.json'

    },
    // Tambahkan materi lain di sini sesuai kebutuhan
};

// State untuk materi yang sedang dipilih. Default ke 'literasi_digital'.
let selectedMaterialKey = 'literasi_digital';


// State (kondisi) permainan
let playerPositions;
let playerScores; // Variabel baru untuk melacak skor pemain
let currentPlayer;
let gameActive;
let diceType = 'digital'; // Default ke dadu digital
let waitingForAnswer = false; // State baru untuk menunggu jawaban pertanyaan
let consecutiveSixes = 0; // State baru: Menghitung angka 6 berturut-turut

// State baru untuk fitur "Batalkan"
let previousPlayerPosition = Array(4).fill(0); // Menyimpan posisi pemain sebelumnya per pemain
let lastPlayerMoved = null; // Menyimpan indeks pemain yang terakhir bergerak sebelum gerakan
let lastDiceRollResult = null; // Menyimpan hasil dadu terakhir yang menggerakkan pemain
let actionInProgress = false; // Mencegah interaksi saat animasi atau modal aktif

// Variabel baru untuk menyimpan langkah yang tertunda dari pertanyaan
let pendingQuestionMoveSteps = 0;
// Variabel untuk menyimpan data pertanyaan saat ini yang sedang ditampilkan di modal
let currentQuestionData = null;

// Objek Tone.js untuk efek suara langkah
const stepSynth = new Tone.Synth({
    oscillator: {
        type: "sine"
    },
    envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.01,
        release: 0.1
    }
}).toDestination();


// --- REFERENSI ELEMEN DOM ---

const board = document.getElementById('game-board');
const playerPiecesContainer = document.getElementById('player-pieces-container');
const rollDiceBtn = document.getElementById('roll-dice-btn');
const restartBtn = document.getElementById('restart-btn');
const diceFace = document.getElementById('dice-face');
const turnInfo = document.getElementById('turn-info');
const infoPanelTitle = document.querySelector('#info-panel h2');
const winnerModal = document.getElementById('winner-modal');
const winnerText = document.getElementById('winner-text');
const playAgainBtn = document.getElementById('play-again-btn');

// Referensi elemen UI pengaturan awal
const playerCountInputSetup = document.getElementById('player-count-input-setup'); // Input jumlah pemain di layar setup
const materialSelect = document.getElementById('material-select'); // Dropdown pilihan materi
const startGameBtn = document.getElementById('start-game-btn'); // Tombol "Mulai Permainan"

// Referensi untuk mengelola visibilitas layar
const gameSetupScreen = document.getElementById('game-setup-screen');
const mainGameScreen = document.getElementById('main-game-screen');


const gameContainer = document.getElementById('game-container');
const diceTypeRadios = document.querySelectorAll('input[name="dice-type"]');
const physicalDiceInputContainer = document.getElementById('physical-dice-input-container');
const physicalDiceResultInput = document.getElementById('physical-dice-result');
const submitPhysicalRollBtn = document.getElementById('submit-physical-roll-btn');

// Referensi elemen modal pertanyaan
const questionModal = document.getElementById('question-modal');
const questionText = document.getElementById('question-text');
const questionOptions = document.getElementById('question-options');
const questionInput = document.getElementById('question-input');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
// feedbackText dan continueGameBtn DIPINDAHKAN ke modal baru
// const feedbackText = document.getElementById('feedback-text');
// const continueGameBtn = document.getElementById('continue-game-btn');

// Referensi elemen modal feedback BARU
const feedbackModal = document.getElementById('feedback-modal');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackMessage = document.getElementById('feedback-message');
const closeFeedbackBtn = document.getElementById('close-feedback-btn');

// Referensi elemen modal pesan etika digital baru
const ethicsMessageModal = document.getElementById('ethics-message-modal');
const ethicsMessageText = document.getElementById('ethics-message-text');
const closeEthicsMessageBtn = document.getElementById('close-ethics-message-btn');

// Referensi elemen baru: Bagian jumlah pemain dan tombol batal
// playerCountSection tidak lagi digunakan secara langsung, diganti oleh gameSetupScreen
const cancelRollBtn = document.getElementById('cancel-roll-btn');

// Referensi elemen tombol fullscreen
const fullscreenBtn = document.getElementById('fullscreen-btn');

// Referensi elemen untuk menampilkan skor pemain (BARU)
const playerScoresDisplay = document.getElementById('player-scores-display');


// --- FUNGSI UTAMA PERMAINAN ---

/**
 * Fungsi untuk memainkan suara langkah bidak.
 */
function playMoveSound() {
    stepSynth.triggerAttackRelease("C5", "8n"); // Mainkan nada C5 singkat
}

/**
 * Menginisialisasi atau memulai ulang permainan.
 * Kini juga memuat konten game berdasarkan materi yang dipilih.
 */
async function initGame() {
    // Memulai Tone.js audio context pada interaksi pertama
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log("Audio context dimulai.");
    }

    // Sembunyikan layar setup, tampilkan layar utama game
    gameSetupScreen.classList.add('hidden');
    mainGameScreen.classList.remove('hidden');

    // Reset state permainan
    playerPositions = Array(PLAYER_COUNT).fill(0); // Posisi 0 = start
    playerScores = Array(PLAYER_COUNT).fill(0); // Inisialisasi skor pemain (BARU)
    currentPlayer = 0;
    gameActive = true;
    waitingForAnswer = false; // Pastikan ini direset
    consecutiveSixes = 0; // Reset penghitung angka 6

    // Reset state untuk fitur "Batalkan"
    previousPlayerPosition = Array(PLAYER_COUNT).fill(0);
    lastPlayerMoved = null; // Ini akan memastikan tombol batal tersembunyi di awal
    lastDiceRollResult = null;
    actionInProgress = false;
    pendingQuestionMoveSteps = 0; // Reset langkah tertunda
    currentQuestionData = null; // Reset data pertanyaan

    // Bersihkan dan buat papan permainan
    board.innerHTML = '';
    playerPiecesContainer.innerHTML = '';
    createBoard(); // Pastikan createBoard dipanggil untuk membuat papan dan indikator
    createPlayerPieces();
    drawSnakesAndLadders();

    // PENTING: Memuat konten game setelah pengaturan pemain dan materi dipilih
    await loadGameContent(selectedMaterialKey);

    // Update UI ke kondisi awal setelah konten dimuat dan game siap
    updateAllPlayerPositionsUI();
    updateTurnInfo(); // Ini akan mengontrol visibilitas tombol batal dan menampilkan giliran pemain
    updateScoresUI(); // Perbarui tampilan skor (BARU)
    rollDiceBtn.disabled = false;
    physicalDiceResultInput.disabled = false;
    submitPhysicalRollBtn.disabled = false;
    winnerModal.classList.remove('show'); // Sembunyikan modal pemenang
    questionModal.classList.remove('show'); // Sembunyikan modal pertanyaan
    ethicsMessageModal.classList.remove('show'); // Pastikan modal etika juga tersembunyi
    feedbackModal.classList.remove('show'); // Pastikan modal feedback juga tersembunyi
    diceFace.innerHTML = `<span class="text-4xl font-bold text-slate-700">🎲</span>`;
    updateDiceUI(); // Panggil ini untuk menampilkan UI dadu yang benar saat inisialisasi

    // Fokus ke papan permainan setelah memulai game dengan sedikit delay
    setTimeout(() => {
        gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50); // Delay 50ms untuk memastikan elemen sudah dirender
}

/**
 * Membuat 100 kotak (cell) secara dinamis di papan.
 */
function createBoard() {
    const cells = [];
    for (let i = 1; i <= BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = `cell-${i}`;
        cell.dataset.number = i;

        // Tambahkan indikator visual untuk sel pertanyaan
        // Indikator tetap ada di triggerCells, namun pertanyaannya akan diacak saat mendarat
        if (triggerCells.includes(i)) {
            cell.classList.add('question-cell-indicator'); // Class baru untuk styling
            const questionIcon = document.createElement('span');
            questionIcon.textContent = '❓'; // Emoji tanda tanya
            questionIcon.classList.add('absolute', 'top-1', 'left-1', 'text-xl', 'opacity-75'); // Gaya dasar Tailwind
            cell.appendChild(questionIcon);
        }

        cells.push(cell);
    }

    for (let logicalRow = 10; logicalRow >= 1; logicalRow--) {
        const startNum = (logicalRow - 1) * 10 + 1;
        const endNum = logicalRow * 10;

        let rowCells = [];
        if (logicalRow % 2 !== 0) {
            for (let i = startNum; i <= endNum; i++) {
                rowCells.push(cells[i - 1]);
            }
        } else {
            for (let i = endNum; i >= startNum; i--) {
                rowCells.push(cells[i - 1]);
            }
        }

        rowCells.forEach(cell => board.appendChild(cell));
    }
}

/**
 * Membuat bidak untuk setiap pemain.
 */
function createPlayerPieces() {
    playerPiecesContainer.innerHTML = '';
    for (let i = 0; i < PLAYER_COUNT; i++) {
        const piece = document.createElement('div');
        piece.id = `player-${i}`;
        const allColors = [...playerColors, ...additionalPlayerColors];
        const colorClass = allColors[i % allColors.length];
        piece.classList.add('player-piece', colorClass);
        piece.textContent = `P${i + 1}`;
        playerPiecesContainer.appendChild(piece);
    }
}

/**
 * Menggambar ular dan tangga di papan.
 * Fungsi ini sekarang dikosongkan karena gambar akan disediakan melalui background.
 */
function drawSnakesAndLadders() {
    const container = document.getElementById('snakes-ladders-container');
    container.innerHTML = '';
}

/**
 * Event handler saat tombol "Kocok Dadu" ditekan (untuk dadu digital).
 */
async function handleRollDiceDigital() {
    if (!gameActive || waitingForAnswer || actionInProgress) return;
    actionInProgress = true; // Set flag bahwa aksi sedang berlangsung

    // Memulai Tone.js audio context pada interaksi pertama
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log("Audio context dimulai dari rollDiceBtn.");
    }

    cancelRollBtn.classList.add('hidden'); // Selalu sembunyikan tombol batal untuk dadu digital

    gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    rollDiceBtn.disabled = true;
    diceFace.classList.add('rolling');

    await new Promise(resolve => setTimeout(resolve, 300));

    const diceResult = Math.floor(Math.random() * 6) + 1;

    diceFace.innerHTML = `<span class="text-4xl font-bold text-slate-700">${diceResult}</span>`;
    diceFace.classList.remove('rolling');

    infoPanelTitle.textContent = `Pemain ${currentPlayer + 1} dapat ${diceResult}`;

    // Simpan state sebelum bergerak untuk fitur "Batalkan"
    lastPlayerMoved = currentPlayer;
    previousPlayerPosition[currentPlayer] = playerPositions[currentPlayer];
    lastDiceRollResult = diceResult; // Simpan hasil dadu terakhir

    // Logika angka 6 berturut-turut
    if (diceResult === 6) {
        consecutiveSixes++;
    } else {
        consecutiveSixes = 0; // Reset jika bukan 6
    }

    await movePlayer(diceResult);

    if (!gameActive) {
        actionInProgress = false; // Reset flag
        return;
    }

    // Cek apakah pemain mendarat di sel pemicu pertanyaan
    if (triggerCells.includes(playerPositions[currentPlayer])) {
        waitingForAnswer = true;
        disableDiceButtons();
        cancelRollBtn.classList.add('hidden'); // Pastikan batal tersembunyi jika ada pertanyaan
        
        // Pilih pertanyaan secara acak dari questionBank
        const questionIds = Object.keys(questionBank);
        if (questionIds.length > 0) {
            const randomQuestionId = questionIds[Math.floor(Math.random() * questionIds.length)];
            currentQuestionData = questionBank[randomQuestionId]; // Simpan data pertanyaan yang dipilih
            showQuestionModal(currentQuestionData);
        } else {
            console.warn("Tidak ada pertanyaan yang tersedia di questionBank. Melanjutkan permainan.");
            // Lanjutkan permainan jika tidak ada pertanyaan
            waitingForAnswer = false;
            switchPlayer();
            updateDiceUI();
            updateTurnInfo();
        }
    } else {
        // Jika hasil dadu bukan 6, ATAU jika sudah mendapatkan 6 sebanyak 3 kali berturut-turut
        if (diceResult !== 6 || consecutiveSixes >= 3) {
            switchPlayer();
            consecutiveSixes = 0; // Reset penghitung untuk pemain berikutnya
            updateDiceUI(); // Re-enable dice buttons for the new player
            updateTurnInfo();
        } else { // Pemain dapat giliran lagi (dapat 6, kurang dari 3x berturut-turut)
            infoPanelTitle.textContent = `Pemain ${currentPlayer + 1} dapat giliran lagi! (${consecutiveSixes}x 6 beruntun)`;
            turnInfo.textContent = "Silakan kocok dadu lagi.";
            rollDiceBtn.disabled = false; // Biarkan tombol dadu digital aktif
        }
    }
    actionInProgress = false; // Reset flag
}

/**
 * Event handler saat tombol "Submit Hasil Dadu" ditekan (untuk dadu fisik).
 */
async function handleSubmitPhysicalRoll() {
    if (!gameActive || waitingForAnswer || actionInProgress) return;
    actionInProgress = true; // Set flag bahwa aksi sedang berlangsung

    // Memulai Tone.js audio context pada interaksi pertama
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log("Audio context dimulai dari submitPhysicalRollBtn.");
    }

    const diceResult = parseInt(physicalDiceResultInput.value, 10);

    // Validasi input: Pastikan angka antara 1 dan 6.
    if (isNaN(diceResult) || diceResult < 1 || diceResult > 6) {
        displayMessage("Input Tidak Valid!", "Hasil dadu harus angka antara 1 dan 6.");
        physicalDiceResultInput.disabled = false; // Biarkan input aktif agar bisa dikoreksi
        submitPhysicalRollBtn.disabled = false; // Biarkan submit aktif
        actionInProgress = false; // Reset flag
        return; // Hentikan proses, pemain harus mengoreksi input
    }

    gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    diceFace.innerHTML = `<span class="text-4xl font-bold text-slate-700">${diceResult}</span>`;

    infoPanelTitle.textContent = `Pemain ${currentPlayer + 1} memasukkan ${diceResult}`;

    // Simpan state sebelum bergerak untuk fitur "Batalkan"
    lastPlayerMoved = currentPlayer;
    previousPlayerPosition[currentPlayer] = playerPositions[currentPlayer];
    lastDiceRollResult = diceResult; // Simpan hasil dadu terakhir

    // Logika angka 6 berturut-turut
    if (diceResult === 6) {
        consecutiveSixes++;
    } else {
        consecutiveSixes = 0; // Reset jika bukan 6
    }

    disableDiceButtons(); // Nonaktifkan tombol dadu setelah submit, tombol batal tidak terpengaruh

    await movePlayer(diceResult); // Pindahkan bidak

    if (!gameActive) {
        actionInProgress = false; // Reset flag
        return;
    }

    // Cek apakah pemain mendarat di sel pemicu pertanyaan
    if (triggerCells.includes(playerPositions[currentPlayer])) {
        waitingForAnswer = true;
        disableDiceButtons(); // nonaktifkan tombol dadu dan submit
        cancelRollBtn.classList.add('hidden'); // Sembunyikan tombol batal jika ada pertanyaan
        
        // Pilih pertanyaan secara acak dari questionBank
        const questionIds = Object.keys(questionBank);
        if (questionIds.length > 0) {
            const randomQuestionId = questionIds[Math.floor(Math.random() * questionIds.length)];
            currentQuestionData = questionBank[randomQuestionId]; // Simpan data pertanyaan yang dipilih
            showQuestionModal(currentQuestionData);
        } else {
            console.warn("Tidak ada pertanyaan yang tersedia di questionBank. Melanjutkan permainan.");
            // Lanjutkan permainan jika tidak ada pertanyaan
            waitingForAnswer = false;
            switchPlayer();
            updateDiceUI();
            updateTurnInfo();
        }
    } else {
        // Jika hasil dadu bukan 6, ATAU jika sudah mendapatkan 6 sebanyak 3 kali berturut-turut
        if (diceResult !== 6 || consecutiveSixes >= 3) {
            switchPlayer();
            consecutiveSixes = 0; // Reset penghitung untuk pemain berikutnya
            updateDiceUI(); // Re-enable dice buttons for the new player
            updateTurnInfo();
        } else { // Pemain dapat giliran lagi (dapat 6, kurang dari 3x berturut-turut)
            infoPanelTitle.textContent = `Pemain ${currentPlayer + 1} dapat giliran lagi! (${consecutiveSixes}x 6 beruntun)`;
            turnInfo.textContent = "Silakan masukkan hasil dadu lagi.";
            physicalDiceResultInput.disabled = false;
            submitPhysicalRollBtn.disabled = false;
            physicalDiceResultInput.value = '';
        }
    }
    actionInProgress = false; // Reset flag
}

/**
 * Fungsi untuk menonaktifkan semua tombol dan input dadu.
 * Tombol 'Batalkan' tidak dinonaktifkan oleh fungsi ini.
 */
function disableDiceButtons() {
    rollDiceBtn.disabled = true;
    physicalDiceResultInput.disabled = true;
    submitPhysicalRollBtn.disabled = true;
}

/**
 * Memindahkan bidak pemain sesuai hasil dadu.
 * @param {number} steps - Angka dari dadu.
 */
async function movePlayer(steps) {
    let currentPos = playerPositions[currentPlayer];
    let targetPosition = currentPos + steps;

    if (targetPosition > BOARD_SIZE) {
        displayMessage("Angka Terlalu Besar!", "Hasil dadu harus pas 100!");
        // Jika langkah tidak valid, batalkan penyimpanan state untuk "Batalkan"
        lastPlayerMoved = null;
        previousPlayerPosition[currentPlayer] = 0; // Reset ke default
        lastDiceRollResult = null;
        updateDiceUI(); // Mengaktifkan kembali input dadu fisik/digital
        return;
    }

    for (let i = 1; i <= steps; i++) {
        currentPos++;
        playerPositions[currentPlayer] = currentPos;
        updatePlayerPositionUI(currentPlayer);
        playMoveSound(); // Mainkan suara setiap kali bidak bergerak satu langkah
        await new Promise(resolve => setTimeout(resolve, 200));
        if (currentPos === BOARD_SIZE) break;
    }

    if (snakesAndLaddersMap[playerPositions[currentPlayer]]) {
        const destination = snakesAndLaddersMap[playerPositions[currentPlayer]];
        const isLadder = destination > playerPositions[currentPlayer];
        const action = isLadder ? "Naik Tangga" : "Turun Ular";
        infoPanelTitle.textContent = `Wow, ${action}!`;
        turnInfo.textContent = `Dari ${playerPositions[currentPlayer]} ke ${destination}.`;

        // Logika baru: Jika bidak naik tangga dan posisi sebelumnya adalah 0
        // (artinya bidak bergerak dari luar papan dan langsung naik tangga)
        if (isLadder && previousPlayerPosition[currentPlayer] === 0) {
            console.log(`DEBUG: Player ${currentPlayer + 1} moved from 0 and hit a ladder. Hiding cancel button.`);
            lastPlayerMoved = null; // Menghilangkan kemampuan untuk membatalkan
        }

        // Pindahkan bidak ke posisi ular/tangga
        playerPositions[currentPlayer] = destination;
        await new Promise(resolve => setTimeout(resolve, 600));
        updatePlayerPositionUI(currentPlayer);

        // Tampilkan pesan etika digital
        let ethicsMsg;
        if (isLadder) {
            ethicsMsg = ethicsMessages.ladders[Math.floor(Math.random() * ethicsMessages.ladders.length)];
        } else {
            ethicsMsg = ethicsMessages.snakes[Math.floor(Math.random() * ethicsMessages.snakes.length)];
        }
        await showEthicsMessageModal(ethicsMsg);
    }

    if (playerPositions[currentPlayer] === BOARD_SIZE) {
        endGame();
    }
}

/**
 * Mengganti giliran pemain.
 */
function switchPlayer() {
    currentPlayer = (currentPlayer + 1) % PLAYER_COUNT;
    updateTurnInfo();
    updateScoresUI(); // Perbarui tampilan skor saat giliran berganti
}

/**
 * Mengakhiri permainan dan menampilkan pemenang.
 */
function endGame() {
    gameActive = false;
    disableDiceButtons();
    winnerModal.classList.add('show');
    winnerText.textContent = `Pemain ${currentPlayer + 1} Menang!`;
}

/**
 * Fungsi utilitas untuk menampilkan pesan di info panel.
 * @param {string} title - Judul pesan.
 * @param {string} message - Isi pesan.
 */
function displayMessage(title, message) {
    const infoPanel = document.getElementById('info-panel');
    const originalText = turnInfo.textContent;
    const originalTitle = infoPanelTitle.textContent;

    infoPanelTitle.textContent = title;
    turnInfo.textContent = message;
    infoPanel.classList.add('bg-red-200');

    setTimeout(() => {
        infoPanelTitle.textContent = originalTitle;
        turnInfo.textContent = originalText;
        infoPanel.classList.remove('bg-red-200');
    }, 3000);
}


// --- FUNGSI UNTUK UPDATE TAMPILAN (UI) ---

/**
 * Mengupdate informasi giliran di panel.
 */
function updateTurnInfo() {
    infoPanelTitle.textContent = `Giliran Pemain ${currentPlayer + 1}`;
    if (!waitingForAnswer) {
        let dicePrompt = '';
        if (diceType === 'digital') {
            dicePrompt = 'kocok dadu';
            cancelRollBtn.classList.add('hidden'); // Selalu sembunyikan di mode digital
        } else {
            dicePrompt = 'masukkan hasil dadu fisik';
            // Tampilkan tombol batal hanya jika ada langkah sebelumnya yang bisa dibatalkan
            if (lastPlayerMoved !== null) {
                cancelRollBtn.classList.remove('hidden');
            } else {
                cancelRollBtn.classList.add('hidden');
            }
        }
        turnInfo.textContent = `Silakan ${dicePrompt}.`;
    } else { // waitingForAnswer is true (modal sedang aktif)
        turnInfo.textContent = "Jawab pertanyaan untuk melanjutkan!";
        cancelRollBtn.classList.add('hidden'); // Selalu sembunyikan jika modal aktif
    }
}


/**
 * Memperbarui posisi visual SEMUA bidak (dipakai saat inisialisasi).
 */
function updateAllPlayerPositionsUI() {
    for (let i = 0; i < PLAYER_COUNT; i++) {
        updatePlayerPositionUI(i);
    }
}

/**
 * Memperbarui posisi visual satu bidak pemain.
 * @param {number} playerIndex - Indeks pemain yang akan diupdate.
 */
function updatePlayerPositionUI(playerIndex) {
    const piece = document.getElementById(`player-${playerIndex}`);
    const position = playerPositions[playerIndex];

    if (position === 0) {
        // Mengembalikan posisi bidak start ke konfigurasi yang Anda inginkan
        piece.style.bottom = '-5%'; // Posisi bidak di garis tepi bawah papan
        piece.style.left = `${5 + playerIndex * 8}%`; // Posisi horizontal bidak
        piece.style.transform = `translate(-50%, -50%)`; // Memusatkan bidak relatif terhadap posisinya
        return;
    }

    const targetCell = document.getElementById(`cell-${position}`);
    if (targetCell) {
        const cellRect = targetCell.getBoundingClientRect();
        const gameContainerRect = document.getElementById('game-container').getBoundingClientRect();

        const centerX = (cellRect.left + cellRect.width / 2 - gameContainerRect.left);
        const centerY = (cellRect.top + cellRect.height / 2 - gameContainerRect.top);

        let finalX = centerX;
        let finalY = centerY;

        const playersAtCurrentPositionIndices = [];
        for (let i = 0; i < PLAYER_COUNT; i++) {
            if (playerPositions[i] === position) {
                playersAtCurrentPositionIndices.push(i);
            }
        }
        const numPlayersOnCell = playersAtCurrentPositionIndices.length;

        if (numPlayersOnCell > 1) {
            const pieceWidth = piece.offsetWidth;
            const spacing = pieceWidth * (numPlayersOnCell > 2 ? 0.5 : 0.7);

            const currentPieceIndexInGroup = playersAtCurrentPositionIndices.indexOf(playerIndex);

            finalX = centerX + (currentPieceIndexInGroup - (numPlayersOnCell - 1) / 2) * spacing;
        }

        piece.style.left = `${finalX}px`;
        piece.style.top = `${finalY}px`;
        piece.style.transform = `translate(-50%, -50%)`; // Tetap memusatkan bidak di dalam sel
    }
}

/**
 * Mengatur visibilitas tombol dadu berdasarkan tipe dadu yang dipilih.
 * Juga mengaktifkan kembali tombol dadu.
 */
function updateDiceUI() {
    if (diceType === 'digital') {
        rollDiceBtn.classList.remove('hidden');
        rollDiceBtn.disabled = false;
        physicalDiceInputContainer.classList.add('hidden');
        cancelRollBtn.classList.add('hidden'); // Selalu sembunyikan di mode digital
    } else { // diceType is 'physical'
        rollDiceBtn.classList.add('hidden');
        physicalDiceInputContainer.classList.remove('hidden');
        physicalDiceResultInput.value = '';
        physicalDiceResultInput.disabled = false;
        submitPhysicalRollBtn.disabled = false;
        // Tampilkan tombol batal hanya jika ada langkah sebelumnya yang bisa dibatalkan
        if (lastPlayerMoved !== null) {
            cancelRollBtn.classList.remove('hidden');
        } else {
            cancelRollBtn.classList.add('hidden');
        }
    }
}

/**
 * Memperbarui tampilan skor pemain di UI. (BARU)
 */
function updateScoresUI() {
    if (playerScoresDisplay) {
        let scoreText = '';
        for (let i = 0; i < PLAYER_COUNT; i++) {
            scoreText += `P${i + 1}: ${playerScores[i]} Poin${i < PLAYER_COUNT - 1 ? ' | ' : ''}`;
        }
        playerScoresDisplay.textContent = scoreText;
    }
}


// --- FUNGSI MODAL PERTANYAAN ---

/**
 * Menampilkan modal pertanyaan dengan detail pertanyaan yang diberikan.
 * @param {object} questionData - Objek berisi data pertanyaan.
 */
function showQuestionModal(questionData) {
    questionText.textContent = questionData.question;
    questionOptions.innerHTML = '';
    questionInput.value = '';
    // feedbackText.textContent = ''; // Dipindahkan ke modal feedback
    // continueGameBtn.classList.add('hidden'); // Dipindahkan ke modal feedback
    submitAnswerBtn.classList.remove('hidden');

    if (questionData.type === 'text_input') {
        questionInput.classList.remove('hidden');
        questionInput.disabled = false;
        questionInput.focus();
        questionOptions.classList.add('hidden');
    } else { // Termasuk 'multiple_choice', 'true_false', dan yang lainnya
        questionInput.classList.add('hidden');
        questionOptions.classList.remove('hidden');
    }

    // Menggunakan tipe "multiple_choice_multi_select" untuk menentukan checkbox
    if (questionData.options && questionData.options.length > 0) {
        const inputType = (questionData.type === 'multiple_choice_multi_select') ? 'checkbox' : 'radio';
        questionData.options.forEach((option, index) => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="${inputType}" name="question-option" value="${option}" class="form-${inputType} h-4 w-4 text-blue-600">
                <span class="ml-2">${option}</span>
            `;
            questionOptions.appendChild(label);
            label.querySelector('input').disabled = false;
        });
    }

    questionModal.classList.add('show');
    updateTurnInfo();
    disableDiceButtons(); // Nonaktifkan tombol dadu/submit
    cancelRollBtn.classList.add('hidden'); // Sembunyikan tombol batal saat modal aktif
}

/**
 * Menangani submit jawaban pertanyaan.
 */
submitAnswerBtn.addEventListener('click', async () => {
    // Gunakan currentQuestionData yang sudah disimpan saat showQuestionModal dipanggil
    const currentQuestion = currentQuestionData;
    if (!currentQuestion) {
        console.error("ERROR: currentQuestionData tidak ditemukan saat submit jawaban.");
        return;
    }

    let userAnswer;

    if (currentQuestion.type === 'text_input') {
        userAnswer = questionInput.value.trim();
    } else if (currentQuestion.type === 'multiple_choice_multi_select') {
        // Kumpulkan semua jawaban yang dipilih dari checkbox
        userAnswer = Array.from(document.querySelectorAll('input[name="question-option"]:checked'))
                        .map(checkbox => checkbox.value);
    } else { // 'multiple_choice' atau 'true_false'
        const selectedOption = document.querySelector('input[name="question-option"]:checked');
        userAnswer = selectedOption ? selectedOption.value : '';
    }

    let isCorrect = false;
    let feedbackMessageText = "";

    // Logika pemeriksaan jawaban yang diperbarui
    if (currentQuestion.type === 'text_input') {
        // Untuk text_input, 'answer' bisa berupa string tunggal atau array string
        if (Array.isArray(currentQuestion.answer)) {
            const normalizedUserAnswer = userAnswer.toLowerCase();
            isCorrect = currentQuestion.answer.some(ans => ans.toLowerCase() === normalizedUserAnswer);
        } else {
            isCorrect = userAnswer.toLowerCase() === currentQuestion.answer.toLowerCase();
        }
    } else if (currentQuestion.type === 'multiple_choice_multi_select') {
        // Untuk multi-select, 'answer' HARUS berupa array
        if (Array.isArray(currentQuestion.answer)) {
            // Cek apakah semua jawaban yang benar dipilih DAN tidak ada jawaban salah yang dipilih
            const correctAnswers = currentQuestion.answer.map(ans => ans.toLowerCase());
            const selectedAnswers = userAnswer.map(ans => ans.toLowerCase());
            
            // Semua jawaban yang benar harus ada di jawaban yang dipilih pengguna
            const allCorrectSelected = correctAnswers.every(ans => selectedAnswers.includes(ans));
            // Jumlah jawaban yang dipilih harus sama dengan jumlah jawaban yang benar
            const sameCount = selectedAnswers.length === correctAnswers.length;

            isCorrect = allCorrectSelected && sameCount;
        } else {
            // Jika answer di JSON bukan array untuk multi-select, ini adalah error data
            console.error("ERROR: Tipe 'multiple_choice_multi_select' membutuhkan 'answer' berupa array.");
            isCorrect = false;
        }
    } else { // 'multiple_choice' atau 'true_false'
        isCorrect = userAnswer === currentQuestion.answer;
    }

    if (isCorrect) {
        feedbackMessageText = "Benar! " + (currentQuestion.feedback || "") + " Anda maju 1 langkah!";
        pendingQuestionMoveSteps = 1; // Simpan langkah maju
        
        // --- BAGIAN BARU UNTUK MENAMBAH POIN ---
        if (currentQuestion.points) { // Pastikan properti points ada di data pertanyaan
            playerScores[currentPlayer] += currentQuestion.points;
            feedbackMessageText += ` Anda mendapatkan ${currentQuestion.points} poin!`;
            updateScoresUI(); // Perbarui tampilan skor
        }
        // --- AKHIR BAGIAN BARU ---

    } else {
        feedbackMessageText = `Salah. Jawaban yang benar adalah: ${Array.isArray(currentQuestion.answer) ? currentQuestion.answer.join(" / ") : currentQuestion.answer}. ` + (currentQuestion.feedback || "") + " Anda mundur 1 langkah!";
        pendingQuestionMoveSteps = -1; // Simpan langkah mundur
    }

    submitAnswerBtn.classList.add('hidden');
    // continueGameBtn.classList.remove('hidden'); // Dipindahkan ke modal feedback
    questionInput.disabled = true;
    document.querySelectorAll('input[name="question-option"]').forEach(input => input.disabled = true);

    // TUTUP MODAL PERTANYAAN, LALU TAMPILKAN MODAL FEEDBACK
    questionModal.classList.remove('show');
    await showFeedbackModal(isCorrect ? "Jawaban Benar!" : "Jawaban Salah!", feedbackMessageText, pendingQuestionMoveSteps);
});

// continueGameBtn.addEventListener('click', async () => { /* Logic ini sekarang ada di showFeedbackModal */ });


// --- FUNGSI MODAL FEEDBACK PERTANYAAN BARU ---
/**
 * Menampilkan modal feedback setelah pertanyaan dijawab.
 * @param {string} title - Judul feedback (misal: "Jawaban Benar!" atau "Jawaban Salah!").
 * @param {string} message - Detail pesan feedback.
 * @param {number} moveSteps - Jumlah langkah yang akan diambil setelah feedback (positif untuk maju, negatif untuk mundur).
 */
async function showFeedbackModal(title, message, moveSteps) {
    feedbackTitle.textContent = title;
    feedbackMessage.textContent = message;

    if (moveSteps > 0) {
        feedbackTitle.classList.remove('text-red-500');
        feedbackTitle.classList.add('text-green-600');
        feedbackMessage.classList.remove('text-red-500');
        feedbackMessage.classList.add('text-green-600');
    } else if (moveSteps < 0) {
        feedbackTitle.classList.remove('text-green-600');
        feedbackTitle.classList.add('text-red-500');
        feedbackMessage.classList.remove('text-green-600');
        feedbackMessage.classList.add('text-red-500');
    } else {
        feedbackTitle.classList.remove('text-green-600', 'text-red-500');
        feedbackMessage.classList.remove('text-green-600', 'text-red-500');
        feedbackTitle.classList.add('text-slate-800'); // Warna default
        feedbackMessage.classList.add('text-slate-700'); // Warna default
    }

    feedbackModal.classList.add('show');
    waitingForAnswer = true; // Tetap anggap sedang menunggu jawaban hingga modal feedback ditutup
    cancelRollBtn.classList.add('hidden'); // Sembunyikan tombol batal saat modal aktif

    return new Promise(resolve => {
        closeFeedbackBtn.onclick = async () => {
            feedbackModal.classList.remove('show');
            waitingForAnswer = false; // Lanjutkan permainan

            // Lakukan pergerakan bidak berdasarkan pendingQuestionMoveSteps setelah modal tertutup
            if (moveSteps !== 0) {
                let newPosition = playerPositions[currentPlayer] + moveSteps;
                // Pastikan posisi tidak melebihi BOARD_SIZE atau kurang dari 0
                playerPositions[currentPlayer] = Math.min(Math.max(newPosition, 0), BOARD_SIZE);
                updatePlayerPositionUI(currentPlayer); // Update posisi visual
                await new Promise(resolveMove => setTimeout(resolveMove, 500)); // Beri jeda singkat untuk animasi bidak
            }
            
            // Reset elemen modal pertanyaan
            questionInput.value = '';
            questionInput.disabled = false;
            questionOptions.innerHTML = '';
            currentQuestionData = null; // Reset data pertanyaan setelah digunakan

            // Jika hasil dadu terakhir bukan 6, ATAU jika sudah mendapatkan 6 sebanyak 3 kali berturut-turut
            if (lastDiceRollResult !== 6 || consecutiveSixes >= 3) {
                switchPlayer();
                consecutiveSixes = 0; // Reset penghitung 6 untuk pemain berikutnya
                lastPlayerMoved = null; // Reset setelah giliran beralih atau selesai
                lastDiceRollResult = null; // Reset hasil dadu terakhir
            } else { // Pemain dapat giliran lagi (dapat 6, kurang dari 3x berturut-turut)
                infoPanelTitle.textContent = `Pemain ${currentPlayer + 1} dapat giliran lagi! (${consecutiveSixes}x 6 beruntun)`;
                turnInfo.textContent = "Silakan kocok dadu lagi.";
            }
            updateDiceUI(); // Aktifkan tombol dadu kembali sesuai tipe, yang juga akan mengelola visibilitas tombol batal
            resolve();
        };
    });
}


// --- FUNGSI MODAL PESAN ETIKA DIGITAL BARU ---
/**
 * Menampilkan modal pesan etika digital.
 * @param {string} message - Pesan etika digital yang akan ditampilkan.
 */
async function showEthicsMessageModal(message) {
    ethicsMessageText.textContent = message;
    ethicsMessageModal.classList.add('show');
    waitingForAnswer = true; // Menghentikan permainan sementara
    cancelRollBtn.classList.add('hidden'); // Selalu sembunyikan tombol batal saat modal etika muncul

    return new Promise(resolve => {
        closeEthicsMessageBtn.onclick = () => {
            ethicsMessageModal.classList.remove('show');
            waitingForAnswer = false; // Lanjutkan permainan
            updateDiceUI(); // Perbarui UI dadu (termasuk tombol batal) setelah modal ditutup
            resolve();
        };
    });
}

// --- FUNGSI BARU UNTUK TOMBOL "BATALKAN" ---
async function handleCancelRoll() {
    // Memeriksa apakah game aktif, tidak sedang menunggu jawaban, ada langkah yang bisa dibatalkan, dan tidak ada aksi lain berlangsung
    if (!gameActive || waitingForAnswer || lastPlayerMoved === null || actionInProgress) {
        return;
    }
    actionInProgress = true; // Set flag bahwa aksi sedang berlangsung

    // Tampilkan pesan pembatalan
    infoPanelTitle.textContent = `Pembatalan Gerakan!`;
    turnInfo.textContent = `Pemain ${lastPlayerMoved + 1} kembali ke posisi sebelumnya.`;

    // Kembalikan posisi pemain yang terakhir bergerak
    playerPositions[lastPlayerMoved] = previousPlayerPosition[lastPlayerMoved];
    updatePlayerPositionUI(lastPlayerMoved);

    // Beri jeda singkat untuk melihat pergerakan kembali
    await new Promise(resolve => setTimeout(resolve, 500));

    // Kembalikan giliran ke pemain yang langkahnya dibatalkan
    currentPlayer = lastPlayerMoved;
    consecutiveSixes = 0; // Reset consecutiveSixes karena langkah dibatalkan

    // Reset state untuk fitur "Batalkan"
    lastPlayerMoved = null; // Reset agar tidak bisa dibatalkan lagi
    lastDiceRollResult = null; // Reset hasil dadu terakhir setelah dibatalkan

    updateTurnInfo(); // Perbarui informasi giliran
    updateDiceUI(); // Aktifkan kembali tombol dadu dan kelola visibilitas tombol batal
    actionInProgress = false; // Reset flag
}


// --- FUNGSI MEMUAT KONTEN GAME DARI URL EKSTERNAL ---
/**
 * Memuat pertanyaan dan pesan etika digital dari URL eksternal berdasarkan materi yang dipilih.
 * @param {string} materialKey - Kunci materi yang dipilih dari materialConfigs.
 */
async function loadGameContent(materialKey) {
    const config = materialConfigs[materialKey];
    if (!config) {
        console.error(`ERROR: Konfigurasi materi '${materialKey}' tidak ditemukan.`);
        displayMessage("Error Konfigurasi!", `Materi '${materialKey}' tidak ditemukan. Mohon pilih materi yang valid.`);
        gameActive = false;
        disableDiceButtons();
        // Kembali ke layar setup jika ada error konfigurasi
        mainGameScreen.classList.add('hidden');
        gameSetupScreen.classList.remove('hidden');
        return;
    }

    infoPanelTitle.textContent = `Memuat Konten ${config.name}...`;
    turnInfo.textContent = "Mohon tunggu (memuat bank soal dan pesan)..."; 
    disableDiceButtons();

    try {
        // Mencoba memuat pertanyaan
        const questionsResponse = await fetch(config.questions_url);
        if (!questionsResponse.ok) {
            throw new Error(`HTTP error! status: ${questionsResponse.status} for questions from ${config.questions_url}.`);
        }
        const questionsArray = await questionsResponse.json();

        questionBank = {};
        questionsArray.forEach(q => {
            questionBank[q.id] = q;
        });

        // Mencoba memuat pesan etika digital
        const ethicsResponse = await fetch(config.ethics_url);
        if (!ethicsResponse.ok) {
            throw new Error(`HTTP error! status: ${ethicsResponse.status} for ethics messages from ${config.ethics_url}.`);
        }
        const ethicsData = await ethicsResponse.json();
        // PERBAIKAN TYPO: 'laddles' menjadi 'ladders'
        ethicsMessages.ladders = ethicsData.ladders; 
        ethicsMessages.snakes = ethicsData.snakes;

        // cellQuestionMap tidak lagi diisi dengan pertanyaan tetap
        // Pertanyaan akan dipilih acak saat pemain mendarat di triggerCell.
        let cellQuestionMap = {}; // Ini tetap dideklarasikan tapi tidak digunakan untuk pemetaan statis.

        console.log(`Bank Soal (${config.name}) Dimuat:`, questionBank);
        console.log("Peta Sel Pertanyaan (tidak lagi statis):", cellQuestionMap);
        console.log(`Pesan Etika Digital (${config.name}) Dimuat:`, ethicsMessages);
        
        // Pesan sukses dihilangkan dari sini agar tidak menimpa updateTurnInfo
        // yang akan dipanggil setelah ini di initGame().

    } catch (error) {
        console.error("Gagal memuat konten game:", error);
        // Game tidak dapat dimulai tanpa pertanyaan jika tidak ada fallback
        gameActive = false;
        disableDiceButtons();

        infoPanelTitle.textContent = "Gagal Memuat Game!";
        turnInfo.textContent = `Game tidak dapat dimulai karena konten gagal dimuat untuk materi ${config.name}. Periksa URL Anda atau koneksi internet.`;
        displayMessage("Error Fatal!", `Game tidak dapat dimulai karena konten gagal dimuat untuk materi ${config.name}. Periksa URL Anda atau koneksi internet.`);
        // Kembali ke layar setup jika ada error loading
        mainGameScreen.classList.add('hidden');
        gameSetupScreen.classList.remove('hidden');
    }
}

// --- FUNGSI FULLSCREEN ---
/**
 * Mengaktifkan atau menonaktifkan mode layar penuh.
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // Jika tidak dalam mode layar penuh, minta layar penuh
        const element = document.documentElement; // Mengambil elemen <html>
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { /* Chrome, Safari, dan Opera */
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE/Edge */
            document.msRequestFullscreen();
        }
    } else {
        // Jika dalam mode layar penuh, keluar dari layar penuh
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari, dan Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    }
    // Setelah permintaan fullscreen (baik masuk atau keluar), fokus ke papan permainan dengan sedikit delay
    setTimeout(() => {
        gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50); // Delay 50ms untuk memastikan elemen sudah dirender
}

// --- EVENT LISTENERS GLOBAL ---
rollDiceBtn.addEventListener('click', handleRollDiceDigital);
submitPhysicalRollBtn.addEventListener('click', handleSubmitPhysicalRoll);
cancelRollBtn.addEventListener('click', handleCancelRoll); // Tambahkan event listener untuk tombol batal
fullscreenBtn.addEventListener('click', toggleFullscreen); // Event listener untuk tombol fullscreen baru

// Event listener untuk tombol Restart
restartBtn.addEventListener('click', () => {
    // Ketika restart, kembali ke layar setup
    mainGameScreen.classList.add('hidden');
    gameSetupScreen.classList.remove('hidden');
    initSetupScreen(); // Panggil fungsi untuk menginisialisasi ulang setup screen
});

// Event listener untuk tombol Play Again
playAgainBtn.addEventListener('click', () => {
    // Ketika play again, kembali ke layar setup
    winnerModal.classList.remove('show');
    mainGameScreen.classList.add('hidden');
    gameSetupScreen.classList.remove('hidden');
    initSetupScreen(); // Panggil fungsi untuk menginisialisasi ulang setup screen
});

// Event listener untuk tombol "Mulai Permainan" di layar setup
startGameBtn.addEventListener('click', async () => {
    // Memulai Tone.js audio context pada interaksi pertama
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log("Audio context dimulai dari startGameBtn.");
    }

    const desiredPlayers = parseInt(playerCountInputSetup.value, 10); // Ambil dari input layar setup
    const selectedMaterial = materialSelect.value; // Dapatkan nilai materi yang dipilih

    if (!isNaN(desiredPlayers) && desiredPlayers >= 2 && desiredPlayers <= 4) {
        PLAYER_COUNT = desiredPlayers;
        selectedMaterialKey = selectedMaterial; // Simpan materi yang dipilih
        initGame(); // Memulai game dengan pengaturan baru
        toggleFullscreen(); // Memanggil fungsi fullscreen setelah game dimulai
    } else {
        displayMessage("Input Tidak Valid!", "Jumlah pemain harus antara 2 dan 4.");
    }
});

diceTypeRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        diceType = event.target.value;
        updateDiceUI();
        updateTurnInfo();
    });
});

window.addEventListener('resize', () => {
    updateAllPlayerPositionsUI();
});

/**
 * Fungsi untuk menginisialisasi layar setup game.
 * Dipanggil saat halaman dimuat dan saat game dimulai ulang/dimainkan lagi.
 */
function initSetupScreen() {
    // Pastikan layar setup terlihat dan layar game tersembunyi
    gameSetupScreen.classList.remove('hidden');
    mainGameScreen.classList.add('hidden');

    // Mengisi opsi dropdown materi
    materialSelect.innerHTML = ''; // Bersihkan opsi yang ada
    for (const key in materialConfigs) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = materialConfigs[key].name; 
        materialSelect.appendChild(option);
    }
    // Set opsi yang dipilih ke materi default atau yang terakhir dipilih
    materialSelect.value = selectedMaterialKey; 

    // Reset input jumlah pemain ke nilai default
    playerCountInputSetup.value = 2;

    // Reset info panel di layar game (jika terlihat)
    infoPanelTitle.textContent = "Siap Bermain!";
    turnInfo.textContent = "Atur jumlah pemain dan pilih materi.";
}

// Inisialisasi layar setup saat DOM dimuat
document.addEventListener('DOMContentLoaded', initSetupScreen);
