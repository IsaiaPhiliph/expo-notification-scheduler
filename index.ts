import { PrismaClient } from "@prisma/client";
import express from "express";
import cron from "node-cron";

const sendNotifications = async (now: Date) => {
  console.log(`${now.toISOString()} - `, "checking notifications");
  const toSend = await prisma.notification.findMany({ where: { sent: false } });
  console.log(toSend);
};

cron.schedule("*/5 * * * * *", sendNotifications);

const app = express();

const PORT = 8080;

const prisma = new PrismaClient();

app.use(express.json());

app.post("/schedule-notification", async (req, res) => {
  const { to, title, body, data, send } = req.body;
  try {
    const notification = await prisma.notification.create({
      data: {
        to,
        title,
        body,
        data,
        send,
      },
    });
    return res.status(201).json(notification);
  } catch (error) {
    console.log(`Error creating schedule-notification ${error}`);
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
