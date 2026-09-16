# CampusFind User & Staff Operations Guide

CampusFind is a map-first lost and found platform engineered specifically for colleges, universities, and school campuses. This guide provides comprehensive operational workflows for both students and campus security personnel.

---

## Part 1: Student Guide

### 1. Reporting a Found Item (Under 20 Seconds)

When you find an unattended belonging on campus:

1. Tap the green **Pin (+)** button in the bottom navigation bar.
2. Select **I Found Something**.
3. **Capture Photo:** Tap the camera area. On mobile, this launches the camera directly (`capture="environment"`). The image is automatically compressed in your browser to under 2MB, and GPS metadata is stripped for safety.
4. **Speak or Type Description:** Hold the microphone button to dictate in English/Indian English (`en-IN`), or type the item name (e.g., "Silver Milton water bottle").
5. **Campus Location:**
   - If GPS is granted, CampusFind automatically snaps your report to the nearest building if you are within 40 meters.
   - If indoors, tap the floor chip (e.g., "Floor 2") and add an optional spot note (e.g., "Library study cubicle 4").
6. **Private Proof Detail:** If the item has a distinctive hidden mark (such as a sticker, engraving, or specific keychain), enter it in the **Private Proof Detail** box. This detail is converted into an irreversible cryptographic hash on the server. Only a claimant who knows this exact detail will receive an instant match verification.
7. Tap **Pin it on Campus**.

### 2. ID Card Privacy Rule

If you find a student ID card or financial card:
- **Do not post readable student register numbers or card numbers.**
- Use your finger or a paper slip to cover the register number before taking the photo.
- In the description, note only the student name and department.

### 3. Searching for Lost Items

1. Open the **List** view from the bottom navigation bar.
2. Use the search bar to filter by keyword, category, or building name.
3. Switch between **All**, **Lost**, and **Found** chips.
4. Select **Near Me** to sort items by physical distance from your current GPS position.

### 4. Claiming Belongings

1. Tap an item card to open its dedicated permalink page.
2. Review the photo and location history.
3. Tap **Claim This Item**.
4. **Verification:** Enter your phone number or campus email to receive an instant 6-digit OTP code. This prevents anonymous spam claims.
5. **Prove Ownership:** If the finder set a private proof detail, enter what you know (e.g., "dent on the silver lid").
   - If your answer matches the hash, the system confirms ownership instantly.
   - You can also write a polite message to coordinate a handover.
6. **Public Handover Safety:** Always arrange to meet in broad daylight at an open campus area (such as the campus cafeteria, reception lobby, or security gate). Never pay money or share passwords.

### 5. Managing Your Activity

Tap **Mine** in the bottom navigation to:
- Review your active pins.
- View incoming student claims.
- **Accept Claim:** Once you physically hand over the item to the owner, tap **Accept** to mark the item as `recovered`.
- **Decline Claim:** If a claimant cannot prove ownership, tap **Decline**.

---

## Part 2: Security Desk & Staff Operations

### 1. Accessing the Security Desk Portal

Campus security personnel and facility managers manage physical lost property through the dedicated desk portal:

- URL: `https://campusfind.app/<campus>/desk` (e.g., `/kengeri/desk`)
- **Authentication:** Enter the security desk PIN configured for your campus.

### 2. The 14-Day Expiration Policy

- Unclaimed pins remain visible on the public student map for **14 days**.
- After 14 days, items automatically expire and transfer to the Security Desk inventory.
- Students who lose items after 14 days are instructed by the app to visit the physical security desk.

### 3. Desk Workflows

- **Physical Intake:** When a student or cleaner hands in a physical item at the desk, find the expired or open pin in the desk portal and tap **Check In at Desk**. The status changes to `desk`.
- **Return to Student:** When a student visits the security desk and identifies their belonging, verify their student ID, retrieve the item, and tap **Return to Student**. The item is marked `recovered` and closed.
- **Disposal / Archival:** Items that remain at the desk past university retention terms can be permanently archived by tapping **Archive / Dispose**.

### 4. Abuse & Moderation Controls

- Any student can report a malicious, fraudulent, or inappropriate pin using the **Report** button.
- When 3 distinct device sessions report an item, CampusFind automatically hides the pin from the public map and list feed (fail-closed protection).
- Security desk personnel can review flagged items and permanently dispose of spam.
