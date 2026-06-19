const API_BASE = window.location.origin;

const phone = document.querySelector(".phone");
const thread = document.querySelector("#thread");
const form = document.querySelector("#demo-form");
const appDrawer = document.querySelector("#app-drawer");
const openAppsButton = document.querySelector("#open-apps");
const openSchedulerButton = document.querySelector("#open-scheduler");
const runButton = document.querySelector("#run-demo");
const closeSheetButton = document.querySelector("#close-sheet");
const backendStatus = document.querySelector("#backend-status");
const sessionId = document.querySelector("#session-id");
const resultStatus = document.querySelector("#result-status");
const slotOutput = document.querySelector("#slot-output");
const roundsOutput = document.querySelector("#rounds-output");

const dateRangeStart = "2026-03-02T09:00:00";
const dateRangeEnd = "2026-03-06T18:00:00";
let sheetDragStartY = 0;
let sheetDragStartOffset = 162;
let sheetOffset = 162;
let isDraggingSheet = false;

const sheetExpandedOffset = 0;
const sheetCollapsedOffset = 162;
const sheetCloseOffset = 270;

function updateSheetOffset(offset) {
  sheetOffset = Math.max(sheetExpandedOffset, Math.min(sheetCloseOffset, offset));
  phone.style.setProperty("--sheet-offset", `${sheetOffset}px`);
  if (phone.classList.contains("sheet-open")) {
    scrollThreadToLatest();
  }
}

function scrollThreadToLatest() {
  requestAnimationFrame(() => {
    thread.scrollTop = thread.scrollHeight;
  });
}

function addMessage(kind, author, text) {
  const message = document.createElement("article");
  message.className = `message ${kind}`;
  message.innerHTML = `<strong>${author}</strong>${text}`;
  thread.appendChild(message);
  scrollThreadToLatest();
}

function addAppCard(title, text) {
  const message = document.createElement("article");
  message.className = "message card";
  message.innerHTML = `
    <div class="card-title">
      <span class="mini-icon">AI</span>
      <span>${title}</span>
    </div>
    <p>${text}</p>
  `;
  thread.appendChild(message);
  scrollThreadToLatest();
}

function addTypingIndicator() {
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.id = "typing-indicator";
  typing.innerHTML = "<span></span><span></span><span></span>";
  thread.appendChild(typing);
  scrollThreadToLatest();
}

function removeTypingIndicator() {
  document.querySelector("#typing-indicator")?.remove();
}

function setInitialConversation() {
  thread.innerHTML = "";
  addMessage("agent", "Me", "Testing Meeting Scheduler Extension");
  addMessage("user", "Clely", "Testing Meeting Scheduler Extension");
  addMessage("system", "Sat, Feb 28 at 6:01 PM", "Tap +, choose Meeting Scheduler, then find a time.");
}

function showAppDrawer() {
  appDrawer.hidden = false;
  form.hidden = true;
  phone.classList.remove("sheet-open");
}

function hideAppDrawer() {
  appDrawer.hidden = true;
}

function showSchedulerSheet() {
  appDrawer.hidden = true;
  form.hidden = false;
  updateSheetOffset(sheetCollapsedOffset);
  phone.classList.add("sheet-open");
  scrollThreadToLatest();
}

function closeSchedulerSheet() {
  form.hidden = true;
  appDrawer.hidden = true;
  phone.classList.remove("sheet-open");
  updateSheetOffset(sheetCollapsedOffset);
}

function startSheetDrag(event) {
  isDraggingSheet = true;
  sheetDragStartY = event.clientY;
  sheetDragStartOffset = sheetOffset;
  closeSheetButton.setPointerCapture?.(event.pointerId);
  form.style.transition = "none";
  phone.style.setProperty("--sheet-transition", "none");
}

function dragSheet(event) {
  if (!isDraggingSheet) {
    return;
  }

  updateSheetOffset(sheetDragStartOffset + event.clientY - sheetDragStartY);
}

function finishSheetDrag() {
  if (!isDraggingSheet) {
    return;
  }

  isDraggingSheet = false;
  form.style.transition = "";
  phone.style.removeProperty("--sheet-transition");

  if (sheetOffset > sheetCollapsedOffset + 82) {
    closeSchedulerSheet();
    return;
  }

  updateSheetOffset(sheetOffset < sheetCollapsedOffset / 2 ? sheetExpandedOffset : sheetCollapsedOffset);
}

function formatSlot(slot) {
  if (!slot) {
    return "No slot selected";
  }

  const start = new Date(slot.start);
  const end = new Date(slot.end);
  return `${start.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })} to ${end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  })}`;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.detail || `Request failed with ${response.status}`);
  }

  return body;
}

async function registerUser(displayName, schedulingStyle) {
  return api("/users/register", {
    method: "POST",
    body: JSON.stringify({
      display_name: displayName,
      scheduling_style: schedulingStyle
    })
  });
}

