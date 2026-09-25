const profileForm = document.getElementById("profileForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const secondaryEmailInput = document.getElementById("secondaryEmail");

const profileMessage = document.getElementById("profileMessage");

const passwordForm = document.getElementById("passwordForm");
const passwordMessage = document.getElementById("passwordMessage");

const userWelcome = document.getElementById("userWelcome");

const userId = document.getElementById("userId");
const displayName = document.getElementById("displayName");
const displayEmail = document.getElementById("displayEmail");

const logoutBtn = document.getElementById("logoutBtn");



async function loadUser() {

    try {

        const response = await fetch("/api/me");

        if (!response.ok) {
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
            window.location.href = "/login.html";
            return;
        }

        const user = data.user;

        
        userWelcome.textContent =
            `Welcome, ${user.name}`;

        
        nameInput.value = user.name;
        emailInput.value = user.email;

        secondaryEmailInput.value =
            user.secondary_email || "";

        
        userId.textContent = user.id;
        displayName.textContent = user.name;
        displayEmail.textContent = user.email;

    } catch (error) {

        console.error(
            "Error loading user:",
            error
        );

        window.location.href = "/login.html";
    }
}



profileForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const name =
            nameInput.value.trim();

        const secondaryEmail =
            secondaryEmailInput.value.trim();

        if (!name) {

            profileMessage.textContent =
                "Name is required.";

            return;
        }

        try {

            const response = await fetch(
                "/api/me",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        secondaryEmail:
                            secondaryEmail
                    })
                }
            );

            if (response.status === 401) {

                window.location.href =
                    "/login.html";

                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                profileMessage.textContent =
                    data.message;

                return;
            }

            profileMessage.textContent =
                data.message;

            
            if (data.user) {

                userWelcome.textContent =
                    `Welcome, ${data.user.name}`;

                displayName.textContent =
                    data.user.name;
            }

        } catch (error) {

            console.error(
                "Update profile error:",
                error
            );

            profileMessage.textContent =
                "Something went wrong.";
        }
    }
);



passwordForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const currentPassword =
            document.getElementById(
                "currentPassword"
            ).value;

        const newPassword =
            document.getElementById(
                "newPassword"
            ).value;

        const confirmNewPassword =
            document.getElementById(
                "confirmNewPassword"
            ).value;


        
        if (
            newPassword !==
            confirmNewPassword
        ) {

            passwordMessage.textContent =
                "New passwords do not match.";

            return;
        }


        
        if (newPassword.length < 6) {

            passwordMessage.textContent =
                "New password must be at least 6 characters.";

            return;
        }


        try {

            const response = await fetch(
                "/api/change-password",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        currentPassword:
                            currentPassword,

                        newPassword:
                            newPassword
                    })
                }
            );


            if (response.status === 401) {

                window.location.href =
                    "/login.html";

                return;
            }


            const data =
                await response.json();


            if (!response.ok) {

                passwordMessage.textContent =
                    data.message;

                return;
            }


            passwordMessage.textContent =
                data.message;


            
            passwordForm.reset();

        } catch (error) {

            console.error(
                "Change password error:",
                error
            );

            passwordMessage.textContent =
                "Something went wrong.";
        }
    }
);



logoutBtn.addEventListener(
    "click",
    async function () {

        try {

            const response = await fetch(
                "/api/logout",
                {
                    method: "POST"
                }
            );

            const data =
                await response.json();

            if (data.success) {

                window.location.href =
                    "/login.html";

            } else {

                alert(
                    data.message ||
                    "Logout failed."
                );
            }

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "Something went wrong."
            );
        }
    }
);




loadUser();

// ==================== CUSTOMER REQUEST MANAGEMENT ====================

const requestForm = document.getElementById("requestForm");
const requestTitle = document.getElementById("requestTitle");
const requestDescription = document.getElementById("requestDescription");
const requestMessage = document.getElementById("requestMessage");
const myRequests = document.getElementById("myRequests");

async function loadMyRequests() {
    try {
        const response = await fetch("/api/requests/my");

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load requests.");
        }

        myRequests.innerHTML = "";

        if (data.requests.length === 0) {
            myRequests.innerHTML = "<p>No service requests yet.</p>";
            return;
        }

        data.requests.forEach(request => {
            const item = document.createElement("div");
            item.className = "content-item";

            const title = document.createElement("h3");
            title.textContent = `#${request.id} - ${request.title}`;

            const status = document.createElement("p");
            status.className = "request-status";
            status.textContent = `Status: ${request.status}`;

            const description = document.createElement("p");
            description.textContent = request.description;

            const dates = document.createElement("small");
            dates.textContent =
                `Created: ${request.created_at} | Updated: ${request.updated_at}`;

            item.appendChild(title);
            item.appendChild(status);
            item.appendChild(description);
            item.appendChild(dates);

            myRequests.appendChild(item);
        });
    } catch (error) {
        console.error("Load requests error:", error);
        myRequests.innerHTML = "<p>Failed to load your requests.</p>";
    }
}

requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = requestTitle.value.trim();
    const description = requestDescription.value.trim();

    if (!title || !description) {
        requestMessage.textContent = "Please fill in all request fields.";
        return;
    }

    try {
        const response = await fetch("/api/requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, description })
        });

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            requestMessage.textContent =
                data.message || "Could not submit request.";
            return;
        }

        requestMessage.textContent = data.message;
        requestForm.reset();

        await loadMyRequests();
    } catch (error) {
        console.error("Submit request error:", error);
        requestMessage.textContent =
            "Something went wrong. Please try again.";
    }
});

loadMyRequests();
