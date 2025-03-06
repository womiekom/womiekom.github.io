function startBirthday() {
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("birthday-content").style.display = "block";
}

function showSurprise() {
    const confettiContainer = document.getElementById("confetti-container");
    confettiContainer.innerHTML = "🎊🎉💖✨🥳";
    confettiContainer.style.fontSize = "50px";

    // Play birthday song
    let audio = new Audio('https://www.myinstants.com/media/sounds/happy-birthday-to-you.mp3');
    audio.play();
}
