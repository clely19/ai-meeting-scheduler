const API_BASE = window.location.origin;

const shell = document.querySelector(".shell");
const phone = document.querySelector(".phone");
const thread = document.querySelector("#thread");
const form = document.querySelector("#demo-form");
const appDrawer = document.querySelector("#app-drawer");
const openAppsButton = document.querySelector("#open-apps");
const openSchedulerButton = document.querySelector("#open-scheduler");
const openDemoChatButton = document.querySelector("#open-demo-chat");
const calendarPlanner = document.querySelector("#calendar-planner");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarWeekLabel = document.querySelector("#calendar-week-label");
const calendarWeekHint = document.querySelector("#calendar-week-hint");
const calendarPrevWeekButton = document.querySelector("#calendar-prev-week");
const calendarNextWeekButton = document.querySelector("#calendar-next-week");
const resetCalendarsButton = document.querySelector("#reset-calendars");
const linkedinPostButtons = document.querySelectorAll(".linkedin-row");
const simpleChatButtons = document.querySelectorAll(".simple-chat-row");
const filterMenuButton = document.querySelector("#filter-menu-button");
const filterMenu = document.querySelector("#filter-menu");
const backButton = document.querySelector(".back-pill");
const runButton = document.querySelector("#run-demo");
const runAiDemoButton = document.querySelector("#run-ai-demo");
const closeSheetButton = document.querySelector("#close-sheet");
const scheduleStartDateInput = document.querySelector("#schedule-start-date");
const scheduleStartTimeInput = document.querySelector("#schedule-start-time");
const scheduleEndDateInput = document.querySelector("#schedule-end-date");
const scheduleEndTimeInput = document.querySelector("#schedule-end-time");
const hostStyleSelect = document.querySelector("#host-style");
const inviteeMixSelect = document.querySelector("#invitee-mix");
const meetingPlatformSelect = document.querySelector("#meeting-platform");
const participantSetupOverlay = document.querySelector("#participant-setup-overlay");
const participantSetupForm = document.querySelector("#participant-setup-form");
const participantHostNameInput = document.querySelector("#participant-host-name");
const participantOneNameInput = document.querySelector("#participant-one-name");
const participantTwoNameInput = document.querySelector("#participant-two-name");
const demoCompleteOverlay = document.querySelector("#demo-complete-overlay");
const demoCompleteCopy = document.querySelector("#demo-complete-copy");
const returnInitialDemoButton = document.querySelector("#return-initial-demo");
const reviewCompletedDemoButton = document.querySelector("#review-completed-demo");
const timeWheelElements = document.querySelectorAll(".time-wheel[data-time-input]");
const extensionSubtitle = document.querySelector("#extension-subtitle");
const createStateNode = () => document.createElement("span");
const backendStatus = document.querySelector("#backend-status") || createStateNode();
const sessionId = document.querySelector("#session-id") || createStateNode();
const resultStatus = document.querySelector("#result-status") || createStateNode();
const modeStatus = document.querySelector("#mode-status") || createStateNode();
const slotOutput = document.querySelector("#slot-output") || createStateNode();
const roundsOutput = document.querySelector("#rounds-output") || document.createElement("div");
const aiUpgradeCard = document.querySelector("#ai-upgrade-card") || { hidden: true };
const geminiApiKeyInput = document.querySelector("#gemini-api-key") || {
  value: "",
  focus() {}
};
const demoModeCard = document.querySelector("#demo-mode-card");
const aiModeCard = document.querySelector("#ai-mode-card");
const resultModeLabel = document.querySelector("#result-mode-label") || createStateNode();
const chatName = document.querySelector(".chat-title h1");
const groupAvatar = document.querySelector(".group-avatar");
const schedulerConversationPreview = document.querySelector("#open-demo-chat .conversation-preview");
const styleGuideTitle = document.querySelector("#style-guide-title");
const styleGuideCopy = document.querySelector("#style-guide-copy");
const styleGuideInvitees = document.querySelector("#style-guide-invitees");
const guideStepCount = document.querySelector("#guide-step-count");
const guidePanelCount = document.querySelector("#guide-panel-count") || createStateNode();
const guideTitle = document.querySelector("#guide-title");
const guideCopy = document.querySelector("#guide-copy");
const guidePanelCopy = document.querySelector("#guide-panel-copy") || createStateNode();
const guideNext = document.querySelector("#guide-next");
const guideCallout = document.querySelector("#guide-callout");

const geminiKeyStorageName = "meetingSchedulerGeminiKey";
const schedulerStateStorageName = "meetingSchedulerDemoStateV5";
const maxScheduledMeetings = 3;
let sheetDragStartY = 0;
let sheetDragStartOffset = 162;
let sheetOffset = 162;
let isDraggingSheet = false;
let guideStepIndex = 0;
let guideDelayTimer;
let currentChatMode = "scheduler";
let isRestoringSchedulerChat = false;
let calendarWeekOffset = 0;
let pendingOffscreenMeeting = null;
let participantSetupComplete = false;
const timeWheelScrollTimers = new WeakMap();

