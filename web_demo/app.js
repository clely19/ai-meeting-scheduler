const API_BASE = window.location.origin;

const phone = document.querySelector(".phone");
const thread = document.querySelector("#thread");
const form = document.querySelector("#demo-form");
const appDrawer = document.querySelector("#app-drawer");
const openAppsButton = document.querySelector("#open-apps");
const openSchedulerButton = document.querySelector("#open-scheduler");
const openDemoChatButton = document.querySelector("#open-demo-chat");
const linkedinPostButtons = document.querySelectorAll(".linkedin-row");
const filterMenuButton = document.querySelector("#filter-menu-button");
const filterMenu = document.querySelector("#filter-menu");
const backButton = document.querySelector(".back-pill");
const runButton = document.querySelector("#run-demo");
const closeSheetButton = document.querySelector("#close-sheet");
const backendStatus = document.querySelector("#backend-status");
const sessionId = document.querySelector("#session-id");
const resultStatus = document.querySelector("#result-status");
const slotOutput = document.querySelector("#slot-output");
const roundsOutput = document.querySelector("#rounds-output");
const chatName = document.querySelector(".chat-title h1");
const groupAvatar = document.querySelector(".group-avatar");
const guideStepCount = document.querySelector("#guide-step-count");
const guideTitle = document.querySelector("#guide-title");
const guideCopy = document.querySelector("#guide-copy");
const guideNext = document.querySelector("#guide-next");
const guideStepsList = document.querySelector("#guide-steps");

const dateRangeStart = "2026-03-02T09:00:00";
const dateRangeEnd = "2026-03-06T18:00:00";
let sheetDragStartY = 0;
let sheetDragStartOffset = 162;
let sheetOffset = 162;
let isDraggingSheet = false;
let guideStepIndex = 0;

const sheetExpandedOffset = 0;
const sheetCollapsedOffset = 162;
const sheetCloseOffset = 270;
const guideSteps = [
  {
    title: "Start from Messages",
    copy: "Begin on the Messages list, then open the AI Meeting Scheduler demo chat.",
    action: "Continue: Open demo chat"
  },
  {
    title: "Open iMessage apps",
    copy: "Use the plus button to reveal the iMessage app drawer, just like the original extension flow.",
    action: "Next: Open app drawer"
  },
  {
    title: "Choose Meeting Scheduler",
    copy: "Select Meeting Scheduler from the app drawer so the extension sheet appears below the text box.",
    action: "Next: Open scheduler"
  },
  {
    title: "Review meeting details",
    copy: "The demo is prefilled for a portfolio meeting. Run the live scheduling negotiation when ready.",
    action: "Continue: Find a time"
  },
  {
    title: "Live negotiation running",
    copy: "The host and invitee agents are registering users, proposing slots, and saving the session.",
    action: "Running..."
  },
  {
    title: "Review the result",
    copy: "Read the suggested slot and negotiation rounds. The result came from the live Render backend.",
    action: "Start over"
  }
];
const linkedInPosts = {
  "agentic-ai": {
    title: "Agentic AI + Data Cloud",
    subtitle: "Agentic AI, Data Cloud, Salesforce",
    url: "https://www.linkedin.com/posts/clely-fernandes_agenticai-datacloud-salesforce-ugcPost-7457422569668014080-mlCK/?utm_source=share&utm_medium=member_desktop&rcm=ACoAADcM6rYBYDfuAouEWwFrlY1giwgoCPkgrkI",
    preview: "I didn't expect a sketch of Mickey Mouse to change how I think about data.",
    image: "/demo/assets/linkedin-agentic-preview.png",
    imageAlt: "LinkedIn post preview about Salesforce and agentic AI"
  },
  "github-copilot": {
    title: "GitHub AI Copilot",
    subtitle: "GitHub, AI, Copilot",
    url: "https://www.linkedin.com/posts/clely-fernandes_github-ai-copilot-share-7452776419551555584-jveT/?utm_source=share&utm_medium=member_desktop&rcm=ACoAADcM6rYBYDfuAouEWwFrlY1giwgoCPkgrkI",
    preview: "A practical note on GitHub Copilot privacy, model training, and the setting every developer should actively decide.",
    image: "/demo/assets/linkedin-github-copilot-preview.png",
    imageAlt: "LinkedIn post preview about GitHub Copilot"
  }
};

function renderGuideSteps() {
  guideStepsList.innerHTML = guideSteps
    .map((step, index) => `
      <li class="${index === guideStepIndex ? "active" : ""} ${index < guideStepIndex ? "done" : ""}">
        <span>${index + 1}</span>
        <strong>${step.title}</strong>
      </li>
    `)
    .join("");
}

function setGuideStep(index) {
  guideStepIndex = Math.max(0, Math.min(guideSteps.length - 1, index));
  const step = guideSteps[guideStepIndex];
  guideStepCount.textContent = `Step ${guideStepIndex + 1} of ${guideSteps.length}`;
  guideTitle.textContent = step.title;
  guideCopy.textContent = step.copy;
  guideNext.textContent = step.action;
  guideNext.disabled = guideStepIndex === 4 || (runButton.disabled && guideStepIndex === 3);
  renderGuideSteps();
}

