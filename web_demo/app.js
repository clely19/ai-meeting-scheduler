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
const runAiDemoButton = document.querySelector("#run-ai-demo");
const closeSheetButton = document.querySelector("#close-sheet");
const backendStatus = document.querySelector("#backend-status");
const sessionId = document.querySelector("#session-id");
const resultStatus = document.querySelector("#result-status");
const modeStatus = document.querySelector("#mode-status");
const slotOutput = document.querySelector("#slot-output");
const roundsOutput = document.querySelector("#rounds-output");
const aiUpgradeCard = document.querySelector("#ai-upgrade-card");
const geminiApiKeyInput = document.querySelector("#gemini-api-key");
const demoModeCard = document.querySelector("#demo-mode-card");
const aiModeCard = document.querySelector("#ai-mode-card");
const resultModeLabel = document.querySelector("#result-mode-label");
const chatName = document.querySelector(".chat-title h1");
const groupAvatar = document.querySelector(".group-avatar");
const guideStepCount = document.querySelector("#guide-step-count");
const guidePanelCount = document.querySelector("#guide-panel-count");
const guideTitle = document.querySelector("#guide-title");
const guideCopy = document.querySelector("#guide-copy");
const guidePanelCopy = document.querySelector("#guide-panel-copy");
const guideNext = document.querySelector("#guide-next");

const dateRangeStart = "2026-03-02T09:00:00";
const dateRangeEnd = "2026-03-06T18:00:00";
const geminiKeyStorageName = "meetingSchedulerGeminiKey";
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
    copy: "The first run is Demo Mode: mock calendars, deterministic agents, and no model API key.",
    action: "Continue: Run demo mode"
  },
  {
    title: "Live negotiation running",
    copy: "The host and invitee agents are registering users, proposing slots, and saving the session.",
    action: "Running..."
  },
  {
    title: "Review the result",
    copy: "Read the suggested slot and negotiation rounds. Then choose whether to rerun the same workflow with your own Gemini key.",
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
  "vibe-coding": {
    title: "Vibe Coding",
    subtitle: "Vibe coding, building in public, AI",
    url: "https://www.linkedin.com/posts/clely-fernandes_vibecoding-buildinginpublic-ai-share-7441626369769308160-J6gb/?utm_source=share&utm_medium=member_desktop&rcm=ACoAADcM6rYBYDfuAouEWwFrlY1giwgoCPkgrkI",
    preview: "I've been trying to build something new. A skill, and a project.",
    image: "/demo/assets/linkedin-vibe-coding-preview.png",
    imageAlt: "LinkedIn post preview about vibe coding"
  }
};

function setGuideStep(index) {
  guideStepIndex = Math.max(0, Math.min(guideSteps.length - 1, index));
  const step = guideSteps[guideStepIndex];
  phone.classList.remove(...guideSteps.map((_, stepIndex) => `guide-step-${stepIndex}`));
  phone.classList.add(`guide-step-${guideStepIndex}`);
  guideStepCount.textContent = `Step ${guideStepIndex + 1} of ${guideSteps.length}`;
  guidePanelCount.textContent = guideStepCount.textContent;
  guideTitle.textContent = step.title;
  guideCopy.textContent = step.copy;
  guidePanelCopy.textContent = guideStepIndex === 5
    ? "The walkthrough is complete. Review the live result or start over."
    : "Follow the highlighted action inside the phone.";
  guideNext.textContent = step.action;
  guideNext.disabled = guideStepIndex === 4 || (runButton.disabled && guideStepIndex === 3);
}

function setModePresentation(useAi) {
  const modeName = useAi ? "Personalized AI Mode" : "Demo Mode";
  modeStatus.textContent = modeName;
  resultModeLabel.textContent = modeName;
  demoModeCard.classList.toggle("active", !useAi);
  aiModeCard.classList.toggle("active", useAi);
  runButton.textContent = "Run Demo Mode";
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
        <span>LinkedIn</span>
        <strong>Post</strong>
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
  setModePresentation(false);
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
  await runSchedulingFlow({ useAi: false });
}

async function runPersonalizedAiDemo() {
  const geminiApiKey = geminiApiKeyInput.value.trim();
  if (!geminiApiKey) {
    slotOutput.textContent = "Paste a Gemini API key to run the personalized AI flow.";
    geminiApiKeyInput.focus();
    return;
  }

  sessionStorage.setItem(geminiKeyStorageName, geminiApiKey);
  await runSchedulingFlow({ useAi: true, geminiApiKey });
}

