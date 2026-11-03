import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const perPage = 10;
  const search = req.query.search as string | undefined;
  const sort = req.query.sort === 'oldest' ? 'asc' : 'desc';

  const where: any = {};
  if (search && search.trim() !== '') {
    where.title = { contains: search };
  }

  const [total, data] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: sort },
      include: {
        user: { select: { id: true, username: true, email: true, name: true } },
      },
    }),
  ]);

  res.status(200).json({
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      perPage,
    },
  });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, email: true, name: true } },
    },
  });

  if (!announcement) {
    res.status(404).json({ message: 'Announcement not found' });
    return;
  }

  res.status(200).json(announcement);
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.sub;
  const { title, description, price, category } = req.body;

  const announcement = await prisma.announcement.create({
    data: { title, description, price, category, userId },
    include: {
      user: { select: { id: true, username: true, email: true, name: true } },
    },
  });

  res.status(201).json(announcement);
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const userId = req.user!.sub;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Announcement not found' });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: req.body,
    include: {
      user: { select: { id: true, username: true, email: true, name: true } },
    },
  });

  res.status(200).json(updated);
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const userId = req.user!.sub;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Announcement not found' });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  await prisma.announcement.delete({ where: { id } });
  res.status(204).end();
};