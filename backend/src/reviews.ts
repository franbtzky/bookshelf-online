import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const router = Router();

interface ReviewRow extends RowDataPacket {
  id: number;
  rating: number;
  comment: string | null;
  created_at: Date | string;
  user_id: number;
  user_name: string;
}

interface RecentReviewRow extends ReviewRow {
  open_library_key: string;
  title: string;
  author: string | null;
  cover_id: number | null;
  publish_year: number | null;
  edition_count: number | null;
}

function getUserId(req: Request): number | null {
  const authorization = req.headers.authorization;
  const secret = process.env.JWT_SECRET;

  if (!authorization?.startsWith("Bearer ") || !secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(authorization.slice(7), secret);

    if (
      typeof decoded === "string" ||
      !Number.isSafeInteger(decoded.userId) ||
      decoded.userId <= 0
    ) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

function formatReview(row: ReviewRow) {
  return {
    id: Number(row.id),
    rating: Number(row.rating),
    comment: row.comment || "",
    created_at: row.created_at,
    user_id: Number(row.user_id),
    user_name: String(row.user_name),
  };
}

// Avaliações recentes da comunidade.
router.get("/recent", async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RecentReviewRow[]>(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         u.id AS user_id,
         u.name AS user_name,
         b.open_library_key,
         b.title,
         b.author,
         b.cover_id,
         b.publish_year,
         b.edition_count
       FROM book_reviews r
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN books b ON b.id = r.book_id
       ORDER BY r.updated_at DESC, r.id DESC
       LIMIT 20`
    );

    res.json(
      rows.map((row) => ({
        id: Number(row.id),
        rating: Number(row.rating),
        comment: row.comment || "",
        created_at: row.created_at,
        user_name: row.user_name,
        book: {
          key: row.open_library_key,
          title: row.title,
          author_name: row.author ? [row.author] : [],
          cover_i: row.cover_id,
          first_publish_year: row.publish_year,
          edition_count: row.edition_count,
        },
      }))
    );
  } catch (error) {
    console.error("Erro ao listar avaliações:", error);
    res.status(500).json({
      error: "Não foi possível carregar as avaliações.",
    });
  }
});

// Avaliações e média de um livro da Open Library.
router.get("/book/:workId", async (req: Request, res: Response) => {
  const { workId } = req.params;

  if (typeof workId !== "string" || !/^OL\d+W$/.test(workId)) {
    res.status(400).json({ error: "Identificador do livro inválido." });
    return;
  }

  try {
    const [rows] = await pool.execute<ReviewRow[]>(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         u.id AS user_id,
         u.name AS user_name
       FROM book_reviews r
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN books b ON b.id = r.book_id
       WHERE b.open_library_key = ?
       ORDER BY r.updated_at DESC, r.id DESC`,
      [`/works/${workId}`]
    );

    const reviews = rows.map(formatReview);
    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length
      ? Number((ratingSum / reviews.length).toFixed(1))
      : 0;

    res.json({
      averageRating,
      totalReviews: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Erro ao carregar avaliações do livro:", error);
    res.status(500).json({
      error: "Não foi possível carregar as avaliações deste livro.",
    });
  }
});

// Cria ou atualiza a única avaliação do usuário para o livro.
router.post("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (userId === null) {
    res.status(401).json({
      error: "Faça login para publicar uma avaliação.",
    });
    return;
  }

  const { savedBookId, rating, comment } = req.body ?? {};

  const validBookId = Number.isSafeInteger(savedBookId) && savedBookId > 0;
  const validRating = Number.isInteger(rating) && rating >= 1 && rating <= 5;
  const validComment =
    comment === undefined ||
    (typeof comment === "string" && comment.length <= 5000);

  if (!validBookId || !validRating || !validComment) {
    res.status(400).json({ error: "Dados da avaliação inválidos." });
    return;
  }

  try {
    const [savedBooks] = await pool.execute<RowDataPacket[]>(
      `SELECT book_id
       FROM user_books
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [savedBookId, userId]
    );

    if (savedBooks.length === 0) {
      res.status(404).json({
        error: "Livro não encontrado na sua estante.",
      });
      return;
    }

    const bookId = Number(savedBooks[0].book_id);
    const normalizedComment =
      typeof comment === "string" ? comment.trim() || null : null;

    await pool.execute<ResultSetHeader>(
      `INSERT INTO book_reviews (user_id, book_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         comment = VALUES(comment),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, bookId, rating, normalizedComment]
    );

    res.json({
      success: true,
      message: "Avaliação publicada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao publicar avaliação:", error);
    res.status(500).json({
      error: "Não foi possível publicar a avaliação.",
    });
  }
});

export default router;
