const servicesContainer =
    document.getElementById("servicesContainer");

async function loadPublicServices() {
    try {
        const response = await fetch("/api/services");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Could not load services."
            );
        }

        servicesContainer.innerHTML = "";

        if (data.services.length === 0) {
            servicesContainer.innerHTML =
                '<p class="services-empty">No services are currently available.</p>';
            return;
        }

        data.services.forEach(service => {
            const card = document.createElement("div");
            card.className = "service-card";

            const title = document.createElement("h3");
            title.textContent = service.title;

            const description = document.createElement("p");
            description.textContent = service.description;

            card.appendChild(title);
            card.appendChild(description);

            servicesContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Load public services error:", error);

        servicesContainer.innerHTML =
            '<p class="services-empty">Unable to load services right now.</p>';
    }
}

loadPublicServices();
