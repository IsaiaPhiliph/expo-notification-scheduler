# expo-notification-scheduler

Nodejs server to schedule expo notifications

## What it does?

This server can schedule expo notifications, a feature that expo notifications api is missing. It can also send instant notifications.

## How does it work?

It uses prisma to store notifications, so you can expand it to fit your business logic by adding more tables.
Then it runs a cron job every x time to check if there are notifications to send.

You can use it for different expo projects at the same time, "PUSH_TOO_MANY_EXPERIENCE_IDS" error is controlled and handled properly, but I recommend using 1 server per expo project
