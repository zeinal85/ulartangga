// --- KONFIGURASI DAN STATE PERMAINAN ---

const BOARD_SIZE = 100;
let PLAYER_COUNT = 2;

const snakesAndLaddersMap = {
    2: 38, 6: 27, 29: 50, 41: 60, 51: 89, 66: 75, // Tangga
    36: 4, 34: 13, 67: 36, 83: 45, 61: 42, 74: 53, 94: 87 // Ular
};

// Variabel triggerCells yang sekarang berada di bagian konfigurasi global
const triggerCells = [3, 7, 11, 15, 18, 22, 25, 30, 32, 35, 40, 45, 48, 50, 55, 58, 60, 65, 70, 72, 79, 80, 85, 90, 92, 95, 98];

const playerColors = ['bg-red-700', 'bg-blue-700', 'bg-green-700', 'bg-yellow-700'];
const additionalPlayerColors = ['bg-purple-700', 'bg-orange-700'];

// Bank Soal Etika Digital - AKAN DIISI DARI URL EKSTERNAL
let questionBank = {};
// Pemetaan sel ke ID pertanyaan - AKAN DIBUAT SECARA DINAMIS
let cellQuestionMap = {};

// Bank Pesan Etika Digital untuk Ular dan Tangga - AKAN DIISI DARI URL EKSTERNAL
let ethicsMessages = { ladders: [], snakes: [] }; // Inisialisasi sebagai objek kosong yang akan diisi

// =====================================================================
// Menggunakan file questions.json yang ada di folder yang sama
// =====================================================================
const QUESTIONS_URL = './questions.json';

// =====================================================================
// Menggunakan file pesan.json yang ada di folder yang sama
// =====================================================================
const ETHICS_URL = './pesan.json';


// State (kondisi) permainan
let playerPositions;
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
const playerCountInput = document.getElementById('player-count-input');
const setPlayersBtn = document.getElementById('set-players-btn');
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
const feedbackText = document.getElementById('feedback-text');
const continueGameBtn = document.getElementById('continue-game-btn');

// Referensi elemen modal pesan etika digital baru
const ethicsMessageModal = document.getElementById('ethics-message-modal');
const ethicsMessageText = document.getElementById('ethics-message-text');
const closeEthicsMessageBtn = document.getElementById('close-ethics-message-btn');

// Referensi elemen baru: Bagian jumlah pemain dan tombol batal
const playerCountSection = document.getElementById('player-count-section');
const cancelRollBtn = document.getElementById('cancel-roll-btn');


// --- FUNGSI UTAMA PERMAINAN ---

/**
 * Menginisialisasi atau memulai ulang permainan.
 */
function initGame() {
    // Reset state permainan
    playerPositions = Array(PLAYER_COUNT).fill(0); // Posisi 0 = start
    currentPlayer = 0;
    gameActive = true;
    waitingForAnswer = false; // Pastikan ini direset
    consecutiveSixes = 0; // Reset penghitung angka 6

    // Reset state untuk fitur "Batalkan"
    previousPlayerPosition = Array(PLAYER_COUNT).fill(0);
    lastPlayerMoved = null;
    lastDiceRollResult = null;
    actionInProgress = false;


    // Bersihkan dan buat papan permainan
    board.innerHTML = '';
    playerPiecesContainer.innerHTML = '';
    createBoard(); // Pastikan createBoard dipanggil untuk membuat papan dan indikator
    createPlayerPieces();
    drawSnakesAndLadders();

    // Update UI ke kondisi awal
    updateAllPlayerPositionsUI();
    updateTurnInfo();
    rollDiceBtn.disabled = false;
    physicalDiceResultInput.disabled = false;
    submitPhysicalRollBtn.disabled = false;
    winnerModal.classList.remove('show'); // Sembunyikan modal pemenang
    questionModal.classList.remove('show'); // Sembunyikan modal pertanyaan
    ethicsMessageModal.classList.remove('show'); // Pastikan modal etika juga tersembunyi
    diceFace.innerHTML = `<span class="text-4xl font-bold text-slate-700">🎲</span>`;
    updateDiceUI(); // Panggil ini untuk menampilkan UI dadu yang benar saat inisialisasi

    // Tampilkan kembali bagian jumlah pemain saat game diinisialisasi ulang
    playerCountSection.classList.remove('hidden');
    cancelRollBtn.classList.add('hidden'); // Sembunyikan tombol batal saat inisialisasi
}

/**
 * Membuat 100 kotak (cell) secara dinamis di papan.
 * Angka 1 di kiri bawah, angka 100 di kiri atas, dalam pola zig-zag.
 */
