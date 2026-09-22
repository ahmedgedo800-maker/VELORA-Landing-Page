const userWelcome = document.getElementById("userWelcome");
const logoutBtn = document.getElementById("logoutBtn");



const serviceForm = document.getElementById("serviceForm");
const serviceTitle = document.getElementById("serviceTitle");
const serviceDescription = document.getElementById("serviceDescription");
const serviceSubmitButton = document.getElementById("serviceSubmitButton");
const cancelServiceEdit = document.getElementById("cancelServiceEdit");
const serviceList = document.getElementById("serviceList");

let editingServiceId = null;


const contentForm = document.getElementById("contentForm");
const submitButton = document.getElementById("submitButton");
const contentList = document.getElementById("contentList");

let editingContentId = null;



async function checkUser() {
    try {
        const response = await fetch("/api/me");

        if (!response.ok) {
            window.location.href = "/login.html";
            return false;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
            window.location.href = "/login.html";
            return false;
        }

        userWelcome.textContent = `Welcome, ${data.user.name}`;
        return true;

    } catch (error) {
        console.error("User check error:", error);
        window.location.href = "/login.html";
        return false;
    }
}



logoutBtn.addEventListener("click", async () => {
    try {
        const response = await fetch("/api/logout", {
            method: "POST"
        });

        const result = await response.json();

        if (result.success) {
            window.location.href = "/login.html";
        } else {
            alert(result.message || "Logout failed.");
        }

    } catch (error) {
        console.error("Logout error:", error);
        alert("Something went wrong.");
    }
});



async function loadServices() {
    try {
        const response = await fetch("/api/services");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load services.");
        }

        serviceList.innerHTML = "";

        if (data.services.length === 0) {
            serviceList.innerHTML = "<p>No services available.</p>";
            return;
        }

        data.services.forEach(service => {
            const serviceItem = document.createElement("div");
            serviceItem.className = "content-item";

            const title = document.createElement("h3");
            title.textContent = service.title;

            const description = document.createElement("p");
            description.textContent = service.description;

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "edit-btn";
            editButton.textContent = "Edit";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";

            editButton.addEventListener("click", () => {
                serviceTitle.value = service.title;
                serviceDescription.value = service.description;
                editingServiceId = service.id;

                serviceSubmitButton.textContent = "Update Service";
                cancelServiceEdit.hidden = false;

                serviceForm.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });

            deleteButton.addEventListener("click", async () => {
                const confirmed = confirm(
                    "Are you sure you want to delete this service?"
                );

                if (!confirmed) {
                    return;
                }

                try {
                    const response = await fetch(
                        `/api/services/${service.id}`,
                        {
                            method: "DELETE"
                        }
                    );

                    if (response.status === 401) {
                        window.location.href = "/login.html";
                        return;
                    }

                    const result = await response.json();

                    if (!response.ok) {
                        alert(result.message || "Could not delete service.");
                        return;
                    }

                    alert("Service deleted successfully.");
                    await loadServices();

                } catch (error) {
                    console.error("Delete service error:", error);
                    alert("Something went wrong.");
                }
            });

            serviceItem.appendChild(title);
            serviceItem.appendChild(description);
            serviceItem.appendChild(editButton);
            serviceItem.appendChild(deleteButton);

            serviceList.appendChild(serviceItem);
        });

    } catch (error) {
        console.error("Load services error:", error);
        serviceList.innerHTML = "<p>Failed to load services.</p>";
    }
}


serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = serviceTitle.value.trim();
    const description = serviceDescription.value.trim();

    if (!title || !description) {
        alert("Please fill in all service fields.");
        return;
    }

    try {
        let response;

        if (editingServiceId !== null) {
            response = await fetch(
                `/api/services/${editingServiceId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title,
                        description
                    })
                }
            );
        } else {
            response = await fetch(
                "/api/services",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title,
                        description
                    })
                }
            );
        }

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Could not save service.");
            return;
        }

        alert(
            editingServiceId !== null
                ? "Service updated successfully."
                : "Service added successfully."
        );

        resetServiceForm();
        await loadServices();

    } catch (error) {
        console.error("Save service error:", error);
        alert("Something went wrong.");
    }
});



cancelServiceEdit.addEventListener("click", () => {
    resetServiceForm();
});

function resetServiceForm() {
    editingServiceId = null;
    serviceForm.reset();

    serviceSubmitButton.textContent = "Add Service";
    cancelServiceEdit.hidden = true;
}


async function loadContent() {
    try {
        const response = await fetch("/api/content");

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        const content = await response.json();

        contentList.innerHTML = "";

        if (content.length === 0) {
            contentList.innerHTML = "<p>No content available.</p>";
            return;
        }

        content.forEach(item => {
            const contentItem = document.createElement("div");
            contentItem.className = "content-item";

            const title = document.createElement("h3");
            title.textContent = item.title;

            const description = document.createElement("p");
            description.textContent = item.description;

            const editButton = document.createElement("button");
            editButton.className = "edit-btn";
            editButton.type = "button";
            editButton.textContent = "Edit";

            editButton.addEventListener("click", () => {
                document.getElementById("title").value = item.title;
                document.getElementById("description").value = item.description;

                editingContentId = item.id;
                submitButton.textContent = "Update Content";

                contentForm.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-btn";
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", async () => {
                const confirmed = confirm(
                    "Are you sure you want to delete this content?"
                );

                if (!confirmed) {
                    return;
                }

                try {
                    const response = await fetch(
                        `/api/content/${item.id}`,
                        {
                            method: "DELETE"
                        }
                    );

                    if (response.status === 401) {
                        window.location.href = "/login.html";
                        return;
                    }

                    const result = await response.json();

                    if (!response.ok) {
                        alert(result.message);
                        return;
                    }

                    alert("Content deleted successfully.");
                    await loadContent();

                } catch (error) {
                    console.error("Delete content error:", error);
                    alert("Something went wrong.");
                }
            });

            contentItem.appendChild(title);
            contentItem.appendChild(description);
            contentItem.appendChild(editButton);
            contentItem.appendChild(deleteButton);

            contentList.appendChild(contentItem);
        });

    } catch (error) {
        console.error("Load content error:", error);
        contentList.innerHTML = "<p>Failed to load content.</p>";
    }
}



contentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!title || !description) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        let response;

        if (editingContentId !== null) {
            response = await fetch(
                `/api/content/${editingContentId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title,
                        description
                    })
                }
            );
        } else {
            response = await fetch(
                "/api/content",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title,
                        description
                    })
                }
            );
        }

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert(
            editingContentId !== null
                ? "Content updated successfully."
                : "Content added successfully."
        );

        editingContentId = null;
        submitButton.textContent = "Add Content";
        contentForm.reset();

        await loadContent();

    } catch (error) {
        console.error("Save content error:", error);
        alert("Something went wrong.");
    }
});



(async function startDashboard() {
    const loggedIn = await checkUser();

    if (!loggedIn) {
        return;
    }

    await loadServices();
    await loadContent();
})();
