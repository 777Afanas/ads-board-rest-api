import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000), // Захист від завеликих текстів
  price: z.number().positive(),
  category: z.enum(["sale", "service", "job", "other"]), // Жорсткий список категорій
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Body must contain at least one field to update" } // Захист від порожніх запитів
);

export const announcementParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(2147483647), // Захист типу Int у PostgreSQL
});

export const announcementQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().positive().max(214748364).default(1),
}).strict(); // Захист від невідомих query-параметрів