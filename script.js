let gameState = {
    categories: [],
    selectedWords: [],
    solvedCategories: [],
    shuffledWords: [] // New property to store shuffled words
};

// Theme handling
function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Changed default to dark
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

function showMenu() { showScreen('menu'); }
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
        
        // Get all words and shuffle them initially
        const allWords = gameState.categories.flatMap(cat => cat.items);
        gameState.shuffledWords = shuffleArray(allWords);
        
        showScreen('gameBoard');
        renderGame();
    } catch (e) {
        alert('Invalid game code');
    }
}

function renderGame() {
    // Render completed categories
    const completedCategoriesDiv = document.getElementById('completedCategories');
    completedCategoriesDiv.innerHTML = gameState.solvedCategories.map(category => `
        <div class="completed-category">
            <div class="category-name">${category.name}</div>
            <div class="category-items">${category.items.join(', ')}</div>
        </div>
    `).join('');

    // Get remaining words from shuffled array
    const remainingWords = gameState.shuffledWords.filter(word => 
        !gameState.solvedCategories.some(cat => cat.items.includes(word))
    );

    // Render word grid
    const wordGridDiv = document.getElementById('wordGrid');
    wordGridDiv.innerHTML = remainingWords.map(word => `
        <button class="word-button" onclick="toggleWord('${word}')">
            ${word}
        </button>
    `).join('');

    // Update selected state
    gameState.selectedWords.forEach(word => {
        const button = Array.from(document.getElementsByClassName('word-button'))
            .find(btn => btn.textContent.trim() === word);
        if (button) button.classList.add('selected');
    });
}


function showMessage(message, type = 'error') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = type;
    messageBox.classList.add('message-fade');
    
    // Remove the fade class after animation completes
    setTimeout(() => {
        messageBox.classList.remove('message-fade');
        messageBox.textContent = '';
    }, 3000);
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

    // Check if selected words form a valid category
    const matchingCategory = gameState.categories.find(category =>
        category.items.every(item => gameState.selectedWords.includes(item)) &&
        !gameState.solvedCategories.find(solved => solved.name === category.name)
    );

    if (matchingCategory) {
        gameState.solvedCategories.push(matchingCategory);
        gameState.selectedWords = [];
        if (gameState.solvedCategories.length === 4) {
            showMessage('Congratulations! You\'ve solved all categories!', 'success');
            setTimeout(() => showMenu(), 2000);
        } else {
            showMessage('Category found!', 'success');
            renderGame();
        }
    } else {
        showMessage('Invalid category. Try again!');
        gameState.selectedWords = [];
        renderGame();
    }
}

function shuffleGrid() {
    gameState.shuffledWords = shuffleArray(gameState.shuffledWords);
    renderGame();
}

// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', initTheme);