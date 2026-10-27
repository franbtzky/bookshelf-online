
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Book = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
};


type ReadingStatus = "Quero ler" | "Lendo" | "Lido";
type Page =
  | "inicio"
  | "explorar"
  | "estante"
  | "perfil"
  | "amigos"
  | "feed"
  | "livro";
type SearchType = "livros" | "autores" | "usuarios";
type AuthMode = "register" | "login";

type SavedBook = {
  current_page: number;
  total_pages: number | null;
  started_at: string | null;
  finished_at: string | null;
  is_favorite: boolean;
  id: number;
  book: Book;
  status: ReadingStatus;
  rating: number;
  notes: string;
};

type User = {
  id: number;
  name: string;
  email: string;
};

type SearchUser = {
  id: number;
  name: string;
};

type PublicBook = {
  status: ReadingStatus;
  book: Book;
};

type Friendship = {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: "pending" | "accepted";
};

type FriendshipStatusResponse = {
  friendship: Friendship | null;
};

type PublicProfile = {
  user: SearchUser;
  books: PublicBook[];
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
  book: Book;
};

type BookReview = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_id: number;
  user_name: string;
};

type BookReviewsResponse = {
  averageRating: number;
  totalReviews: number;
  reviews: BookReview[];
};

type Genre = {
  id: string;
  name: string;
  description: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const TOKEN_KEY = "bookshelf-online-token";

const statusOptions: ReadingStatus[] = [
  "Quero ler",
  "Lendo",
  "Lido",
];

const genres: Genre[] = [
  {
    id: "romance",
    name: "Romance",
    description: "Histórias de amor e encontros inesquecíveis",
  },
  {
    id: "fantasy",
    name: "Fantasia",
    description: "Mundos mágicos e aventuras extraordinárias",
  },
  {
    id: "horror",
    name: "Terror",
    description: "Histórias sombrias e arrepiantes",
  },
  {
    id: "mystery",
    name: "Mistério",
    description: "Segredos, enigmas e investigações",
  },
  {
    id: "science_fiction",
    name: "Ficção científica",
    description: "Outros mundos e futuros possíveis",
  },
  {
    id: "classic_literature",
    name: "Clássicos",
    description: "Obras que atravessam gerações",
  },
];

async function api<T>(
  path: string,
  token?: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique o Back-End."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || "Não foi possível concluir a operação."
    );
  }

  return data as T;
}

