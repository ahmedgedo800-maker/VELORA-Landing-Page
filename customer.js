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