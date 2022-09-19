import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

import { convertHourStringToMinutes } from "./utils/convert-hour-string-to-minutes";
import { convertMinutesStringToHours } from "./utils/convert-minutes-to-hour-string";

const prisma = new PrismaClient({
  log: ["query"],
});

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3500;

app.get("/games", async (req, res) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });

  return res.json(games);
});

app.post("/games/:id/ads", async (req, res) => {
  const gameId = req.params.id;

  const body: any = req.body;

  const hourStartMinutes = convertHourStringToMinutes(body.hourStart);
  const hourEndMinutes = convertHourStringToMinutes(body.hourEnd);

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(","),
      hourStart: hourStartMinutes,
      hourEnd: hourEndMinutes,
      useVoiceChannel: body.useVoiceChannel,
    },
  });

  return res.status(201).json(ad);
});

app.get("/games/:id/ads", async (req, res) => {
  if (!req.params?.id) return res.sendStatus(400);

  const gameId = req.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      gameId: true,
      hourStart: true,
      hourEnd: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      createdAt: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!ads) {
    return res.status(400).json({ message: "No ads to the provided game id" });
  }

  return res.json(
    ads.map((ad) => ({
      ...ad,
      weekDays: ad.weekDays.split(","),
      hourStart: convertMinutesStringToHours(ad.hourStart),
      hourEnd: convertMinutesStringToHours(ad.hourEnd),
    }))
  );
});

app.get("/ads/:id/discord", async (req, res) => {
  if (!req.params?.id) return res.sendStatus(400);

  const adId = req.params.id;

  const ad = await prisma.ad.findUnique({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  if (!ad) {
    return res
      .status(400)
      .json({ message: "No discord to the provided ad id" });
  }

  return res.json({
    discord: ad.discord,
  });
});

app.listen(PORT, () => console.log(`Server runing on port ${PORT}`));
