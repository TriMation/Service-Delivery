# Service-Delivery
This repository contains a single-tenant project management system designed to streamline project delivery, time tracking, and client collaboration. The system includes role-based access (admin, user, and client) to ensure secure data handling and a clear separation of responsibilities.

Key Features
Role-Based Access

Admin: Full control over the system—manages users, clients, projects, tasks, and requests.
User: Primarily handles assigned tasks, logs time, and responds to client requests.
Client: Has a read-only view of assigned projects, can submit or upvote requests, and monitor progress.
Core Modules & Pages

Dashboard: High-level overview of projects, tasks, and requests. Customizable widgets show relevant metrics based on the user’s role.
Projects: Create and manage projects, assign them to clients, define deliverables, and link tasks.
Tasks: Track status (to_do, in_progress, completed), assign tasks to users, and log time.
Time Tracking: Users can log hours spent on each task. Admins (and sometimes clients) can review total hours per project.
Requests: Clients and users can submit or comment on requests. Admins and users can approve/reject.
Clients: Store client details (company info, contact person, etc.) and manage access permissions.
User Management: For admins only. Create, edit, or delete user accounts; assign roles (admin, user, client).
Costings (Resource Matrix): For admins only. Track each user’s cost rate, competency, and time/cost loading in a separate Supabase table.
Skills Matrix: For admins only. Define skills (e.g., “JavaScript,” “Project Management”) and record each user’s proficiency level (none, medium, high).
Reports: Generate project-specific reports, including time entries and summaries, with the option to export to PDF.
Settings: Configure system-wide preferences, adjust PDF output formatting, set up email notifications, and more.
Basic Instructions
Installation & Setup

Clone the repository.
Install dependencies (e.g., npm install or similar, depending on your chosen framework).
Configure environment variables for connecting to your Supabase instance (API keys, project URL) and any additional services (SMTP settings, etc.).
Run the development server (e.g., npm run dev) and open the application in your browser.
Initial Admin Setup

Log in as or create an admin user (by default, you might have a superuser or a seeding script to establish the first admin account).
Access the Settings page to customize system branding, email notifications, PDF output, and other preferences.
Managing Users, Clients, and Projects

From the User Management page, create additional admins, users, or clients.
On the Clients page, add new client records and associate them with projects.
In the Projects page, create or edit projects, assign them to a client, and define deliverables.
Tasks & Time Tracking

Admin or User can create tasks linked to a project.
User logs time on assigned tasks in the Time Tracking module.
Review total hours, filter by date or project, and generate reports as needed.
Requests

Clients can submit new requests or upvote existing requests related to their projects.
Admins or Users can review requests, leave comments, and change status (approve, reject, in_progress, etc.).
Costings & Skills Matrix

Accessible only to admins.
Costings: Enter each user’s hourly/daily cost, competency rating, time loading, and cost loading.
Skills Matrix: Track user proficiencies (none, medium, high) across dynamically added skills.
Reports & Exports

Generate detailed project reports to view all tasks, time entries, and any key metrics.
Export reports as PDF (configured in Settings), which includes project summaries and time logs.
Best Practices

Regularly back up your Supabase data (or schedule automatic backups).
Enforce security best practices (strong passwords, two-factor authentication if available).
Keep the system updated with the latest patches for your framework and libraries.
Contributing
Branching: Use feature branches for changes; submit pull requests for review.
Coding Standards: Follow the conventions established in the project (linting rules, code style).
Testing: Write or update tests where possible, ensuring new features don’t break existing functionality.

License
Licensed by TriMation Pty Ltd.