const sheetExpandedOffset = 0;
const sheetCollapsedOffset = 162;
const sheetCloseOffset = 270;
const demoWindowDays = 7;
const timeWheelIncrementMinutes = 15;
const timeWheelStartMinutes = 9 * 60;
const balancedStyleBufferMinutes = 30;
const fallbackSearchDays = 42;
const calendarHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const calendarParticipants = [
  {
    key: "host",
    defaultName: "Alex",
    defaultBusy: ["0-10", "1-14", "3-11", "4-15"]
  },
  {
    key: "inviteeOne",
    defaultName: "Taylor",
    defaultBusy: ["0-9", "2-13", "2-14", "4-10"]
  },
  {
    key: "inviteeTwo",
    defaultName: "Morgan",
    defaultBusy: ["1-10", "1-11", "3-15", "5-12"]
  }
];
const schedulingStyleDetails = {
  early: {
    label: "Early style",
    shortLabel: "Early",
    copy: "Prioritizes the first available time that works, so meetings land as soon as the group has overlap.",
    result: "ranked the earliest matching openings first"
  },
  balanced: {
    label: "Balanced style",
    shortLabel: "Balanced",
    copy: "Adds breathing room around busy calendar blocks and avoids squeezing people between back-to-back commitments.",
    result: "protected breathing room around existing calendar blocks"
  },
  flexible: {
    label: "Flexible style",
    shortLabel: "Flexible",
    copy: "Accepts later or future openings if they create a calmer, lower-density schedule for the group.",
    result: "was willing to move later to find a lower-density time"
  }
};
let calendarBusyCells = {};
let scheduledMeetings = [];
let schedulerMessages = [];
const guideSteps = [
  {
    title: "Open iMessage apps",
    copy: "Tap the highlighted + button to reveal the iMessage app drawer.",
    action: "Tap the highlighted +"
  },
  {
    title: "Choose Meeting Scheduler",
    copy: "Choose the highlighted Meeting Scheduler row to open the extension sheet.",
    action: "Choose Meeting Scheduler"
  },
  {
    title: "Review meeting details",
    copy: "Block busy calendar times if you want, then use the highlighted Run Demo Mode button.",
    action: "Run Demo Mode"
  },
  {
    title: "Live negotiation running",
    copy: "The host and invitee agents are registering users, proposing slots, and saving the session.",
    action: "Running..."
  },
  {
    title: "Demo complete",
    copy: "Review the selected time and round-by-round explanation in the group chat.",
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
const simpleChats = {
  "launch-plan": {
    title: "Launch Plan",
    avatar: "2",
    subtitle: "Clely and Maya",
    messages: [
      ["agent", "Maya", "I added the checklist for the demo walkthrough."],
      ["user", "Clely", "Perfect. I want the first screen to feel less crowded."],
      ["agent", "Maya", "Agreed. The scheduler should feel like something the user opens on purpose."]
    ]
  },
  "design-review": {
    title: "Design Review",
    avatar: "4",
    subtitle: "Clely, Maya, Jordan, Alex",
    messages: [
      ["agent", "Jordan", "The calendar view is ready to test beside the Messages app."],
      ["agent", "Alex", "The main flow should stay focused on the chat."],
      ["user", "Clely", "Let's keep the calendars useful but secondary."]
    ]
  }
};

function cleanParticipantName(value, fallback) {
  const name = String(value || "").trim();
  return name || fallback;
}

function getParticipantNames() {
  return {
    host: cleanParticipantName(
      participantHostNameInput?.value,
      "Alex"
    ),
    inviteeOne: cleanParticipantName(
      participantOneNameInput?.value,
      "Taylor"
    ),
    inviteeTwo: cleanParticipantName(
      participantTwoNameInput?.value,
      "Morgan"
    )
  };
}

function getParticipantNameList() {
  const names = getParticipantNames();
  return `${names.host}, ${names.inviteeOne}, and ${names.inviteeTwo}`;
}

function getStyleDetail(style) {
  return schedulingStyleDetails[style] || schedulingStyleDetails.balanced;
}

function getStyleLabels(styles) {
  return styles.map((style) => getStyleDetail(style).shortLabel).join(" + ");
}

function getInviteeMixDescription(styles = getInviteeStyles()) {
  const [firstStyle, secondStyle] = styles;
  return `Invitee agents are using ${getStyleLabels(styles)} preferences: ${getStyleDetail(firstStyle).result}, while the other ${getStyleDetail(secondStyle).result}.`;
}

function getSchedulingStyleReason(hostStyle, inviteeStyles, status) {
  const statusText = status
    ? ` The final status was ${String(status).toLowerCase().replace("_", " ")}.`
    : "";
  const hasBalancedStyle = [hostStyle, ...inviteeStyles].includes("balanced");
  const bufferText = hasBalancedStyle
    ? ` Balanced calendars also keep a ${balancedStyleBufferMinutes}-minute buffer around busy blocks.`
    : "";
  return `Why this time: the host used ${getStyleDetail(hostStyle).label.toLowerCase()}, so it ${getStyleDetail(hostStyle).result}. The invitees used ${getStyleLabels(inviteeStyles)} preferences, so the selected slot still had to be free for everyone.${bufferText}${statusText}`;
}

function updateStyleGuide() {
  const hostStyle = hostStyleSelect?.value || "early";
  const inviteeStyles = getInviteeStyles();
  const detail = getStyleDetail(hostStyle);

  if (styleGuideTitle) {
    styleGuideTitle.textContent = detail.label;
  }
  if (styleGuideCopy) {
    styleGuideCopy.textContent = detail.copy;
  }
  if (styleGuideInvitees) {
    styleGuideInvitees.textContent = getInviteeMixDescription(inviteeStyles);
  }
}

function setParticipantNameInputs(names = {}) {
  const defaults = {
    host: "Alex",
    inviteeOne: "Taylor",
    inviteeTwo: "Morgan"
  };
  if (participantHostNameInput) {
    participantHostNameInput.value = cleanParticipantName(
      names.host,
      defaults.host
    );
  }
  if (participantOneNameInput) {
    participantOneNameInput.value = cleanParticipantName(
      names.inviteeOne,
      defaults.inviteeOne
    );
  }
  if (participantTwoNameInput) {
    participantTwoNameInput.value = cleanParticipantName(
      names.inviteeTwo,
      defaults.inviteeTwo
    );
  }
}

function updateSchedulerConversationPreview() {
  if (!schedulerConversationPreview) {
    return;
  }

  schedulerConversationPreview.textContent = `${getParticipantNameList()}: tap + to find a common time.`;
}

function shouldShowParticipantSetup() {
  return currentChatMode === "scheduler" &&
    !participantSetupComplete &&
    scheduledMeetings.length === 0;
}

function showParticipantSetupIfNeeded() {
  if (!participantSetupOverlay) {
    return;
  }

  participantSetupOverlay.hidden = !shouldShowParticipantSetup();
  if (!participantSetupOverlay.hidden) {
    participantHostNameInput?.focus();
  }
}

function hideParticipantSetup() {
  if (participantSetupOverlay) {
    participantSetupOverlay.hidden = true;
  }
}

function showDemoCompleteOverlay() {
  if (!demoCompleteOverlay) {
    return;
  }

  if (demoCompleteCopy) {
    demoCompleteCopy.textContent = `All three meetings are visible on the calendars for ${getParticipantNameList()}. You can restart the demo or go back and review the completed chat.`;
  }
  demoCompleteOverlay.hidden = false;
  returnInitialDemoButton?.focus();
}

function hideDemoCompleteOverlay() {
  if (demoCompleteOverlay) {
    demoCompleteOverlay.hidden = true;
  }
}

function refreshEditableParticipantPresentation() {
  if (!scheduledMeetings.length) {
    schedulerMessages = getInitialSchedulerMessages();
    saveSchedulerState();
    if (currentChatMode === "scheduler") {
      renderSchedulerConversation();
    }
  }

  if (!calendarPlanner?.hidden) {
    renderCalendarPlanner();
  }
  updateSchedulerConversationPreview();
  applyHostStyleToScheduler();
}

function getInitialSchedulerMessages() {
  const names = getParticipantNames();
  return [
    {
      type: "message",
      kind: "system",
      author: "Group",
      text: getParticipantNameList()
    },
    {
      type: "message",
      kind: "agent",
      author: names.inviteeOne,
      text: `Hi ${names.host}, I would love to find a time that works for everyone this week.`
    },
    {
      type: "message",
      kind: "agent",
      author: names.inviteeTwo,
      text: "Same here. My calendar is a little packed, so overlap would really help."
    },
    {
      type: "message",
      kind: "user",
      author: names.host,
      text: "I'll try the Meeting Scheduler and let it compare our calendars."
    },
    {
      type: "message",
      kind: "agent",
      author: "Meeting Scheduler",
      text: "Sounds good. Tap + below when you're ready, choose Meeting Scheduler, and I will walk through the options with you."
    }
  ];
}

function loadSchedulerState() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(schedulerStateStorageName) || "{}"
    );
    setParticipantNameInputs(saved.participantNames || {});
    scheduledMeetings = Array.isArray(saved.scheduledMeetings)
      ? saved.scheduledMeetings.slice(0, maxScheduledMeetings)
      : [];
    participantSetupComplete = Boolean(saved.participantSetupComplete) ||
      scheduledMeetings.length > 0;
    schedulerMessages = Array.isArray(saved.messages) && saved.messages.length
      ? saved.messages
      : getInitialSchedulerMessages();
  } catch {
    setParticipantNameInputs();
    scheduledMeetings = [];
    participantSetupComplete = false;
    schedulerMessages = getInitialSchedulerMessages();
  }
  updateSchedulerConversationPreview();
}

function saveSchedulerState() {
  localStorage.setItem(
    schedulerStateStorageName,
    JSON.stringify({
      scheduledMeetings,
      messages: schedulerMessages,
      participantNames: getParticipantNames(),
      participantSetupComplete
    })
  );
}

function resetSchedulerState() {
  setParticipantNameInputs();
  participantSetupComplete = false;
  scheduledMeetings = [];
  schedulerMessages = getInitialSchedulerMessages();
  hideDemoCompleteOverlay();
  saveSchedulerState();
  updateSchedulerConversationPreview();
}

function setGuideVisibility(visible) {
  shell?.classList.toggle("guide-visible", visible);
  if (visible) {
    window.requestAnimationFrame(positionGuideCallout);
  }
}

function scheduleGuideReveal(delay = 3600) {
  window.clearTimeout(guideDelayTimer);
  setGuideVisibility(false);
  guideDelayTimer = window.setTimeout(() => {
    if (!phone.classList.contains("post-chat")) {
      setGuideVisibility(true);
    }
  }, delay);
}

function setGuideStep(index) {
  guideStepIndex = Math.max(0, Math.min(guideSteps.length - 1, index));
  const step = guideSteps[guideStepIndex];
  shell?.classList.remove(...guideSteps.map((_, stepIndex) => `guide-step-${stepIndex}`));
  shell?.classList.add(`guide-step-${guideStepIndex}`);
  phone.classList.remove(...guideSteps.map((_, stepIndex) => `guide-step-${stepIndex}`));
  phone.classList.add(`guide-step-${guideStepIndex}`);
  guideStepCount.textContent = `Step ${guideStepIndex + 1} of ${guideSteps.length}`;
  guidePanelCount.textContent = guideStepCount.textContent;
  guideTitle.textContent = step.title;
  guideCopy.textContent = step.copy;
  guidePanelCopy.textContent = guideStepIndex === 4
    ? "Demo Mode is complete. The result is visible inside the chat."
    : "Follow the highlighted action inside the phone.";
  guideNext.textContent = step.action;
  guideNext.disabled = guideStepIndex === 3 || (runButton.disabled && guideStepIndex === 2);
  window.requestAnimationFrame(positionGuideCallout);
}

function getGuideTarget() {
  if (guideStepIndex === 0) {
    return openAppsButton;
  }
  if (guideStepIndex === 1) {
    return openSchedulerButton;
  }
  if (guideStepIndex === 2) {
    return runButton;
  }
  if (guideStepIndex === 3 || guideStepIndex === 4) {
    return thread;
  }
  return null;
}

function clearGuideCalloutPosition() {
  if (!guideCallout) {
    return;
  }
  guideCallout.style.left = "";
  guideCallout.style.right = "";
  guideCallout.style.top = "";
  guideCallout.style.bottom = "";
}

function positionGuideCallout() {
  if (!guideCallout || !shell || !window.matchMedia("(min-width: 881px)").matches) {
    clearGuideCalloutPosition();
    return;
  }

  const target = getGuideTarget();
  if (!target) {
    clearGuideCalloutPosition();
    return;
  }

  const shellRect = shell.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const calloutRect = guideCallout.getBoundingClientRect();

  if (!targetRect.width || !targetRect.height || !calloutRect.width || !calloutRect.height) {
    clearGuideCalloutPosition();
    return;
  }

  const shellLeft = shellRect.left;
  const minLeft = 12;
  const maxLeft = shellRect.width - calloutRect.width - 12;
  const minTop = 12;
  const maxTop = shellRect.height - calloutRect.height - 12;
  const isCompactTarget = guideStepIndex === 0 || guideStepIndex === 1;
  const targetCenterLeft = targetRect.left - shellLeft + (targetRect.width / 2) - (calloutRect.width / 2);
  const targetSideLeft = targetRect.right - shellLeft + 12;
  const left = Math.min(
    Math.max(isCompactTarget ? targetSideLeft : targetCenterLeft, minLeft),
    maxLeft
  );
  const top = Math.min(
    Math.max(targetRect.top - shellRect.top - calloutRect.height - 16, minTop),
    maxTop
  );

  guideCallout.style.left = `${Math.round(left)}px`;
  guideCallout.style.right = "auto";
  guideCallout.style.top = `${Math.round(top)}px`;
  guideCallout.style.bottom = "auto";
}

function setModePresentation(useAi) {
  const modeName = useAi ? "Personalized AI Mode" : "Demo Mode";
  modeStatus.textContent = modeName;
  resultModeLabel.textContent = modeName;
  demoModeCard?.classList.toggle("active", !useAi);
  aiModeCard?.classList.toggle("active", useAi);
  runButton.textContent = "Run Demo Mode";
}

function formatLocalDateTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDateInputValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-");
}

function formatTimeInputValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function minutesToTimeInputValue(totalMinutes) {
  const minutesInDay = 24 * 60;
  const normalizedMinutes = ((totalMinutes % minutesInDay) + minutesInDay) %
    minutesInDay;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timeInputValueToMinutes(value) {
  const [hoursText, minutesText] = String(value || "00:00").split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return 0;
  }

  return hours * 60 + minutes;
}

function formatTimeWheelLabel(value) {
  const [hoursText, minutesText] = value.split(":");
  const date = new Date();
  date.setHours(Number(hoursText), Number(minutesText), 0, 0);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getTimeWheelOptions() {
  return Array.from(
    { length: Math.floor((24 * 60) / timeWheelIncrementMinutes) },
    (_, index) => minutesToTimeInputValue(
      timeWheelStartMinutes + index * timeWheelIncrementMinutes
    )
  );
}

function updateTimeWheelSelection(input, options = {}) {
  if (!input) {
    return;
  }

  const wheel = document.querySelector(`.time-wheel[data-time-input="${input.id}"]`);
  if (!wheel) {
    return;
  }

  wheel.querySelectorAll(".time-wheel-option").forEach((button) => {
    const selected = button.dataset.timeValue === input.value;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
    if (selected && options.scroll !== false) {
      requestAnimationFrame(() => {
        button.scrollIntoView({
          block: "center"
        });
      });
    }
  });
}

function selectCenteredTimeWheelOption(wheel, input) {
  const buttons = Array.from(wheel.querySelectorAll(".time-wheel-option"));
  if (!buttons.length || !input) {
    return;
  }

  const wheelCenter = wheel.getBoundingClientRect().top +
    wheel.getBoundingClientRect().height / 2;
  const closestButton = buttons.reduce((closest, button) => {
    const rect = button.getBoundingClientRect();
    const distance = Math.abs((rect.top + rect.height / 2) - wheelCenter);
    if (!closest || distance < closest.distance) {
      return {
        button,
        distance
      };
    }
    return closest;
  }, null)?.button;

  if (closestButton?.dataset.timeValue && closestButton.dataset.timeValue !== input.value) {
    setTimeInputValue(input, closestButton.dataset.timeValue, {
      scroll: false
    });
  }
}

function setTimeInputValue(input, value, options = {}) {
  if (!input) {
    return;
  }

  input.value = value;
  updateTimeWheelSelection(input, {
    scroll: options.scroll
  });
  if (options.dispatch !== false) {
    input.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  }
}

function initializeTimeWheels() {
  const options = getTimeWheelOptions();
  timeWheelElements.forEach((wheel) => {
    const input = document.querySelector(`#${wheel.dataset.timeInput}`);
    wheel.innerHTML = "";
    options.forEach((value) => {
      const button = document.createElement("button");
      button.className = "time-wheel-option";
      button.type = "button";
      button.setAttribute("role", "option");
      button.dataset.timeValue = value;
      button.textContent = formatTimeWheelLabel(value);
      button.addEventListener("click", () => {
        setTimeInputValue(input, value);
      });
      wheel.append(button);
    });
    wheel.addEventListener("scroll", () => {
      window.clearTimeout(timeWheelScrollTimers.get(wheel));
      timeWheelScrollTimers.set(
        wheel,
        window.setTimeout(() => selectCenteredTimeWheelOption(wheel, input), 90)
      );
    });
    updateTimeWheelSelection(input);
  });
}

function getDemoDateRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(9, 0, 0, 0);
  if (now.getHours() >= 17) {
    start.setDate(start.getDate() + 1);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + demoWindowDays);
  end.setHours(18, 0, 0, 0);

  return {
    start: formatLocalDateTime(start),
    end: formatLocalDateTime(end)
  };
}

function initializeScheduleWindowControls() {
  const { start, end } = getDemoDateRange();
  const startDate = new Date(start);
  const endDate = new Date(end);

  scheduleStartDateInput.value = formatDateInputValue(startDate);
  setTimeInputValue(scheduleStartTimeInput, formatTimeInputValue(startDate), {
    dispatch: false
  });
  scheduleEndDateInput.value = formatDateInputValue(endDate);
  const defaultEndTime = new Date(startDate);
  defaultEndTime.setMinutes(defaultEndTime.getMinutes() + 60);
  setTimeInputValue(scheduleEndTimeInput, formatTimeInputValue(defaultEndTime), {
    dispatch: false
  });
}

