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
const meetingPlatformSelect = document.querySelector("#meeting-platform");
const participantHostNameInput = document.querySelector("#participant-host-name");
const participantOneNameInput = document.querySelector("#participant-one-name");
const participantTwoNameInput = document.querySelector("#participant-two-name");
const durationInputs = document.querySelectorAll("input[name='duration-minutes']");
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
const guideStepCount = document.querySelector("#guide-step-count");
const guidePanelCount = document.querySelector("#guide-panel-count") || createStateNode();
const guideTitle = document.querySelector("#guide-title");
const guideCopy = document.querySelector("#guide-copy");
const guidePanelCopy = document.querySelector("#guide-panel-copy") || createStateNode();
const guideNext = document.querySelector("#guide-next");

const geminiKeyStorageName = "meetingSchedulerGeminiKey";
const schedulerStateStorageName = "meetingSchedulerDemoStateV3";
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

const sheetExpandedOffset = 0;
const sheetCollapsedOffset = 162;
const sheetCloseOffset = 270;
const demoWindowDays = 7;
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
    scheduledMeetings = Array.isArray(saved.scheduledMeetings)
      ? saved.scheduledMeetings.slice(0, maxScheduledMeetings)
      : [];
    schedulerMessages = Array.isArray(saved.messages) && saved.messages.length
      ? saved.messages
      : getInitialSchedulerMessages();
  } catch {
    scheduledMeetings = [];
    schedulerMessages = getInitialSchedulerMessages();
  }
}

function saveSchedulerState() {
  localStorage.setItem(
    schedulerStateStorageName,
    JSON.stringify({
      scheduledMeetings,
      messages: schedulerMessages
    })
  );
}

function resetSchedulerState() {
  scheduledMeetings = [];
  schedulerMessages = getInitialSchedulerMessages();
  saveSchedulerState();
}

function setGuideVisibility(visible) {
  shell?.classList.toggle("guide-visible", visible);
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
  scheduleStartTimeInput.value = formatTimeInputValue(startDate);
  scheduleEndDateInput.value = formatDateInputValue(endDate);
  scheduleEndTimeInput.value = formatTimeInputValue(endDate);
  syncEndTimeToDuration();
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
  return Number(
    document.querySelector("input[name='duration-minutes']:checked").value
  );
}

function syncEndTimeToDuration() {
  if (
    !scheduleStartDateInput?.value ||
    !scheduleStartTimeInput?.value ||
    !scheduleEndDateInput ||
    !scheduleEndTimeInput
  ) {
    return;
  }

  const start = new Date(`${scheduleStartDateInput.value}T${scheduleStartTimeInput.value}:00`);
  if (Number.isNaN(start.getTime())) {
    return;
  }

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + getSelectedDurationMinutes());
  scheduleEndTimeInput.value = formatTimeInputValue(end);
  if (end.toDateString() !== start.toDateString()) {
    scheduleEndDateInput.value = formatDateInputValue(end);
  }
}

function applyHostStyleToScheduler() {
  const style = hostStyleSelect?.value || "early";
  const names = getParticipantNames();
  const styleStartHours = {
    early: 9,
    balanced: 12,
    flexible: 15
  };

  extensionSubtitle.textContent = `Hi ${names.host} · ${style} style`;
  if (scheduleStartTimeInput && styleStartHours[style] !== undefined) {
    scheduleStartTimeInput.value = `${String(styleStartHours[style]).padStart(2, "0")}:00`;
    syncEndTimeToDuration();
  }

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

function getScheduledCellPosition(meeting, day, hour) {
  if (!meeting) {
    return null;
  }

  const previousHour = hour - 1;
  const nextHour = hour + 1;
  const previousMeeting = calendarHours.includes(previousHour)
    ? getScheduledMeetingForCell(day, previousHour)
    : null;
  const nextMeeting = calendarHours.includes(nextHour)
    ? getScheduledMeetingForCell(day, nextHour)
    : null;
  const isSameMeeting = (candidate) => (
    candidate?.number === meeting.number &&
    candidate?.start === meeting.start
  );
  const continuesFromPrevious = isSameMeeting(previousMeeting);
  const continuesToNext = isSameMeeting(nextMeeting);

  if (continuesFromPrevious && continuesToNext) {
    return "middle";
  }
  if (continuesFromPrevious) {
    return "end";
  }
  if (continuesToNext) {
    return "start";
  }

  return "single";
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
        const scheduledMeeting = getScheduledMeetingForCell(day, hour);
        const button = document.createElement("button");
        button.className = "busy-cell";
        button.type = "button";
        button.dataset.participant = participant.key;
        button.dataset.cell = cellKey;
        button.setAttribute(
          "aria-label",
          `${participantName} ${formatDayHeader(day)} ${hour}:00 busy`
        );
        if (scheduledMeeting) {
          const scheduledPosition = getScheduledCellPosition(
            scheduledMeeting,
            day,
            hour
          );
          button.classList.add("is-scheduled");
          button.classList.add(`scheduled-${scheduledPosition}`);
          button.textContent = scheduledPosition === "start" ||
            scheduledPosition === "single"
            ? `Meet ${scheduledMeeting.number}`
            : "";
          button.title = getMeetingDetailsText(scheduledMeeting);
        } else if (calendarBusyCells[participant.key]?.has(cellKey)) {
          button.classList.add("is-busy");
          button.textContent = "Busy";
        } else {
          button.textContent = "Free";
        }
        weekGrid.append(button);
      });
    });

    calendar.append(heading, weekGrid);
    calendarGrid.append(calendar);
  });
}

