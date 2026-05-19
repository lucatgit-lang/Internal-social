import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Heart,
  Home,
  Plus,
  MessageCircle,
  Search,
  Send,
  CirclePlus,
  UserCircle2,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { addComment, createPost, createStory, getCommunityFeed, toggleFollow, toggleLike, toggleSave } from "../api/community";
import { openOrCreateDirect } from "../api/chat";
import { SocialSidebar } from "../components/navigation/SocialSidebar";

export function Community() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getCommunityFeed>>["data"] | null>(null);
  const [postText, setPostText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"post" | "story">("post");
  const [createPostContent, setCreatePostContent] = useState("");
  const [createImageUrl, setCreateImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [storyViewerUserId, setStoryViewerUserId] = useState<string | null>(null);
  const [storyViewerPos, setStoryViewerPos] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());
  const storyIntervalRef = useRef<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await getCommunityFeed();
      setData(res.data);
    } catch {
      toast.error("Errore caricamento Community");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!data?.stories?.length) return;
    setViewedStoryIds((prev) => {
      const next = new Set(prev);
      for (const s of data.stories) {
        if (s.viewed) next.add(s.id);
      }
      return next;
    });
  }, [data]);

  const topStories = useMemo(() => data?.stories ?? [], [data]);
  const storyGroups = useMemo(() => {
    const byUser = new Map<string, { userId: string; user: string; avatar: string | null; stories: typeof topStories }>();
    for (const s of topStories) {
      const g = byUser.get(s.userId);
      if (!g) byUser.set(s.userId, { userId: s.userId, user: s.user, avatar: s.avatar, stories: [s] });
      else g.stories.push(s);
    }
    const groups = Array.from(byUser.values());
    for (const g of groups) {
      g.stories.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    }
    groups.sort((a, b) => {
      const at = new Date(a.stories[a.stories.length - 1]?.time ?? 0).getTime();
      const bt = new Date(b.stories[b.stories.length - 1]?.time ?? 0).getTime();
      return bt - at;
    });
    return groups;
  }, [topStories]);
  const topFeedPosts = useMemo(() => data?.posts?.slice(0, 2) ?? [], [data]);
  const bottomFeedPosts = useMemo(() => data?.posts?.slice(2) ?? [], [data]);

  const onCreatePost = async () => {
    if (!postText.trim()) return;
    try {
      await createPost({ content: postText.trim() });
      setPostText("");
      await refresh();
      toast.success("Post pubblicato");
    } catch {
      toast.error("Impossibile pubblicare");
    }
  };

  const onMessage = async (userId: string) => {
    try {
      const res = await openOrCreateDirect(userId);
      nav(`/chat?conversationId=${encodeURIComponent(res.data.conversationId)}&userId=${encodeURIComponent(userId)}`);
    } catch {
      toast.error("Impossibile aprire la chat");
    }
  };

  const onCreateFromModal = async () => {
    try {
      if (createMode === "post") {
        if (!createPostContent.trim()) {
          toast.error("Inserisci il testo del post");
          return;
        }
        await createPost({ content: createPostContent.trim(), imageUrl: createImageUrl.trim() || undefined });
      } else {
        if (!createImageUrl.trim()) {
          toast.error("Inserisci URL immagine per la storia");
          return;
        }
        await createStory({ imageUrl: createImageUrl.trim(), hoursToLive: 12 });
      }
      setCreatePostContent("");
      setCreateImageUrl("");
      setImagePreview("");
      setCreateOpen(false);
      await refresh();
      toast.success(createMode === "post" ? "Post creato" : "Storia creata");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("API_GET_FAILED:413")) {
        toast.error("File troppo grande. Riduci il peso del video.");
      } else {
        toast.error("Impossibile creare contenuto");
      }
    }
  };

  const openCreateStoryModal = () => {
    setCreateMode("story");
    setCreateOpen(true);
  };

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      setCreateImageUrl(value);
      setImagePreview(value);
    };
    reader.readAsDataURL(file);
  };

  const isVideoMedia = (url: string | null | undefined) => {
    if (!url) return false;
    return /^data:video\//i.test(url) || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);
  };

  const activeGroup = storyGroups.find((g) => g.userId === storyViewerUserId) ?? null;
  const activeStory = activeGroup ? activeGroup.stories[Math.min(storyViewerPos, activeGroup.stories.length - 1)] : null;

  const openStory = (userId: string) => {
    setStoryViewerUserId(userId);
    setStoryViewerPos(0);
  };
  const closeStory = () => {
    setStoryViewerUserId(null);
    setStoryViewerPos(0);
  };
  const prevStory = () => {
    if (!activeGroup) return;
    setStoryViewerPos((p) => Math.max(p - 1, 0));
  };
  const nextStory = () => {
    if (!activeGroup) return;
    if (storyViewerPos >= activeGroup.stories.length - 1) {
      closeStory();
      return;
    }
    setStoryViewerPos((p) => p + 1);
  };

  useEffect(() => {
    if (storyIntervalRef.current != null) {
      window.clearInterval(storyIntervalRef.current);
      storyIntervalRef.current = null;
    }
    if (storyViewerUserId == null || !activeGroup || activeGroup.stories.length === 0) {
      setStoryProgress(0);
      return;
    }
    const current = activeGroup.stories[Math.min(storyViewerPos, activeGroup.stories.length - 1)];
    if (current?.id) {
      setViewedStoryIds((prev) => {
        if (prev.has(current.id)) return prev;
        const next = new Set(prev);
        next.add(current.id);
        return next;
      });
    }
    setStoryProgress(0);
    const durationMs = 5000;
    const tickMs = 50;
    const step = 100 / (durationMs / tickMs);
    storyIntervalRef.current = window.setInterval(() => {
      setStoryProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          if (storyViewerPos >= activeGroup.stories.length - 1) {
            closeStory();
          } else {
            setStoryViewerPos((p) => p + 1);
          }
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => {
      if (storyIntervalRef.current != null) {
        window.clearInterval(storyIntervalRef.current);
        storyIntervalRef.current = null;
      }
    };
  }, [storyViewerUserId, storyViewerPos, activeGroup]);

  const renderPost = (p: (typeof topFeedPosts)[number]) => (
    <article key={p.id} className="border-b bg-white">
      <header className="flex items-center gap-3 px-3 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={p.author.avatar ?? undefined} />
          <AvatarFallback>{p.author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{p.author.name}</div>
          <div className="truncate text-xs text-zinc-500">{p.author.role ?? "Utente"}</div>
        </div>
      </header>

      {p.image ? (
        isVideoMedia(p.image) ? (
          <video src={p.image} controls className="h-[360px] w-full bg-black object-cover md:h-[520px]" />
        ) : (
          <img src={p.image} alt={p.content.slice(0, 80)} className="h-[360px] w-full object-cover md:h-[520px]" />
        )
      ) : (
        <div className="mx-3 mb-2 rounded-xl bg-zinc-100 p-4 text-[15px]">{p.content}</div>
      )}

      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => void toggleLike(p.id).then(refresh)} className="h-9 w-9 rounded-full">
              <Heart className={p.isLiked ? "h-5 w-5 fill-current text-rose-500" : "h-5 w-5"} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => void toggleSave(p.id).then(refresh)} className="h-9 w-9 rounded-full">
            <Bookmark className={p.isSaved ? "h-5 w-5 fill-current" : "h-5 w-5"} />
          </Button>
        </div>

        <div className="px-1 pt-1 text-sm font-semibold">{p.likes} mi piace</div>
        {!p.image && (
          <p className="px-1 py-1 text-sm">
            <span className="font-semibold">{p.author.name}</span> {p.content}
          </p>
        )}

        <div className="space-y-1 px-1 py-1">
          {p.comments.slice(-2).map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold">{c.user}</span> {c.text}
            </div>
          ))}
        </div>

        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("comment") as HTMLInputElement;
            void addComment(p.id, { content: input.value }).then(() => {
              input.value = "";
              return refresh();
            });
          }}
        >
          <Input name="comment" placeholder="Aggiungi un commento..." className="h-9 rounded-full border-zinc-200" />
          <Button type="submit" size="sm" className="rounded-full">
            Invia
          </Button>
        </form>
      </div>
    </article>
  );

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento community...</div>;
  if (!data) return <div className="p-6 text-sm text-destructive">Community non disponibile</div>;

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="w-full">
        <SocialSidebar active="community" />

        <main className="min-w-0 w-full max-w-[680px] border-x pb-16 lg:pb-0 lg:ml-[calc(286px+max(0px,(100vw-286px-680px)/2))] xl:ml-[calc(286px+max(0px,(100vw-286px-340px-680px)/2))]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="text-[34px] font-semibold leading-none tracking-tight">Per te</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => void onCreatePost()}>
                <CirclePlus className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => nav("/chat")}>
                <Heart className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="hidden items-center justify-between border-b px-4 py-3 lg:flex">
            <div className="text-xl font-semibold">Per te</div>
            <div className="text-sm text-zinc-600">Seguiti</div>
          </div>

          <div className="border-b px-3 py-3">
            <div className="flex gap-3 overflow-x-auto pb-1">
              <button type="button" className="min-w-[72px] text-center" onClick={openCreateStoryModal}>
                <div className="mx-auto mb-1 rounded-full bg-zinc-200 p-[2px]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-zinc-100">
                    <Plus className="h-7 w-7 text-zinc-700" />
                  </div>
                </div>
                <div className="truncate text-[11px]">Crea</div>
              </button>
              {storyGroups.map((g) => (
                <button key={g.userId} type="button" className="min-w-[72px] text-center" onClick={() => openStory(g.userId)}>
                  <div className={`mx-auto mb-1 rounded-full p-[2px] ${g.stories.every((x) => viewedStoryIds.has(x.id)) ? "bg-zinc-300" : "bg-gradient-to-tr from-fuchsia-500 via-rose-500 to-amber-400"}`}>
                    <Avatar className="h-16 w-16 border-2 border-white">
                      <AvatarImage src={g.avatar ?? undefined} />
                      <AvatarFallback>{g.user[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="truncate text-[11px]">{g.user}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-b px-3 py-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={data.posts[0]?.author.avatar ?? undefined} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Input
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Condividi un aggiornamento..."
                className="h-10 rounded-full border-zinc-200"
              />
              <Button onClick={() => void onCreatePost()} className="rounded-full">
                Pubblica
              </Button>
            </div>
          </div>

          {topFeedPosts.map(renderPost)}

          <section className="px-3 py-4">
            <div className="mb-3 text-sm font-semibold text-zinc-600">Suggeriti per te</div>
            <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2">
              {data.suggestions.map((s) => (
                <div key={s.id} className="w-[220px] shrink-0 snap-start rounded-2xl border bg-white p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={s.avatar ?? undefined} />
                      <AvatarFallback>{s.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <div className="truncate text-xs text-zinc-500">{s.role ?? "Utente"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => void toggleFollow(s.id).then(refresh)} className="flex-1 rounded-full">
                      {s.isFollowing ? "Seguito" : "Segui"}
                    </Button>
                    <Button size="sm" onClick={() => void onMessage(s.id)} className="flex-1 rounded-full">
                      Messaggio
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {bottomFeedPosts.map(renderPost)}
        </main>

        <aside className="hidden h-screen w-[340px] overflow-y-auto px-6 py-8 xl:fixed xl:right-0 xl:top-0 xl:block">
          <div className="mb-6 flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={data.posts[0]?.author.avatar ?? undefined} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold">Deddy Admin</div>
              <div className="text-xs text-zinc-500">hi deddy community</div>
            </div>
          </div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-600">Suggeriti per te</span>
            <span className="text-zinc-700">Mostra tutto</span>
          </div>
          <div className="space-y-3">
            {data.suggestions.slice(0, 6).map((s) => (
              <div key={`right-${s.id}`} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={s.avatar ?? undefined} />
                    <AvatarFallback>{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="truncate text-xs text-zinc-500">Suggerimento per te</div>
                  </div>
                </div>
                <Button variant="link" size="sm" onClick={() => void toggleFollow(s.id).then(refresh)}>
                  {s.isFollowing ? "Seguito" : "Segui"}
                </Button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white px-6 py-2 lg:hidden">
        <div className="mx-auto flex max-w-[680px] items-center justify-between">
          <button onClick={() => nav("/community")}><Home className="h-6 w-6" /></button>
          <button onClick={() => toast.info("Ricerca in arrivo")}><Search className="h-6 w-6" /></button>
          <button onClick={() => toast.info("Reels in arrivo")}><Clapperboard className="h-6 w-6" /></button>
          <button onClick={() => nav("/chat")}><Send className="h-6 w-6" /></button>
          <button onClick={() => toast.info("Profilo base")}><UserCircle2 className="h-6 w-6" /></button>
        </div>
      </nav>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 text-lg font-semibold">Crea contenuto</div>
            <div className="mb-3 flex gap-2">
              <Button variant={createMode === "post" ? "default" : "outline"} onClick={() => setCreateMode("post")} className="flex-1">Post</Button>
              <Button variant={createMode === "story" ? "default" : "outline"} onClick={() => setCreateMode("story")} className="flex-1">Storia</Button>
            </div>
            {createMode === "post" ? (
              <div className="space-y-2">
                <Input placeholder="Testo del post..." value={createPostContent} onChange={(e) => setCreatePostContent(e.target.value)} />
                <Input placeholder="URL immagine/video (opzionale)" value={createImageUrl} onChange={(e) => setCreateImageUrl(e.target.value)} />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">
                    Carica media
                    <input type="file" accept="image/*,video/*,.mp4,.mov,.webm,.ogg,.mkv,.avi,.m4v" className="hidden" onChange={onPickImage} />
                  </label>
                  {createImageUrl ? <span className="text-xs text-zinc-500">Media selezionato</span> : null}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input placeholder="URL immagine/video storia..." value={createImageUrl} onChange={(e) => setCreateImageUrl(e.target.value)} />
                <label className="inline-flex cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">
                  Carica media
                  <input type="file" accept="image/*,video/*,.mp4,.mov,.webm,.ogg,.mkv,.avi,.m4v" className="hidden" onChange={onPickImage} />
                </label>
                <div className="text-xs text-zinc-500">Durata storia fissa: 12 ore</div>
              </div>
            )}
            {(imagePreview || createImageUrl) ? (
              isVideoMedia(imagePreview || createImageUrl) ? (
                <video src={imagePreview || createImageUrl} controls className="mt-3 h-36 w-full rounded-lg bg-black object-cover" />
              ) : (
                <img
                  src={imagePreview || createImageUrl}
                  alt="Anteprima contenuto"
                  className="mt-3 h-36 w-full rounded-lg object-cover"
                />
              )
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Annulla</Button>
              <Button onClick={() => void onCreateFromModal()}>Pubblica</Button>
            </div>
          </div>
        </div>
      )}

      {activeStory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-black">
            <div className="absolute left-0 right-0 top-0 z-10 h-1 bg-white/30">
              <div className="h-1 bg-white transition-[width] duration-75 ease-linear" style={{ width: `${storyProgress}%` }} />
            </div>
            <button type="button" onClick={closeStory} className="absolute right-3 top-3 z-20 rounded-full bg-black/40 p-1 text-white">
              <X className="h-5 w-5" />
            </button>
            <button type="button" onClick={prevStory} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" onClick={nextStory} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white">
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute left-3 top-3 z-20 flex items-center gap-2 pt-2">
              <Avatar className="h-8 w-8 border border-white/50">
                <AvatarImage src={activeStory.avatar ?? undefined} />
                <AvatarFallback>{activeStory.user[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white">{activeStory.user}</span>
            </div>
            {isVideoMedia(activeStory.image) ? (
              <video src={activeStory.image} controls autoPlay className="h-[70vh] w-full bg-black object-contain" />
            ) : (
              <img src={activeStory.image} alt={`Story ${activeStory.user}`} className="h-[70vh] w-full object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