function getSelectedDateRange() {
  const start = new Date(`${scheduleStartDateInput.value}T${scheduleStartTimeInput.value || "09:00"}:00`);
  const end = new Date(`${scheduleEndDateInput.value}T${scheduleEndTimeInput.value || "18:00"}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Choose a valid scheduling date and time window.");
  }

  if (end <= start) {
    throw new Error("The schedule end must be after the schedule start.");
  }

  return {
    start: formatLocalDateTime(start),
    end: formatLocalDateTime(end)
  };
}

function getSelectedDurationMinutes() {
  const startMinutes = timeInputValueToMinutes(scheduleStartTimeInput?.value);
  let endMinutes = timeInputValueToMinutes(scheduleEndTimeInput?.value);
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return Math.max(timeWheelIncrementMinutes, endMinutes - startMinutes);
}

function getSelectedTimeWindowForDate(date) {
  const startMinutes = timeInputValueToMinutes(scheduleStartTimeInput?.value);
  let endMinutes = timeInputValueToMinutes(scheduleEndTimeInput?.value);
  const start = new Date(date);
  start.setHours(
    Math.floor(startMinutes / 60),
    startMinutes % 60,
    0,
    0
  );

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + (endMinutes - startMinutes));

  return {
    start,
    end
  };
}

function setScheduleWindowFromSlot(slot) {
  const start = new Date(slot?.start);
  const end = new Date(slot?.end);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return false;
  }

  scheduleStartDateInput.value = formatDateInputValue(start);
  setTimeInputValue(scheduleStartTimeInput, formatTimeInputValue(start), {
    dispatch: false
  });
  scheduleEndDateInput.value = formatDateInputValue(end);
  setTimeInputValue(scheduleEndTimeInput, formatTimeInputValue(end), {
    dispatch: false
  });
  [scheduleStartDateInput, scheduleEndDateInput].forEach((input) => {
    input?.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  });
  return true;
}

function getSelectedTimeWindowBusyBlocks(dateRange) {
  const rangeStart = new Date(dateRange.start);
  const rangeEnd = new Date(dateRange.end);
  if (
    Number.isNaN(rangeStart.getTime()) ||
    Number.isNaN(rangeEnd.getTime())
  ) {
    return [];
  }

  const busyBlocks = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= rangeEnd) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const selectedWindow = getSelectedTimeWindowForDate(cursor);
    const blockedBeforeStart = new Date(Math.max(
      dayStart.getTime(),
      rangeStart.getTime()
    ));
    const blockedBeforeEnd = new Date(Math.min(
      selectedWindow.start.getTime(),
      rangeEnd.getTime()
    ));
    if (blockedBeforeEnd > blockedBeforeStart) {
      busyBlocks.push({
        start: formatLocalDateTime(blockedBeforeStart),
        end: formatLocalDateTime(blockedBeforeEnd),
        title: "Outside selected meeting time"
      });
    }

    const blockedAfterStart = new Date(Math.max(
      selectedWindow.end.getTime(),
      rangeStart.getTime()
    ));
    const blockedAfterEnd = new Date(Math.min(
      dayEnd.getTime(),
      rangeEnd.getTime()
    ));
    if (blockedAfterEnd > blockedAfterStart) {
      busyBlocks.push({
        start: formatLocalDateTime(blockedAfterStart),
        end: formatLocalDateTime(blockedAfterEnd),
        title: "Outside selected meeting time"
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return busyBlocks;
}

function getDateRangeDays(dateRange) {
  const rangeStart = dateRange?.start ? new Date(dateRange.start) : null;
  const rangeEnd = dateRange?.end ? new Date(dateRange.end) : null;
  if (
    !rangeStart ||
    !rangeEnd ||
    Number.isNaN(rangeStart.getTime()) ||
    Number.isNaN(rangeEnd.getTime())
  ) {
    return getDemoWeekDays();
  }

  const days = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const lastDay = new Date(rangeEnd);
  lastDay.setHours(0, 0, 0, 0);

  while (cursor <= lastDay) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getBusyBlocksFromCells(participantKey, days) {
  return Array.from(calendarBusyCells[participantKey] || [])
    .flatMap((cellKey) => {
      const [dayIndexText, hourText] = cellKey.split("-");
      const dayIndex = Number(dayIndexText);
      const hour = Number(hourText);
      if (Number.isNaN(dayIndex) || Number.isNaN(hour)) {
        return [];
      }

      return days
        .filter((day) => day.getDay() === dayIndex + 1)
        .map((day) => {
          const start = new Date(day);
          start.setHours(hour, 0, 0, 0);
          const end = new Date(start);
          end.setHours(hour + 1, 0, 0, 0);

          return {
            start: formatLocalDateTime(start),
            end: formatLocalDateTime(end),
            title: "Busy"
          };
        });
    });
}

function intervalsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart < secondEnd && firstEnd > secondStart;
}

function formatShortTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getParticipantWindowConflicts(participant, day, windowStart, windowEnd) {
  const days = getCalendarWeekDays(0);
  const dayIndex = days.findIndex((candidate) => (
    candidate.toDateString() === day.toDateString()
  ));
  const conflicts = [];

  if (dayIndex >= 0) {
    Array.from(calendarBusyCells[participant.key] || []).forEach((cellKey) => {
      const [cellDayIndexText, hourText] = cellKey.split("-");
      if (Number(cellDayIndexText) !== dayIndex) {
        return;
      }

      const hour = Number(hourText);
      if (Number.isNaN(hour)) {
        return;
      }

      const busyStart = new Date(day);
      busyStart.setHours(hour, 0, 0, 0);
      const busyEnd = new Date(busyStart);
      busyEnd.setHours(hour + 1, 0, 0, 0);
      if (intervalsOverlap(windowStart, windowEnd, busyStart, busyEnd)) {
        conflicts.push(formatShortTime(busyStart));
      }
    });
  }

  scheduledMeetings.forEach((meeting) => {
    const busyStart = new Date(meeting.start);
    const busyEnd = new Date(meeting.end);
    if (
      Number.isNaN(busyStart.getTime()) ||
      Number.isNaN(busyEnd.getTime()) ||
      !intervalsOverlap(windowStart, windowEnd, busyStart, busyEnd)
    ) {
      return;
    }

    conflicts.push(`meeting ${meeting.number}`);
  });

  return conflicts;
}

function getEarlierWindowExplanation(slot) {
  if (!slot?.start) {
    return "";
  }

  let dateRange;
  try {
    dateRange = getSelectedDateRange();
  } catch {
    return "";
  }

  const rangeStart = new Date(dateRange.start);
  const selectedStart = new Date(slot.start);
  if (
    Number.isNaN(rangeStart.getTime()) ||
    Number.isNaN(selectedStart.getTime())
  ) {
    return "";
  }

  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const selectedDay = new Date(selectedStart);
  selectedDay.setHours(0, 0, 0, 0);
  const skippedDays = [];

  while (cursor < selectedDay) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      const { start, end } = getSelectedTimeWindowForDate(cursor);
      const dayConflicts = calendarParticipants
        .map((participant) => {
          const participantName = getParticipantNames()[participant.key] ||
            participant.defaultName;
          const conflicts = getParticipantWindowConflicts(
            participant,
            cursor,
            start,
            end
          );
          return conflicts.length
            ? `${participantName} at ${conflicts.slice(0, 2).join(" and ")}`
            : "";
        })
        .filter(Boolean);

      if (dayConflicts.length) {
        skippedDays.push(`${formatDayHeader(cursor)} had ${dayConflicts.join(", ")}`);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (!skippedDays.length) {
    return "";
  }

  return ` Earlier windows were skipped because ${skippedDays.slice(0, 2).join("; ")}.`;
}

function applyHostStyleToScheduler() {
  const style = hostStyleSelect?.value || "early";
  const names = getParticipantNames();

  extensionSubtitle.textContent = `Hi ${names.host} · ${style} style`;

  if (!calendarPlanner?.hidden) {
    renderCalendarPlanner();
  }
}

function getDemoWeekDays() {
  return getCalendarWeekDays(calendarWeekOffset);
}

function getCalendarWeekDays(weekOffset = 0) {
  let start;
  try {
    ({ start } = getSelectedDateRange());
  } catch {
    ({ start } = getDemoDateRange());
  }
  const startDate = new Date(start);
  startDate.setDate(startDate.getDate() + weekOffset * demoWindowDays);
  return Array.from({ length: demoWindowDays }, (_, dayIndex) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayIndex);
    return date;
  });
}

function getMeetingWeekOffset(meeting) {
  if (!meeting?.start) {
    return 0;
  }

  const baseWeek = getCalendarWeekDays(0);
  const firstDay = baseWeek[0];
  const meetingStart = new Date(meeting.start);
  if (!firstDay || Number.isNaN(meetingStart.getTime())) {
    return 0;
  }

  const dayDelta = Math.floor(
    (meetingStart - firstDay) / (1000 * 60 * 60 * 24)
  );
  return Math.floor(dayDelta / demoWindowDays);
}

function isMeetingInViewedWeek(meeting) {
  if (!meeting?.start || !meeting?.end) {
    return false;
  }

  const days = getDemoWeekDays();
  const firstDay = new Date(days[0]);
  const lastDay = new Date(days[days.length - 1]);
  firstDay.setHours(0, 0, 0, 0);
  lastDay.setHours(23, 59, 59, 999);

  const meetingStart = new Date(meeting.start);
  const meetingEnd = new Date(meeting.end);
  return meetingStart <= lastDay && meetingEnd >= firstDay;
}

function formatDayHeader(date) {
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function resetCalendarBusyCells() {
  calendarBusyCells = Object.fromEntries(
    calendarParticipants.map((participant) => [
      participant.key,
      new Set(participant.defaultBusy)
    ])
  );
}

function getBusyBufferMinutesForStyle(style) {
  return style === "balanced" ? balancedStyleBufferMinutes : 0;
}

function applyBusyBuffer(blocks, bufferMinutes, dateRange) {
  if (!bufferMinutes) {
    return blocks;
  }

  const rangeStart = dateRange?.start ? new Date(dateRange.start) : null;
  const rangeEnd = dateRange?.end ? new Date(dateRange.end) : null;
  const hasValidRange = rangeStart &&
    rangeEnd &&
    !Number.isNaN(rangeStart.getTime()) &&
    !Number.isNaN(rangeEnd.getTime());

  return blocks.map((block) => {
    const start = new Date(block.start);
    const end = new Date(block.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }

    start.setMinutes(start.getMinutes() - bufferMinutes);
    end.setMinutes(end.getMinutes() + bufferMinutes);
    const clampedStart = hasValidRange && start < rangeStart
      ? rangeStart
      : start;
    const clampedEnd = hasValidRange && end > rangeEnd
      ? rangeEnd
      : end;

    if (clampedEnd <= clampedStart) {
      return null;
    }

    return {
      ...block,
      start: formatLocalDateTime(clampedStart),
      end: formatLocalDateTime(clampedEnd),
      buffer_minutes: bufferMinutes
    };
  }).filter(Boolean);
}

function setCalendarWeekLabel(days) {
  if (!calendarWeekLabel || !days.length) {
    return;
  }

  calendarWeekLabel.textContent = `${formatDayHeader(days[0])} - ${formatDayHeader(days[days.length - 1])}`;
}

function updateCalendarWeekHint(days) {
  if (!calendarWeekHint || !calendarNextWeekButton || !calendarPrevWeekButton) {
    return;
  }

  calendarNextWeekButton.classList.remove("needs-attention");
  calendarPrevWeekButton.classList.remove("needs-attention");

  if (!pendingOffscreenMeeting || isMeetingInViewedWeek(pendingOffscreenMeeting)) {
    calendarWeekHint.hidden = true;
    calendarWeekHint.textContent = "";
    pendingOffscreenMeeting = null;
    return;
  }

  const targetOffset = getMeetingWeekOffset(pendingOffscreenMeeting);
  const isFutureWeek = targetOffset > calendarWeekOffset;
  const button = isFutureWeek
    ? calendarNextWeekButton
    : calendarPrevWeekButton;
  button.classList.add("needs-attention");
  calendarWeekHint.hidden = false;
  calendarWeekHint.textContent = isFutureWeek
    ? `Meeting ${pendingOffscreenMeeting.number} is in a later week. Use › to view it.`
    : `Meeting ${pendingOffscreenMeeting.number} is in an earlier week. Use ‹ to view it.`;
}

function getScheduledMeetingForCell(day, hour) {
  const cellStart = new Date(day);
  cellStart.setHours(hour, 0, 0, 0);
  const cellEnd = new Date(cellStart);
  cellEnd.setHours(hour + 1, 0, 0, 0);

  return scheduledMeetings.find((meeting) => {
    const meetingStart = new Date(meeting.start);
    const meetingEnd = new Date(meeting.end);
    if (
      Number.isNaN(meetingStart.getTime()) ||
      Number.isNaN(meetingEnd.getTime())
    ) {
      return false;
    }

    return meetingStart < cellEnd && meetingEnd > cellStart;
  });
}

function renderScheduledMeetingOverlays(weekGrid, days) {
  const firstHour = calendarHours[0];
  const lastHour = calendarHours[calendarHours.length - 1] + 1;

  scheduledMeetings.forEach((meeting) => {
    const meetingStart = new Date(meeting.start);
    const meetingEnd = new Date(meeting.end);
    if (
      Number.isNaN(meetingStart.getTime()) ||
      Number.isNaN(meetingEnd.getTime())
    ) {
      return;
    }

    const dayIndex = days.findIndex((day) => (
      day.toDateString() === meetingStart.toDateString()
    ));
    if (dayIndex < 0) {
      return;
    }

    const startHourValue = meetingStart.getHours() +
      meetingStart.getMinutes() / 60;
    const endHourValue = meetingEnd.getHours() +
      meetingEnd.getMinutes() / 60;
    const visibleStart = Math.max(startHourValue, firstHour);
    const visibleEnd = Math.min(endHourValue, lastHour);
    if (visibleEnd <= visibleStart) {
      return;
    }
    const startOffset = visibleStart - firstHour;
    const endOffset = visibleEnd - firstHour;
    const startGapCount = Math.floor(startOffset);
    const gapCount = Math.max(
      Math.ceil(endOffset) - Math.floor(startOffset) - 1,
      0
    );

    const overlay = document.createElement("div");
    overlay.className = "scheduled-meeting-block";
    if (dayIndex >= 4) {
      overlay.classList.add("popover-left");
    }
    const label = document.createElement("span");
    label.className = "scheduled-meeting-label";
    label.textContent = meeting.title || `Meeting ${meeting.number}`;
    const time = document.createElement("span");
    time.className = "scheduled-meeting-time";
    time.textContent = `${formatShortTime(meetingStart)}-${formatShortTime(meetingEnd)}`;
    const popover = document.createElement("span");
    popover.className = "scheduled-meeting-popover";
    const popoverKicker = document.createElement("span");
    popoverKicker.className = "popover-kicker";
    popoverKicker.textContent = meeting.platformLabel || "Meeting";
    const popoverTitle = document.createElement("strong");
    popoverTitle.textContent = meeting.title || `Meeting ${meeting.number}`;
    const popoverSlot = document.createElement("span");
    popoverSlot.textContent = formatSlot(meeting);
    const popoverLink = document.createElement("span");
    popoverLink.className = "popover-link";
    popoverLink.textContent = meeting.link || "Meeting link pending";
    popover.append(popoverKicker, popoverTitle, popoverSlot);
    if (meeting.styleReason) {
      const popoverReason = document.createElement("span");
      popoverReason.textContent = meeting.styleReason;
      popover.append(popoverReason);
    }
    popover.append(popoverLink);
    overlay.append(label, time, popover);
    overlay.setAttribute(
      "aria-label",
      getMeetingDetailsText(meeting)
    );
    overlay.tabIndex = 0;
    overlay.style.setProperty("--meeting-day", dayIndex + 1);
    overlay.style.setProperty("--meeting-start-offset", startOffset);
    overlay.style.setProperty(
      "--meeting-start-gap-count",
      startGapCount
    );
    overlay.style.setProperty(
      "--meeting-duration",
      visibleEnd - visibleStart
    );
    overlay.style.setProperty("--meeting-gap-count", gapCount);
    weekGrid.append(overlay);
  });
}

function renderCalendarPlanner() {
  if (!calendarGrid) {
    return;
  }

  const days = getDemoWeekDays();
  setCalendarWeekLabel(days);
  updateCalendarWeekHint(days);
  calendarGrid.innerHTML = "";

  calendarParticipants.forEach((participant) => {
    const participantName = getParticipantNames()[participant.key] ||
      participant.defaultName;
    const calendar = document.createElement("article");
    calendar.className = "participant-calendar";

    const heading = document.createElement("h4");
    heading.textContent = participantName;

    const weekGrid = document.createElement("div");
    weekGrid.className = "week-grid";
    weekGrid.style.setProperty("--calendar-hour-count", calendarHours.length);
    weekGrid.append(document.createElement("span"));

    days.forEach((day) => {
      const header = document.createElement("span");
      header.className = "week-header";
      header.textContent = day.toLocaleDateString([], {
        weekday: "short"
      });
      header.title = formatDayHeader(day);
      weekGrid.append(header);
    });

    calendarHours.forEach((hour) => {
      const time = document.createElement("span");
      time.className = "time-label";
      time.textContent = `${hour}`;
      weekGrid.append(time);

      days.forEach((day, dayIndex) => {
        const cellKey = `${dayIndex}-${hour}`;
        const button = document.createElement("button");
        button.className = "busy-cell";
        button.type = "button";
        button.dataset.participant = participant.key;
        button.dataset.cell = cellKey;
        button.setAttribute(
          "aria-label",
          `${participantName} ${formatDayHeader(day)} ${hour}:00 busy`
        );
        if (calendarBusyCells[participant.key]?.has(cellKey)) {
          button.classList.add("is-busy");
          button.textContent = "Busy";
        } else {
          button.textContent = "Free";
        }
        weekGrid.append(button);
      });
    });

    renderScheduledMeetingOverlays(weekGrid, days);

    calendar.append(heading, weekGrid);
    calendarGrid.append(calendar);
  });
}

function getParticipantBusyBlocks(participantKey, options = {}) {
  const days = getDateRangeDays(options.dateRange);
  const manualBusyBlocks = getBusyBlocksFromCells(participantKey, days);

  const scheduledBusyBlocks = scheduledMeetings.map((meeting) => ({
    start: meeting.start,
    end: meeting.end,
    title: meeting.title,
    link: meeting.link,
    platform: meeting.platformLabel
  }));
  const selectedTimeWindowBusyBlocks = options.dateRange
    ? getSelectedTimeWindowBusyBlocks(options.dateRange)
    : [];
  const bufferedBusyBlocks = applyBusyBuffer(
    [
      ...manualBusyBlocks,
      ...scheduledBusyBlocks
    ],
    options.busyBufferMinutes || 0,
    options.dateRange
  );

  return [
    ...bufferedBusyBlocks,
    ...selectedTimeWindowBusyBlocks,
  ];
}

function getParticipantAvailabilityBlocks(participantKey, options = {}) {
  const days = getDateRangeDays(options.dateRange);
  const manualBusyBlocks = getBusyBlocksFromCells(participantKey, days);
  const scheduledBusyBlocks = scheduledMeetings.map((meeting) => ({
    start: meeting.start,
    end: meeting.end,
    title: meeting.title,
    link: meeting.link,
    platform: meeting.platformLabel
  }));

  return applyBusyBuffer(
    [
      ...manualBusyBlocks,
      ...scheduledBusyBlocks
    ],
    options.busyBufferMinutes || 0,
    options.dateRange
  );
}

function slotOverlapsBusyBlocks(slotStart, slotEnd, busyBlocks) {
  return busyBlocks.some((block) => {
    const busyStart = new Date(block.start);
    const busyEnd = new Date(block.end);
    if (
      Number.isNaN(busyStart.getTime()) ||
      Number.isNaN(busyEnd.getTime())
    ) {
      return false;
    }

    return intervalsOverlap(slotStart, slotEnd, busyStart, busyEnd);
  });
}

function getFallbackSearchRange(selectedRange) {
  const rangeEnd = new Date(selectedRange.end);
  const searchStart = new Date(rangeEnd);
  searchStart.setMinutes(
    Math.ceil(searchStart.getMinutes() / timeWheelIncrementMinutes) *
      timeWheelIncrementMinutes,
    0,
    0
  );

  const searchEnd = new Date(searchStart);
  searchEnd.setDate(searchEnd.getDate() + fallbackSearchDays);
  searchEnd.setHours(calendarHours[calendarHours.length - 1] + 1, 0, 0, 0);

  return {
    start: formatLocalDateTime(searchStart),
    end: formatLocalDateTime(searchEnd)
  };
}

function findNextConsensusFallbackSlot({
  dateRange,
  durationMinutes,
  hostStyle,
  inviteeStyles
}) {
  const searchRange = getFallbackSearchRange(dateRange);
  const searchStart = new Date(searchRange.start);
  const searchEnd = new Date(searchRange.end);
  const participantStyles = {
    host: hostStyle,
    inviteeOne: inviteeStyles[0],
    inviteeTwo: inviteeStyles[1]
  };
  const busyBlocksByParticipant = Object.fromEntries(
    calendarParticipants.map((participant) => [
      participant.key,
      getParticipantAvailabilityBlocks(participant.key, {
        dateRange: searchRange,
        busyBufferMinutes: getBusyBufferMinutesForStyle(
          participantStyles[participant.key]
        )
      })
    ])
  );

  const cursor = new Date(searchStart);
  cursor.setSeconds(0, 0);

  while (cursor < searchEnd) {
    if (cursor.getDay() === 0 || cursor.getDay() === 6) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(calendarHours[0], 0, 0, 0);
      continue;
    }

    const dayStart = new Date(cursor);
    dayStart.setHours(calendarHours[0], 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(calendarHours[calendarHours.length - 1] + 1, 0, 0, 0);

    if (cursor < dayStart) {
      cursor.setTime(dayStart.getTime());
    }
    if (cursor >= dayEnd) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(calendarHours[0], 0, 0, 0);
      continue;
    }

    const candidateEnd = new Date(cursor);
    candidateEnd.setMinutes(candidateEnd.getMinutes() + durationMinutes);
    if (candidateEnd <= dayEnd && candidateEnd <= searchEnd) {
      const isFreeForEveryone = calendarParticipants.every((participant) => (
        !slotOverlapsBusyBlocks(
          cursor,
          candidateEnd,
          busyBlocksByParticipant[participant.key] || []
        )
      ));

      if (isFreeForEveryone) {
        return {
          start: formatLocalDateTime(cursor),
          end: formatLocalDateTime(candidateEnd),
          duration_minutes: durationMinutes
        };
      }
    }

    cursor.setMinutes(cursor.getMinutes() + timeWheelIncrementMinutes);
  }

  return null;
}

function addScheduledMeeting(title, slot, platform, options = {}) {
  if (!slot?.start || !slot?.end) {
    return null;
  }

  const meetingPlatform = platform || getMeetingPlatform();
  const meeting = {
    number: scheduledMeetings.length + 1,
    title,
    platformId: meetingPlatform.id,
    platformLabel: meetingPlatform.label,
    link: createMeetingLink(meetingPlatform.id, title, slot),
    styleReason: options.styleReason || "",
    start: slot.start,
    end: slot.end
  };
  scheduledMeetings = [
    ...scheduledMeetings,
    meeting
  ].slice(0, maxScheduledMeetings);
  participantSetupComplete = true;
  hideParticipantSetup();
  saveSchedulerState();

  pendingOffscreenMeeting = isMeetingInViewedWeek(meeting)
    ? null
    : meeting;

  if (!calendarPlanner?.hidden) {
    renderCalendarPlanner();
  }

  return meeting;
}

function updateRunButtonForMeetingLimit() {
  if (form.classList.contains("is-running")) {
    return;
  }

  const reachedLimit = scheduledMeetings.length >= maxScheduledMeetings;
  runButton.disabled = reachedLimit;
  runButton.textContent = reachedLimit
    ? "Demo Complete"
    : "Run Demo Mode";
}

function returnToInitialDemo() {
  closeSchedulerSheet();
  hideDemoCompleteOverlay();
  resetSchedulerState();
  resetCalendarBusyCells();
  calendarWeekOffset = 0;
  pendingOffscreenMeeting = null;
  showChat();
  updateRunButtonForMeetingLimit();
}

function showCalendarPlanner() {
  if (!calendarPlanner) {
    return;
  }
  renderCalendarPlanner();
  calendarPlanner.hidden = false;
  document.body.classList.add("calendars-visible");
}

function hideCalendarPlanner() {
  if (calendarPlanner) {
    calendarPlanner.hidden = true;
  }
  document.body.classList.remove("calendars-visible");
}

function advanceGuide() {
  if (guideStepIndex === 0) {
    openAppsButton.focus();
    return;
  }

  if (guideStepIndex === 1) {
    openSchedulerButton.focus();
    return;
  }

  if (guideStepIndex === 2) {
    setGuideStep(3);
    form.requestSubmit();
    return;
  }

  showChat();
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

function persistSchedulerRecord(record) {
  if (currentChatMode !== "scheduler" || isRestoringSchedulerChat) {
    return;
  }

  schedulerMessages.push(record);
  saveSchedulerState();
}

function renderMessageRecord(record) {
  if (record.type === "demo-reset") {
    addReturnToInitialDemoCard({
      persist: false
    });
    return;
  }

  if (record.type === "meeting-result") {
    addMeetingResultCard(record.meeting, {
      persist: false
    });
    return;
  }

  if (record.type === "fallback-proposal") {
    addFallbackProposalCard(record.proposal, {
      persist: false
    });
    return;
  }

  if (record.type === "card") {
    addAppCard(record.title, record.text, {
      persist: false,
      className: record.className || ""
    });
    return;
  }

  if (record.type === "round") {
    addRoundSummaryMessage(record.title, record.lines || [], {
      persist: false
    });
    return;
  }

  addMessage(record.kind, record.author, record.text, {
    persist: false
  });
}

function renderSchedulerConversation() {
  currentChatMode = "scheduler";
  thread.innerHTML = "";
  chatName.textContent = "Meeting Scheduler Demo";
  groupAvatar.textContent = "3";
  phone.classList.remove("post-chat");
  openAppsButton.disabled = false;
  isRestoringSchedulerChat = true;
  schedulerMessages.forEach(renderMessageRecord);
  isRestoringSchedulerChat = false;
}

function addMessage(kind, author, text, options = {}) {
  const message = document.createElement("article");
  message.className = `message ${kind}`;
  const authorElement = document.createElement("strong");
  authorElement.textContent = author;
  message.append(authorElement, document.createTextNode(String(text)));
  thread.appendChild(message);
  if (options.persist !== false) {
    persistSchedulerRecord({
      type: "message",
      kind,
      author,
      text: String(text)
    });
  }
  scrollThreadToLatest();
}

function addFallbackProposalCard(proposal, options = {}) {
  if (!proposal?.slot) {
    return;
  }

  const hostName = getParticipantNames().host;
  const message = document.createElement("article");
  message.className = "message card fallback-proposal";

  const header = document.createElement("div");
  header.className = "card-title";
  const icon = document.createElement("span");
  icon.className = "mini-icon";
  icon.textContent = "AI";
  const label = document.createElement("span");
  label.textContent = "Next available option";
  header.append(icon, label);

  const copy = document.createElement("p");
  copy.textContent = `${hostName}, the group agents could not confirm a slot inside your selected window. They did find the next time everyone can attend:`;

  const slot = document.createElement("p");
  slot.className = "fallback-slot";
  slot.textContent = formatSlot(proposal.slot);

  const detail = document.createElement("p");
  detail.className = "meeting-style-reason";
  detail.textContent = `If you accept, I will update the scheduler to this date and time with ${getStyleDetail(proposal.hostStyle).shortLabel} host style and ${getStyleLabels(proposal.inviteeStyles)} invitee styles, then run Demo Mode automatically.`;

  const actions = document.createElement("div");
  actions.className = "fallback-actions";
  const acceptButton = document.createElement("button");
  acceptButton.type = "button";
  acceptButton.className = "fallback-action primary";
  acceptButton.dataset.action = "accept-fallback";
  acceptButton.dataset.fallbackId = proposal.id;
  acceptButton.textContent = proposal.status === "accepted"
    ? "Accepted"
    : "Accept and run";
  const declineButton = document.createElement("button");
  declineButton.type = "button";
  declineButton.className = "fallback-action secondary";
  declineButton.dataset.action = "decline-fallback";
  declineButton.dataset.fallbackId = proposal.id;
  declineButton.textContent = proposal.status === "declined"
    ? "Passed"
    : "Pass";
  const isResolved = proposal.status === "accepted" || proposal.status === "declined";
  acceptButton.disabled = isResolved;
  declineButton.disabled = isResolved;
  actions.append(acceptButton, declineButton);

  message.append(header, copy, slot, detail, actions);
  thread.appendChild(message);

  if (options.persist !== false) {
    persistSchedulerRecord({
      type: "fallback-proposal",
      proposal
    });
  }

  scrollThreadToLatest();
}

function updateFallbackProposalStatus(fallbackId, status) {
  schedulerMessages = schedulerMessages.map((record) => {
    if (
      record.type !== "fallback-proposal" ||
      record.proposal?.id !== fallbackId
    ) {
      return record;
    }

    return {
      ...record,
      proposal: {
        ...record.proposal,
        status
      }
    };
  });
  saveSchedulerState();
}

function getFallbackProposal(fallbackId) {
  return schedulerMessages.find((record) => (
    record.type === "fallback-proposal" &&
    record.proposal?.id === fallbackId
  ))?.proposal;
}

function createFallbackProposal({
  meetingTitle,
  slot,
  meetingPlatform,
  hostStyle,
  inviteeStyles,
  inviteeMix
}) {
  return {
    id: `fallback-${Date.now()}`,
    meetingTitle,
    slot,
    meetingPlatform,
    hostStyle,
    inviteeStyles,
    inviteeMix,
    status: "pending"
  };
}

function addFallbackProposalIfAvailable({
  meetingTitle,
  demoDateRange,
  durationMinutes,
  meetingPlatform,
  hostStyle,
  inviteeStyles,
  inviteeMix
}) {
  const fallbackSlot = findNextConsensusFallbackSlot({
    dateRange: demoDateRange,
    durationMinutes,
    hostStyle,
    inviteeStyles
  });

  if (!fallbackSlot) {
    resultStatus.textContent = "No fallback found";
    slotOutput.textContent = "Try a shorter meeting or clear a busy block.";
    addAppCard(
      "No shared fallback found",
      "The agents checked future calendar openings too, but could not find a shared slot with the current meeting length and style settings. Try shortening the meeting or clearing a busy block."
    );
    return;
  }

  resultStatus.textContent = "Fallback proposed";
  slotOutput.textContent = formatSlot(fallbackSlot);
  addFallbackProposalCard(createFallbackProposal({
    meetingTitle,
    slot: fallbackSlot,
    meetingPlatform,
    hostStyle,
    inviteeStyles,
    inviteeMix
  }));
}

async function acceptFallbackProposal(fallbackId) {
  const proposal = getFallbackProposal(fallbackId);
  if (!proposal || proposal.status !== "pending") {
    return;
  }

  updateFallbackProposalStatus(fallbackId, "accepted");
  const meetingTitleInput = document.querySelector("#meeting-title");
  if (meetingTitleInput) {
    meetingTitleInput.value = proposal.meetingTitle || meetingTitleInput.value;
  }
  if (proposal.meetingPlatform?.id && meetingPlatformSelect) {
    meetingPlatformSelect.value = proposal.meetingPlatform.id;
  }
  if (proposal.hostStyle && hostStyleSelect) {
    hostStyleSelect.value = proposal.hostStyle;
  }
  if (proposal.inviteeMix && inviteeMixSelect) {
    inviteeMixSelect.value = proposal.inviteeMix;
  }
  setScheduleWindowFromSlot(proposal.slot);
  updateStyleGuide();
  applyHostStyleToScheduler();
  renderSchedulerConversation();
  addMessage(
    "user",
    getParticipantNames().host,
    "That works. Use this next available time and run the Meeting Scheduler."
  );
  await runSchedulingFlow({
    useAi: false,
    fallbackAttempt: true
  });
}

function declineFallbackProposal(fallbackId) {
  const proposal = getFallbackProposal(fallbackId);
  if (!proposal || proposal.status !== "pending") {
    return;
  }

  updateFallbackProposalStatus(fallbackId, "declined");
  renderSchedulerConversation();
  addMessage(
    "user",
    getParticipantNames().host,
    "Let's skip that fallback for now."
  );
  addAppCard(
    "Fallback skipped",
    "No problem. You can adjust the calendar blocks, shorten the meeting, or choose a different scheduling window before running Demo Mode again."
  );
  setGuideStep(2);
}

function addAppCard(title, text, options = {}) {
  const message = document.createElement("article");
  message.className = `message card ${options.className || ""}`.trim();
  message.innerHTML = `
    <div class="card-title">
      <span class="mini-icon">AI</span>
      <span>${title}</span>
    </div>
    <p>${text}</p>
  `;
  thread.appendChild(message);
  if (options.persist !== false) {
    persistSchedulerRecord({
      type: "card",
      title,
      text,
      className: options.className || ""
    });
  }
  scrollThreadToLatest();
}

function addMeetingResultCard(meeting, options = {}) {
  if (!meeting) {
    return;
  }

  const message = document.createElement("article");
  message.className = "message card meeting-result";

  const header = document.createElement("div");
  header.className = "card-title";
  const icon = document.createElement("span");
  icon.className = "mini-icon";
  icon.textContent = "✓";
  const label = document.createElement("span");
  label.textContent = `Scheduled meeting ${meeting.number} of ${maxScheduledMeetings}`;
  header.append(icon, label);

  const title = document.createElement("p");
  title.className = "meeting-result-title";
  title.textContent = meeting.title;

  const slot = document.createElement("p");
  slot.textContent = formatSlot(meeting);

  const reason = document.createElement("p");
  reason.className = "meeting-style-reason";
  reason.textContent = meeting.styleReason || "Why this time: the scheduler selected the earliest slot that matched the group availability.";

  const link = document.createElement("a");
  link.className = "meeting-link";
  link.href = meeting.link;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = `${meeting.platformLabel}: ${meeting.link}`;

  message.append(header, title, slot, reason, link);
  thread.appendChild(message);

  if (options.persist !== false) {
    persistSchedulerRecord({
      type: "meeting-result",
      meeting
    });
  }

  scrollThreadToLatest();
}

function addReturnToInitialDemoCard(options = {}) {
  const names = getParticipantNameList();
  const message = document.createElement("article");
  message.className = "message card demo-reset-card";
  message.innerHTML = `
    <div class="card-title">
      <span class="mini-icon">AI</span>
      <span>Demo cycle complete</span>
    </div>
    <p>All three meetings are visible on the calendars for ${names}. Return to the initial demo when you're ready to start fresh.</p>
    <button class="return-demo-button" type="button" data-action="reset-scheduler-demo">Return to initial demo</button>
  `;
  thread.appendChild(message);

  if (options.persist !== false) {
    persistSchedulerRecord({
      type: "demo-reset"
    });
  }

  scrollThreadToLatest();
}

function addRoundSummaryMessage(title, lines, options = {}) {
  const message = document.createElement("article");
  message.className = "message card round-summary";

  const header = document.createElement("div");
  header.className = "card-title";
  const icon = document.createElement("span");
  icon.className = "mini-icon";
  icon.textContent = "AI";
  const label = document.createElement("span");
  label.textContent = title;
  header.append(icon, label);

  const list = document.createElement("ul");
  lines.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    list.appendChild(item);
  });

  message.append(header, list);
  thread.appendChild(message);
  if (options.persist !== false) {
    persistSchedulerRecord({
      type: "round",
      title,
      lines
    });
  }
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

function setInitialConversation() {
  renderSchedulerConversation();
}

function settleProcessingMessages() {
  document.querySelectorAll(".running-state").forEach((message) => {
    message.classList.remove("running-state");
  });
}

function showChat() {
  phone.classList.add("in-chat");
  phone.classList.remove("post-chat");
  setInitialConversation();
  hideAppDrawer();
  hideCalendarPlanner();
  form.hidden = true;
  phone.classList.remove("sheet-open");
  updateSheetOffset(sheetCollapsedOffset);
  scrollThreadToLatest();
  setGuideStep(0);
  scheduleGuideReveal();
  showParticipantSetupIfNeeded();
}

function showLinkedInPostChat(post) {
  currentChatMode = "post";
  phone.classList.add("in-chat");
  phone.classList.add("post-chat");
  setGuideVisibility(false);
  hideAppDrawer();
  hideCalendarPlanner();
  form.hidden = true;
  phone.classList.remove("sheet-open");
  updateSheetOffset(sheetCollapsedOffset);
  chatName.textContent = post.title;
  groupAvatar.textContent = "in";
  openAppsButton.disabled = true;
  thread.innerHTML = "";
  addMessage("system", "LinkedIn", post.subtitle);
  addLinkedInPreview(post);
  hideParticipantSetup();
}

function showSimpleChat(chat) {
  currentChatMode = "simple";
  phone.classList.add("in-chat");
  phone.classList.add("post-chat");
  setGuideVisibility(false);
  hideAppDrawer();
  hideCalendarPlanner();
  form.hidden = true;
  phone.classList.remove("sheet-open");
  updateSheetOffset(sheetCollapsedOffset);
  chatName.textContent = chat.title;
  groupAvatar.textContent = chat.avatar;
  openAppsButton.disabled = true;
  thread.innerHTML = "";
  addMessage("system", "Group", chat.subtitle);
  chat.messages.forEach(([kind, author, text]) => {
    addMessage(kind, author, text);
  });
  hideParticipantSetup();
}

function showMessagesList() {
  currentChatMode = "list";
  form.hidden = true;
  appDrawer.hidden = true;
  hideCalendarPlanner();
  phone.classList.remove("sheet-open");
  phone.classList.remove("post-chat");
  phone.classList.remove("in-chat");
  openAppsButton.disabled = false;
  updateSheetOffset(sheetCollapsedOffset);
  setModePresentation(false);
  setGuideStep(0);
  hideParticipantSetup();
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
  hideCalendarPlanner();
  form.hidden = true;
  phone.classList.remove("sheet-open");
  setGuideStep(1);
  setGuideVisibility(true);
}

function hideAppDrawer() {
  appDrawer.hidden = true;
}

function showSchedulerSheet() {
  if (scheduledMeetings.length >= maxScheduledMeetings) {
    returnToInitialDemo();
    return;
  }

  if (shouldShowParticipantSetup()) {
    showParticipantSetupIfNeeded();
    return;
  }

  appDrawer.hidden = true;
  form.hidden = false;
  showCalendarPlanner();
  updateSheetOffset(sheetCollapsedOffset);
  phone.classList.add("sheet-open");
  scrollThreadToLatest();
  setGuideStep(2);
  setGuideVisibility(true);
  updateRunButtonForMeetingLimit();
}

function closeSchedulerSheet() {
  form.hidden = true;
  appDrawer.hidden = true;
  hideCalendarPlanner();
  phone.classList.remove("sheet-open");
  updateSheetOffset(sheetCollapsedOffset);
  setGuideStep(1);
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
  if (!slot || !slot.start || !slot.end) {
    return "No slot selected";
  }

  const start = new Date(slot.start);
  const end = new Date(slot.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "No valid slot returned";
  }

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

function getMeetingPlatform() {
  const platform = meetingPlatformSelect?.value || "google-meet";
  const labels = {
    "google-meet": "Google Meet",
    zoom: "Zoom",
    teams: "Microsoft Teams"
  };

  return {
    id: platform,
    label: labels[platform] || "Google Meet"
  };
}

function slugifyMeetingText(text) {
  return String(text || "meeting")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "meeting";
}

function createMeetingLink(platformId, title, slot) {
  const start = new Date(slot?.start || Date.now());
  const code = [
    slugifyMeetingText(title),
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, "0"),
    String(start.getDate()).padStart(2, "0"),
    String(start.getHours()).padStart(2, "0"),
    String(start.getMinutes()).padStart(2, "0")
  ].join("-");

  if (platformId === "zoom") {
    return `https://zoom.us/j/${code}`;
  }

  if (platformId === "teams") {
    return `https://teams.microsoft.com/l/meetup-join/${code}`;
  }

  return `https://meet.google.com/${code}`;
}

