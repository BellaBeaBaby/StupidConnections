let gameState = {
    categories: [],
    selectedWords: [],
    solvedCategories: [],
    shuffledWords: [],
    gameCompleted: false,
    maxAttempts: 0,
    remainingAttempts: 0
};

// Theme handling
function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function showMenu() { 
    gameState.gameCompleted = false;
    showScreen('menu'); 
}

function showCreateGame() { showScreen('createGame'); }
function showEnterCode() { showScreen('enterCode'); }

function generateGameCode() {
    const gameData = {
        categories: []
    };

    for (let i = 1; i <= 4; i++) {
        const name = document.getElementById(`cat${i}-name`).value;
        const items = document.getElementById(`cat${i}-items`).value
            .split(',')
            .map(item => item.trim());

        if (!name || items.length !== 4) {
            alert('Please ensure each category has a name and exactly 4 comma-separated items');
            return;
        }

        gameData.categories.push({ name, items });
    }

    const maxAttempts = parseInt(document.getElementById('max-attempts').value) || 0;
    gameData.maxAttempts = maxAttempts;

    const gameCode = btoa(JSON.stringify(gameData));
    document.getElementById('gameCode').classList.remove('hidden');
    document.getElementById('generatedCode').value = gameCode;
}

function copyGameCode() {
    const codeElement = document.getElementById('generatedCode');
    codeElement.select();
    document.execCommand('copy');
}

function startGame() {
    const code = document.getElementById('codeInput').value;
    try {
        const gameData = JSON.parse(atob(code));
        gameState.categories = gameData.categories;
        gameState.selectedWords = [];
        gameState.solvedCategories = [];
        gameState.gameCompleted = false;
        gameState.maxAttempts = gameData.maxAttempts;
        gameState.remainingAttempts = gameData.maxAttempts || Infinity;
        const allWords = gameState.categories.flatMap(cat => cat.items);
        gameState.shuffledWords = shuffleArray(allWords);
        
        showScreen('gameBoard');
        renderGame();
    } catch (e) {
        alert('Invalid game code' + e);
    }
}

function renderGame() {
    const livesCounter = document.getElementById('livesCounter');
    if (gameState.remainingAttempts === Infinity) {
        livesCounter.textContent = 'Lives: Unlimited';
    } else {
        livesCounter.textContent = `Lives: ${gameState.remainingAttempts}`;
        livesCounter.style.color = gameState.remainingAttempts > 3 ? 'var(--success-color)' : 'var(--error-color)';
    };
    const completedCategoriesDiv = document.getElementById('completedCategories');
    completedCategoriesDiv.innerHTML = gameState.solvedCategories.map(category => `
        <div class="completed-category">
            <div class="category-name">${category.name}</div>
            <div class="category-items">${category.items.join(', ')}</div>
        </div>
    `).join('');

    const wordGridDiv = document.getElementById('wordGrid');
    
    if (gameState.gameCompleted) {
        // Clear the word grid instead of showing finish button
        wordGridDiv.innerHTML = '';
        
        // Hide submit and shuffle buttons
        const submitButton = document.querySelector('button[onclick="checkSelection()"]');
        const shuffleButton = document.querySelector('button[onclick="shuffleGrid()"]');
        
        if (submitButton) submitButton.style.display = 'none';
        if (shuffleButton) shuffleButton.style.display = 'none';
    } else {
        // Show submit and shuffle buttons
        const submitButton = document.querySelector('button[onclick="checkSelection()"]');
        const shuffleButton = document.querySelector('button[onclick="shuffleGrid()"]');
        
        if (submitButton) submitButton.style.display = '';
        if (shuffleButton) shuffleButton.style.display = '';

        const remainingWords = gameState.shuffledWords.filter(word => 
            !gameState.solvedCategories.some(cat => cat.items.includes(word))
        );

        wordGridDiv.innerHTML = remainingWords.map(word => `
            <button class="word-button" onclick="toggleWord('${word}')">
                ${word}
            </button>
        `).join('');

        gameState.selectedWords.forEach(word => {
            const button = Array.from(document.getElementsByClassName('word-button'))
                .find(btn => btn.textContent.trim() === word);
            if (button) button.classList.add('selected');
        });
    }
}

let messageQueue = []; // Queue to hold messages
let isMessageActive = false; // To track if a message is being displayed

async function showMessage(message, type = 'error') {
    // Add the message to the queue
    messageQueue.push({ message, type });

    // Process messages from the queue
    while (messageQueue.length > 0) {
        isMessageActive = true;
        const currentMessage = messageQueue.shift();

        const messageBox = document.getElementById('messageBox');
        messageBox.textContent = currentMessage.message;
        messageBox.className = currentMessage.type;
        messageBox.classList.add('message-fade');

        // Wait for the fade-in and fade-out animation
        await new Promise(resolve => setTimeout(resolve, 3000));

        messageBox.classList.remove('message-fade');
        messageBox.textContent = '';
    }
}

async function pasteText() {
    try {
        // Read clipboard content
        const clipboardText = await navigator.clipboard.readText();
        
        // Display the clipboard content
        document.getElementById('codeInput').value = clipboardText
      } catch (err) {
        // Handle errors, e.g., no clipboard access or permissions
        alert('Failed to read clipboard: ' + err)
      }
}

function toggleWord(word) {
    const index = gameState.selectedWords.indexOf(word);
    if (index === -1) {
        if (gameState.selectedWords.length >= 4) {
            showMessage('You can only select 4 words at a time');
            return;
        }
        gameState.selectedWords.push(word);
    } else {
        gameState.selectedWords.splice(index, 1);
    }
    renderGame();
}

function checkSelection() {
    if (gameState.selectedWords.length !== 4) {
        showMessage('Please select exactly 4 words');
        return;
    }

    const matchingCategory = gameState.categories.find(category =>
        category.items.every(item => gameState.selectedWords.includes(item)) &&
        !gameState.solvedCategories.find(solved => solved.name === category.name)
    );

    if (matchingCategory) {
        gameState.solvedCategories.push(matchingCategory);
        gameState.selectedWords = [];
        if (gameState.solvedCategories.length === 4) {
            gameState.gameCompleted = true;
            showMessage('Congratulations! You\'ve solved all categories!', 'success');
            renderGame();
        } else {
            showMessage('Category found!', 'success');
            renderGame();
        }
    } else {
        gameState.remainingAttempts--
        // Check if the selection is "one away" from a complete category
        const oneAwayCategory = gameState.categories.find(category => {
            const selectedCount = gameState.selectedWords.filter(word => category.items.includes(word)).length;
            return selectedCount === category.items.length - 1 && 
                   !gameState.solvedCategories.find(solved => solved.name === category.name);
        });

        if (oneAwayCategory) {
            showMessage('One away!', 'nearly');

        } else {
            showMessage('Invalid category. Try again!');
        }
        if (gameState.remainingAttempts <= 0) {
            showLostScreen();
        } else{
            gameState.selectedWords = [];
            renderGame();
        }
    }
}

function showLostScreen() {
    const answersDiv = document.getElementById('correctAnswers');
    answersDiv.innerHTML = gameState.categories.map(cat => `
        <div>
            <strong>${cat.name}</strong>: ${cat.items.join(', ')}
        </div>
    `).join('');
    showScreen('lostScreen');
}


function shuffleGrid() {
    gameState.shuffledWords = shuffleArray(gameState.shuffledWords);
    renderGame();
}

document.addEventListener('DOMContentLoaded', initTheme);