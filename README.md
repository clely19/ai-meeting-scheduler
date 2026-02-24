# ai-meeting-scheduler
AI Multi-Agent Meeting Scheduler : An iMessage Extension

### Folder Structure

/ios &nbsp; &nbsp;→ &nbsp; &nbsp; Front-end \
/backend &nbsp; &nbsp; → &nbsp; &nbsp; Back-end \
/calendar &nbsp; &nbsp; → &nbsp; &nbsp; Data layer      (raw information) \
/agents &nbsp; &nbsp; → &nbsp; &nbsp; Logic layer     (individual reasoning) \
/negotiation &nbsp; &nbsp; → &nbsp; &nbsp; Service layer   (coordinated behavior) \
/api &nbsp; &nbsp; → &nbsp; &nbsp; Interface layer (external communication)


### State Machine

I will be following the following state machine for negotiation. The negotiation session can be in any of the 5 states.

negotiating &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; → &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; pending_approval &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; → confirmed\
&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;→ failed\
&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;↑   &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;↓\
&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;└──────── cancelled