function createBoard() {
    const cells = [];
    for (let i = 1; i <= BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = `cell-${i}`;
        cell.dataset.number = i;

        // Tambahkan indikator visual untuk sel pertanyaan
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

    // Sembunyikan bagian jumlah pemain saat dadu dikocok
    playerCountSection.classList.add('hidden');
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

    if (cellQuestionMap[playerPositions[currentPlayer]]) {
        waitingForAnswer = true;
        disableDiceButtons();
        cancelRollBtn.classList.add('hidden'); // Pastikan batal tersembunyi jika ada pertanyaan
        const questionId = cellQuestionMap[playerPositions[currentPlayer]];
        showQuestionModal(questionBank[questionId]);
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
        // Tombol batal tidak akan muncul di mode digital, jadi tidak perlu penyesuaian di sini.
    }
    actionInProgress = false; // Reset flag
}

/**
 * Event handler saat tombol "Submit Hasil Dadu" ditekan (untuk dadu fisik).
 */
async function handleSubmitPhysicalRoll() {
    if (!gameActive || waitingForAnswer || actionInProgress) return;
    actionInProgress = true; // Set flag bahwa aksi sedang berlangsung

    playerCountSection.classList.add('hidden');
    // Tombol batal seharusnya sudah terlihat karena di mode fisik (diatur di updateDiceUI)

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

    if (cellQuestionMap[playerPositions[currentPlayer]]) {
        waitingForAnswer = true;
        disableDiceButtons(); // nonaktifkan tombol dadu dan submit
        cancelRollBtn.classList.add('hidden'); // Sembunyikan tombol batal jika ada pertanyaan
        const questionId = cellQuestionMap[playerPositions[currentPlayer]];
        showQuestionModal(questionBank[questionId]);
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
            // Tombol batal tetap terlihat karena sudah diatur oleh updateDiceUI()
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
        await new Promise(resolve => setTimeout(resolve, 200));
        if (currentPos === BOARD_SIZE) break;
    }

    if (snakesAndLaddersMap[playerPositions[currentPlayer]]) {
        const destination = snakesAndLaddersMap[playerPositions[currentPlayer]];
        const isLadder = destination > playerPositions[currentPlayer];
        const action = isLadder ? "Naik Tangga" : "Turun Ular";
        infoPanelTitle.textContent = `Wow, ${action}!`;
        turnInfo.textContent = `Dari ${playerPositions[currentPlayer]} ke ${destination}.`;

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
        piece.style.bottom = '-5%';
        piece.style.left = `${5 + playerIndex * 8}%`;
        piece.style.transform = `translate(-50%, -50%)`;
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
        piece.style.transform = `translate(-50%, -50%)`;
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
        cancelRollBtn.classList.add('hidden'); // Sembunyikan tombol batal di mode digital
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

// --- FUNGSI MODAL PERTANYAAN ---

/**
 * Menampilkan modal pertanyaan dengan detail pertanyaan yang diberikan.
 * @param {object} questionData - Objek berisi data pertanyaan.
 */
function showQuestionModal(questionData) {
    questionText.textContent = questionData.question;
    questionOptions.innerHTML = '';
    questionInput.value = '';
    feedbackText.textContent = '';
    continueGameBtn.classList.add('hidden');
    submitAnswerBtn.classList.remove('hidden');

    if (questionData.type === 'text_input') {
        questionInput.classList.remove('hidden');
        questionInput.disabled = false;
        questionInput.focus();
        questionOptions.classList.add('hidden');
    } else {
        questionInput.classList.add('hidden');
        questionOptions.classList.remove('hidden');
    }

    if (questionData.options && questionData.options.length > 0) {
        questionData.options.forEach((option, index) => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="radio" name="question-option" value="${option}" class="form-radio h-4 w-4 text-blue-600">
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
    const currentQuestionId = cellQuestionMap[playerPositions[currentPlayer]];
    const currentQuestion = questionBank[currentQuestionId];
    let userAnswer;

    if (currentQuestion.type === 'text_input') {
        userAnswer = questionInput.value.trim();
    } else if (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') {
        const selectedOption = document.querySelector('input[name="question-option"]:checked');
        userAnswer = selectedOption ? selectedOption.value : '';
    }

    let isCorrect = false;
    if (currentQuestion.type === 'text_input') {
        isCorrect = userAnswer.toLowerCase() === currentQuestion.answer.toLowerCase();
    } else {
        isCorrect = userAnswer === currentQuestion.answer;
    }

    if (isCorrect) {
        feedbackText.textContent = "Benar! " + (currentQuestion.feedback || "") + " Anda maju 1 langkah!";
        feedbackText.classList.remove('text-red-500');
        feedbackText.classList.add('text-green-600');

        // Hadiah: Maju 1 langkah
        let newPosition = playerPositions[currentPlayer] + 1;
        // Pastikan tidak melebihi BOARD_SIZE
        playerPositions[currentPlayer] = Math.min(newPosition, BOARD_SIZE);
        updatePlayerPositionUI(currentPlayer); // Update posisi visual

    } else {
        feedbackText.textContent = `Salah. Jawaban yang benar adalah: ${currentQuestion.answer}. ` + (currentQuestion.feedback || "") + " Anda mundur 1 langkah!";
        feedbackText.classList.remove('text-green-600');
        feedbackText.classList.add('text-red-500');

        // Hukuman: Mundur 1 langkah
        let newPosition = playerPositions[currentPlayer] - 1;
        // Pastikan tidak kurang dari 0 (posisi start)
        playerPositions[currentPlayer] = Math.max(newPosition, 0);
        updatePlayerPositionUI(currentPlayer); // Update posisi visual
    }

    // Tambahkan jeda waktu di sini agar pemain sempat membaca umpan balik dan melihat pergerakan
    await new Promise(resolve => setTimeout(resolve, 1500)); // Jeda 1.5 detik

    submitAnswerBtn.classList.add('hidden');
    continueGameBtn.classList.remove('hidden');
    questionInput.disabled = true;
    document.querySelectorAll('input[name="question-option"]').forEach(radio => radio.disabled = true);
});

/**
 * Melanjutkan permainan setelah pertanyaan dijawab.
 */
continueGameBtn.addEventListener('click', () => {
    questionModal.classList.remove('show');
    waitingForAnswer = false;

    questionInput.value = '';
    questionInput.disabled = false;
    questionOptions.innerHTML = '';
    feedbackText.textContent = '';

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
});

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
 * Memuat pertanyaan dan pesan etika digital dari URL eksternal dan menginisialisasi game.
 */
async function loadGameContent() {
    infoPanelTitle.textContent = "Memuat Konten Game...";
    turnInfo.textContent = "Mohon tunggu (bank soal & etika digital dari database)..."; // Pesan loading diperbarui
    disableDiceButtons(); // Nonaktifkan tombol saat memuat

    try {
        // Mencoba memuat pertanyaan dari GitHub Gist
        const questionsResponse = await fetch(QUESTIONS_URL);
        if (!questionsResponse.ok) {
            throw new Error(`HTTP error! status: ${questionsResponse.status} for questions.`);
        }
        const questionsArray = await questionsResponse.json();

        questionBank = {};
        questionsArray.forEach(q => {
            questionBank[q.id] = q;
        });

        // Mencoba memuat pesan etika digital dari GitHub Gist
        const ethicsResponse = await fetch(ETHICS_URL);
        if (!ethicsResponse.ok) {
            throw new Error(`HTTP error! status: ${ethicsResponse.status} for ethics messages.`);
        }
        const ethicsData = await ethicsResponse.json();
        ethicsMessages.ladders = ethicsData.ladders;
        ethicsMessages.snakes = ethicsData.snakes;

        cellQuestionMap = {};
        if (questionsArray.length > 0) { // Hanya isi cellQuestionMap jika ada pertanyaan yang dimuat
            let questionIndex = 0;
            // Menggunakan triggerCells yang sudah dideklarasikan di bagian konfigurasi global di atas
            triggerCells.forEach(cellNum => {
                if (questionsArray[questionIndex] && questionBank[questionsArray[questionIndex].id]) {
                    cellQuestionMap[cellNum] = questionsArray[questionIndex].id;
                }
                questionIndex = (questionIndex + 1) % questionsArray.length;
            });
        }

        console.log("Bank Soal Dimuat dari database:", questionBank);
        console.log("Peta Sel Pertanyaan:", cellQuestionMap);
        console.log("Pesan Etika Digital Dimuat:", ethicsMessages);
        initGame();
        displayMessage("Siap Bermain!", "Konten game berhasil dimuat dari database."); // Pesan diperbarui

    } catch (error) {
        console.error("Gagal memuat konten game:", error);
        // Game tidak dapat dimulai tanpa pertanyaan jika tidak ada fallback
        gameActive = false;
        disableDiceButtons();

        infoPanelTitle.textContent = "Gagal Memuat Game!";
        turnInfo.textContent = "Game tidak dapat dimulai karena konten gagal dimuat dari database. Periksa URL Anda atau koneksi internet.";
        displayMessage("Error Fatal!", "Game tidak dapat dimulai karena konten gagal dimuat dari database. Periksa URL Anda atau koneksi internet.");
    }
}

// --- EVENT LISTENERS GLOBAL ---
rollDiceBtn.addEventListener('click', handleRollDiceDigital);
submitPhysicalRollBtn.addEventListener('click', handleSubmitPhysicalRoll);
restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);
cancelRollBtn.addEventListener('click', handleCancelRoll); // Tambahkan event listener untuk tombol batal

setPlayersBtn.addEventListener('click', () => {
    const desiredPlayers = parseInt(playerCountInput.value, 10);
    if (!isNaN(desiredPlayers) && desiredPlayers >= 2 && desiredPlayers <= 4) {
        PLAYER_COUNT = desiredPlayers;
        initGame();
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

// MULAI MEMUAT SOAL SAAT HALAMAN DIMUAT
document.addEventListener('DOMContentLoaded', loadGameContent);
