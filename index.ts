import { PrismaClient } from "@prisma/client";
import Expo from "expo-server-sdk";
import express from "express";
import cron from "node-cron";

const expo = new Expo();

const prisma = new PrismaClient();

const app = express();

const sendNotifications = async (now: Date) => {
  const toSend = await prisma.notification.findMany({
    where: { sent: false, send: { lte: now } },
  });
  console.log(
    `${now.toISOString()} - checking notifications: ${toSend.length} to send`
  );
  const validMessages = toSend
    .map((msg) => ({
      ...msg,
      data: msg.data ? JSON.parse(msg.data) : undefined,
      title: msg.title ? msg.title : undefined,
      body: msg.body ? msg.body : undefined,
    }))
    .filter((msg) => Expo.isExpoPushToken(msg.to));
  const messages = [...validMessages];
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  await prisma.notification.updateMany({
    data: { sent: true },
    where: {
      id: {
        in: messages.map((msg) => msg.id),
      },
    },
  });
  (async () => {
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error: any) {
        if (error.code === "PUSH_TOO_MANY_EXPERIENCE_IDS") {
          for (const [key, value] of Object.entries(error.details)) {
            const expo_tokens = value as string[];
            const chunkFromProject = chunk.filter(
              (item) =>
                typeof item.to === "string" && expo_tokens.includes(item.to)
            );
            try {
              await expo.sendPushNotificationsAsync(chunkFromProject);
            } catch (error) {
              console.error(error);
            }
          }
        } else {
          console.error(error);
        }
      }
    }
  })();
};

cron.schedule("*/5 * * * * *", sendNotifications);

const PORT = 8080;

app.use(express.json());

app.post("/schedule-notification", async (req, res) => {
  const { to, title, body, data, send } = req.body;

  let sent = false;

  try {
    if (!send) {
      await expo.sendPushNotificationsAsync([{ to, title, body, data }]);
      sent = true;
    }

    const notification = await prisma.notification.create({
      data: {
        to,
        title,
        body,
        data,
        send,
        sent,
      },
    });

    return res.status(201).json(notification);
  } catch (error) {
    console.error(`Error creating schedule-notification ${error}`);
    return res.sendStatus(500);
  }
});

app.get("/schedule-notification", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany();
    return res.json(notifications);
  } catch (error) {
    console.log(`Error getting schedule-notifications: ${error}`);
  }
});

app.listen(PORT, () => console.log(`Server up: http://localhost:${PORT}`));
