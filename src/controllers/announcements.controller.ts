import { Request, Response } from "express";
import prisma from "../../prisma/client.js";

const PER_PAGE = 10;

// Виносимо вибірку користувача, щоб не дублювати її
const userSelect = {
  select: { id: true, username: true, email: true, name: true },
};

export async function listAnnouncements(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const search = req.query.search as string | undefined;
  const sort = req.query.sort as string | undefined;

  const where = search ? { title: { contains: search, mode: "insensitive" as const } } : {};

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: userSelect },
    }),
    prisma.announcement.count({ where }),
  ]);

  res.json({
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
      perPage: PER_PAGE,
    },
  });
}

export async function getAnnouncement(req: Request, res: Response) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: userSelect },
  });

  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.json(announcement);
}

export async function createAnnouncement(req: Request, res: Response) {
  const announcement = await prisma.announcement.create({
    data: { ...req.body, userId: req.user!.sub },
    include: { user: userSelect },
  });

  res.status(201).json(announcement);
}

export async function updateAnnouncement(req: Request, res: Response) {
  const id = Number(req.params.id);
  
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  if (existing.userId !== req.user!.sub) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: req.body,
    include: { user: userSelect },
  });

  res.json(updated);
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const id = Number(req.params.id);

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  if (existing.userId !== req.user!.sub) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  await prisma.announcement.delete({ where: { id } });

  res.status(204).end();
}