function advanceGuide() {
  if (guideStepIndex === 0) {
    showChat();
    setGuideStep(1);
    return;
  }

  if (guideStepIndex === 1) {
    showAppDrawer();
    setGuideStep(2);
    return;
  }

  if (guideStepIndex === 2) {
    showSchedulerSheet();
    setGuideStep(3);
    return;
  }

  if (guideStepIndex === 3) {
    setGuideStep(4);
    form.requestSubmit();
    return;
  }

  showMessagesList();
  setGuideStep(0);
}

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

function addLinkedInPreview(post) {
  const message = document.createElement("article");
  message.className = "message card linkedin-preview";
  const media = post.image
    ? `<img class="linkedin-post-media" src="${post.image}" alt="${post.imageAlt}">`
    : `<span class="linkedin-post-media linkedin-post-placeholder" aria-label="${post.imageAlt}">
        <span>GitHub</span>
        <strong>AI Copilot</strong>
      </span>`;
  message.innerHTML = `
    <a class="linkedin-post-card" href="${post.url}" target="_blank" rel="noreferrer">
      ${media}
      <span class="linkedin-link-copy">
        <span class="linkedin-domain">linkedin.com</span>
        <span class="linkedin-title">${post.title}</span>
        <span class="linkedin-summary">${post.preview}</span>
      </span>
    </a>
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
  chatName.textContent = "Me";
  groupAvatar.textContent = "M";
  phone.classList.remove("post-chat");
  addMessage("agent", "Me", "Testing Meeting Scheduler Extension");
  addMessage("user", "Clely", "Testing Meeting Scheduler Extension");
  addMessage("system", "Sat, Feb 28 at 6:01 PM", "Tap +, choose Meeting Scheduler, then find a time.");
}

function showChat() {
  phone.classList.add("in-chat");
  phone.classList.remove("post-chat");
  setInitialConversation();
  hideAppDrawer();
  form.hidden = true;
  phone.classList.remove("sheet-open");
  updateSheetOffset(sheetCollapsedOffset);
  scrollThreadToLatest();
  setGuideStep(1);
}

function showLinkedInPostChat(post) {
  phone.classList.add("in-chat");
  phone.classList.add("post-chat");
  hideAppDrawer();
  form.hidden = true;
  phone.classList.remove("sheet-open");
  updateSheetOffset(sheetCollapsedOffset);
  chatName.textContent = post.title;
  groupAvatar.textContent = "in";
  thread.innerHTML = "";
  addMessage("system", "LinkedIn", post.subtitle);
  addLinkedInPreview(post);
  setGuideStep(0);
}

function showMessagesList() {
  form.hidden = true;
  appDrawer.hidden = true;
  phone.classList.remove("sheet-open");
  phone.classList.remove("post-chat");
  phone.classList.remove("in-chat");
  updateSheetOffset(sheetCollapsedOffset);
  setGuideStep(0);
}

function closeFilterMenu() {
  filterMenu.hidden = true;
  filterMenuButton.setAttribute("aria-expanded", "false");
}

function toggleFilterMenu() {
  filterMenu.hidden = !filterMenu.hidden;
  filterMenuButton.setAttribute("aria-expanded", String(!filterMenu.hidden));
}

function showAppDrawer() {
  appDrawer.hidden = false;
  form.hidden = true;
  phone.classList.remove("sheet-open");
  setGuideStep(2);
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
  setGuideStep(3);
}

function closeSchedulerSheet() {
  form.hidden = true;
  appDrawer.hidden = true;
  phone.classList.remove("sheet-open");
  updateSheetOffset(sheetCollapsedOffset);
  setGuideStep(2);
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
  setGuideStep(4);
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
    setGuideStep(5);
  } catch (error) {
    removeTypingIndicator();
    resultStatus.textContent = "Error";
    slotOutput.textContent = error.message;
    addMessage("system", "Error", error.message);
    setGuideStep(3);
  } finally {
    runButton.disabled = false;
    setGuideStep(guideStepIndex);
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
openDemoChatButton.addEventListener("click", showChat);
linkedinPostButtons.forEach((button) => {
  button.addEventListener("click", () => showLinkedInPostChat(linkedInPosts[button.dataset.postId]));
});
filterMenuButton.addEventListener("click", toggleFilterMenu);
filterMenu.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-filter-action]");
  if (!actionButton) {
    return;
  }

  closeFilterMenu();
  if (actionButton.dataset.filterAction === "scheduler") {
    showChat();
    return;
  }
  if (actionButton.dataset.filterAction === "linkedin") {
    const firstPostButton = document.querySelector(".linkedin-row");
    firstPostButton?.focus();
  }
});
backButton.addEventListener("click", showMessagesList);
closeSheetButton.addEventListener("pointerdown", startSheetDrag);
closeSheetButton.addEventListener("pointermove", dragSheet);
closeSheetButton.addEventListener("pointerup", finishSheetDrag);
closeSheetButton.addEventListener("pointercancel", finishSheetDrag);
form.addEventListener("submit", runDemo);
guideNext.addEventListener("click", advanceGuide);
setInitialConversation();
setGuideStep(0);
checkHealth();
