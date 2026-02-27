**Overview**

This mobile application is designed to manage Pilates training users and
their training schedules. The system consists of two main portals:

Target platforms are **iOS and Android**. The admin portal should be
implemented within the same mobile app using role-based access.


- **User Portal** for Pilates trainees

The app enables class tracking, training notes management,
and automated notifications for upcoming sessions.

- **Admin Portal** for trainers or administrators
Manages users, schedules training sessions, and records training content. 


**User Portal Requirements**

**Authentication**

- Users and admins both log in using **Google (Gmail) sign-in ** 
- Admin will verify whether the user is currently an active training user.


**User Dashboard**

After successful login, the user sees a dashboard displaying:

- Total number of completed classes

  - Calculate the number of classes that are not canceled and have
    passed the current time. 
  - if new user, it will show as O

- Next scheduled class (date and time)

  - Look up the training table by user ID to find upcoming training
    sessions and display the closed ones.

- A button to view practice history and upcoming schedule

If No upcoming class exists, the dashboard displays a “No upcoming class
scheduled” message.


**practice history and upcoming schedule**

- A calendar view shows both past and future training sessions

- Default view is monthly

- Users can tap on a date to see session details

- Session information includes:

  - Date and time

  - Training status (Scheduled, Completed, Cancelled)

**Notifications**

- Users receive push notifications for upcoming training sessions

- Default reminder is sent 24 hours before the session

- Users can enable or disable notifications from settings

- Notifications are automatically updated if a session is rescheduled

**Admin Portal Requirements**

**Authentication**

- Admin logs in using **Google (Gmail) sign-in**
- Admin accounts must exist in the system with role = `ADMIN`
- If the Gmail account role is not `ADMIN`, admin portal access is denied, redirect user to User Portal.

**Admin Calendar**

- After login, admin lands on a calendar view

- Admin can select a time slot to create a training event



When creating a training event, in a new page which allowing the
admin to:

- Select an existing user, order by name ascending 

After selecting a user, the system displays:

- Total number of completed classes for that user

- Shwo Last 5 training notes (most recent first)

- Enter training notes

- Edit training time -Start time


When edit a training event, in a new page which  allowing the admin
to:

- Edit training notes

- Edit training time

- Cancel training event


**User Management**

Admin can manage users through a dedicated user management portal.

Supported actions:

- Add a new user by providing username and Gmail

- Edit existing user information (username and Gmail)

- Update user status

User status options:

- In training

- Inactive 

Validation rules:

- Gmail must be unique


**User List View**

The admin user list displays:

- Username

- Next scheduled class

- Current status

- Number of classes completed

Additional features:

- Filter users by status

- Sort by next class or completed classes

**Data Tables**

Table: User (accounts for both trainees and admins)

| **Column Name** | **Data Type** | **Description**                                      |
|-----------------|---------------|------------------------------------------------------|
| id              | UUID          | Primary key, unique account identifier               |
| username        | Text          | Display name                                         |
| gmail           | Text (Unique) | Gmail account used for login                         |
| role            | Enum          | USER / ADMIN                                         |
| status          | Enum          | IN_TRAINING / INACTIVE (applies to role USER)        |
| created_at      | DateTime      | Record creation time                                 |
| updated_at      | DateTime      | Last update time                                     |

Table: TrainingSession

| **Column Name**  | **Data Type** | **Description**                                                     |
|------------------|---------------|---------------------------------------------------------------------|
| id               | UUID          | Primary key, unique session identifier                              |
| user_id          | UUID (FK)     | References User.id (must have role USER)                            |
| created_by_id    | UUID (FK)     | References User.id (must have role ADMIN)                           |
| start_time       | DateTime      | Session start date and time                                         |
| end_time         | DateTime      | Session end date and time                                           |
| status           | Text          | SCHEDULED \| COMPLETED \| CANCELLED \| NO_SHOW                     |
| notes            | Text          | Training content and notes                                          |
| created_at       | DateTime      | Record creation time                                                |
| updated_at       | DateTime      | Last update time                                                    |

Table: DeviceToken

| **Column Name** | **Data Type** | **Description**            |
|-----------------|---------------|----------------------------|
| id              | UUID          | Primary key                |
| user_id         | UUID (FK)     | References User.id         |
| platform        | Enum          | IOS / ANDROID              |
| fcm_token       | Text (Unique) | Push notification token    |
| last_seen_at    | DateTime      | Last time token was active |
| created_at      | DateTime      | Record creation time       |
| updated_at      | DateTime      | Last update time           |

Table: NotificationPreference

| **Column Name** | **Data Type** | **Description**                   |
|-----------------|---------------|-----------------------------------|
| user_id         | UUID (PK, FK) | References User.id                |
| enabled         | Boolean       | Whether notifications are enabled |
| rule            | Enum          | 24H / 1H / BOTH                   |
| updated_at      | DateTime      | Last update time                  |



**Key User Flows**

**User Flow**

- User logs in with Google

- User views dashboard summary

- User checks past and future schedules in calendar

- User receives notifications for upcoming sessions

**Admin Flow**

- Admin logs in with credentials

- Admin views calendar

- Admin creates or updates training sessions

- Admin reviews user progress and training history

- Admin manages user profiles and statuses

**Non-Functional Requirements**

**Security**

- OAuth 2.0 for Google login (Users and Admins)
- Role-based access control

**Performance**

- Dashboard and calendar load within acceptable mobile response times

- Efficient calendar pagination by month

**Reference:**

erDiagram

USER {
  uuid id PK
  string username
  string gmail "UNIQUE"
  string role "USER\|ADMIN"
  string status "IN_TRAINING\|INACTIVE"
  datetime createdAt
  datetime updatedAt
}

TRAINING_SESSION {
  uuid id PK
  uuid userId FK
  uuid createdById FK
  datetime startTime
  datetime endTime
  string status "SCHEDULED\|COMPLETED\|CANCELLED\|NO_SHOW"
  text notes
  datetime createdAt
  datetime updatedAt
}

DEVICE_TOKEN {
  uuid id PK
  uuid userId FK
  string platform "iOS\|Android"
  string fcmToken
  datetime lastSeenAt
  datetime createdAt
  datetime updatedAt
}

NOTIFICATION_PREFERENCE {
  uuid userId PK, FK
  boolean enabled
  string reminderRule "24H\|1H\|BOTH"
  datetime updatedAt
}

%% Relationships
USER ||--o{ TRAINING_SESSION : has
USER ||--o{ TRAINING_SESSION : creates
USER ||--o{ DEVICE_TOKEN : registers
USER ||--|| NOTIFICATION_PREFERENCE : configures
