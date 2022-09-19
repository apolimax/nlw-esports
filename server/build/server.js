var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { PrismaClient } from "@prisma/client";
import { convertHourStringToMinutes } from "./utils/convert-hour-string-to-minutes";
const prisma = new PrismaClient({
    log: ["query"],
});
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3500;
app.get("/games", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const games = yield prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true,
                },
            },
        },
    });
    return res.json(games);
}));
app.post("/games/:id/ads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gameId = req.params.id;
    const body = req.body;
    const hourStartMinutes = convertHourStringToMinutes(body.hourStart);
    const hourEndMinutes = convertHourStringToMinutes(body.hourEnd);
    const ad = yield prisma.ad.create({
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
}));
app.get("/games/:id/ads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = req.params) === null || _a === void 0 ? void 0 : _a.id))
        return res.sendStatus(400);
    const gameId = req.params.id;
    const ads = yield prisma.ad.findMany({
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
    return res.json(ads.map((ad) => (Object.assign(Object.assign({}, ad), { weekDays: ad.weekDays.split(",") }))));
}));
app.get("/ads/:id/discord", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    if (!((_b = req.params) === null || _b === void 0 ? void 0 : _b.id))
        return res.sendStatus(400);
    const adId = req.params.id;
    const ad = yield prisma.ad.findUnique({
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
}));
app.listen(PORT, () => console.log(`Server runing on port ${PORT}`));