function getParticipantBusyBlocks(participantKey) {
  const days = getDemoWeekDays();
  const manualBusyBlocks = Array.from(calendarBusyCells[participantKey] || [])
    .map((cellKey) => {
      const [dayIndexText, hourText] = cellKey.split("-");
      const day = days[Number(dayIndexText)];
      const hour = Number(hourText);
      if (!day || Number.isNaN(hour)) {
        return null;
      }

      const start = new Date(day);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(hour + 1, 0, 0, 0);

      return {
        start: formatLocalDateTime(start),
        end: formatLocalDateTime(end),
        title: "Busy"
      };
    })
    .filter(Boolean);

  const scheduledBusyBlocks = scheduledMeetings.map((meeting) => ({
    start: meeting.start,
    end: meeting.end,
    title: meeting.title,
    link: meeting.link,
    platform: meeting.platformLabel
  }));

  return [
    ...manualBusyBlocks,
    ...scheduledBusyBlocks
  ];
}

function addScheduledMeeting(title, slot, platform) {
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
    start: slot.start,
    end: slot.end
  };
  scheduledMeetings = [
    ...scheduledMeetings,
    meeting
  ].slice(0, maxScheduledMeetings);
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

  const link = document.createElement("a");
  link.className = "meeting-link";
  link.href = meeting.link;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = `${meeting.platformLabel}: ${meeting.link}`;

  message.append(header, title, slot, link);
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

async function runSchedulingFlow({ useAi, geminiApiKey } = { useAi: false }) {
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
  const meetingPlatform = getMeetingPlatform();
  const participantNames = getParticipantNames();
  const [inviteeStyleOne, inviteeStyleTwo] = getInviteeStyles();

  try {
    addAppCard(
      "Meeting Scheduler is processing",
      `Checking calendars for ${getParticipantNameList()} for ${meetingTitle}. Please wait for the scheduled slot.`,
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
      [host.id]: getParticipantBusyBlocks("host"),
      [inviteeOne.id]: getParticipantBusyBlocks("inviteeOne"),
      [inviteeTwo.id]: getParticipantBusyBlocks("inviteeTwo")
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
      meetingPlatform
    );

    if (scheduledMeeting) {
      addMeetingResultCard(scheduledMeeting);
    } else {
      addAppCard(
        `${negotiation.status.replace("_", " ")}`,
        `No meeting link was created because no valid slot was returned.`
      );
    }
    aiUpgradeCard.hidden = Boolean(useAi);
    setGuideStep(4);
    setGuideVisibility(true);
    if (scheduledMeetings.length >= maxScheduledMeetings) {
      addReturnToInitialDemoCard();
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
  if (!resetButton) {
    return;
  }

  returnToInitialDemo();
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
    if (input === scheduleStartDateInput || input === scheduleStartTimeInput) {
      syncEndTimeToDuration();
    }
    if (!calendarPlanner?.hidden) {
      renderCalendarPlanner();
    }
  });
});
durationInputs.forEach((input) => {
  input.addEventListener("change", syncEndTimeToDuration);
});
hostStyleSelect?.addEventListener("change", applyHostStyleToScheduler);
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
geminiApiKeyInput.value = sessionStorage.getItem(geminiKeyStorageName) || "";
initializeScheduleWindowControls();
loadSchedulerState();
resetCalendarBusyCells();
setModePresentation(false);
applyHostStyleToScheduler();
showChat();
updateRunButtonForMeetingLimit();
checkHealth();