async function runSchedulingFlow({ useAi, geminiApiKey } = { useAi: false }) {
  setModePresentation(useAi);
  runButton.disabled = true;
  runAiDemoButton.disabled = true;
  setGuideStep(4);
  resultStatus.textContent = useAi
    ? "Personalized AI running"
    : "Demo running";
  sessionId.textContent = "Creating";
  slotOutput.textContent = useAi
    ? "Using the same scheduling flow with AI-enabled agents and your Gemini key."
    : "Using mock calendars and deterministic agents. No model API key is used.";
  roundsOutput.innerHTML = "";
  aiUpgradeCard.hidden = true;
  setInitialConversation();

  const meetingTitle = document.querySelector("#meeting-title").value;
  const durationMinutes = Number(
    document.querySelector("input[name='duration-minutes']:checked").value
  );
  const hostStyle = document.querySelector("#host-style").value;
  const [inviteeStyleOne, inviteeStyleTwo] = getInviteeStyles();

  try {
    addMessage("user", "Clely", meetingTitle);
    addAppCard(
      useAi ? "Personalized AI Mode" : "Demo Mode",
      useAi
        ? "Rerunning the same scheduling workflow with your Gemini key for this browser session."
        : "Running the public first-visit flow with mock calendars, deterministic agents, and no model API key."
    );
    const timestamp = new Date().toISOString().slice(11, 19);
    const host = await registerUser(`Demo Host ${timestamp}`, hostStyle);
    const inviteeOne = await registerUser(`Demo Invitee A ${timestamp}`, inviteeStyleOne);
    const inviteeTwo = await registerUser(`Demo Invitee B ${timestamp}`, inviteeStyleTwo);

    addMessage("agent", "Host Agent", `Proposing ${durationMinutes}-minute slots using a ${hostStyle} preference.`);
    addMessage("agent", "Invitee Agents", `Evaluating availability as ${inviteeStyleOne} and ${inviteeStyleTwo} schedulers.`);
    addMessage(
      "system",
      "Mode",
      useAi
        ? "Personalized AI Mode: same workflow, user-provided Gemini key."
        : "Demo Mode: same workflow, mock data, no model key."
    );
    addTypingIndicator();

    const negotiation = await api("/negotiation/start", {
      method: "POST",
      headers: useAi ? { "X-User-Gemini-Key": geminiApiKey } : {},
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
        date_range_end: dateRangeEnd,
        use_ai: useAi
      })
    });

    removeTypingIndicator();
    const saved = await api(`/negotiation/${negotiation.session_id}`);
    sessionId.textContent = negotiation.session_id;
    resultStatus.textContent = `${useAi ? "AI" : "Demo"}: ${negotiation.status.replace("_", " ")}`;
    slotOutput.textContent = formatSlot(negotiation.agreed_slot);
    renderRounds(negotiation.negotiation_logs);

    addAppCard(
      `${negotiation.status.replace("_", " ")}`,
      `Suggested slot: ${formatSlot(negotiation.agreed_slot)}. Completed in ${negotiation.rounds_completed} round(s).`
    );
    addMessage("system", "Saved", `Session status: ${saved.status}.`);
    if (!useAi) {
      aiUpgradeCard.hidden = false;
      addMessage("system", "Demo Mode", "No model API key was used for this run.");
    } else {
      aiUpgradeCard.hidden = true;
      addMessage("system", "Personalized AI Mode", "This run used your Gemini key for AI reasoning.");
    }
    setGuideStep(5);
  } catch (error) {
    removeTypingIndicator();
    resultStatus.textContent = "Error";
    slotOutput.textContent = error.message;
    addMessage("system", "Error", error.message);
    setGuideStep(3);
  } finally {
    runButton.disabled = false;
    runAiDemoButton.disabled = false;
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
runAiDemoButton.addEventListener("click", runPersonalizedAiDemo);
guideNext.addEventListener("click", advanceGuide);
geminiApiKeyInput.value = sessionStorage.getItem(geminiKeyStorageName) || "";
setModePresentation(false);
setInitialConversation();
setGuideStep(0);
checkHealth();