function getMeetingDetailsText(meeting) {
  return [
    meeting.title,
    formatSlot(meeting),
    meeting.styleReason,
    meeting.platformLabel,
    meeting.link
  ].filter(Boolean).join("\n");
}

function formatApiError(errorDetail, fallback) {
  if (!errorDetail) {
    return fallback;
  }

  if (typeof errorDetail === "string") {
    return errorDetail;
  }

  if (Array.isArray(errorDetail)) {
    return errorDetail
      .map((item) => formatApiError(item, fallback))
      .join("; ");
  }

  if (typeof errorDetail === "object") {
    const location = Array.isArray(errorDetail.loc)
      ? `${errorDetail.loc.join(".")}: `
      : "";
    if (errorDetail.msg) {
      return `${location}${errorDetail.msg}`;
    }
    if (errorDetail.message) {
      return `${location}${errorDetail.message}`;
    }
    return JSON.stringify(errorDetail);
  }

  return String(errorDetail);
}

async function api(path, options = {}) {
  const { headers = {}, ...requestOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(formatApiError(
      body?.detail || body,
      `Request failed with ${response.status}`
    ));
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

function getDecisionText(response, displayName) {
  const decision = response?.decision || "REVIEWED";
  const decisionText = decision.toLowerCase().replace("_", " ");
  const reasoning = response?.reasoning ? ` ${response.reasoning}` : "";
  const slot = response?.accepted_slot
    ? ` Preferred slot: ${formatSlot(response.accepted_slot)}.`
    : "";
  const counterSlots = Array.isArray(response?.counter_slots) && response.counter_slots.length
    ? ` Countered with ${response.counter_slots.length} alternate time${response.counter_slots.length === 1 ? "" : "s"}.`
    : "";

  return `${displayName} ${decisionText}.${reasoning}${slot}${counterSlots}`;
}

function renderRounds(logs, participantNames = {}) {
  roundsOutput.innerHTML = "";

  const roundKeys = Object.keys(logs || {})
    .filter((key) => key.startsWith("round_"))
    .sort();

  if (!roundKeys.length) {
    roundsOutput.textContent = "No negotiation rounds returned.";
    addRoundSummaryMessage("Negotiation rounds", [
      "No round-by-round details came back from the scheduler."
    ]);
    return;
  }

  roundKeys.forEach((key) => {
    const round = logs[key];
    const responses = Object.entries(round.responses || {});
    const accepted = responses
      .filter(([, response]) => response.decision === "ACCEPT").length;
    const counters = responses
      .filter(([, response]) => response.decision === "COUNTER").length;
    const roundLabel = key.replace("_", " ");
    const lines = [
      `${getParticipantNames().host}'s scheduler proposed ${round.proposals?.length || 0} possible time${round.proposals?.length === 1 ? "" : "s"}.`,
      `${accepted} accepted, ${counters} countered.`
    ];

    responses.forEach(([userId, response]) => {
      lines.push(getDecisionText(response, participantNames[userId] || "Invitee"));
    });

    addRoundSummaryMessage(`${roundLabel}: checking overlap`, lines);

    const card = document.createElement("article");
    card.className = "round";
    card.innerHTML = `
      <div class="round-title">
        <span>${roundLabel}</span>
        <span>${accepted} accepted, ${counters} countered</span>
      </div>
      <p>${round.proposals?.length || 0} host proposals evaluated by ${responses.length} invitee agents.</p>
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

async function runSchedulingFlow({
  useAi,
  geminiApiKey,
  fallbackAttempt = false
} = { useAi: false }) {
  if (scheduledMeetings.length >= maxScheduledMeetings) {
    resetSchedulerState();
    renderSchedulerConversation();
    renderCalendarPlanner();
  }

  setModePresentation(useAi);
  runButton.disabled = true;
  runButton.textContent = "Scheduling...";
  form.classList.add("is-running");
  if (runAiDemoButton) {
    runAiDemoButton.disabled = true;
  }
  setGuideStep(3);
  setGuideVisibility(true);
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
  let demoDateRange;
  try {
    demoDateRange = getSelectedDateRange();
  } catch (error) {
    const message = error.message || "Choose a valid scheduling date and time window.";
    resultStatus.textContent = "Error";
    slotOutput.textContent = message;
    addMessage("system", "Error", message);
    runButton.disabled = false;
    if (runAiDemoButton) {
      runAiDemoButton.disabled = false;
    }
    setGuideStep(2);
    return;
  }
  const durationMinutes = Number(
    getSelectedDurationMinutes()
  );
  const hostStyle = document.querySelector("#host-style").value;
  const inviteeMix = inviteeMixSelect?.value || "early-flexible";
  const meetingPlatform = getMeetingPlatform();
  const participantNames = getParticipantNames();
  const [inviteeStyleOne, inviteeStyleTwo] = getInviteeStyles();
  const styleReason = getSchedulingStyleReason(
    hostStyle,
    [inviteeStyleOne, inviteeStyleTwo]
  );

  try {
    addAppCard(
      "Meeting Scheduler is processing",
      `Checking calendars for ${getParticipantNameList()} for ${meetingTitle}. ${styleReason}`,
      {
        persist: false,
        className: "running-state"
      }
    );
    const timestamp = new Date().toISOString().slice(11, 19);
    const host = await registerUser(`${participantNames.host} ${timestamp}`, hostStyle);
    const inviteeOne = await registerUser(`${participantNames.inviteeOne} ${timestamp}`, inviteeStyleOne);
    const inviteeTwo = await registerUser(`${participantNames.inviteeTwo} ${timestamp}`, inviteeStyleTwo);
    const participantBusyBlocks = {
      [host.id]: getParticipantBusyBlocks("host", {
        dateRange: demoDateRange,
        busyBufferMinutes: getBusyBufferMinutesForStyle(hostStyle)
      }),
      [inviteeOne.id]: getParticipantBusyBlocks("inviteeOne", {
        dateRange: demoDateRange,
        busyBufferMinutes: getBusyBufferMinutesForStyle(inviteeStyleOne)
      }),
      [inviteeTwo.id]: getParticipantBusyBlocks("inviteeTwo", {
        dateRange: demoDateRange,
        busyBufferMinutes: getBusyBufferMinutesForStyle(inviteeStyleTwo)
      })
    };

    const negotiation = await api("/negotiation/start", {
      method: "POST",
      ...(useAi ? {
        headers: { "X-User-Gemini-Key": geminiApiKey }
      } : {}),
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
        date_range_start: demoDateRange.start,
        date_range_end: demoDateRange.end,
        participant_busy_blocks: participantBusyBlocks,
        use_ai: useAi
      })
    });

    sessionId.textContent = negotiation.session_id;
    resultStatus.textContent = `${useAi ? "AI" : "Demo"}: ${negotiation.status.replace("_", " ")}`;
    slotOutput.textContent = formatSlot(negotiation.agreed_slot);
    settleProcessingMessages();
    const scheduledMeeting = addScheduledMeeting(
      meetingTitle,
      negotiation.agreed_slot,
      meetingPlatform,
      {
        styleReason: getSchedulingStyleReason(
          hostStyle,
          [inviteeStyleOne, inviteeStyleTwo],
          negotiation.status
        ) + getEarlierWindowExplanation(negotiation.agreed_slot)
      }
    );

    if (scheduledMeeting) {
      addMeetingResultCard(scheduledMeeting);
    } else {
      if (fallbackAttempt) {
        addAppCard(
          "Fallback slot unavailable",
          "That fallback slot was no longer available after the final check. You can pass on it or adjust the scheduler details."
        );
      } else {
        addFallbackProposalIfAvailable({
          meetingTitle,
          demoDateRange,
          durationMinutes,
          meetingPlatform,
          hostStyle,
          inviteeStyles: [inviteeStyleOne, inviteeStyleTwo],
          inviteeMix
        });
      }
    }
    aiUpgradeCard.hidden = Boolean(useAi);
    setGuideStep(4);
    setGuideVisibility(true);
    if (scheduledMeetings.length >= maxScheduledMeetings) {
      closeSchedulerSheet();
      setGuideVisibility(false);
      showDemoCompleteOverlay();
    }
  } catch (error) {
    resultStatus.textContent = "Error";
    const message = error.message || "The demo run could not complete.";
    slotOutput.textContent = message;
    addMessage("system", "Error", message);
    setGuideStep(2);
  } finally {
    form.classList.remove("is-running");
    updateRunButtonForMeetingLimit();
    if (runAiDemoButton) {
      runAiDemoButton.disabled = false;
    }
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
  if (openAppsButton.disabled) {
    return;
  }
  if (appDrawer.hidden) {
    showAppDrawer();
  } else {
    hideAppDrawer();
    setGuideStep(0);
  }
});

openSchedulerButton.addEventListener("click", showSchedulerSheet);
openDemoChatButton.addEventListener("click", showChat);
linkedinPostButtons.forEach((button) => {
  button.addEventListener("click", () => showLinkedInPostChat(linkedInPosts[button.dataset.postId]));
});
simpleChatButtons.forEach((button) => {
  button.addEventListener("click", () => showSimpleChat(simpleChats[button.dataset.chatId]));
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
calendarGrid?.addEventListener("click", (event) => {
  if (event.target.closest(".scheduled-meeting-block")) {
    return;
  }

  const cell = event.target.closest(".busy-cell");
  if (!cell) {
    return;
  }
  if (cell.classList.contains("is-scheduled")) {
    return;
  }

  const participantKey = cell.dataset.participant;
  const cellKey = cell.dataset.cell;
  if (!participantKey || !cellKey) {
    return;
  }

  if (!calendarBusyCells[participantKey]) {
    calendarBusyCells[participantKey] = new Set();
  }

  if (calendarBusyCells[participantKey].has(cellKey)) {
    calendarBusyCells[participantKey].delete(cellKey);
  } else {
    calendarBusyCells[participantKey].add(cellKey);
  }
  renderCalendarPlanner();
});
calendarPrevWeekButton?.addEventListener("click", () => {
  calendarWeekOffset -= 1;
  renderCalendarPlanner();
});
calendarNextWeekButton?.addEventListener("click", () => {
  calendarWeekOffset += 1;
  renderCalendarPlanner();
});
thread.addEventListener("click", (event) => {
  const resetButton = event.target.closest("[data-action='reset-scheduler-demo']");
  if (resetButton) {
    returnToInitialDemo();
    return;
  }

  const acceptButton = event.target.closest("[data-action='accept-fallback']");
  if (acceptButton) {
    acceptFallbackProposal(acceptButton.dataset.fallbackId);
    return;
  }

  const declineButton = event.target.closest("[data-action='decline-fallback']");
  if (declineButton) {
    declineFallbackProposal(declineButton.dataset.fallbackId);
  }
});
resetCalendarsButton?.addEventListener("click", () => {
  resetCalendarBusyCells();
  renderCalendarPlanner();
});
[
  scheduleStartDateInput,
  scheduleStartTimeInput,
  scheduleEndDateInput,
  scheduleEndTimeInput
].forEach((input) => {
  input?.addEventListener("change", () => {
    if (!calendarPlanner?.hidden) {
      renderCalendarPlanner();
    }
  });
});
hostStyleSelect?.addEventListener("change", () => {
  applyHostStyleToScheduler();
  updateStyleGuide();
});
inviteeMixSelect?.addEventListener("change", updateStyleGuide);
participantSetupForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  participantSetupComplete = true;
  refreshEditableParticipantPresentation();
  saveSchedulerState();
  hideParticipantSetup();
  openAppsButton.focus();
});
[
  participantHostNameInput,
  participantOneNameInput,
  participantTwoNameInput
].forEach((input) => {
  input?.addEventListener("input", refreshEditableParticipantPresentation);
});
backButton.addEventListener("click", showMessagesList);
closeSheetButton.addEventListener("pointerdown", startSheetDrag);
closeSheetButton.addEventListener("pointermove", dragSheet);
closeSheetButton.addEventListener("pointerup", finishSheetDrag);
closeSheetButton.addEventListener("pointercancel", finishSheetDrag);
form.addEventListener("submit", runDemo);
runAiDemoButton?.addEventListener("click", runPersonalizedAiDemo);
guideNext.addEventListener("click", advanceGuide);
window.addEventListener("resize", positionGuideCallout);
window.addEventListener("orientationchange", positionGuideCallout);
returnInitialDemoButton?.addEventListener("click", returnToInitialDemo);
reviewCompletedDemoButton?.addEventListener("click", () => {
  hideDemoCompleteOverlay();
  showCalendarPlanner();
  renderSchedulerConversation();
  setGuideStep(4);
  setGuideVisibility(true);
});
geminiApiKeyInput.value = sessionStorage.getItem(geminiKeyStorageName) || "";
initializeScheduleWindowControls();
initializeTimeWheels();
loadSchedulerState();
resetCalendarBusyCells();
setModePresentation(false);
applyHostStyleToScheduler();
updateStyleGuide();
showChat();
updateRunButtonForMeetingLimit();
checkHealth();