function getCover(book: Book, size: "M" | "L" = "M") {
  return book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-${size}.jpg`
    : null;
}

function getAuthor(book: Book) {
  return book.author_name?.join(", ") || "Autor desconhecido";
}

function getInitialPage(): Page {
  const path = window.location.pathname;

  if (/^\/perfil\/\d+\/?$/.test(path)) return "perfil";
  if (/^\/livro\/OL\d+W\/?$/.test(path)) return "livro";
  if (/^\/amigos\/?$/.test(path)) return "amigos";
  if (/^\/estante\/?$/.test(path)) return "estante";
  if (/^\/explorar\/?$/.test(path)) return "explorar";
  if (/^\/feed\/?$/.test(path)) return "feed";

  return "inicio";
}

function App() {
  
  const [page, setPage] = useState<Page>(getInitialPage);
  console.log("Página atual:", page);
  console.log("URL atual:", window.location.pathname);
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("livros");
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  const [friendshipError, setFriendshipError] = useState("");
  type FriendRequest = {
  id: number;
  user_id: number;
  user_name: string;
  created_at: string;
};
const [notificationsOpen, setNotificationsOpen] = useState(false);
const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
type Friend = {
  friendship_id: number;
  user_id: number;
  user_name: string;
};
type FeedActivity = {
  id: number;
  user_id: number;
  user_name: string;
  status: string;
  rating: number | null;
  created_at: string;
  book: Book;
};

const [friends, setFriends] = useState<Friend[]>([]);
const [friendsLoading, setFriendsLoading] = useState(false);
const [friendsError, setFriendsError] = useState("");
const [feedActivities, setFeedActivities] = useState<FeedActivity[]>([]);
const [feedFilter, setFeedFilter] = useState<"comunidade" | "amigos">("comunidade");
const [feedLoading, setFeedLoading] = useState(false);
const [feedError, setFeedError] = useState("");
const [friendSearch, setFriendSearch] = useState("");
const [friendSearchResults, setFriendSearchResults] = useState<SearchUser[]>([]);
const [friendSearchLoading, setFriendSearchLoading] = useState(false);
const [friendSearchError, setFriendSearchError] = useState("");
const [notificationsLoading, setNotificationsLoading] = useState(false);
const [notificationActionId, setNotificationActionId] = useState<number | null>(null);
const [notificationsError, setNotificationsError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [library, setLibrary] = useState<SavedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const [genreBooks, setGenreBooks] = useState<
    Record<string, Book[]>
  >({});
  const [genreLoading, setGenreLoading] = useState(true);
  const [genreError, setGenreError] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || ""
  );
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingBook, setPendingBook] = useState<Book | null>(null);
  const [pendingLibrary, setPendingLibrary] = useState(false);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [description, setDescription] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] =
  useState<ReadingStatus>("Quero ler");

  const [ratingDraft, setRatingDraft] = useState(0);
  const [currentPageDraft, setCurrentPageDraft] = useState(0);
  const [totalPagesDraft, setTotalPagesDraft] = useState("");
  const [startedAtDraft, setStartedAtDraft] = useState("");
  const [finishedAtDraft, setFinishedAtDraft] = useState("");
  const [isFavoriteDraft, setIsFavoriteDraft] = useState(false);
  const [bookChangesSaving, setBookChangesSaving] = useState(false);
  const [bookSaveMessage, setBookSaveMessage] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [bookReviews, setBookReviews] = useState<BookReview[]>([]);
  const [bookAverageRating, setBookAverageRating] = useState(0);
  const [bookReviewsLoading, setBookReviewsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Todos");
  function navigateTo(pageName: Page) {
  const routes: Record<Page, string> = {
    inicio: "/",
    explorar: "/explorar",
    estante: "/estante",
    amigos: "/amigos",
    feed: "/feed",
    perfil: window.location.pathname,
    livro: window.location.pathname,
  };

  window.history.pushState({}, "", routes[pageName]);
  setSelectedBook(null);
  setPage(pageName);
  window.scrollTo(0, 0);
}
useEffect(() => {
  const value = friendSearch.trim();

  if (value.length < 2) {
    setFriendSearchResults([]);
    setFriendSearchError("");
    setFriendSearchLoading(false);
    return;
  }

  let cancelled = false;

  const timeout = window.setTimeout(async () => {
    setFriendSearchLoading(true);
    setFriendSearchError("");

    try {
      const results = await api<SearchUser[]>(
        `/users/search?q=${encodeURIComponent(value)}`
      );

      if (!cancelled) {
        setFriendSearchResults(
          results.filter((reader) => reader.id !== user?.id)
        );
      }
    } catch (err) {
      if (!cancelled) {
        setFriendSearchError((err as Error).message);
      }
    } finally {
      if (!cancelled) {
        setFriendSearchLoading(false);
      }
    }
  }, 350);

  return () => {
    cancelled = true;
    window.clearTimeout(timeout);
  };
}, [friendSearch, user?.id]);
  useEffect(() => {
  if (!token || !user) {
    setFriendRequests([]);
    setNotificationsOpen(false);
    return;
  }

  let cancelled = false;

  async function fetchPendingRequests() {
    try {
      const requests = await api<FriendRequest[]>(
        "/friendships/requests",
        token
      );

      if (!cancelled) {
        setFriendRequests(requests);
      }
    } catch (err) {
      if (!cancelled) {
        console.error("Erro ao carregar notificações:", err);
      }
    }
  }

  void fetchPendingRequests();

  return () => {
    cancelled = true;
  };
}, [token, user?.id]);

  useEffect(() => {
  const match = window.location.pathname.match(/^\/perfil\/(\d+)\/?$/);

 if (match) {
  void openUserProfile(Number(match[1]), false);
}

 function handleBackForward() {
  const path = window.location.pathname;

  const profileMatch = path.match(/^\/perfil\/(\d+)\/?$/);

  if (profileMatch) {
    setSelectedBook(null);
    void openUserProfile(Number(profileMatch[1]), false);
    return;
  }

  setPublicProfile(null);
  setSelectedBook(null);
  setPage(getInitialPage());

  window.scrollTo(0, 0);
}

window.addEventListener("popstate", handleBackForward);

return () => {
  window.removeEventListener("popstate", handleBackForward);
};
}, []);

useEffect(() => {
  if (!selectedBook || !authReady) return;

  const saved = library.find(
    (item) => item.book.key === selectedBook.key
  );

  setStatusDraft(saved?.status || "Quero ler");
  setRatingDraft(0);
  setNotesDraft(saved?.notes || "");

  setCurrentPageDraft(saved?.current_page ?? 0);

  setTotalPagesDraft(
    saved?.total_pages != null
      ? String(saved.total_pages)
      : ""
  );

  setStartedAtDraft(saved?.started_at || "");
  setFinishedAtDraft(saved?.finished_at || "");
  setIsFavoriteDraft(saved?.is_favorite ?? false);
}, [selectedBook?.key, authReady]);

useEffect(() => {
  if (page === "amigos" && token) {
    void loadFriends();
  }
}, [page, token]);

useEffect(() => {
  if (page === "feed" && token) {
    void loadFeed();
  }
}, [page, token, feedFilter]);

  useEffect(() => {
    let active = true;

    if (!token) {
      setUser(null);
      setLibrary([]);
      setAuthReady(true);
      return;
    }

    setAuthReady(false);

    Promise.all([
      api<{ user: User }>("/auth/me", token),
      api<SavedBook[]>("/books", token),
    ])
      .then(([profile, items]) => {
        if (!active) return;
        setUser(profile.user);
        setLibrary(items);
        setAuthReady(true);
      })
      .catch((err: Error) => {
        if (!active) return;
        setActionError(err.message);
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setLibrary([]);
        setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadGenres() {
      setGenreLoading(true);

      const results = await Promise.allSettled(
        genres.map(async (genre) => {
          const response = await fetch(
            `https://openlibrary.org/subjects/${genre.id}.json?limit=8`
          );

          if (!response.ok) {
            throw new Error("Falha ao carregar gênero");
          }

          const data = await response.json();

          const items: Book[] = (data.works || [])
            .filter(
              (work: {
                key?: string;
                title?: string;
              }) =>
                typeof work.key === "string" &&
                /^\/works\/OL\d+W$/.test(work.key) &&
                typeof work.title === "string"
            )
            .map(
              (work: {
                key: string;
                title: string;
                authors?: { name: string }[];
                cover_id?: number;
                first_publish_year?: number;
              }) => ({
                key: work.key,
                title: work.title,
                author_name: work.authors?.map(
                  (author) => author.name
                ),
                cover_i: work.cover_id,
                first_publish_year: work.first_publish_year,
              })
            );

          return { id: genre.id, items };
        })
      );

      if (!active) return;

      const collection: Record<string, Book[]> = {};
      let failed = false;

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          collection[result.value.id] = result.value.items;
        } else {
          failed = true;
        }
      });

      setGenreBooks(collection);
      setGenreError(failed);
      setGenreLoading(false);
    }

    void loadGenres();

    return () => {
      active = false;
    };
  }, []);

  async function loadReviews() {
    setReviewsLoading(true);
    setReviewsError(false);

    try {
      const items = await api<Review[]>("/reviews/recent");
      setReviews(items);
      setReviewIndex(0);
    } catch {
      setReviewsError(true);
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  useEffect(() => {
    if (reviews.length < 2) return;

    const interval = window.setInterval(() => {
      setReviewIndex((current) => (current + 1) % reviews.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [reviews.length]);

  function openAuth(mode: AuthMode = "register") {
    setAuthMode(mode);
    setAuthError("");
    setAuthOpen(true);
  }

  function closeAuth() {
    if (authLoading) return;
    setAuthOpen(false);
    setPendingBook(null);
    setPendingLibrary(false);
    setAuthPassword("");
    setAuthError("");
  }

  function requestLibrary() {
    if (!authReady) return;

    if (user) {
      navigateTo("estante");
    } else {
      setPendingLibrary(true);
      openAuth();
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setLibrary([]);
    setPendingBook(null);
    setSelectedBook(null);
    setPage("inicio");
    setActionError("");
  }

  function findSavedBook(key: string) {
    return library.find((item) => item.book.key === key);
  }

  async function addBook(book: Book, authToken: string) {
    setSaving(true);
    setActionError("");

    try {
      const item = await api<SavedBook>(
        "/books",
        authToken,
        {
          method: "POST",
          body: JSON.stringify({
            book,
            status: "Quero ler",
          }),
        }
      );

      setLibrary((current) =>
        current.some((saved) => saved.book.key === book.key)
          ? current
          : [...current, item]
      );

      return true;
    } catch (err) {
      setActionError((err as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveBook(book: Book) {
    if (!authReady) return;

    if (!user || !token) {
      setPendingBook(book);
      openAuth();
      return;
    }

    if (findSavedBook(book.key)) return;

    await addBook(book, token);
  }

  async function removeBook(key: string) {
    const item = findSavedBook(key);
    if (!item || !token) return;

    setActionError("");

    try {
      await api(`/books/${item.id}`, token, {
        method: "DELETE",
      });

      setLibrary((current) =>
        current.filter((saved) => saved.id !== item.id)
      );
      setSelectedBook(null);
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function updateBook(
  key: string,
  changes: Partial<
  Pick<
    SavedBook,
    | "status"
    | "rating"
    | "notes"
    | "current_page"
    | "total_pages"
    | "started_at"
    | "finished_at"
    | "is_favorite"
  >
>
) {
  const item = findSavedBook(key);

  if (!item || !token) {
    throw new Error("Não foi possível identificar o livro ou a sessão.");
  }

  setActionError("");

  try {
    await api(`/books/${item.id}`, token, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });

    setLibrary((current) =>
      current.map((saved) =>
        saved.id === item.id
          ? { ...saved, ...changes }
          : saved
      )
    );
  } catch (err) {
    setActionError((err as Error).message);
    throw err;
  }
}

async function loadBookReviews(bookKey: string) {
  const match = bookKey.match(/^\/works\/(OL\d+W)$/);

  if (!match) return;

  setBookReviewsLoading(true);
  setBookReviews([]);
  setBookAverageRating(0);

  try {
    const data = await api<BookReviewsResponse>(
      `/reviews/book/${match[1]}`
    );

    setBookReviews(data.reviews);
    setBookAverageRating(data.averageRating);

  } catch (err) {
    console.error("Erro ao carregar avaliações do livro:", err);
    setBookReviews([]);
    setBookAverageRating(0);

  } finally {
    setBookReviewsLoading(false);
  }
}

  // A nota e a resenha são uma única avaliação, carregada de book_reviews.
  useEffect(() => {
    const mine = bookReviews.find((review) => review.user_id === user?.id);
    setRatingDraft(mine?.rating ?? 0);
    setReviewComment(mine?.comment ?? "");
  }, [bookReviews, user?.id]);

  async function publishReview() {
    if (!selectedBook || !token) return;

    const saved = findSavedBook(selectedBook.key);
    if (!saved) return;

    if (ratingDraft < 1 || ratingDraft > 5) {
      setReviewMessage("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }

    setReviewSaving(true);
    setReviewMessage("");

    try {
      await api("/reviews", token, {
        method: "POST",
        body: JSON.stringify({
          savedBookId: saved.id,
          rating: ratingDraft,
          comment: reviewComment,
        }),
      });

      setReviewMessage("Avaliação salva com sucesso!");
      await Promise.all([loadBookReviews(selectedBook.key), loadReviews()]);
    } catch (err) {
      setReviewMessage((err as Error).message);
    } finally {
      setReviewSaving(false);
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublicProfile(null);
    setProfileError("");
    setAuthLoading(true);
    setAuthError("");

    try {
      const data = await api<{
        user: User;
        token: string;
      }>(
        authMode === "register"
          ? "/auth/register"
          : "/auth/login",
        undefined,
        {
          method: "POST",
          body: JSON.stringify(
            authMode === "register"
              ? {
                  name: authName,
                  email: authEmail,
                  password: authPassword,
                }
              : {
                  email: authEmail,
                  password: authPassword,
                }
          ),
        }
      );

      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setToken(data.token);

      if (pendingBook) {
        await addBook(pendingBook, data.token);
      }

      if (pendingLibrary) {
        setPage("estante");
      }

      setPendingBook(null);
      setPendingLibrary(false);
      setAuthOpen(false);
      setAuthPassword("");
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  }

  
async function searchAuthors(term: string) {
  const value = term.trim();

  if (!value) {
    setError("Digite o nome de um autor para pesquisar.");
    return;
  }

  setPage("explorar");
  setLoading(true);
  setError("");
  setSearched(true);
  setBooks([]);

  try {
    const params = new URLSearchParams({
      author: value,
      fields:
        "key,title,author_name,first_publish_year,cover_i,edition_count",
      limit: "24",
    });

    const response = await fetch(
      `https://openlibrary.org/search.json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Erro na pesquisa de autores.");
    }

    const data = await response.json();

    const results: Book[] = Array.isArray(data.docs)
      ? data.docs.filter(
          (book: Book) =>
            typeof book.key === "string" &&
            /^\/works\/OL\d+W$/.test(book.key) &&
            typeof book.title === "string"
        )
      : [];

    setBooks(results);
  } catch {
    setError(
      "Não foi possível pesquisar os livros deste autor. Tente novamente."
    );
  } finally {
    setLoading(false);
  }
}



async function openUserProfile(
  userId: number,
  updateHistory = true
) {
  // Fecha detalhes de livros ao entrar em um perfil público.
  setSelectedBook(null);
  if (updateHistory) {
  window.history.pushState({}, "", `/perfil/${userId}`);
}

  setPage("perfil");
  setPublicProfile(null);
  setProfileLoading(true);
  setProfileError("");
  setFriendship(null);
  setFriendshipError("");

  window.scrollTo(0, 0);

  try {
    const profile = await api<PublicProfile>(`/users/${userId}`);
    setPublicProfile(profile);

    if (token) {
      try {
        const result = await api<FriendshipStatusResponse>(
          `/friendships/status/${userId}`,
          token
        );

        setFriendship(result.friendship);
      } catch (err) {
        setFriendshipError(
          "Não foi possível consultar a amizade: " +
          (err as Error).message
        );
      }
    }
  } catch (err) {
    setProfileError((err as Error).message);
  } finally {
    setProfileLoading(false);
  }
}

async function searchUsers(term: string) {
  const value = term.trim();

  if (!value) {
    setError("Digite o nome de um usuário para pesquisar.");
    return;
  }

  setPage("explorar");
  setLoading(true);
  setError("");
  setSearched(true);
  setBooks([]);
  setUsers([]);

  try {
    const results = await api<SearchUser[]>(
      `/users/search?q=${encodeURIComponent(value)}`
    );

    setUsers(results);
  } catch (err) {
    setError((err as Error).message);
  } finally {
    setLoading(false);
  }
}


  async function searchBooks(term: string) {
    const value = term.trim();

    if (!value) {
      setError("Digite um título ou autor para pesquisar.");
      return;
    }

    setPage("explorar");
    setLoading(true);
    setError("");
    setSearched(true);
    setBooks([]);

    try {
      const params = new URLSearchParams({
        q: value,
        fields:
          "key,title,author_name,first_publish_year,cover_i,edition_count",
        limit: "24",
      });

      const response = await fetch(
        `https://openlibrary.org/search.json?${params}`
      );

      if (!response.ok) {
        throw new Error("Erro na pesquisa.");
      }

      const data = await response.json();

      setBooks(
        Array.isArray(data.docs)
          ? data.docs.filter(
              (book: Book) =>
                /^\/works\/OL\d+W$/.test(book.key)
            )
          : []
      );
    } catch {
      setError(
        "Não foi possível carregar os livros. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadFeed() {
  if (!token) return;

  setFeedLoading(true);
  setFeedError("");

  try {
    const activities = await api<FeedActivity[]>(
  `/feed?filtro=${feedFilter}`,
  token
);
    setFeedActivities(activities);
  } catch (err) {
    setFeedError((err as Error).message);
  } finally {
    setFeedLoading(false);
  }
}

  async function loadFriends() {
  if (!token) return;

  setFriendsLoading(true);
  setFriendsError("");

  try {
    const result = await api<Friend[]>("/friendships/friends", token);
    setFriends(result);
  } catch (err) {
    setFriendsError((err as Error).message);
  } finally {
    setFriendsLoading(false);
  }
}

  
async function loadFriendRequests() {
  if (!token) {
    setFriendRequests([]);
    return;
  }

  setNotificationsLoading(true);
  setNotificationsError("");

  try {
    const requests = await api<FriendRequest[]>(
      "/friendships/requests",
      token
    );

    setFriendRequests(requests);
  } catch (err) {
    setNotificationsError((err as Error).message);
  } finally {
    setNotificationsLoading(false);
  }
}

async function respondToFriendRequest(
  requestId: number,
  action: "accept" | "reject"
) {
  if (!token || notificationActionId !== null) return;

  setNotificationActionId(requestId);
  setNotificationsError("");

  try {
    await api(
      action === "accept"
        ? `/friendships/${requestId}/accept`
        : `/friendships/${requestId}`,
      token,
      { method: action === "accept" ? "PATCH" : "DELETE" }
    );

    setFriendRequests((current) =>
      current.filter((request) => request.id !== requestId)
    );

    // Atualiza o botão do perfil, caso esteja aberto.
    if (publicProfile) {
      const result = await api<FriendshipStatusResponse>(
        `/friendships/status/${publicProfile.user.id}`,
        token
      );

      setFriendship(result.friendship);
    }
  } catch (err) {
    setNotificationsError((err as Error).message);
  } finally {
    setNotificationActionId(null);
  }
}


  async function rejectFriendshipRequest() {
  if (!token || !friendship || !user || friendshipLoading) return;

  if (
    friendship.status !== "pending" ||
    friendship.receiver_id !== user.id
  ) {
    return;
  }

  setFriendshipLoading(true);
  setFriendshipError("");

  try {
    await api(
      `/friendships/${friendship.id}`,
      token,
      { method: "DELETE" }
    );

    setFriendship(null);
  } catch (err) {
    setFriendshipError((err as Error).message);
  } finally {
    setFriendshipLoading(false);
  }
}

async function removeFriendship() {
  if (!token || !friendship || friendshipLoading) return;

  if (friendship.status !== "accepted") return;

  const confirmed = window.confirm(
    `Tem certeza de que deseja desfazer a amizade com ${publicProfile?.user.name ?? "este usuário"}?`
  );

  if (!confirmed) return;

  setFriendshipLoading(true);
  setFriendshipError("");

  try {
    await api(
      `/friendships/${friendship.id}`,
      token,
      { method: "DELETE" }
    );

    setFriendship(null);

    // Atualiza a lista de amigos.
    setFriends((current) =>
      current.filter(
        (friend) => friend.friendship_id !== friendship.id
      )
    );
  } catch (err) {
    setFriendshipError((err as Error).message);
  } finally {
    setFriendshipLoading(false);
  }
}

  async function handleFriendshipAction(otherUserId: number) {
  if (!token || !user || friendshipLoading) return;

  setFriendshipLoading(true);
  setFriendshipError("");

  try {
    if (!friendship) {
      await api(
        `/friendships/request/${otherUserId}`,
        token,
        { method: "POST" }
      );
    } else if (friendship.status === "pending" &&
               friendship.requester_id === user.id) {
      await api(
        `/friendships/${friendship.id}`,
        token,
        { method: "DELETE" }
      );
    } else if (friendship.status === "pending" &&
               friendship.receiver_id === user.id) {
      await api(
        `/friendships/${friendship.id}/accept`,
        token,
        { method: "PATCH" }
      );
    } else {
      return;
    }

    const result = await api<FriendshipStatusResponse>(
      `/friendships/status/${otherUserId}`,
      token
    );

    setFriendship(result.friendship);
  } catch (err) {
    setFriendshipError((err as Error).message);
  } finally {
    setFriendshipLoading(false);
  }
}
  
function handleSearch(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (searchType === "autores") {
    setUsers([]);
    void searchAuthors(query);
    return;
  }

  if (searchType === "usuarios") {
    void searchUsers(query);
    return;
  }

  setUsers([]);
  void searchBooks(query);
}


  function exploreGenre(genre: Genre) {
    setQuery(genre.name);
    void searchBooks(`subject:${genre.id}`);
  }

  async function saveBookChanges() {
  if (!selectedBook || bookChangesSaving) return;

  setBookSaveMessage("");

  const totalPages = totalPagesDraft.trim()
    ? Number(totalPagesDraft)
    : null;

  if (
    statusDraft !== "Quero ler" &&
    totalPages !== null &&
    (!Number.isSafeInteger(totalPages) || totalPages <= 0)
  ) {
    setBookSaveMessage("Informe um total de páginas válido.");
    return;
  }

  if (
    statusDraft === "Lendo" &&
    totalPages !== null &&
    currentPageDraft > totalPages
  ) {
    setBookSaveMessage(
      "A página atual não pode ultrapassar o total de páginas."
    );
    return;
  }

  if (
    startedAtDraft &&
    finishedAtDraft &&
    finishedAtDraft < startedAtDraft
  ) {
    setBookSaveMessage(
      "A data de término não pode ser anterior à data de início."
    );
    return;
  }

  setBookChangesSaving(true);

  try {
    await updateBook(selectedBook.key, {
      status: statusDraft,

      ...(statusDraft === "Lendo"
        ? {
            current_page: currentPageDraft,
            total_pages: totalPages,
          }
        : {}),

      ...(statusDraft !== "Quero ler"
        ? {
            started_at: startedAtDraft || null,
            finished_at: finishedAtDraft || null,
          }
        : {}),

      is_favorite: isFavoriteDraft,
    });

    setBookSaveMessage("Alterações salvas com sucesso!");
  } catch (err) {
    setBookSaveMessage(
      (err as Error).message ||
        "Não foi possível salvar as alterações."
    );
  } finally {
    setBookChangesSaving(false);
  }
}

  async function openDetails(book: Book) {
    const savedBook = findSavedBook(book.key);
    setSelectedBook(book);
    setBookReviews([]);
    void loadBookReviews(book.key);
    setNotesDraft(savedBook?.notes || "");
    setStatusDraft(savedBook?.status || "Quero ler");
    setRatingDraft(0);
    setCurrentPageDraft(savedBook?.current_page ?? 0);
setTotalPagesDraft(
  savedBook?.total_pages != null
    ? String(savedBook.total_pages)
    : ""
);
setStartedAtDraft(savedBook?.started_at || "");
setFinishedAtDraft(savedBook?.finished_at || "");
setIsFavoriteDraft(savedBook?.is_favorite ?? false);
    setReviewComment("");
    setReviewMessage("");
    setDescription("");
    setDetailsLoading(true);
    setActionError("");

    try {
      if (!book.key.startsWith("/works/")) {
        setDescription("Descrição não disponível.");
        return;
      }

      const response = await fetch(
        `https://openlibrary.org${book.key}.json`
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar detalhes.");
      }

      const data = await response.json();

      const text =
        typeof data.description === "string"
          ? data.description
          : data.description?.value;

      setDescription(
        text ||
          "A Open Library ainda não possui uma sinopse para este livro."
      );
    } catch {
      setDescription(
        "Não foi possível carregar a descrição deste livro."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
  if (page !== "livro") return;

  const match = window.location.pathname.match(
    /^\/livro\/(OL\d+W)\/?$/
  );

  if (!match) return;

  const bookKey = `/works/${match[1]}`;

  if (selectedBook?.key === bookKey) return;

  let cancelled = false;

  async function loadBookFromUrl() {
    setDetailsLoading(true);

    try {
      const response = await fetch(
        `https://openlibrary.org${bookKey}.json`
      );

      if (!response.ok) {
        throw new Error("Livro não encontrado.");
      }

      const data = await response.json();

      if (cancelled) return;

      const book: Book = {
        key: bookKey,
        title: data.title || "Título desconhecido",
        cover_i: data.covers?.[0],
        first_publish_year: data.first_publish_date
          ? Number(
              String(data.first_publish_date).match(/\d{4}/)?.[0]
            ) || undefined
          : undefined,
      };

      setSelectedBook(book);
        void loadBookReviews(book.key);

        const text =
        typeof data.description === "string"
          ? data.description
          : data.description?.value;

      setDescription(
        text ||
          "A Open Library ainda não possui uma sinopse para este livro."
      );

      setDetailsLoading(false);
    } catch {
      if (!cancelled) {
        setDescription(
          "Não foi possível carregar as informações deste livro."
        );
        setDetailsLoading(false);
      }
    }
  }

  void loadBookFromUrl();

  return () => {
    cancelled = true;
  };
}, [page, selectedBook?.key]);

  async function openBookPage(book: Book) {
  const match = book.key.match(/^\/works\/(OL\d+W)$/);

  if (!match) {
    void openDetails(book);
    return;
  }

  window.history.pushState(
  { bookshelfBookPage: true },
  "",
  `/livro/${match[1]}`
);
  setPage("livro");
  window.scrollTo(0, 0);

  await openDetails(book);
}

  const filteredLibrary = library.filter(
    (item) =>
      statusFilter === "Todos" ||
      item.status === statusFilter
  );

  const totalRead = library.filter(
    (item) => item.status === "Lido"
  ).length;

  const totalReading = library.filter(
    (item) => item.status === "Lendo"
  ).length;

  const totalWishlist = library.filter(
    (item) => item.status === "Quero ler"
  ).length;

  const selectedSavedBook = selectedBook
    ? findSavedBook(selectedBook.key)
    : undefined;

  const currentReview = reviews[reviewIndex];

  function BookCard({ book }: { book: Book }) {
    const saved = !!findSavedBook(book.key);

    return (
      <article className="book-card shelf-book-card">
        <button
          className="book-cover-button"
          type="button"
          onClick={() => void openDetails(book)}
          aria-label={`Ver detalhes de ${book.title}`}
        >
          {getCover(book) ? (
            <img
              src={getCover(book)!}
              alt={`Capa de ${book.title}`}
              loading="lazy"
            />
          ) : (
            <div className="no-cover">
              <span>✦</span>
              <span>Sem capa disponível</span>
            </div>
          )}
        </button>

        <div className="book-info">
          <span className="book-year">
            {book.first_publish_year || "Ano desconhecido"}
          </span>

          <button
  className="book-title-button"
  type="button"
  onClick={() => void openBookPage(book)}
>
  {book.title}
</button>

          <p className="book-author">{getAuthor(book)}</p>

          <button
            className={`book-action ${saved ? "saved" : ""}`}
            type="button"
            disabled={saving || !authReady}
            onClick={() =>
              saved
                ? void openDetails(book)
                : void saveBook(book)
            }
          >
            {saved
              ? "✓ Na minha estante"
              : "+ Adicionar à estante"}
          </button>
        </div>
      </article>
    );
  }

      
return (
  <div className="app">
    <div className="wall-sconce wall-sconce-left" aria-hidden="true">
      <img src="/arandela.png" alt="" />
    </div>

    <div className="wall-sconce wall-sconce-right" aria-hidden="true">
      <img src="/arandela.png" alt="" />
    </div>

      <header className="header">
        <div className="header-content">
          <button
            className="brand"
            type="button"
            onClick={() => navigateTo("inicio")}
          >
            <span className="brand-icon">✦</span>
            <span className="brand-name">Bookshelf Online</span>
          </button>

          <nav
            className="navigation"
            aria-label="Navegação principal"
          >
            <button
  className={page === "inicio" ? "active" : ""}
  onClick={() => navigateTo("inicio")}
  >

              Início
            </button>

            <button
              className={page === "explorar" ? "active" : ""}
              onClick={() => navigateTo("explorar")}
            >
              Explorar livros
            </button>

            <button
  className={page === "estante" ? "active" : ""}
  onClick={requestLibrary}
>
  Minha estante
</button>

{user && (
  <button
  className={page === "amigos" ? "active" : ""}
  onClick={() => navigateTo("amigos")}
>
  Meus amigos
</button>
)}
{user && (
<button
  type="button"
  className={page === "feed" ? "active" : ""}
  onClick={() => navigateTo("feed")}
>
  Feed
</button>
)}
</nav>

          {user ? (
            <div className="header-user">
              <button
                className="header-library-button"
                type="button"
                onClick={requestLibrary}
              >
                Minha biblioteca <span>{library.length}</span>
              </button>

              <div className="notifications-wrapper">
  <button
    type="button"
    className="notification-trigger"
    aria-label="Notificações"
    aria-expanded={notificationsOpen}
    onClick={() => {
      const nextOpen = !notificationsOpen;
      setNotificationsOpen(nextOpen);

      if (nextOpen) {
        void loadFriendRequests();
      }
    }}
  >
    <span aria-hidden="true">♧</span>
    {friendRequests.length > 0 && (
      <span className="notification-count">
        {friendRequests.length}
      </span>
    )}
  </button>

  {notificationsOpen && (
    <div className="notifications-panel">
      <div className="notifications-heading">
        <h3>Notificações</h3>
        <button
          type="button"
          onClick={() => setNotificationsOpen(false)}
          aria-label="Fechar notificações"
        >
          ×
        </button>
      </div>

      {notificationsLoading && <p>Carregando notificações...</p>}

      {notificationsError && (
        <p className="message error">{notificationsError}</p>
      )}

      {!notificationsLoading && friendRequests.length === 0 && (
        <p className="notifications-empty">
          Nenhuma solicitação de amizade pendente.
        </p>
      )}

      {!notificationsLoading &&
        friendRequests.map((request) => (
          <div className="notification-item" key={request.id}>
            <div className="notification-person">
              <span className="notification-avatar">
                {request.user_name.charAt(0).toUpperCase()}
              </span>

              <p>
                <strong>{request.user_name}</strong> enviou uma
                solicitação de amizade.
              </p>
            </div>

            <div className="notification-actions">
              <button
                type="button"
                disabled={notificationActionId !== null}
                onClick={() =>
                  void respondToFriendRequest(request.id, "accept")
                }
              >
                Aceitar
              </button>

              <button
                type="button"
                className="notification-reject"
                disabled={notificationActionId !== null}
                onClick={() =>
                  void respondToFriendRequest(request.id, "reject")
                }
              >
                Recusar
              </button>
            </div>
          </div>
        ))}
    </div>
  )}
</div>

              <span className="header-username">
                {user.name}
              </span>

              <button
                className="logout-button"
                type="button"
                onClick={logout}
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              className="header-library-button"
              type="button"
              onClick={() => openAuth("login")}
            >
              Entrar / Cadastrar
            </button>
          )}
        </div>
      </header>

      <main className="app-content">
        {actionError && (
          <p className="message error" role="alert">
            {actionError}{" "}
            <button
              type="button"
              onClick={() => setActionError("")}
              aria-label="Fechar mensagem"
            >
              ×
            </button>
          </p>
        )}

        {page === "inicio" && (
          <>
            
<section className="hero">
  <div className="hero-ornament hero-ornament-left" aria-hidden="true">
    ❦
  </div>

  <div className="hero-ornament hero-ornament-right" aria-hidden="true">
    ❦
  </div>

  <div className="hero-inner">
    <div className="hero-edition">
      <span>✦</span>
      <span>BOOKSHELF ONLINE · MMXXVI</span>
      <span>✦</span>
    </div>

    <p className="hero-overline">
      "Renda-se, como eu me rendi. Mergulhe no que você não conhece como eu mergulhei. Não se preocupe em entender, viver ultrapassa qualquer entendimento."
      - Lispector, Clarice
    </p>

    <h1>
      O mundo entre as páginas.
    </h1>


    <div className="hero-search">
      <div className="search-types">
        <button
          type="button"
          className={searchType === "livros" ? "active" : ""}
          onClick={() => setSearchType("livros")}
        >
          Livros
        </button>

        <button
          type="button"
          className={searchType === "autores" ? "active" : ""}
          onClick={() => setSearchType("autores")}
        >
          Autores
        </button>

        <button
          type="button"
          className={searchType === "usuarios" ? "active" : ""}
          onClick={() => setSearchType("usuarios")}
        >
          Leitores
        </button>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <span className="search-symbol" aria-hidden="true">⌕</span>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            searchType === "livros"
              ? "Procure por um livro ou uma história..."
              : searchType === "autores"
              ? "Qual autor deseja encontrar?"
              : "Encontre outros leitores..."
          }
        />

        <button type="submit">
          Pesquisar <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="search-hint">
        UM UNIVERSO DE OBRAS À SUA ESPERA
      </p>
    </div>
  </div>

  <div className="hero-bottom-ornament" aria-hidden="true">
    <span>✧</span>
    <span>LEIA · DESCUBRA · COMPARTILHE</span>
    <span>✧</span>
  </div>
</section>


            <section className="discovery-section">
              <div className="discovery-heading">
                <p className="eyebrow">
                  ✦ SUA PRÓXIMA LEITURA
                </p>
                <h2>Descubra novas histórias</h2>
                <p>
                  De romances inesquecíveis a mundos
                  fantásticos. Há sempre uma nova
                  história esperando por você.
                </p>
              </div>

              {genreLoading && (
                <div className="loading-state">
                  <div className="spinner" />
                  <p>Preparando sua biblioteca...</p>
                </div>
              )}

              {genreError && (
                <p className="message error">
                  Algumas recomendações não puderam
                  ser carregadas agora.
                </p>
              )}

              {genres.map((genre) => {
                const items = genreBooks[genre.id] || [];

                if (!genreLoading && !items.length) {
                  return null;
                }

                return (
                  <section
                    className="genre-section"
                    key={genre.id}
                  >
                    <div className="genre-heading">
                      <div>
                        <h3>{genre.name}</h3>
                        <p>{genre.description}</p>
                      </div>

                      <button
                        type="button"
                        className="genre-more"
                        onClick={() =>
                          exploreGenre(genre)
                        }
                      >
                        Ver mais →
                      </button>
                    </div>

                    
                    <div className="wooden-shelf">
                      <div className="shelf-back">
                        <div className="genre-books">
                          {items.map((book) => (
                            <div
                              className="genre-book-item"
                              key={book.key}
                            >
                              <BookCard book={book} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="shelf-plank" aria-hidden="true" />
                    </div>

                  </section>
                );
              })}
            </section>

            <section className="community-section">
              <div className="community-heading">
                <p className="eyebrow">
                  ✦ A COMUNIDADE ESTÁ LENDO
                </p>
                <h2>Últimas avaliações</h2>
                <p>
                  Descubra o que outros leitores
                  acharam de suas histórias.
                </p>
              </div>

              <div className="community-carousel">
                {reviewsLoading ? (
                  <p>Carregando avaliações...</p>
                ) : reviewsError ? (
                  <div className="community-empty">
                    <p>
                      Não foi possível carregar as
                      avaliações agora.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void loadReviews()
                      }
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : currentReview ? (
                  <>
                    <div className="review-layout">
                      <button
                        className="review-book-cover"
                        type="button"
                        onClick={() =>
                          void openDetails(
                            currentReview.book
                          )
                        }
                      >
                        {getCover(currentReview.book) ? (
                          <img
                            src={
                              getCover(
                                currentReview.book
                              )!
                            }
                            alt={`Capa de ${currentReview.book.title}`}
                          />
                        ) : (
                          <span>✦</span>
                        )}
                      </button>

                      <div className="review-content">
                        <p className="review-author">
                          {currentReview.user_name}
                          {" "}avaliou
                        </p>

                        <button
                          className="review-title"
                          type="button"
                          onClick={() =>
                            void openDetails(
                              currentReview.book
                            )
                          }
                        >
                          {currentReview.book.title}
                        </button>

                        <p className="review-stars">
                          {"★".repeat(
                            currentReview.rating
                          )}
                          {"☆".repeat(
                            5 - currentReview.rating
                          )}
                        </p>

                        {currentReview.comment && (
                          <blockquote className="review-quote">
                            “{currentReview.comment}”
                          </blockquote>
                        )}

                        <p className="review-date">
                          {new Date(
                            currentReview.created_at
                          ).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>

                    {reviews.length > 1 && (
                      <div className="review-navigation">
                        <button
                          type="button"
                          aria-label="Avaliação anterior"
                          onClick={() =>
                            setReviewIndex(
                              (current) =>
                                (current -
                                  1 +
                                  reviews.length) %
                                reviews.length
                            )
                          }
                        >
                          ←
                        </button>

                        <span>
                          {reviewIndex + 1} /{" "}
                          {reviews.length}
                        </span>

                        <button
                          type="button"
                          aria-label="Próxima avaliação"
                          onClick={() =>
                            setReviewIndex(
                              (current) =>
                                (current + 1) %
                                reviews.length
                            )
                          }
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="community-empty">
                    <span>✦</span>
                    <h3>
                      Toda história merece uma opinião.
                    </h3>
                    <p>
                      Ainda não há avaliações públicas.
                      Seja a primeira pessoa a compartilhar
                      uma leitura!
                    </p>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        setPage("explorar")
                      }
                    >
                      Explorar livros →
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="join-section">
              {user ? (
                <>
                  <p className="eyebrow">
                    ✦ SUA BIBLIOTECA
                  </p>
                  <h2>
                    Que bom ter você aqui, {user.name}!
                  </h2>
                  <p>
                    Sua estante já tem {library.length}{" "}
                    {library.length === 1
                      ? "livro"
                      : "livros"}.
                    Continue construindo sua coleção.
                  </p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={requestLibrary}
                  >
                    Acessar minha estante →
                  </button>
                </>
              ) : (
                <>
                  <p className="eyebrow">
                    ✦ UM ESPAÇO SÓ SEU
                  </p>
                  <h2>
                    Sua biblioteca começa aqui.
                  </h2>
                  <p>
                    Guarde seus livros favoritos,
                    acompanhe suas leituras e compartilhe
                    suas avaliações com outros leitores.
                  </p>

                  <div className="join-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        openAuth("register")
                      }
                    >
                      Criar minha conta
                    </button>
                    <button
                      className="join-login"
                      type="button"
                      onClick={() =>
                        openAuth("login")
                      }
                    >
                      Já tenho uma conta →
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}

        {page === "explorar" && (
          <section className="catalog-page">
            <p className="eyebrow">
              O UNIVERSO DOS LIVROS
            </p>
            <h1>Explore a biblioteca</h1>
            <p className="section-description">
              Encontre novas histórias e adicione seus
              favoritos à sua coleção pessoal.
            </p>

            
<div className="search-types">
  <button
    type="button"
    className={searchType === "livros" ? "active" : ""}
    onClick={() => setSearchType("livros")}
  >
    Livros
  </button>

  <button
    type="button"
    className={searchType === "autores" ? "active" : ""}
    onClick={() => setSearchType("autores")}
  >
    Autores
  </button>

  <button
    type="button"
    className={searchType === "usuarios" ? "active" : ""}
    onClick={() => setSearchType("usuarios")}
  >
    Usuários
  </button>
</div>


            <form
              className="search-form catalog-search"
              onSubmit={handleSearch}
            >
              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder={
                  searchType === "livros"
                    ? "Pesquisar livros..."
                    : searchType === "autores"
                    ? "Pesquisar autores..."
                    : "Pesquisar usuários..."
                }
                aria-label="Pesquisar livros"
              />
              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Buscando..."
                  : "Pesquisar →"}
              </button>
            </form>

            {error && (
              <p className="message error">{error}</p>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner" />
                <p>
                  Procurando histórias para você...
                </p>
              </div>
            )}

            {!loading && !searched && (
              <div className="empty-state">
                <span>✦</span>
                <h2>
                  Qual será sua próxima leitura?
                </h2>
                <p>
                  Pesquise um título ou autor para
                  explorar o catálogo.
                </p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    setQuery("Jane Austen");
                    void searchBooks("Jane Austen");
                  }}
                >
                  Explorar Jane Austen
                </button>
              </div>
            )}

            

            {!loading && searched && !error && searchType !== "usuarios" && (
              <>
                <div className="results-heading">
                  <h2>
                    {books.length
                      ? "Resultados encontrados"
                      : "Nenhum livro encontrado"}
                  </h2>
                  <span>
                    {books.length} resultados exibidos
                  </span>
                </div>

                {books.length ? (
                  <div className="books-grid">
                    {books.map((book) => (
                      <BookCard
                        key={book.key}
                        book={book}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span>⌕</span>
                    <p>
                      Tente pesquisar outro título,
                      autor ou palavra-chave.
                    </p>
                  </div>
                )}
              </>
            )}
            
{!publicProfile && !profileLoading && !profileError && !loading && searched && !error && searchType === "usuarios" && (
  <>
    <div className="results-heading">
      <h2>
        {users.length
          ? "Usuários encontrados"
          : "Nenhum usuário encontrado"}
      </h2>
      <span>{users.length} resultados exibidos</span>
    </div>

    {users.length ? (
      <div className="users-grid">
        {users.map((foundUser) => (
          <article
            className="user-card"
            key={foundUser.id}
            role="button"
            tabIndex={0}
            onClick={() => void openUserProfile(foundUser.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                void openUserProfile(foundUser.id);
              }
            }}
          >
            <div className="user-avatar">
              {foundUser.name.charAt(0).toUpperCase()}
            </div>

            <div className="user-card-info">
              <h3>{foundUser.name}</h3>
              <p>Leitor da comunidade</p>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <span>⌕</span>
        <p>
          Nenhum leitor encontrado com esse nome.
          Tente pesquisar outro usuário.
        </p>
      </div>
    )}
  </>
)}




          </section>
        )}

        {page === "perfil" && (
  <section className="catalog-page public-profile-page">
    {profileLoading && (
  <div className="loading-state">
    <div className="spinner" />
    <p>Carregando perfil...</p>
  </div>
)}

{profileError && (
  <p className="message error">{profileError}</p>
)}

{publicProfile && (
  <div className="public-profile">
    <button
      type="button"
      className="genre-more"
      onClick={() => {
        window.history.pushState({}, "", "/");
        setPage("explorar");
        setPublicProfile(null);
        window.scrollTo(0, 0);
  }}
    >
      ← Voltar aos usuários
    </button>

    <div className="public-profile-header">
      <div className="user-avatar">
        {publicProfile.user.name.charAt(0).toUpperCase()}
      </div>

      <div>
        <p className="eyebrow">PERFIL DO LEITOR</p>
        <h2>{publicProfile.user.name}</h2>
        <p>{publicProfile.books.length} livros na estante</p>
        {user && user.id !== publicProfile.user.id && (
  <div className="friendship-actions">
    <button
      type="button"
      className="friendship-button"
      disabled={friendshipLoading}
      onClick={() => void handleFriendshipAction(publicProfile.user.id)}
    >
      {friendshipLoading
        ? "Aguarde..."
        : !friendship
          ? "Adicionar amigo"
          : friendship.status === "accepted"
            ? "Amigos"
            : friendship.requester_id === user.id
              ? "Cancelar solicitação"
              : "Aceitar solicitação"}
              
    </button>
    {friendship?.status === "accepted" && (
  <button
    type="button"
    className="friendship-button friendship-remove"
    disabled={friendshipLoading}
    onClick={() => void removeFriendship()}
  >
    Desfazer amizade
  </button>
)}
  </div>
)}

{user &&
  friendship?.status === "pending" &&
  friendship.receiver_id === user.id && (
    <button
      type="button"
      className="friendship-button friendship-reject"
      disabled={friendshipLoading}
      onClick={() =>
        void rejectFriendshipRequest()
      }
    >
      Recusar solicitação
    </button>
  )}

{friendshipError && (
  <p className="message error">{friendshipError}</p>
)}

      </div>
    </div>

    {statusOptions.map((status) => {
      const items = publicProfile.books.filter(
        (item) => item.status === status
      );

      return (
        <section className="public-profile-section" key={status}>
          <h3>{status} ({items.length})</h3>

          {items.length ? (
            <div className="books-grid">
              {items.map((item) => (
                <BookCard key={item.book.key} book={item.book} />
              ))}
            </div>
          ) : (
            <p>Nenhum livro nesta categoria.</p>
          )}
        </section>
      );
    })}
  </div>
)}

  </section>
)}


{page === "feed" && user && (
  <section className="library-page feed-page">
    <p className="eyebrow">ENTRE LIVROS E HISTÓRIAS</p>
    <h1>Feed literário</h1>
    
<p className="section-description">
  Descubra o que os leitores estão explorando,
  compartilhando e adicionando às suas estantes.
</p>

<div className="feed-tabs">
  <button
    type="button"
    className={feedFilter === "comunidade" ? "selected" : ""}
    onClick={() => setFeedFilter("comunidade")}
  >
    Comunidade
  </button>

  <button
    type="button"
    className={feedFilter === "amigos" ? "selected" : ""}
    onClick={() => setFeedFilter("amigos")}
  >
    Amigos
  </button>
</div>


    {feedLoading && <p>Carregando atividades...</p>}

    {feedError && (
      <p className="message error">{feedError}</p>
    )}

    {!feedLoading && !feedError && feedActivities.length === 0 && (
      <p className="feed-empty">
        Ainda não há atividades para mostrar.
        Adicione amigos para acompanhar suas leituras!
      </p>
    )}

    <div className="feed-list">
      {feedActivities.map((activity) => {
        const cover = getCover(activity.book);

        const statusLabel =
          activity.status === "Lendo"
            ? "está lendo"
            : activity.status === "Lido"
            ? "tem este livro como lido"
            : activity.status === "Quero ler"
            ? "adicionou à lista de desejos"
            : "adicionou um livro à estante";

        return (
          <article className="feed-card" key={activity.id}>
            <div className="feed-user">
              <button
                type="button"
                className="feed-avatar"
                onClick={() => void openUserProfile(activity.user_id)}
              >
                {activity.user_name.charAt(0).toUpperCase()}
              </button>

              <div>
                <button
                  type="button"
                  className="feed-user-name"
                  onClick={() => void openUserProfile(activity.user_id)}
                >
                  {activity.user_name}
                </button>

                <p>{statusLabel}</p>
              </div>
            </div>

            <div className="feed-book">
              {cover && (
                <img src={cover} alt={`Capa de ${activity.book.title}`} />
              )}

              <div>
                <h3>{activity.book.title}</h3>
                <p>{getAuthor(activity.book)}</p>

                {activity.rating != null && activity.rating > 0 && (
                  <p className="feed-rating">
                    {"★".repeat(Math.min(5, Math.max(0, Math.round(activity.rating))))}
                    {"☆".repeat(5 - Math.min(5, Math.max(0, Math.round(activity.rating))))}
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  </section>
)}


{page === "amigos" && user && (
  <section className="library-page">
    <p className="eyebrow">COMUNIDADE DE LEITORES</p>
    <h1>Meus amigos</h1>
    <p className="section-description">
      Compartilhe histórias e acompanhe outros leitores.
    </p>

    {<section className="friends-section">
  <div className="friends-heading">
    <h2>Meus amigos</h2>
    <span>{friends.length} amigos</span>
  </div>

  {friendsLoading && <p>Carregando amigos...</p>}

  {friendsError && <p className="message error">{friendsError}</p>}

  {!friendsLoading && friends.length === 0 && (
    <p className="friends-empty">
      Você ainda não possui amigos adicionados.
    </p>
  )}

  <div className="friends-grid">
    {friends.map((friend) => (
      <button
        key={friend.friendship_id}
        type="button"
        className="friend-card"
        onClick={() => void openUserProfile(friend.user_id)}
      >
        <span className="friend-avatar">
          {friend.user_name.charAt(0).toUpperCase()}
        </span>
        <strong>{friend.user_name}</strong>
        <span className="friend-profile-link">Ver perfil →</span>
      </button>
    ))}
  </div>
</section>}

  </section>

  
)}

<section className="find-readers-section">
  <p className="eyebrow">CONHEÇA OUTROS LEITORES</p>
  <h2>Encontrar leitores</h2>

  <p className="section-description">
    Encontre pessoas que compartilham sua paixão pelos livros.
  </p>

  <div className="find-readers-form">
  <input
    type="text"
    placeholder="Digite pelo menos 2 letras para encontrar leitores..."
    value={friendSearch}
    onChange={(event) => setFriendSearch(event.target.value)}
  />
</div>

  {friendSearchError && (
    <p className="message error">{friendSearchError}</p>
  )}

  {!friendSearchLoading &&
    friendSearch.trim() &&
    friendSearchResults.length === 0 &&
    !friendSearchError && (
      <p className="find-readers-empty">
        Pesquise um nome para encontrar outros leitores.
      </p>
    )}

  <div className="friends-grid">
    {friendSearchResults.map((reader) => (
      <button
        key={reader.id}
        type="button"
        className="friend-card"
        onClick={() => void openUserProfile(reader.id)}
      >
        <span className="friend-avatar">
          {reader.name.charAt(0).toUpperCase()}
        </span>

        <strong>{reader.name}</strong>

        <span className="friend-profile-link">
          Ver perfil →
        </span>
      </button>
    ))}
  </div>
</section>

        {page === "estante" && user && (
          <section className="library-page">
            <p className="eyebrow">
              COLEÇÃO PESSOAL
            </p>
            <h1>Minha estante</h1>
            <p className="section-description">
              Um lugar para todas as histórias que
              fazem parte da sua vida.
            </p>
            

            <div className="library-summary">
              <div>
                <strong>{library.length}</strong>
                <span>Total de livros</span>
              </div>
              <div>
                <strong>{totalWishlist}</strong>
                <span>Quero ler</span>
              </div>
              <div>
                <strong>{totalReading}</strong>
                <span>Lendo</span>
              </div>
              <div>
                <strong>{totalRead}</strong>
                <span>Lidos</span>
              </div>
            </div>
            

            <div className="filter-bar">
              {["Todos", ...statusOptions].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    className={
                      statusFilter === status
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setStatusFilter(status)
                    }
                  >
                    {status}
                  </button>
                )
              )}
            </div>

            {filteredLibrary.length ? (
              <div className="books-grid">
                {filteredLibrary.map((item) => (
                  <BookCard
                    key={item.book.key}
                    book={item.book}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>♧</span>
                <h2>
                  Sua estante está esperando histórias.
                </h2>
                <p>
                  {library.length === 0
                    ? "Explore o catálogo e adicione seu primeiro livro."
                    : "Não há livros nesta categoria."}
                </p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    setPage("explorar")
                  }
                >
                  Explorar livros →
                </button>
              </div>
            )}
          </section>
        )}

        {page === "livro" && selectedBook && (
  <section className="book-details-page">
    <button
  type="button"
  className="book-back-button"
  onClick={() => {
    if (window.history.state?.bookshelfBookPage) {
      window.history.back();
    } else {
      navigateTo("inicio");
    }
  }}
>
  ← Voltar
</button>

    <div className="book-details-header">
      <div className="book-details-cover">
        {getCover(selectedBook, "L") ? (
          <img
            src={getCover(selectedBook, "L")!}
            alt={`Capa de ${selectedBook.title}`}
          />
        ) : (
          <p>Sem capa disponível</p>
        )}
      </div>

      <div className="book-details-info">
        <p className="eyebrow">DETALHES DA OBRA</p>
        <h1>{selectedBook.title}</h1>
        <p>por {getAuthor(selectedBook)}</p>

        <h2>Sinopse</h2>
        <p>
          {detailsLoading
              ? "Carregando descrição..."
              : description}
          </p>
          <div className="book-page-library">
  <h2>Minha estante</h2>

  {!selectedSavedBook ? (
    <button
      className="primary-button"
      type="button"
      disabled={saving || !authReady}
      onClick={() => void saveBook(selectedBook)}
    >
      {saving ? "Salvando..." : "+ Adicionar à minha estante"}
    </button>
  ) : (
    <div className="book-page-reading-editor">
      <p className="saved-label">
        ✓ Este livro está na sua estante
      </p>

      <label htmlFor="page-reading-status">
        Status de leitura
      </label>
      <select
        id="page-reading-status"
        value={statusDraft}
        onChange={(event) =>
          setStatusDraft(event.target.value as ReadingStatus)
        }
      >
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <div className="public-review-editor">
        <h3>Minha avaliação</h3>
        <label htmlFor="page-book-rating">Nota</label>
        <select
          id="page-book-rating"
          value={ratingDraft}
          onChange={(event) => setRatingDraft(Number(event.target.value))}
        >
          <option value={0}>Ainda não avaliado</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>
              {"★".repeat(rating)} ({rating}/5)
            </option>
          ))}
        </select>
        <label htmlFor="page-review-comment">Resenha (opcional)</label>
        <textarea
          id="page-review-comment"
          rows={4}
          maxLength={5000}
          value={reviewComment}
          onChange={(event) => setReviewComment(event.target.value)}
          placeholder="O que você achou deste livro?"
        />
        {reviewMessage && <p className="save-hint" role="status">{reviewMessage}</p>}
        <button
          type="button"
          className="primary-button"
          disabled={reviewSaving || bookReviewsLoading || ratingDraft === 0}
          onClick={() => void publishReview()}
        >
          {reviewSaving ? "Salvando..." : "Salvar avaliação"}
        </button>
      </div>

      <div className="reading-tracker">
  {statusDraft !== "Quero ler" && (
    <>
  {statusDraft === "Lendo" && (
    <>
      <div className="reading-tracker-fields">
        <label>
          Página atual
          <input
            type="number"
            min="0"
            value={currentPageDraft}
            onChange={(event) =>
              setCurrentPageDraft(
                Math.max(0, Number(event.target.value) || 0)
              )
            }
          />
        </label>

        <label>
          Total de páginas
          <input
            type="number"
            min="1"
            value={totalPagesDraft}
            onChange={(event) =>
              setTotalPagesDraft(event.target.value)
            }
          />
        </label>
      </div>

      {Number(totalPagesDraft) > 0 && (
        <div className="reading-progress">
          <div className="reading-progress-bar">
            <div
              className="reading-progress-fill"
              style={{
                width: `${Math.min(
                  100,
                  (currentPageDraft / Number(totalPagesDraft)) * 100
                )}%`,
              }}
            />
          </div>

          <span>
            {Math.min(
              100,
              Math.round(
                (currentPageDraft / Number(totalPagesDraft)) * 100
              )
            )}% concluído
          </span>
        </div>
      )}
          </>
  )}

      <div className="reading-tracker-fields">
        <label>
          Início da leitura
          <input
            type="date"
            value={startedAtDraft}
            onChange={(event) =>
              setStartedAtDraft(event.target.value)
            }
          />
        </label>

        <label>
  Término da leitura
  <input
    type="date"
    value={finishedAtDraft}
    onChange={(event) => {
      const date = event.target.value;

      setFinishedAtDraft(date);

      if (date) {
        setStatusDraft("Lido");
      }
    }}
  />
</label>
      </div>
    </>
  )}

  <label className="reading-favorite">
    <input
      type="checkbox"
      checked={isFavoriteDraft}
      onChange={(event) =>
        setIsFavoriteDraft(event.target.checked)
      }
    />
    Adicionar aos meus favoritos
  </label>
</div>

      <button
        className="primary-button"
        type="button"
        disabled={bookChangesSaving || saving}
        onClick={() => void saveBookChanges()}
      >
        {bookChangesSaving ? "Salvando..." : "Salvar alterações"}
      </button>

      {bookSaveMessage && (
  <p className="book-save-message" role="status">
    {bookSaveMessage}
  </p>
)}

      <button
        className="remove-button"
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "Deseja remover este livro da sua estante?"
            )
          ) {
            void removeBook(selectedBook.key);
          }
        }}
      >
        Remover da estante
      </button>
    </div>
  )}
</div>

        </div>
      </div>

      <section className="book-public-reviews">
        <h2>Avaliações dos leitores</h2>

        {bookReviewsLoading ? (
          <p>Carregando avaliações...</p>
        ) : (
          <>
            <div className="book-reviews-summary">
              <strong>
                {bookReviews.length > 0
                  ? bookAverageRating.toFixed(1)
                  : "—"}
              </strong>

              <span>
                {bookReviews.length === 1
                  ? "1 avaliação"
                  : `${bookReviews.length} avaliações`}
              </span>
            </div>

            {bookReviews.length === 0 ? (
              <p>Este livro ainda não recebeu avaliações.</p>
            ) : (
              <div className="book-reviews-list">
                {bookReviews.map((review) => (
                  <article className="book-review-item" key={review.id}>
                    <div className="book-review-header">
                      <strong>{review.user_name}</strong>
                      <span>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                    </div>

                    {review.comment && <p>{review.comment}</p>}

                    <small>
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </section>
  )}
      </main>

      <footer className="footer">
        <span>✦ Bookshelf Online</span>
        <p>Um lar para todas as suas histórias.</p>
        <span>
          Dados literários fornecidos pela{" "}
          <a
            href="https://openlibrary.org"
            target="_blank"
            rel="noreferrer"
          >
            Open Library
          </a>
        </span>
      </footer>

      

      {selectedBook && page !== "livro" && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedBook(null);
            }
          }}
        >
          <section
            className="book-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() =>
                setSelectedBook(null)
              }
              aria-label="Fechar detalhes"
            >
              ×
            </button>

            <div className="modal-book-layout">
              <div className="modal-cover">
                {getCover(selectedBook, "L") ? (
                  <img
                    src={
                      getCover(selectedBook, "L")!
                    }
                    alt={`Capa de ${selectedBook.title}`}
                  />
                ) : (
                  <div className="no-cover">
                    <span>✦</span>
                    <span>
                      Sem capa disponível
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-details">
                <p className="eyebrow">
                  DETALHES DA OBRA
                </p>
                <h2 id="modal-title">
                  {selectedBook.title}
                </h2>
                <p className="modal-author">
                  por {getAuthor(selectedBook)}
                </p>

                <div className="book-metadata">
                  <span>
                    Primeira publicação:{" "}
                    <strong>
                      {selectedBook.first_publish_year ||
                        "Não informado"}
                    </strong>
                  </span>
                  <span>
                    Edições catalogadas:{" "}
                    <strong>
                      {selectedBook.edition_count ??
                        "Não informado"}
                    </strong>
                  </span>
                </div>

                <h3>Sobre o livro</h3>
                <p className="book-description book-description-preview">
                  {detailsLoading
                    ? "Carregando descrição..."
                    : description}
                </p>

                <button
                  className="book-more-details"
                  type="button"
                  onClick={() => {
                    void openBookPage(selectedBook);
                  }}
                >
                  Ver detalhes completos →
                </button>

                {!selectedSavedBook ? (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={
                      saving || !authReady
                    }
                    onClick={() =>
                      void saveBook(selectedBook)
                    }
                  >
                    {saving
                      ? "Salvando..."
                      : "+ Adicionar à minha estante"}
                  </button>
                ) : (
                  <div className="reading-editor">
                    <p className="saved-label">
                      ✓ Livro salvo na sua estante
                    </p>

                    <label htmlFor="reading-status">
                      Status de leitura
                    </label>
                    <select
                      id="reading-status"
                      value={selectedSavedBook.status}
                      onChange={(event) =>
                        void updateBook(
                          selectedBook.key,
                          {
                            status:
                              event.target
                                .value as ReadingStatus,
                          }
                        )
                      }
                    >
                      {statusOptions.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="book-notes">
                      Minhas anotações privadas
                    </label>
                    <textarea
                      id="book-notes"
                      rows={4}
                      maxLength={10000}
                      value={notesDraft}
                      onChange={(event) =>
                        setNotesDraft(
                          event.target.value
                        )
                      }
                      onBlur={() => {
                        if (
                          notesDraft !==
                          selectedSavedBook.notes
                        ) {
                          void updateBook(
                            selectedBook.key,
                            { notes: notesDraft }
                          );
                        }
                      }}
                      placeholder="Suas impressões pessoais..."
                    />

                    <p className="save-hint">
                      As anotações são privadas
                      e salvas ao sair do campo.
                    </p>

                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => void openBookPage(selectedBook)}
                    >
                      Avaliar este livro →
                    </button>

                    <button
                      className="remove-button"
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Deseja remover este livro da sua estante?"
                          )
                        ) {
                          void removeBook(
                            selectedBook.key
                          );
                        }
                      }}
                    >
                      Remover da estante
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {authOpen && (
        <div
          className="auth-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAuth();
            }
          }}
        >
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              type="button"
              className="auth-close"
              aria-label="Fechar"
              onClick={closeAuth}
            >
              ×
            </button>

            <p className="eyebrow">
              ✦ SUA BIBLIOTECA PESSOAL
            </p>

            <h2 id="auth-title">
              {authMode === "register"
                ? "Comece sua história."
                : "Bem-vindo de volta."}
            </h2>

            <p className="auth-description">
              {pendingBook
                ? `Entre ou crie uma conta para guardar “${pendingBook.title}” na sua estante.`
                : "Sua coleção de histórias, avaliações e anotações em um só lugar."}
            </p>

            <form
              onSubmit={(event) =>
                void submitAuth(event)
              }
            >
              {authMode === "register" && (
                <label>
                  Nome
                  <input
                    required
                    maxLength={150}
                    autoComplete="name"
                    value={authName}
                    onChange={(event) =>
                      setAuthName(
                        event.target.value
                      )
                    }
                    placeholder="Seu nome"
                  />
                </label>
              )}

              <label>
                E-mail
                <input
                  required
                  type="email"
                  maxLength={255}
                  autoComplete="email"
                  value={authEmail}
                  onChange={(event) =>
                    setAuthEmail(
                      event.target.value
                    )
                  }
                  placeholder="seuemail@exemplo.com"
                />
              </label>

              <label>
                Senha
                <input
                  required
                  type="password"
                  minLength={
                    authMode === "register"
                      ? 8
                      : undefined
                  }
                  autoComplete={
                    authMode === "register"
                      ? "new-password"
                      : "current-password"
                  }
                  value={authPassword}
                  onChange={(event) =>
                    setAuthPassword(
                      event.target.value
                    )
                  }
                  placeholder="Sua senha"
                />
              </label>

              {authError && (
                <p
                  className="auth-error"
                  role="alert"
                >
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Aguarde..."
                  : authMode === "register"
                    ? "Criar minha conta"
                    : "Entrar"}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === "register"
                ? "Já tem uma conta? "
                : "Ainda não tem uma conta? "}

              <button
                type="button"
                onClick={() => {
                  setAuthMode(
                    authMode === "register"
                      ? "login"
                      : "register"
                  );
                  setAuthError("");
                }}
              >
                {authMode === "register"
                  ? "Entrar"
                  : "Criar conta"}
              </button>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
