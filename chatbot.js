(() => {
  const messagesDiv = document.getElementById("messages");
  const inputField = document.getElementById("userInput");
  const widget = document.getElementById("chat-widget");
  const launcher = document.getElementById("chat-launcher");
  const closeButton = document.querySelector(".chat-close");
  const quickReplies = [...document.querySelectorAll("[data-chat-reply]")];
  const toast = document.getElementById("webhook-toast");
  const form = document.getElementById("chat-form");

  if (!messagesDiv || !inputField || !widget || !launcher || !form) return;

  let flowState = "general";
  const leadData = { name: "", phone: "" };

  function setChatOpen(isOpen) {
    widget.classList.toggle("closed", !isOpen);
    launcher.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) window.setTimeout(() => inputField.focus(), 120);
  }

  function toggleChat() {
    setChatOpen(widget.classList.contains("closed"));
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[char]
    ));
  }

  function addMessage(content, sender, isHtml = false) {
    const msg = document.createElement("div");
    msg.className = `msg ${sender}`;

    if (isHtml) {
      msg.innerHTML = content;
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = content;
      msg.appendChild(paragraph);
    }

    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function sendSmsDeflection(kind = "pricing") {
    const body =
      kind === "pricing"
        ? "Hi I Do Transportation, I am chatting with your AI Concierge and would like a custom quote for an upcoming event."
        : "Hi I Do Transportation, I am chatting with your AI Concierge and have a planning question.";

    addMessage(
      `Pricing depends on the exact route, timing, passenger count, and event plan, so the team handles quotes personally. That keeps the number accurate and avoids guessing in chat.<br><br>
      <a href="sms:9366722097?body=${encodeURIComponent(body)}" class="sms-button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        Text the Team for a Quote
      </a>
      <div class="bot-question">I can still help with fleet, airport, and wedding logistics while you wait.</div>`,
      "bot",
      true,
    );
  }

  function fireWebhook() {
    console.log("Demo chatbot lead captured:", leadData);
    if (!toast) return;
    toast.style.display = "block";
    window.setTimeout(() => {
      toast.style.display = "none";
    }, 3800);
  }

  function processFlow(input) {
    const lowerInput = input.toLowerCase();

    if (flowState === "awaiting_phone") {
      const digits = input.replace(/\D/g, "");
      if (digits.length >= 10 && digits.length <= 11) {
        leadData.phone = digits;
        flowState = "complete";
        fireWebhook();
        addMessage(
          `Got it. I captured the best number for ${escapeHtml(leadData.name)} and queued this as a demo quote handoff.<br><div class="bot-question">Which venues, hotels, airports, or pickup points are part of the route?</div>`,
          "bot",
          true,
        );
      } else {
        addMessage("That does not look like a 10-digit phone number. What is the best cell number for the team to text?", "bot");
      }
      return;
    }

    if (flowState === "awaiting_name") {
      leadData.name = input;
      flowState = "awaiting_phone";
      addMessage(`Great to meet you, ${escapeHtml(leadData.name)}. What is the best cell number for the team to text about the quote?`, "bot", true);
      return;
    }

    const hasPricingNumber = /\b\d{2,4}\b/.test(lowerInput);
    if (
      lowerInput.includes("budget") ||
      lowerInput.includes("$") ||
      lowerInput.includes("price") ||
      lowerInput.includes("cost") ||
      lowerInput.includes("how much") ||
      lowerInput.includes("rent") ||
      hasPricingNumber
    ) {
      sendSmsDeflection("pricing");
      return;
    }

    if (lowerInput.includes("quote") || lowerInput.includes("book") || lowerInput.includes("reserve")) {
      flowState = "awaiting_name";
      addMessage(
        `I can get a quote file started. Because pricing depends on route, hours, timing, and passenger count, a human coordinator will finish the quote personally.<div class="bot-question">What is your first and last name?</div>`,
        "bot",
        true,
      );
      return;
    }

    if (lowerInput.includes("car") || lowerInput.includes("fleet") || lowerInput.includes("van") || lowerInput.includes("vehicle")) {
      addMessage(
        `The mockup presents high-capacity private transportation for wedding parties, guest shuttles, airport arrivals, and private events. The final build can reflect exact vehicle specs once Chase confirms the fleet details.<div class="bot-question">About how many passengers are you trying to move?</div>`,
        "bot",
        true,
      );
      return;
    }

    if (lowerInput.includes("airport") || lowerInput.includes("iah") || lowerInput.includes("hobby") || lowerInput.includes("hou")) {
      addMessage(
        `Yes. The site is set up to support IAH, Hobby, private airport arrivals, hotel blocks, and wedding-weekend transportation. The key details are pickup time, terminal or FBO, passenger count, and luggage needs.<div class="bot-question">Is this an airport pickup, airport drop-off, or both?</div>`,
        "bot",
        true,
      );
      return;
    }

    if (lowerInput.includes("wedding") || lowerInput.includes("venue") || lowerInput.includes("guest")) {
      addMessage(
        `For weddings, the strongest plan usually covers guest shuttle loops, ceremony arrival windows, wedding-party movement, reception returns, and private getaway timing.<div class="bot-question">Do you already have the venue and hotel block picked?</div>`,
        "bot",
        true,
      );
      return;
    }

    addMessage(
      `That is a good planning question. For exact answers, the team should confirm the final details, but I can help frame the route and event type.<br><br>
      <a href="sms:9366722097?body=${encodeURIComponent("Hi I Do Transportation, I am chatting with your AI Concierge and have a planning question.")}" class="sms-button">
        Text a Human Now
      </a>
      <div class="bot-question">Or ask me about weddings, airport transfers, fleet capacity, or quote handoff.</div>`,
      "bot",
      true,
    );
  }

  function handleSend(event) {
    event.preventDefault();
    const text = inputField.value.trim();
    if (!text) return;

    addMessage(text, "user");
    inputField.value = "";

    window.setTimeout(() => {
      processFlow(text);
    }, 450);
  }

  launcher.addEventListener("click", toggleChat);
  closeButton?.addEventListener("click", () => setChatOpen(false));
  form.addEventListener("submit", handleSend);

  quickReplies.forEach((button) => {
    button.addEventListener("click", () => {
      setChatOpen(true);
      inputField.value = button.dataset.chatReply || "";
      handleSend(new Event("submit"));
    });
  });
})();
