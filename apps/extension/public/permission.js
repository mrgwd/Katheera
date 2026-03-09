document.getElementById('grantButton').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());

        // Permission granted!
        document.querySelector('h1').textContent = "Permission Granted!";
        document.querySelector('span').style.display = 'none';
        document.getElementById('grantButton').style.display = 'none';

        let timeLeft = 3;
        const p = document.querySelector('p');
        const updateText = () => {
            p.textContent = `You can now close this tab. It will close automatically in ${timeLeft}s.`;
        };
        updateText();
        const countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                window.close();
            } else {
                updateText();
            }
        }, 1000);

        // Notify background or just close after a delay
        setTimeout(() => {
            window.close();
        }, 3000);

    } catch (err) {
        console.error("Permission denied:", err);
        alert("Permission denied. Please try again and click 'Allow'.");
    }
});
