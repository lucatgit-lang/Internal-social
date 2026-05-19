import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Grid3X3, Bookmark, UserSquare2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { getCommunityFeed, getMyProfile, toggleFollow } from "../api/community";
import { openOrCreateDirect } from "../api/chat";
import { SocialSidebar } from "../components/navigation/SocialSidebar";

export function Profile() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getMyProfile>>["data"] | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; role: string | null; avatar: string | null; isFollowing: boolean }>>([]);

  const refreshSuggestions = async () => {
    const feed = await getCommunityFeed();
    setSuggestions(feed.data.suggestions);
  };

  useEffect(() => {
    void (async () => {
      try {
        const [res] = await Promise.all([getMyProfile(), refreshSuggestions()]);
        setProfile(res.data);
      } catch {
        toast.error("Impossibile caricare il profilo");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento profilo...</div>;
  if (!profile) return <div className="p-6 text-sm text-destructive">Profilo non disponibile</div>;

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <SocialSidebar active="profile" />

      <main className="min-w-0 w-full max-w-[980px] px-6 py-10 lg:ml-[calc(286px+max(0px,(100vw-286px-980px)/2))] xl:ml-[calc(286px+max(0px,(100vw-286px-340px-980px)/2))]">
        <section className="grid grid-cols-1 gap-8 border-b pb-8 md:grid-cols-[220px_1fr]">
          <div className="flex items-start justify-center">
            <Avatar className="h-40 w-40">
              <AvatarImage src={profile.avatar ?? undefined} />
              <AvatarFallback>{profile.name[0]}</AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold">{profile.username}</h1>
              <Button variant="outline" onClick={() => toast.info("Modifica profilo in arrivo")}>Modifica profilo</Button>
              <Button variant="outline" onClick={() => toast.info("Archivio in arrivo")}>Visualizza archivio</Button>
            </div>

            <div className="flex items-center gap-6 text-lg">
              <span><strong>{profile.stats.posts}</strong> post</span>
              <span><strong>{profile.stats.followers}</strong> follower</span>
              <span><strong>{profile.stats.following}</strong> seguiti</span>
            </div>

            <div>
              <div className="font-semibold">{profile.name}</div>
              <div className="text-zinc-600">{profile.title ?? "Creator"}</div>
              <p className="mt-1 text-zinc-800">{profile.bio ?? "Condividi foto e aggiornamenti con il tuo team."}</p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-center gap-10 border-t pt-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">
            <span className="flex items-center gap-2"><Grid3X3 className="h-4 w-4" /> Post</span>
            <span className="flex items-center gap-2 text-zinc-400"><Bookmark className="h-4 w-4" /> Salvati</span>
            <span className="flex items-center gap-2 text-zinc-400"><UserSquare2 className="h-4 w-4" /> Taggati</span>
          </div>

          {profile.posts.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-3xl font-semibold">Condividi foto</div>
              <div className="mt-2 text-zinc-600">Quando condividi le foto, saranno visualizzate sul tuo profilo.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
              {profile.posts.map((p) => (
                <article key={p.id} className="group relative aspect-square overflow-hidden bg-zinc-100">
                  {p.image ? (
                    <img src={p.image} alt={p.content.slice(0, 60)} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3 text-center text-sm text-zinc-700">{p.content}</div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <aside className="hidden h-screen w-[340px] overflow-y-auto px-6 py-10 xl:fixed xl:right-0 xl:top-0 xl:block">
        <div className="mb-6 flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={profile.avatar ?? undefined} />
            <AvatarFallback>{profile.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold">{profile.name}</div>
            <div className="text-xs text-zinc-500">@{profile.username}</div>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-zinc-600">Suggeriti per te</span>
          <span className="text-zinc-700">Mostra tutto</span>
        </div>
        <div className="space-y-3">
          {suggestions.slice(0, 8).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={s.avatar ?? undefined} />
                  <AvatarFallback>{s.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="truncate text-xs text-zinc-500">{s.role ?? "Suggerimento per te"}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="link" size="sm" onClick={() => void toggleFollow(s.id).then(refreshSuggestions)}>
                  {s.isFollowing ? "Seguito" : "Segui"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    void openOrCreateDirect(s.id).then((r) =>
                      nav(`/chat?conversationId=${encodeURIComponent(r.data.conversationId)}&userId=${encodeURIComponent(s.id)}`)
                    )
                  }
                >
                  Msg
                </Button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
