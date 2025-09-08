// Horror Trivia Game Logic

class HorrorTriviaGame {
  constructor() {
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.correctAnswers = 0;
    this.currentQuestion = null;
    this.gameQuestions = [];
    this.timer = null;
    this.nextQuestionTimer = null;
    this.timeLeft = 30;
    this.maxTime = 30;
    this.isAnswered = false;
    this.sessionId = this.generateSessionId();
    this.gameStartTime = null;
    
    // Contest mode properties
    this.isContestMode = false;
    this.contestLink = null;
    this.contestPlayer = null;
    
    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    // Screens
    this.startScreen = document.getElementById('startScreen');
    this.contestLinkScreen = document.getElementById('contestLinkScreen');
    this.questionScreen = document.getElementById('questionScreen');
    this.answerScreen = document.getElementById('answerScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    
    // Start screen elements
    this.startButton = document.getElementById('startGame');
    
    // Question screen elements
    this.currentQuestionSpan = document.getElementById('currentQuestion');
    this.timeLeftSpan = document.getElementById('timeLeft');
    this.currentScoreSpan = document.getElementById('currentScore');
    this.timerFill = document.getElementById('timerFill');
    this.questionImage = document.getElementById('questionImage');
    this.questionText = document.getElementById('questionText');
    this.optionButtons = document.querySelectorAll('.option-button');
    this.totalScoreDisplay = document.getElementById('totalScore');
    this.stopButton = document.getElementById('stopGame');
    
    // Answer screen elements
    this.resultIcon = document.getElementById('resultIcon');
    this.resultText = document.getElementById('resultText');
    this.correctAnswerText = document.getElementById('correctAnswerText');
    this.explanationText = document.getElementById('explanationText');
    this.pointsEarned = document.getElementById('pointsEarned');
    this.nextButton = document.getElementById('nextQuestion');
    
    // Game over screen elements
    this.finalScore = document.getElementById('finalScore');
    this.scoreMessage = document.getElementById('scoreMessage');
    this.playAgainButton = document.getElementById('playAgain');
  }

  bindEvents() {
    this.startButton.addEventListener('click', () => this.startGame());
    this.playAgainButton.addEventListener('click', () => this.restartGame());
    this.stopButton.addEventListener('click', () => this.stopGame());
    
    // Contest mode events
    const contestModeButton = document.getElementById('contestMode');
    if (contestModeButton) {
      contestModeButton.addEventListener('click', () => this.showContestMode());
    }
    
    const validateLinkButton = document.getElementById('validateLink');
    if (validateLinkButton) {
      validateLinkButton.addEventListener('click', () => this.validateContestLink());
    }
    

    
    // Suggestion form events
    const suggestButton = document.getElementById('suggestQuestion');
    if (suggestButton) {
      suggestButton.addEventListener('click', () => this.showSuggestionForm());
    }
    
    const suggestionForm = document.getElementById('suggestionForm');
    if (suggestionForm) {
      suggestionForm.addEventListener('submit', (e) => this.handleSuggestionSubmit(e));
    }
    
    // Option button events
    this.optionButtons.forEach(button => {
      button.addEventListener('click', (e) => this.selectAnswer(e));
    });
  }

  async startGame() {
    try {
      // Show loading state
      this.startButton.disabled = true;
      this.startButton.textContent = 'Loading Questions...';
      
      // Fetch initial batch of questions from database
      console.log('Fetching questions from API...');
      const response = await fetch('/api/trivia/questions?limit=20&approved=true&random=true');
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      this.gameQuestions = await response.json();
      
      console.log(`Loaded ${this.gameQuestions.length} questions for the game`);
      console.log('First question sample:', this.gameQuestions[0]);
      
      if (this.gameQuestions.length === 0) {
        throw new Error('No questions available');
      }
      
      this.currentQuestionIndex = 0;
      this.totalScore = 0;
      this.correctAnswers = 0;
      this.gameStartTime = Date.now();
      this.updateTotalScore();
      this.showScreen(this.questionScreen);
      this.loadQuestion();
      
      // Track game start
      this.trackGameStart();
      
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions. Please try again.');
    } finally {
      // Reset button
      this.startButton.disabled = false;
      this.startButton.textContent = 'Start Game';
    }
  }

  async loadQuestion() {
    console.log('=== LOAD QUESTION METHOD CALLED ===');
    console.log('Current question index:', this.currentQuestionIndex);
    console.log('Game questions length:', this.gameQuestions.length);
    console.log(`Loading question ${this.currentQuestionIndex + 1} of ${this.gameQuestions.length}`);
    
    // If we're running low on questions, fetch more
    if (this.currentQuestionIndex >= this.gameQuestions.length - 5) {
      await this.fetchMoreQuestions();
    }
    
    if (this.currentQuestionIndex >= this.gameQuestions.length) {
      console.log('Game ending - no more questions available');
      this.endGame();
      return;
    }

    this.currentQuestion = this.gameQuestions[this.currentQuestionIndex];
    this.isAnswered = false;
    this.timeLeft = this.maxTime;
    
    // Update question counter
    this.currentQuestionSpan.textContent = this.currentQuestionIndex + 1;
    
    // Load question content
    console.log('Loading question:', this.currentQuestion);
    console.log('Question text element:', this.questionText);
    console.log('Question text content:', this.currentQuestion.question);
    
    if (!this.questionText) {
      console.error('questionText element not found!');
      return;
    }
    this.questionText.textContent = this.currentQuestion.question;
    console.log('Set question text to:', this.questionText.textContent);
    
    // Load image with error handling
    if (this.questionImage) {
      this.questionImage.onerror = () => {
        // If external image fails, fall back to placeholder
        this.questionImage.src = 'images/skeletonquestion.png';
      };
      this.questionImage.src = this.currentQuestion.image_url || 'images/skeletonquestion.png';
    } else {
      console.error('questionImage element not found!');
    }
    
    // Load options (handle both array and JSON string formats)
    let options = this.currentQuestion.options;
    console.log('Raw options:', options);
    
    // If no options field, create from correct_answer and wrong_answers
    if (!options && this.currentQuestion.correct_answer && this.currentQuestion.wrong_answers) {
      options = [this.currentQuestion.correct_answer, ...this.currentQuestion.wrong_answers];
      // Shuffle the options
      options = this.shuffleArray(options);
      console.log('Created options from correct_answer and wrong_answers:', options);
    }
    
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
        console.log('Parsed options:', options);
      } catch (e) {
        console.error('Error parsing options:', e);
        options = [];
      }
    }
    