function getInviteeStyles() {
  const value = document.querySelector("#invitee-mix").value;
  if (value === "balanced-balanced") {
    return ["balanced", "balanced"];
  }
  if (value === "early-balanced") {
    return ["early", "balanced"];
  }
  return ["early", "flexible"];
}

function renderRounds(logs) {
  roundsOutput.innerHTML = "";

  Object.keys(logs)
    .filter((key) => key.startsWith("round_"))
    .sort()
    .forEach((key) => {
      const round = logs[key];
      const accepted = Object.values(round.responses || {})
        .filter((response) => response.decision === "ACCEPT").length;
      const counters = Object.values(round.responses || {})
        .filter((response) => response.decision === "COUNTER").length;

      const card = document.createElement("article");
      card.className = "round";
      card.innerHTML = `
        <div class="round-title">
          <span>${key.replace("_", " ")}</span>
          <span>${accepted} accepted, ${counters} countered</span>
        </div>
        <p>${round.proposals.length} host proposals evaluated by ${Object.keys(round.responses || {}).length} invitee agents.</p>
      `;
      roundsOutput.appendChild(card);
    });
}

async function runDemo(event) {
  event.preventDefault();

  runButton.disabled = true;
  resultStatus.textContent = "Running";
  sessionId.textContent = "Creating";
  slotOutput.textContent = "Negotiating with live agents.";
  roundsOutput.innerHTML = "";
  setInitialConversation();

  const meetingTitle = document.querySelector("#meeting-title").value;
  const durationMinutes = Number(
    document.querySelector("input[name='duration-minutes']:checked").value
  );
  const hostStyle = document.querySelector("#host-style").value;
  const [inviteeStyleOne, inviteeStyleTwo] = getInviteeStyles();

  try {
    addMessage("user", "Clely", meetingTitle);
    addAppCard("Meeting Scheduler", "Setting up host and invitee profiles for this live scheduling thread.");
    const timestamp = new Date().toISOString().slice(11, 19);
    const host = await registerUser(`Demo Host ${timestamp}`, hostStyle);
    const inviteeOne = await registerUser(`Demo Invitee A ${timestamp}`, inviteeStyleOne);
    const inviteeTwo = await registerUser(`Demo Invitee B ${timestamp}`, inviteeStyleTwo);

    addMessage("agent", "Host Agent", `Proposing ${durationMinutes}-minute slots using a ${hostStyle} preference.`);
    addMessage("agent", "Invitee Agents", `Evaluating availability as ${inviteeStyleOne} and ${inviteeStyleTwo} schedulers.`);
    addTypingIndicator();

    const negotiation = await api("/negotiation/start", {
      method: "POST",
      body: JSON.stringify({
        host_user_id: host.id,
        host_display_name: host.display_name,
        host_scheduling_style: host.scheduling_style,
        invitees: [
          {
            user_id: inviteeOne.id,
            display_name: inviteeOne.display_name,
            scheduling_style: inviteeOne.scheduling_style
          },
          {
            user_id: inviteeTwo.id,
            display_name: inviteeTwo.display_name,
            scheduling_style: inviteeTwo.scheduling_style
          }
        ],
        meeting_title: meetingTitle,
        duration_minutes: durationMinutes,
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd
      })
    });

    removeTypingIndicator();
    const saved = await api(`/negotiation/${negotiation.session_id}`);
    sessionId.textContent = negotiation.session_id;
    resultStatus.textContent = negotiation.status.replace("_", " ");
    slotOutput.textContent = formatSlot(negotiation.agreed_slot);
    renderRounds(negotiation.negotiation_logs);

    addAppCard(
      `${negotiation.status.replace("_", " ")}`,
      `Suggested slot: ${formatSlot(negotiation.agreed_slot)}. Completed in ${negotiation.rounds_completed} round(s).`
    );
    addMessage("system", "Saved", `Session status: ${saved.status}.`);
  } catch (error) {
    removeTypingIndicator();
    resultStatus.textContent = "Error";
    slotOutput.textContent = error.message;
    addMessage("system", "Error", error.message);
  } finally {
    runButton.disabled = false;
  }
}

async function checkHealth() {
  try {
    const health = await api("/health");
    backendStatus.textContent = health.status;
  } catch {
    backendStatus.textContent = "Unavailable";
  }
}

openAppsButton.addEventListener("click", () => {
  if (appDrawer.hidden) {
    showAppDrawer();
  } else {
    hideAppDrawer();
  }
});

openSchedulerButton.addEventListener("click", showSchedulerSheet);
closeSheetButton.addEventListener("pointerdown", startSheetDrag);
closeSheetButton.addEventListener("pointermove", dragSheet);
closeSheetButton.addEventListener("pointerup", finishSheetDrag);
closeSheetButton.addEventListener("pointercancel", finishSheetDrag);
form.addEventListener("submit", runDemo);
setInitialConversation();
checkHealth();
