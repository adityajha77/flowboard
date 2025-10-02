let events = [];

function addEvent() {
  const name = document.getElementById("eventName").value;
  const dateInput = document.getElementById("eventDate").value;
  
  if (!name || !dateInput) {
    alert("Please fill out both fields.");
    return;
  }

  const eventDate = new Date(dateInput).getTime();
  events.push({ name, eventDate, reminded: false });

  document.getElementById("eventName").value = "";
  document.getElementById("eventDate").value = "";

  displayEvents();
}

function displayEvents() {
  const container = document.getElementById("eventsContainer");
  container.innerHTML = "";

  events.forEach((event, index) => {
    const li = document.createElement("li");
    li.classList.add("event-item");

    const eventName = document.createElement("div");
    eventName.classList.add("event-name");
    eventName.textContent = event.name;

    const countdown = document.createElement("div");
    countdown.classList.add("countdown");
    countdown.setAttribute("id", `countdown-${index}`);

    li.appendChild(eventName);
    li.appendChild(countdown);
    container.appendChild(li);
  });
}

function updateCountdowns() {
  const now = new Date().getTime();

  events.forEach((event, index) => {
    const distance = event.eventDate - now;
    const countdownEl = document.getElementById(`countdown-${index}`);

    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s left`;

      // Reminder alert 1 minute before event
      if (distance < 60000 && !event.reminded) {
        const sound = document.getElementById("reminderSound");
        sound.play();
        alert(`Reminder: ${event.name} is happening soon!`);
        event.reminded = true;
      }

    } else {
      countdownEl.textContent = "Event Started!";
    }
  });
}

setInterval(updateCountdowns, 1000);
