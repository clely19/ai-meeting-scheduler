# AI Multi-Agent Meeting Scheduler : An iMessage Extension

An iMessage extension powered by multi-agent AI that eliminates back-and-forth 
scheduling. Specialized agents negotiate available time slots between participants 
and reach a consensus in seconds.

## Demo

<p align="center">
  <img width="220" alt="Meeting Scheduler UI" src="https://github.com/user-attachments/assets/dce54fac-bf6c-4cc8-8fb5-bf10b0a8deb6" />
  &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;  &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;
  <img width="220" alt="Team Standup Form" src="https://github.com/user-attachments/assets/b26d0061-8737-4780-b2e0-05fe8e5db759" />
</p>
<p align="center">
  <sub>Meeting Scheduler UI inside iMessage</sub>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sub>Filled form - Team Standup, 60 min duration</sub>
</p>

## How It Works

1. Open the iMessage extension in any conversation
2. Enter a meeting title, select duration (30 / 60 / 90 min), 
   and add invitee UUIDs
3. AI agents negotiate time slots on behalf of each participant
4. System returns a confirmed time or flags a conflict

## Negotiation State Machine
```
negotiating → pending_approval → confirmed
                    ↓                    
                 failed          
                    ↑            
                cancelled        
```
Each negotiation session moves through 5 possible states with 
deterministic transitions, ensuring reliable execution in 
non-deterministic agent environments.

## Folder Structure
```
/ios            → Frontend (SwiftUI iMessage Extension)
/backend        → Backend (FastAPI + Python)
/calendar       → Data layer (availability & raw scheduling data)
/agents         → Logic layer (individual agent reasoning)
/negotiation    → Service layer (coordinated agent behavior)
/api            → Interface layer (external communication)
```

## Tech Stack

- **Frontend:** SwiftUI, iMessage Extension Kit
- **Backend:** FastAPI, Python
- **Agent Framework:** LangChain
- **Database:** PostgreSQL, Supabase
- **Architecture:** Multi-agent negotiation, 
                    persistent memory, state machine governance
