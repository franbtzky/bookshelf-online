import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./db.js";
import reviewsRouter from "./reviews.js";
const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("Configure JWT_SECRET no arquivo .env");
}
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
}));
app.use(express.json({ limit: "100kb" }));
app.use("/api/reviews", reviewsRouter);
type ReadingStatus = "Quero ler" | "Lendo" | "Lido";
interface AuthRequest extends Request {
    userId?: number;
}
interface BookInput {
    key: string;
    title: string;
    author_name?: string[];
    cover_i?: number;
    first_publish_year?: number;
    edition_count?: number;
}
function validStatus(value: unknown): value is ReadingStatus {
    return value === "Quero ler" || value === "Lendo" || value === "Lido";
}
function createToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET!, { expiresIn: "7d" });
}
function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ")
        ? header.slice(7)
        : undefined;
    if (!token) {
        res.status(401).json({ error: "Faça login para continuar." });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
        if (typeof decoded.userId !== "number") {
            res.status(401).json({ error: "Sessão inválida." });
            return;
        }
        req.userId = decoded.userId;
        next();
    }
    catch {
        res.status(401).json({ error: "Sessão expirada ou inválida." });
    }
}
app.get("/api/health", async (_req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", database: "connected" });
    }
    catch {
        res.status(503).json({ status: "error", database: "disconnected" });
    }
});
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            password.length < 8 ||
            name.trim().length > 150 ||
            email.trim().length > 255) {
            res.status(400).json({
                error: "Informe nome, e-mail válido e senha com pelo menos 8 caracteres.",
            });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
        if (existing.length) {
            res.status(409).json({ error: "Este e-mail já está cadastrado." });
            return;
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const [result] = await pool.execute<ResultSetHeader>("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name.trim(), normalizedEmail, passwordHash]);
        const user = {
            id: result.insertId,
            name: name.trim(),
            email: normalizedEmail,
        };
        res.status(201).json({ user, token: createToken(user.id) });
    }
    catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ error: "Não foi possível criar a conta." });
    }
});
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
            res.status(400).json({ error: "Informe e-mail e senha." });
            return;
        }
        const [rows] = await pool.query<RowDataPacket[]>("SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1", [email.trim().toLowerCase()]);
        const account = rows[0];
        if (!account || !(await bcrypt.compare(password, account.password_hash))) {
            res.status(401).json({ error: "E-mail ou senha incorretos." });
            return;
        }
        const user = {
            id: Number(account.id),
            name: String(account.name),
            email: String(account.email),
        };
        res.json({ user, token: createToken(user.id) });
    }
    catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Não foi possível entrar." });
    }
});
app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT id, name, email FROM users WHERE id = ? LIMIT 1", [req.userId]);
        if (!rows.length) {
            res.status(401).json({ error: "Usuário não encontrado." });
            return;
        }
        res.json({ user: rows[0] });
    }
    catch {
        res.status(500).json({ error: "Erro ao consultar o perfil." });
    }
});
app.get("/api/users/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (typeof query !== "string") {
            res.status(400).json({
                error: "Informe um nome para pesquisar.",
            });
            return;
        }
        const name = query.trim();
        if (!name || name.length > 100) {
            res.status(400).json({
                error: "Digite um nome válido com até 100 caracteres.",
            });
            return;
        }
        const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id, name

       FROM users

       WHERE name LIKE ?

       ORDER BY name ASC

       LIMIT 24`, [`%${name}%`]);
        res.json(rows.map((row) => ({
            id: Number(row.id),
            name: String(row.name),
        })));
    }
    catch (error) {
        console.error("Erro ao pesquisar usuários:", error);
        res.status(500).json({
            error: "Não foi possível pesquisar usuários.",
        });
    }
});
app.get("/api/users/:id", async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(400).json({ error: "Usuário inválido." });
            return;
        }
        const [users] = await pool.execute<RowDataPacket[]>("SELECT id, name FROM users WHERE id = ? LIMIT 1", [userId]);
        if (!users.length) {
            res.status(404).json({ error: "Usuário não encontrado." });
            return;
        }
        const [rows] = await pool.execute<RowDataPacket[]>(`SELECT

         ub.status,

         b.open_library_key,

         b.title,

         b.author,

         b.cover_id,

         b.publish_year,

         b.edition_count

       FROM user_books ub

       INNER JOIN books b ON b.id = ub.book_id

       WHERE ub.user_id = ?

       ORDER BY ub.created_at DESC`, [userId]);
        res.json({
            user: {
                id: Number(users[0].id),
                name: String(users[0].name),
            },
            books: rows.map((row) => ({
                status: row.status,
                book: {
                    key: row.open_library_key,
                    title: row.title,
                    author_name: row.author ? [row.author] : [],
                    cover_i: row.cover_id,
                    first_publish_year: row.publish_year,
                    edition_count: row.edition_count,
                },
            })),
        });
    }
    catch (error) {
        console.error("Erro ao carregar perfil público:", error);
        res.status(500).json({
            error: "Não foi possível carregar o perfil.",
        });
    }
});
type FriendshipRow = RowDataPacket & {
    id: number;
    requester_id: number;
    receiver_id: number;
    status: "pending" | "accepted";
};
function getAuthenticatedUserId(req: AuthRequest): number | null {
    const id = Number(req.userId);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}
// Consultar relação entre o usuário logado e outro leitor
app.get("/api/friendships/status/:userId", authenticate, async (req: AuthRequest, res: Response) => {
    const myId = getAuthenticatedUserId(req);
    const otherId = Number(req.params.userId);
    if (!myId || !Number.isSafeInteger(otherId) || otherId <= 0) {
        res.status(400).json({ error: "Usuário inválido." });
        return;
    }
    try {
        const [rows] = await pool.query<FriendshipRow[]>(`SELECT id, requester_id, receiver_id, status

       FROM friendships

       WHERE (requester_id = ? AND receiver_id = ?)

          OR (requester_id = ? AND receiver_id = ?)

       LIMIT 1`, [myId, otherId, otherId, myId]);
        res.json({ friendship: rows[0] ?? null });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao consultar amizade." });
    }
});
// Enviar solicitação de amizade
app.post("/api/friendships/request/:userId", authenticate, async (req: AuthRequest, res: Response) => {
    const myId = getAuthenticatedUserId(req);
    const otherId = Number(req.params.userId);
    if (!myId || !Number.isSafeInteger(otherId) || otherId <= 0 || myId === otherId) {
        res.status(400).json({ error: "Destinatário inválido." });
        return;
    }
    try {
        const [users] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE id = ? LIMIT 1", [otherId]);
        if (users.length === 0) {
            res.status(404).json({ error: "Usuário não encontrado." });
            return;
        }
        const [existing] = await pool.query<FriendshipRow[]>(`SELECT id FROM friendships

       WHERE (requester_id = ? AND receiver_id = ?)

          OR (requester_id = ? AND receiver_id = ?)

       LIMIT 1`, [myId, otherId, otherId, myId]);
        if (existing.length > 0) {
            res.status(409).json({ error: "Já existe uma amizade ou solicitação entre vocês." });
            return;
        }
        const [result] = await pool.query<ResultSetHeader>(`INSERT INTO friendships (requester_id, receiver_id, status)

       VALUES (?, ?, 'pending')`, [myId, otherId]);
        res.status(201).json({ id: result.insertId, status: "pending" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao enviar solicitação." });
    }
});
app.get("/api/friendships/friends", authenticate, async (req: AuthRequest, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
    }
    try {
        const [rows] = await pool.query(`

      SELECT

        f.id AS friendship_id,

        u.id AS user_id,

        u.name AS user_name

      FROM friendships f

      JOIN users u

        ON u.id = CASE

          WHEN f.requester_id = ? THEN f.receiver_id

          ELSE f.requester_id

        END

      WHERE

        (f.requester_id = ? OR f.receiver_id = ?)

        AND f.status = 'accepted'

      ORDER BY u.name ASC

      `, [userId, userId, userId]);
        return res.json(rows);
    }
    catch (error) {
        console.error("Erro ao listar amigos:", error);
        return res.status(500).json({
            error: "Não foi possível carregar a lista de amigos."
        });
    }
});
// Listar solicitações recebidas
app.get("/api/friendships/requests", authenticate, async (req: AuthRequest, res: Response) => {
    const myId = getAuthenticatedUserId(req);
    if (!myId) {
        res.status(401).json({ error: "Não autorizado." });
        return;
    }
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT f.id, f.created_at, u.id AS user_id, u.name AS user_name

       FROM friendships f

       JOIN users u ON u.id = f.requester_id

       WHERE f.receiver_id = ? AND f.status = 'pending'

       ORDER BY f.created_at DESC`, [myId]);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao listar solicitações." });
    }
});
// Aceitar solicitação recebida
app.patch("/api/friendships/:id/accept", authenticate, async (req: AuthRequest, res: Response) => {
    const myId = getAuthenticatedUserId(req);
    const friendshipId = Number(req.params.id);
    if (!myId || !Number.isSafeInteger(friendshipId) || friendshipId <= 0) {
        res.status(400).json({ error: "Solicitação inválida." });
        return;
    }
    try {
        const [result] = await pool.query<ResultSetHeader>(`UPDATE friendships SET status = 'accepted'

       WHERE id = ? AND receiver_id = ? AND status = 'pending'`, [friendshipId, myId]);
        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Solicitação não encontrada." });
            return;
        }
        res.json({ message: "Solicitação aceita." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao aceitar solicitação." });
    }
});
// Recusar solicitação, cancelar pedido ou desfazer amizade
app.delete("/api/friendships/:id", authenticate, async (req: AuthRequest, res: Response) => {
    const myId = getAuthenticatedUserId(req);
    const friendshipId = Number(req.params.id);
    if (!myId || !Number.isSafeInteger(friendshipId) || friendshipId <= 0) {
        res.status(400).json({ error: "Amizade inválida." });
        return;
    }
    try {
        const [result] = await pool.query<ResultSetHeader>(`DELETE FROM friendships

       WHERE id = ? AND (requester_id = ? OR receiver_id = ?)`, [friendshipId, myId, myId]);
        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Amizade ou solicitação não encontrada." });
            return;
        }
        res.json({ message: "Amizade ou solicitação removida." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao remover amizade." });
    }
});
app.get("/api/feed", authenticate, async (req: AuthRequest, res) => {
    try {
        const filtro = req.query.filtro === "amigos" ? "amigos" : "comunidade";
        const [rows] = await pool.query<RowDataPacket[]>(`

      SELECT

        ub.id,

        ub.user_id,

        u.name AS user_name,

        ub.status,

        ub.rating,

        ub.created_at,

        b.open_library_key,

        b.title,

        b.author,

        b.cover_id,

        b.publish_year,

        b.edition_count

      FROM user_books ub

      INNER JOIN users u

        ON u.id = ub.user_id

      INNER JOIN books b

        ON b.id = ub.book_id

      WHERE (

  ? = 'comunidade'

  OR EXISTS (

    SELECT 1

    FROM friendships f

    WHERE f.status = 'accepted'

      AND (

        (f.requester_id = ? AND f.receiver_id = ub.user_id)

        OR

        (f.receiver_id = ? AND f.requester_id = ub.user_id)

      )

  )

)

ORDER BY ub.created_at DESC, ub.id DESC

LIMIT 50

      `, [filtro, req.userId, req.userId]);
        res.json(rows.map((row) => ({
            id: row.id,
            user_id: row.user_id,
            user_name: row.user_name,
            status: row.status,
            rating: row.rating,
            created_at: row.created_at,
            book: {
                key: row.open_library_key,
                title: row.title,
                author_name: row.author ? [row.author] : [],
                cover_i: row.cover_id,
                first_publish_year: row.publish_year,
                edition_count: row.edition_count,
            },
        })));
    }
    catch (error) {
        console.error("Erro ao carregar feed:", error);
        res.status(500).json({
            error: "Não foi possível carregar o feed."
        });
    }
});
app.get("/api/books", authenticate, async (req: AuthRequest, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT

         ub.id,

         ub.status,

        ub.rating,

        ub.notes,

        ub.current_page,

        ub.total_pages,

        ub.started_at,

        ub.finished_at,

        ub.is_favorite,

        b.open_library_key,

         b.title,

         b.author,

         b.cover_id,

         b.publish_year,

         b.edition_count

       FROM user_books ub

       INNER JOIN books b ON b.id = ub.book_id

       WHERE ub.user_id = ?

       ORDER BY ub.created_at DESC`, [req.userId]);
        res.json(rows.map((row) => ({
            id: row.id,
            book: {
                key: row.open_library_key,
                title: row.title,
                author_name: row.author ? [row.author] : [],
                cover_i: row.cover_id,
                first_publish_year: row.publish_year,
                edition_count: row.edition_count,
            },
            status: row.status,
            rating: row.rating,
            notes: row.notes || "",
            current_page: Number(row.current_page ?? 0),
            total_pages: row.total_pages == null
                ? null
                : Number(row.total_pages),
            started_at: row.started_at
                ? new Date(row.started_at).toISOString().slice(0, 10)
                : null,
            finished_at: row.finished_at
                ? new Date(row.finished_at).toISOString().slice(0, 10)
                : null,
            is_favorite: Boolean(row.is_favorite),
        })));
    }
    catch (error) {
        console.error("Erro ao listar livros:", error);
        res.status(500).json({ error: "Não foi possível carregar a estante." });
    }
});
app.post("/api/books", authenticate, async (req: AuthRequest, res) => {
    const book: BookInput | undefined = req.body?.book;
    const status: unknown = req.body?.status || "Quero ler";
    if (!book ||
        typeof book.key !== "string" ||
        !/^\/works\/OL\d+W$/.test(book.key) ||
        typeof book.title !== "string" ||
        !book.title.trim() ||
        book.title.length > 500 ||
        !validStatus(status)) {
        res.status(400).json({ error: "Dados do livro inválidos." });
        return;
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [bookResult] = await connection.execute<ResultSetHeader>(`INSERT INTO books

       (open_library_key, title, author, cover_id, publish_year, edition_count)

       VALUES (?, ?, ?, ?, ?, ?)

       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`, [
            book.key,
            book.title.trim(),
            Array.isArray(book.author_name)
                ? book.author_name.join(", ")
                : null,
            book.cover_i ?? null,
            book.first_publish_year ?? null,
            book.edition_count ?? null,
        ]);
        const [savedResult] = await connection.execute<ResultSetHeader>(`INSERT INTO user_books (user_id, book_id, status)

       VALUES (?, ?, ?)

       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`, [req.userId!, bookResult.insertId, status]);
        await connection.commit();
        res.status(201).json({
            id: savedResult.insertId,
            book,
            status,
            rating: 0,
            notes: "",
        });
    }
    catch (error) {
        await connection.rollback();
        console.error("Erro ao salvar livro:", error);
        res.status(500).json({ error: "Não foi possível salvar o livro." });
    }
    finally {
        connection.release();
    }
});
app.patch("/api/books/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const id = Number(req.params.id);
        const { status, rating, notes, current_page, total_pages, started_at, finished_at, is_favorite, } = req.body;
        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({ error: "Livro inválido." });
            return;
        }
        if ((status !== undefined && !validStatus(status)) ||
            (rating !== undefined &&
                (!Number.isInteger(rating) || rating < 0 || rating > 5)) ||
            (notes !== undefined &&
                (typeof notes !== "string" || notes.length > 10000))) {
            res.status(400).json({ error: "Dados de atualização inválidos." });
            return;
        }
        const validPage = (value: unknown) => Number.isSafeInteger(value) &&
            Number(value) >= 0;
        const validDate = (value: unknown) => {
            if (value === null)
                return true;
            if (typeof value !== "string")
                return false;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return false;
            }
            const date = new Date(`${value}T00:00:00Z`);
            return (!Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value);
        };
        if ((current_page !== undefined && !validPage(current_page)) ||
            (total_pages !== undefined &&
                total_pages !== null &&
                (!validPage(total_pages) || total_pages === 0)) ||
            (started_at !== undefined && !validDate(started_at)) ||
            (finished_at !== undefined && !validDate(finished_at)) ||
            (is_favorite !== undefined && typeof is_favorite !== "boolean")) {
            res.status(400).json({
                error: "Dados de acompanhamento de leitura inválidos.",
            });
            return;
        }
        const [savedBooks] = await pool.execute<RowDataPacket[]>(`SELECT status, current_page, total_pages

   FROM user_books

   WHERE id = ? AND user_id = ?

   LIMIT 1`, [id, req.userId!]);
        if (savedBooks.length === 0) {
            res.status(404).json({
                error: "Livro não encontrado na sua estante.",
            });
            return;
        }
        const savedBook = savedBooks[0];
        const effectiveStatus = status ?? savedBook.status;
        const effectiveCurrentPage = current_page ?? Number(savedBook.current_page ?? 0);
        const effectiveTotalPages = total_pages === undefined
            ? savedBook.total_pages
            : total_pages;
        if (effectiveTotalPages !== null &&
            effectiveTotalPages !== undefined &&
            effectiveCurrentPage > Number(effectiveTotalPages)) {
            res.status(400).json({
                error: "A página atual não pode ultrapassar o total de páginas.",
            });
            return;
        }
        if (effectiveStatus === "Quero ler" &&
            rating !== undefined &&
            rating > 0) {
            res.status(400).json({
                error: "Comece a leitura antes de avaliar este livro.",
            });
            return;
        }
        if (effectiveStatus === "Quero ler" &&
            current_page !== undefined &&
            current_page > 0) {
            res.status(400).json({
                error: "Altere o status para Lendo antes de registrar o progresso.",
            });
            return;
        }
        const fields: string[] = [];
        const values: (string | number | null)[] = [];
        if (status !== undefined) {
            fields.push("status = ?");
            values.push(status);
        }
        if (rating !== undefined) {
            fields.push("rating = ?");
            values.push(rating);
        }
        if (notes !== undefined) {
            fields.push("notes = ?");
            values.push(notes);
        }
        if (current_page !== undefined) {
            fields.push("current_page = ?");
            values.push(current_page);
        }
        if (total_pages !== undefined) {
            fields.push("total_pages = ?");
            values.push(total_pages);
        }
        if (started_at !== undefined) {
            fields.push("started_at = ?");
            values.push(started_at);
        }
        if (finished_at !== undefined) {
            fields.push("finished_at = ?");
            values.push(finished_at);
        }
        if (is_favorite !== undefined) {
            fields.push("is_favorite = ?");
            values.push(is_favorite ? 1 : 0);
        }
        if (!fields.length) {
            res.status(400).json({ error: "Nenhuma alteração informada." });
            return;
        }
        values.push(id, req.userId!);
        const [result] = await pool.execute<ResultSetHeader>(`UPDATE user_books SET ${fields.join(", ")}

       WHERE id = ? AND user_id = ?`, values);
        if (!result.affectedRows) {
            res.status(404).json({ error: "Livro não encontrado na sua estante." });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("Erro ao atualizar livro:", error);
        res.status(500).json({ error: "Não foi possível atualizar o livro." });
    }
});
app.delete("/api/books/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({ error: "Livro inválido." });
            return;
        }
        const [result] = await pool.execute<ResultSetHeader>("DELETE FROM user_books WHERE id = ? AND user_id = ?", [id, req.userId!]);
        if (!result.affectedRows) {
            res.status(404).json({ error: "Livro não encontrado na sua estante." });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("Erro ao excluir livro:", error);
        res.status(500).json({ error: "Não foi possível remover o livro." });
    }
});
app.listen(PORT, () => {
    console.log(`Bookshelf Online API: http://localhost:${PORT}`);
});
