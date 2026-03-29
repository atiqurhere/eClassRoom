**PROJECT PROMPT: Replace Jitsi Meet with Zoom Pro Integration + Automated Recording + YouTube Upload**

Build a complete live class system by replacing the existing Jitsi Meet integration with Zoom-based infrastructure using Zoom Pro. The system must support automatic meeting creation, role-based access (teacher as host, students as participants), automatic cloud recording, webhook-based event handling, and automatic upload of recordings to YouTube as private videos.

---

### 1. Core Objective

Implement a scalable live class system using Zoom APIs where:

* Teachers create classes from the LMS dashboard
* A Zoom meeting is automatically generated
* Teacher becomes the meeting host
* Students receive a join link
* Recording starts automatically
* After the class ends, recording is processed and uploaded to YouTube (private)
* Video link is saved in the LMS

---

### 2. Technology Requirements

* Backend: Node.js (Express preferred)
* Database: PostgreSQL or MongoDB
* APIs:

  * Zoom Server-to-Server OAuth
  * YouTube Data API v3
* Webhooks:

  * Zoom webhook events for recording lifecycle
* Storage:

  * Temporary server storage or streaming upload (avoid large file retention)

---

### 3. Zoom Integration

#### 3.1 Authentication

* Use Zoom Server-to-Server OAuth
* Store account credentials securely in environment variables

#### 3.2 Create Meeting

When teacher creates a class:

* Call Zoom API `/v2/users/{userId}/meetings`
* Include:

  * topic (class name)
  * start_time
  * duration
  * auto_recording = "cloud"

Store response:

* meeting_id
* join_url (for students)
* start_url (for teacher)

---

#### 3.3 Role Handling

* Teacher uses `start_url` → becomes host
* Students use `join_url` → join as participants

---

### 4. LMS Integration

#### Teacher Panel:

* Button: “Create Live Class”
* Automatically creates Zoom meeting
* Save meeting data in DB

#### Student Panel:

* Button: “Join Class”
* Redirect to Zoom join_url

---

### 5. Automatic Recording System

* Enable Zoom cloud recording using:

  * settings.auto_recording = "cloud"

* Recording must start automatically when meeting begins

---

### 6. Webhook Handling (Critical)

Set up webhook endpoint:

POST /api/zoom/webhook

Listen for events:

* recording.completed

On receiving event:

1. Verify Zoom webhook signature
2. Extract recording download URL
3. Fetch recording metadata

---

### 7. Recording Processing

* Download recording file OR stream directly
* Avoid long-term storage on server
* Handle large files (500MB–2GB)

---

### 8. YouTube Upload Automation

#### 8.1 Authentication

* Use YouTube OAuth 2.0
* Prefer a single central channel for institution
* Store refresh_token securely

#### 8.2 Upload Video

Use YouTube Data API:

* Title: Auto-generated (e.g. Class name + date)
* Description: Course + teacher name
* Privacy: "private"

---

### 9. Final Workflow

Teacher creates class
→ Zoom meeting auto-created
→ Class starts
→ Recording auto-starts
→ Class ends
→ Zoom processes recording
→ Webhook triggers backend
→ Backend downloads video
→ Backend uploads to YouTube (private)
→ Store YouTube link in database
→ Show in student dashboard

---

### 10. Security Requirements

* Validate Zoom webhook signature
* Protect API routes with authentication
* Encrypt tokens in database
* Do not expose start_url publicly

---

### 11. Performance Considerations

* Use streaming upload to avoid memory issues
* Queue system recommended (Bull / Redis)
* Handle delayed webhook delivery
* Retry failed uploads

---

### 12. Optional Enhancements

* Attendance tracking via Zoom webhooks
* Auto video naming using AI
* Email notifications after upload
* In-app video player for recorded lectures

---

### 13. Expected Output

* Fully functional Zoom-based live class system
* Automatic recording workflow
* Automatic YouTube private upload
* Integrated LMS dashboard for teachers and students
* Clean API structure with scalable architecture

---
