const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            loginMessage.textContent = data.message;
            return;
        }

        loginMessage.textContent = data.message;

        setTimeout(() => {
            window.location.href = "customer.html";
        }, 1000);

    } catch (error) {
        console.error("Login error:", error);
        loginMessage.textContent = "Something went wrong.";
    }
});