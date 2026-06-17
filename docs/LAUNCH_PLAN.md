# 3-Day Launch Plan

This plan is optimized for getting the AI Meeting Scheduler live, explainable, and shareable within 2-3 focused days.

## Current Project Snapshot

- Backend: FastAPI service with user, calendar availability, agent, and negotiation APIs.
- Client: iOS/iMessage extension UI that talks to a deployed backend URL.
- Data: Supabase-backed users and negotiation sessions, plus in-memory availability cache.
- AI: Gemini-backed host and personal scheduling agents, with deterministic fallback logic when the AI key is unavailable.
- Tests: Calendar slot calculation, mock calendar generation, API behavior, and agent fallback coverage.

## Launch Definition

The project is "live enough" when:

- A public backend URL responds at `/health`.
- A fresh user can register from the app or API.
- A scheduling negotiation can run end to end with mock or submitted availability.
- The iOS client points to the live backend URL.
- The README explains setup, architecture, demo flow, and limitations.
- Portfolio visitors can understand the project even if they cannot install the iMessage extension.

## Day 1: Stabilize And Deploy

Goal: make the backend reliable enough for external testers.

1. Run local verification.
   - `python3 -m unittest discover -s tests`
   - Start FastAPI locally with the project environment.
   - Test `/health`, `/users/register`, `/calendar/availability`, and `/negotiation/start`.

2. Choose a deployment target.
   - Fast path: Render, Railway, or Replit Deployments.
   - Required env vars:
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
     - `GEMINI_API_KEY` if using AI responses

3. Deploy backend.
   - Start command should run the FastAPI app with Uvicorn.
   - Confirm the deployed `/health` endpoint returns `{"status":"alive","project":"ai-meeting-scheduler"}`.

4. Update iOS backend URL.
   - Replace the hard-coded `baseURL` in `NetworkService.swift` with the new deployment URL.
   - Rebuild and run the iMessage extension in the simulator.

5. Create a short demo script.
   - Register host.
   - Register invitee.
   - Submit or generate availability.
   - Start negotiation.
   - Show final suggested slot and negotiation reasoning.

## Day 2: Product Story And Portfolio

Goal: make the project understandable and impressive without needing a live walkthrough.

1. Upgrade README.
   - Add project overview.
   - Add architecture diagram.
   - Add local setup.
   - Add API examples.
   - Add deployment notes.
   - Add known limitations and next steps.

2. Capture demo assets.
   - App screenshots.
   - API response screenshot.
   - Short screen recording if possible.
   - Architecture diagram image or Mermaid diagram.

3. Build portfolio story.
   - Problem: scheduling through group chats is messy.
   - Solution: personal agents negotiate time slots for each participant.
   - Technical depth: FastAPI, Supabase, iMessage extension, calendar slot calculation, multi-round negotiation.
   - Outcome: live demo, clear API, documented scaling path.

4. Prepare LinkedIn post.
   - Keep it personal and specific.
   - Include one crisp technical insight.
   - Link to portfolio, live API, or GitHub.

## Day 3: Sharing And Interview Prep

Goal: get feedback and be ready to explain design choices.

1. Share with 5-10 connections.
   - Ask for one specific form of feedback: usability, idea clarity, technical critique, or career advice.

2. Practice system design.
   - Explain current architecture.
   - Explain why availability calculation is deterministic.
   - Explain how agent negotiation works.
   - Explain how to scale beyond in-memory availability.
   - Explain privacy and data access boundaries.

3. Add final polish.
   - Fix feedback from first testers.
   - Add any missing docs.
   - Add a portfolio CTA: "Try the API", "Watch demo", or "Read architecture".

## Launch Blockers To Resolve

- The backend currently requires Supabase env vars at import time.
- The iOS client currently uses a hard-coded Replit URL.
- Availability is stored in memory, which is not suitable for multi-instance production deployment.
- Supabase RLS is listed as a TODO before production use.
- Public users may need a web demo or API demo because iMessage extensions are harder to try casually.

## Recommended Launch Scope

For this week, present it as a working technical prototype rather than a fully productionized consumer app.

Suggested wording:

> I built a live prototype of an AI multi-agent meeting scheduler for iMessage. It uses personal scheduling agents to compare availability, negotiate across multiple rounds, and suggest a meeting time while preserving each participant's scheduling preferences.