    console.log('Final options to display:', options);
    options.forEach((option, index) => {
      const optionText = document.getElementById(`option${index}`);
      if (!optionText) {
        console.error(`option${index} element not found!`);
        return;
      }
      optionText.textContent = option;
      
      // Reset button styles
      const button = this.optionButtons[index];
      if (button) {
        button.className = 'option-button';
        button.disabled = false;
      } else {
        console.error(`option button ${index} not found!`);
      }
    });
    
    // Start timer
    this.startTimer();
  }

  startTimer() {
    this.updateTimerDisplay();
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();
      
      if (this.timeLeft <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    this.timeLeftSpan.textContent = this.timeLeft;
    this.currentScoreSpan.textContent = this.calculateCurrentScore();
    
    // Update timer bar
    const percentage = (this.timeLeft / this.maxTime) * 100;
    this.timerFill.style.width = `${percentage}%`;
    
    // Change color based on time remaining
    if (this.timeLeft <= 5) {
      this.timerFill.style.background = 'var(--accent-red)';
    } else if (this.timeLeft <= 10) {
      this.timerFill.style.background = 'var(--accent-orange)';
    } else {
      this.timerFill.style.background = 'var(--accent-green)';
    }
  }

  calculateCurrentScore() {
    return Math.max(1, Math.floor((this.timeLeft / this.maxTime) * 10));
  }

  selectAnswer(event) {
    if (this.isAnswered) return;
    
    this.isAnswered = true;
    clearInterval(this.timer);
    
    const selectedButton = event.currentTarget;
    const selectedIndex = parseInt(selectedButton.dataset.option);
    
    // Handle options (could be array or JSON string)
    let options = this.currentQuestion.options;
    
    // If no options field, create from correct_answer and wrong_answers (same as loadQuestion)
    if (!options && this.currentQuestion.correct_answer && this.currentQuestion.wrong_answers) {
      options = [this.currentQuestion.correct_answer, ...this.currentQuestion.wrong_answers];
      // Shuffle the options (same as loadQuestion)
      options = this.shuffleArray(options);
    }
    
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        console.error('Error parsing options:', e);
        options = [];
      }
    }
    
    if (!options || !options[selectedIndex]) {
      console.error('Options not available for answer selection');
      return;
    }
    
    const selectedAnswer = options[selectedIndex];
    const isCorrect = selectedAnswer === this.currentQuestion.correct_answer;
    
    // Calculate score
    const pointsEarned = isCorrect ? this.calculateCurrentScore() : 0;
    this.totalScore += pointsEarned;
    
    // Track correct answers
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    // Track question response
    this.trackQuestionResponse(selectedAnswer, isCorrect, pointsEarned);
    
    // Show answer feedback
    this.showAnswerFeedback(selectedIndex, isCorrect, pointsEarned);
  }

  showAnswerFeedback(selectedIndex, isCorrect, pointsEarned) {
    // Disable all buttons
    this.optionButtons.forEach(button => {
      button.disabled = true;
    });
    
    // Highlight correct and incorrect answers
    this.optionButtons.forEach((button, index) => {
      const optionText = button.querySelector('.option-text').textContent;
      
      if (optionText === this.currentQuestion.correct_answer) {
        button.classList.add('correct');
      } else if (index === selectedIndex && !isCorrect) {
        button.classList.add('incorrect');
      }
    });
    
    // Wait a moment then show answer screen
    setTimeout(() => {
      this.showAnswerScreen(isCorrect, pointsEarned);
    }, 1500);
  }

  showAnswerScreen(isCorrect, pointsEarned) {
    // Update answer screen content
    this.resultIcon.className = `result-icon ${isCorrect ? 'correct' : 'incorrect'}`;
    this.resultText.textContent = isCorrect ? 'CORRECT!' : 'INCORRECT!';
    this.resultText.className = `result-text ${isCorrect ? 'correct' : 'incorrect'}`;
    this.correctAnswerText.textContent = this.currentQuestion.correct_answer;
    this.explanationText.textContent = this.currentQuestion.explanation || '';
    this.pointsEarned.textContent = pointsEarned;
    
    this.showScreen(this.answerScreen);
    
    // Start the countdown timer for next question
    this.startNextQuestionCountdown();
  }

  startNextQuestionCountdown() {
    const timerElement = document.getElementById('nextQuestionTimer');
    let countdown = 10;
    
    // Clear any existing timer
    if (this.nextQuestionTimer) {
      clearInterval(this.nextQuestionTimer);
    }
    
    // Update timer display immediately
    timerElement.textContent = countdown;
    
    // Start countdown
    this.nextQuestionTimer = setInterval(() => {
      countdown--;
      timerElement.textContent = countdown;
      
      if (countdown <= 0) {
        clearInterval(this.nextQuestionTimer);
        this.nextQuestion();
      }
    }, 1000);
  }

  async nextQuestion() {
    // Clear the countdown timer if it's still running
    if (this.nextQuestionTimer) {
      clearInterval(this.nextQuestionTimer);
    }
    
    this.currentQuestionIndex++;
    this.updateTotalScore();
    this.showScreen(this.questionScreen);
    await this.loadQuestion();
  }

  timeUp() {
    if (!this.isAnswered) {
      this.isAnswered = true;
      clearInterval(this.timer);
      
      // Show answer feedback with 0 points
      this.showAnswerFeedback(-1, false, 0);
    }
  }

  endGame() {
    // Clear any running timers
    if (this.nextQuestionTimer) {
      clearInterval(this.nextQuestionTimer);
    }
    
    this.showScreen(this.gameOverScreen);
    this.finalScore.textContent = this.totalScore;
    this.scoreMessage.textContent = this.getScoreMessage();
    
    // Track game end
    this.trackGameEnd();
  }

  stopGame() {
    if (confirm('Are you sure you want to stop the game? Your current score will be saved.')) {
      clearInterval(this.timer);
      if (this.nextQuestionTimer) {
        clearInterval(this.nextQuestionTimer);
      }
      this.endGame();
    }
  }

  getScoreMessage() {
    const maxPossible = this.gameQuestions.length * 10;
    const percentage = (this.totalScore / maxPossible) * 100;
    
    if (percentage >= 90) {
      return "🎃 AMAZING! You're a true horror master! 🎃";
    } else if (percentage >= 70) {
      return "👻 Great job! You really know your horror! 👻";
    } else if (percentage >= 50) {
      return "💀 Not bad! You've got some horror knowledge! 💀";
    } else if (percentage >= 30) {
      return "🦇 Keep watching! Your horror education continues! 🦇";
    } else {
      return "😱 Time to binge some horror classics! 😱";
    }
  }

  restartGame() {
    // Clear any running timers
    if (this.nextQuestionTimer) {
      clearInterval(this.nextQuestionTimer);
    }
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.correctAnswers = 0;
    this.showScreen(this.startScreen);
  }

  showScreen(screen) {
    // Hide all screens
    [this.startScreen, this.contestLinkScreen, this.questionScreen, this.answerScreen, this.gameOverScreen].forEach(s => {
      s.classList.remove('active');
    });
    
    // Show target screen
    screen.classList.add('active');
  }

  updateTotalScore() {
    const currentMaxPossibleScore = this.currentQuestionIndex * 10;
    const scoreText = `${this.correctAnswers} out of ${this.currentQuestionIndex} - Score ${this.totalScore} out of ${currentMaxPossibleScore}`;
    this.totalScoreDisplay.textContent = scoreText;
  }

  // Fetch more questions when running low
  async fetchMoreQuestions() {
    try {
      console.log('Fetching more questions...');
      const response = await fetch('/api/trivia/questions?limit=20&approved=true&random=true');
      if (!response.ok) {
        throw new Error('Failed to fetch more questions');
      }
      
      const newQuestions = await response.json();
      this.gameQuestions = this.gameQuestions.concat(newQuestions);
      console.log(`Added ${newQuestions.length} more questions. Total: ${this.gameQuestions.length}`);
      
    } catch (error) {
      console.error('Error fetching more questions:', error);
    }
  }

  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Track game start
  async trackGameStart() {
    try {
      await fetch('/api/trivia/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_game',
          data: {
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            ipAddress: 'unknown' // We can't get IP from client-side
          }
        })
      });
    } catch (error) {
      console.error('Failed to track game start:', error);
    }
  }

  // Track game end
  async trackGameEnd() {
    try {
      const maxPossibleScore = this.gameQuestions.length * 10;
      await fetch('/api/trivia/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_game',
          data: {
            sessionId: this.sessionId,
            totalScore: this.totalScore,
            questionsAnswered: this.currentQuestionIndex,
            correctAnswers: this.correctAnswers,
            maxPossibleScore: maxPossibleScore
          }
        })
      });
    } catch (error) {
      console.error('Failed to track game end:', error);
    }
  }

  // Track question response
  async trackQuestionResponse(selectedAnswer, isCorrect, pointsEarned) {
    try {
      const timeTaken = this.maxTime - this.timeLeft;
      await fetch('/api/trivia/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'question_response',
          data: {
            sessionId: this.sessionId,
            questionId: this.currentQuestion.id,
            selectedAnswer: selectedAnswer,
            correctAnswer: this.currentQuestion.correct_answer,
            isCorrect: isCorrect,
            timeTaken: timeTaken,
            pointsEarned: pointsEarned
          }
        })
      });
    } catch (error) {
      console.error('Failed to track question response:', error);
    }
  }

  // Suggestion form methods
  showSuggestionForm() {
    // Check if user is a member
    const memberToken = localStorage.getItem('horror4ever_member_token');
    const memberName = localStorage.getItem('horror4ever_member_name');
    
    if (!memberToken || !memberName) {
      // Not a member - redirect to member auth page
      window.location.href = 'member-auth.html';
      return;
    }
    
    // Is a member - show suggestion form
    this.showScreen(document.getElementById('suggestionScreen'));
    this.displayMemberInfo();
  }

  // Display member information in the form
  displayMemberInfo() {
    const memberName = localStorage.getItem('horror4ever_member_name');
    const memberIcon = localStorage.getItem('horror4ever_member_icon');
    
    const memberDisplayName = document.getElementById('memberDisplayName');
    if (memberDisplayName) {
      memberDisplayName.textContent = memberName;
      if (memberIcon) {
        memberDisplayName.innerHTML = `<img src="${memberIcon}" alt="${memberName}" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 5px;">${memberName}`;
      }
    }
  }

  async handleSuggestionSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const memberToken = localStorage.getItem('horror4ever_member_token');
    const memberName = localStorage.getItem('horror4ever_member_name');
    const memberIcon = localStorage.getItem('horror4ever_member_icon') || '';
    
    if (!memberToken || !memberName) {
      alert('Member session expired. Please log in again.');
      window.location.href = 'member-auth.html';
      return;
    }
    
    // Handle image file upload
    const imageFile = formData.get('questionImage');
    let imageUrl = 'images/skeletonquestion.png'; // Default placeholder
    
    if (imageFile && imageFile.size > 0) {
      try {
        // Convert file to base64
        const base64 = await this.fileToBase64(imageFile);
        imageUrl = base64;
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Using default placeholder.');
      }
    }
    
    const suggestionData = {
      question: formData.get('question'),
      correctAnswer: formData.get('correctAnswer'),
      wrongAnswer1: formData.get('wrongAnswer1'),
      wrongAnswer2: formData.get('wrongAnswer2'),
      wrongAnswer3: formData.get('wrongAnswer3'),
      imageUrl: imageUrl,
      explanation: formData.get('explanation') || '',
      memberToken: memberToken
    };

    try {
      const response = await fetch('/api/trivia/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestionData)
      });

      if (response.ok) {
        this.showSuggestionSuccess(suggestionData);
      } else {
        throw new Error('Failed to submit suggestion');
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Failed to submit suggestion. Please try again.');
    }
  }

  showSuggestionSuccess(suggestionData) {
    const suggestionContent = document.querySelector('.suggestion-content');
    suggestionContent.innerHTML = `
      <div class="success-message">
        <h3>✅ Question Submitted Successfully!</h3>
        <p>Thank you for your contribution to our horror trivia collection!</p>
        <p><strong>Your question will be reviewed and added to the game once approved.</strong></p>
        
        <div class="credits-info">
          <h4>🎃 Credits & Recognition</h4>
          <p>When your question is approved, it will include:</p>
          <ul>
            <li><strong>Special Recognition:</strong> Your name will appear in the game credits</li>
            <li><strong>Community Status:</strong> You'll be recognized as a contributing member</li>
          </ul>
        </div>
        
        <div class="form-buttons">
          <button class="submit-button" onclick="window.horrorTriviaGame.showScreen(window.horrorTriviaGame.startScreen)">BACK TO GAME</button>
        </div>
      </div>
    `;
  }

  // Helper function to convert file to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Contest Mode Methods
  showContestMode() {
    this.showScreen(this.contestLinkScreen);
    
    // Check if there's a contest link in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const linkFromUrl = urlParams.get('link');
    
    if (linkFromUrl) {
      document.getElementById('contestLink').value = linkFromUrl;
    }
  }

  showRegularMode() {
    this.showScreen(this.startScreen);
  }

  async validateContestLink() {
    const linkInput = document.getElementById('contestLink').value.trim();
    const errorElement = document.getElementById('linkError');
    
    if (!linkInput) {
      this.showLinkError('Please enter your contest link.');
      return;
    }

    try {
      const response = await fetch('/api/validate-game-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameLink: linkInput })
      });

      const data = await response.json();

      if (response.ok) {
        this.contestLink = linkInput;
        this.contestPlayer = data.player;
        this.isContestMode = true;
        this.startContestGame();
      } else {
        this.showLinkError(data.error);
      }
    } catch (error) {
      this.showLinkError('Failed to validate contest link. Please try again.');
    }
  }

  showLinkError(message) {
    const errorElement = document.getElementById('linkError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  async startContestGame() {
    try {
      // Show loading state
      const validateButton = document.getElementById('validateLink');
      validateButton.disabled = true;
      validateButton.textContent = 'Loading Contest...';
      
      // Fetch contest questions (500 questions for the contest)
      console.log('Fetching contest questions...');
      const response = await fetch('/api/trivia/questions?limit=500&approved=true&random=true');
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contest questions');
      }
      
      this.gameQuestions = await response.json();
      
      console.log('Raw response data:', this.gameQuestions);
      console.log(`Loaded ${this.gameQuestions.length} questions for the contest`);
      
      if (this.gameQuestions.length === 0) {
        throw new Error('No contest questions available');
      }
      
      // Start the contest game
      this.currentQuestionIndex = 0;
      this.totalScore = 0;
      this.correctAnswers = 0;
      this.gameStartTime = new Date();
      
      // Set contest mode timer to 10 seconds
      this.maxTime = 10;
      this.timeLeft = 10;
      
      // Track contest game start
      await this.trackContestGameStart();
      
      // Show first question
      console.log('About to show question screen...');
      this.showScreen(this.questionScreen);
      console.log('Question screen shown, about to load question...');
      this.loadQuestion();
      console.log('Load question called');
      
    } catch (error) {
      console.error('Error starting contest game:', error);
      this.showLinkError('Failed to start contest game. Please try again.');
      
      // Reset button
      const validateButton = document.getElementById('validateLink');
      validateButton.disabled = false;
      validateButton.textContent = 'START CONTEST GAME';
    }
  }

  async trackContestGameStart() {
    try {
      await fetch('/api/trivia/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'contest_start',
          data: {
            sessionId: this.sessionId,
            contestLink: this.contestLink,
            playerName: this.contestPlayer.fullName,
            playerEmail: this.contestPlayer.email,
            userAgent: navigator.userAgent
          }
        })
      });
    } catch (error) {
      console.error('Failed to track contest game start:', error);
    }
  }

  async trackContestGameEnd() {
    try {
      const maxPossibleScore = this.gameQuestions.length * 10;
      await fetch('/api/trivia/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'contest_end',
          data: {
            sessionId: this.sessionId,
            contestLink: this.contestLink,
            playerName: this.contestPlayer.fullName,
            playerEmail: this.contestPlayer.email,
            totalScore: this.totalScore,
            questionsAnswered: this.currentQuestionIndex,
            correctAnswers: this.correctAnswers,
            maxPossibleScore: maxPossibleScore
          }
        })
      });

      // Also submit to contest registration system
      await this.submitContestScore();
    } catch (error) {
      console.error('Failed to track contest game end:', error);
    }
  }

  async submitContestScore() {
    try {
      await fetch('/api/submit-game-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameLink: this.contestLink,
          score: this.totalScore,
          questionsAnswered: this.currentQuestionIndex
        })
      });
    } catch (error) {
      console.error('Failed to submit contest score:', error);
    }
  }

  // Utility method to shuffle an array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const game = new HorrorTriviaGame();
  
  // Make game globally accessible for debugging
  window.horrorTriviaGame = game;
  
  // Check if there's a contest link in the URL and automatically show contest mode
  const urlParams = new URLSearchParams(window.location.search);
  const linkFromUrl = urlParams.get('link');
  
  if (linkFromUrl) {
    console.log('Contest link detected in URL, automatically starting contest game');
    // Pre-fill the link input
    const linkInput = document.getElementById('contestLink');
    if (linkInput) {
      linkInput.value = linkFromUrl;
    }
    // Automatically start the contest game
    game.validateContestLink();
  }
});

// Utility functions for AI integration
function generateNewQuestions() {
  // This function would integrate with AI to generate new questions
  // For now, it's a placeholder for future AI integration
  console.log('AI question generation would happen here');
}

function reviewPendingQuestions() {
  // This function would allow manual review of AI-generated questions
  const pending = questionManager.getPendingQuestions();
  console.log('Pending questions for review:', pending);
  return pending;
}

// Export for potential future use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HorrorTriviaGame, generateNewQuestions, reviewPendingQuestions };
} 