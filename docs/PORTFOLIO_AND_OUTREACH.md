# Portfolio And Outreach Drafts

## Portfolio Story

## Title

AI Multi-Agent Meeting Scheduler for iMessage

## Short Description

An iMessage extension and FastAPI backend where AI scheduling agents negotiate meeting times across multiple participants using calendar availability, user preferences, and multi-round proposal refinement.

## Story Arc

## Problem

Scheduling in group chats is still mostly manual. People suggest times, wait for replies, compare calendars, and repeat the same coordination loop until everyone agrees.

## Solution

I built a prototype where each participant can be represented by a personal scheduling agent. The host agent proposes times, invitee agents evaluate those times against availability and scheduling style, and the backend coordinates multiple rounds until it finds consensus or the best available compromise.

## Technical Highlights

- Built a FastAPI backend with user, calendar, agent, and negotiation routes.
- Created deterministic calendar availability logic for converting busy blocks into free slots.
- Designed host and invitee agents with scheduling styles like early, balanced, and flexible.
- Added fallback agent logic so the system still works without an LLM provider.
- Connected the backend to an iOS/iMessage extension.
- Used Supabase for users and negotiation session persistence.

## Architecture Summary

The iMessage extension sends meeting details to the FastAPI backend. The backend calculates availability, creates a negotiation session, and runs a negotiation orchestrator. The host agent proposes slots, invitee agents accept or counter, and the final result is stored as a session with logs and an agreed slot when one is found.

## What I Learned

- AI is most useful when paired with deterministic systems around it.
- Calendar availability should be computed by reliable logic, not guessed by a model.
- Multi-agent systems need clear state transitions, bounded rounds, and fallbacks.
- A prototype becomes much stronger when it can be explained through architecture, failure modes, and scaling decisions.

## Next Steps

- Move availability from memory into persistent shared storage.
- Add authentication and Supabase Row Level Security.
- Add real calendar OAuth integration.
- Run negotiation asynchronously for better scaling.
- Add a web demo for users who cannot install the iMessage extension.

## LinkedIn Post Draft

I’ve been working on an AI multi-agent meeting scheduler for iMessage.

The idea is simple: instead of everyone manually comparing calendars in a group chat, each participant can be represented by a personal scheduling agent. The host agent proposes times, invitee agents evaluate them against availability and scheduling style, and the backend runs a few negotiation rounds to find a time that works.

The project includes:

- an iMessage extension frontend
- a FastAPI backend
- Supabase-backed users and negotiation sessions
- deterministic calendar availability calculation
- host and invitee scheduling agents
- AI-backed decisions with fallback logic for reliable demos

One technical choice I’m proud of: I kept calendar math deterministic and testable, then used AI only for preference-based scheduling decisions. That made the system easier to reason about and much easier to explain from a system design perspective.

I’m currently polishing the live demo and portfolio writeup. Would love feedback from people interested in AI agents, productivity tools, or system design.

## Short Connection Message

Hey [Name], I recently built a prototype of an AI multi-agent meeting scheduler for iMessage. I’m polishing the live demo and would really value your feedback on the product idea and technical presentation. Could I send you the link?

## Technical Reviewer Message

Hey [Name], I’m preparing a portfolio case study for an AI scheduling project and would appreciate a technical sanity check. It uses FastAPI, Supabase, an iMessage extension, deterministic calendar slot calculation, and multi-agent negotiation. Could I send you the repo or demo?

## Recruiter Or Mentor Message

Hey [Name], I’ve been turning one of my projects into a polished portfolio piece: an AI multi-agent meeting scheduler for iMessage. I’m using it to demonstrate product thinking, backend architecture, and system design. I’d appreciate your feedback on whether the story is clear from a hiring perspective.

## Demo Script

1. Open with the pain point: scheduling in group chats creates repeated back-and-forth.
2. Show the iMessage extension or API demo.
3. Register a host and invitee.
4. Submit availability or generate mock calendars.
5. Start negotiation.
6. Show the result: consensus, partial consensus, or no consensus.
7. Explain the architecture in one minute.
8. Close with production next steps: persistent availability, async jobs, auth, RLS, real calendar integrations.

