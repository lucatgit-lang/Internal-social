import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Mail, Video, Users, Search, Phone, VideoIcon, MoreHorizontal, Paperclip, Smile, Mic, Send as SendIcon, Hash, Bell, UserPlus, Plus, Home, Clapperboard, UserCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { SocialSidebar } from "../components/navigation/SocialSidebar";
import { getContacts, getConversations, getEmailInbox, getMessages, getNotifications, getVideoHistory, openOrCreateDirect, sendMessage } from "../api/chat";
import { toast } from "sonner";
import { useNavigate } from "react-router";

type Tab = "chat" | "email" | "video" | "contatti";
type Filter = "all" | "direct" | "group" | "channel";

export function Chat() {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [chatFilter, setChatFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const [conversations, setConversations] = useState<Awaited<ReturnType<typeof getConversations>>["data"]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; senderId: string; text: string; time: string }>>([]);
  const [messageText, setMessageText] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const [contacts, setContacts] = useState<Array<{ id: string; name: string; role: string | null; email: string; avatar: string | null }>>([]);
  const [emails, setEmails] = useState<Array<{ id: string; from: string; subject: string; body: string; time: string; read: boolean; starred: boolean }>>([]);
  const [videos, setVideos] = useState<Array<{ id: string; type: string; durationSec: number | null; time: string; with: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; description: string | null; createdAt: string; read: boolean }>>([]);

  const loadCore = async () => {
    const [conv, notif] = await Promise.all([getConversations(), getNotifications()]);
    setConversations(conv.data);
    setNotifications(notif.data);
    if (!selected && conv.data[0]) setSelected(conv.data[0].id);
  };

  useEffect(() => {
    void loadCore();
  }, []);

  useEffect(() => {
    if (!selected) return;
    void getMessages(selected).then((m) => setMessages(m.data.messages));
  }, [selected]);

  useEffect(() => {
    if (activeTab === "contatti") void getContacts().then((r) => setContacts(r.data));
    if (activeTab === "email") void getEmailInbox().then((r) => setEmails(r.data));
    if (activeTab === "video") void getVideoHistory().then((r) => setVideos(r.data));
  }, [activeTab]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesFilter = chatFilter === "all" || c.type === chatFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [conversations, chatFilter, search]);

  const selectedConversation = useMemo(() => conversations.find((c) => c.id === selected) ?? null, [conversations, selected]);
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const unreadEmails = emails.filter((e) => !e.read).length;

  const send = async () => {
    if (!selected || !messageText.trim()) return;
    await sendMessage(selected, messageText.trim());
    setMessageText("");
    const m = await getMessages(selected);
    setMessages(m.data.messages);
    await loadCore();
  };

  const openConversation = (id: string) => {
    setSelected(id);
    setMobileThreadOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SocialSidebar active="chat" />

      <main className="pb-16 lg:ml-[286px] lg:pb-0">
        <div className="h-screen overflow-hidden border-l">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 overflow-x-auto border-b bg-card px-3 py-3 md:px-6">
              {[
                { key: "chat" as Tab, label: "Chat", icon: MessageSquare, count: totalUnread },
                { key: "email" as Tab, label: "Email", icon: Mail, count: unreadEmails },
                { key: "video" as Tab, label: "Video", icon: Video, count: 0 },
                { key: "contatti" as Tab, label: "Contatti", icon: Users, count: 0 }
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${activeTab === t.key ? "bg-gradient-to-r from-primary to-indigo-500 text-white" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.count > 0 ? <span className={`rounded-full px-2 text-xs ${activeTab === t.key ? "bg-white/20" : "bg-destructive text-white"}`}>{t.count}</span> : null}
                </button>
              ))}
            </div>

            {activeTab !== "chat" ? (
              <div className="p-4 text-sm text-muted-foreground">
                {activeTab === "email" && emails.map((e) => <div key={e.id} className="mb-2 rounded border p-3"><div className="font-medium">{e.subject}</div><div className="text-xs">{e.from}</div></div>)}
                {activeTab === "video" && videos.map((v) => <div key={v.id} className="mb-2 rounded border p-3 text-sm">{v.with} · {v.type}</div>)}
                {activeTab === "contatti" && contacts.map((c) => <div key={c.id} className="mb-2 flex items-center justify-between rounded border p-3"><div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarImage src={c.avatar ?? undefined} /><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar><div><div className="text-sm">{c.name}</div><div className="text-xs text-muted-foreground">{c.role}</div></div></div><Button size="sm" onClick={() => void openOrCreateDirect(c.id).then((r)=>{setActiveTab("chat"); setSelected(r.data.conversationId); setMobileThreadOpen(true);})}>+ Chat</Button></div>)}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1">
                <section className={`${mobileThreadOpen ? "hidden" : "block"} w-full shrink-0 border-r md:w-80`}>
                  <div className="space-y-3 border-b p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca conversazione..." className="pl-9" />
                    </div>
                    <div className="flex gap-1">
                      {[
                        { k: "all" as Filter, l: "Tutti" },
                        { k: "direct" as Filter, l: "Diretti" },
                        { k: "group" as Filter, l: "Gruppi" },
                        { k: "channel" as Filter, l: "Canali" }
                      ].map((f) => (
                        <button key={f.k} onClick={() => setChatFilter(f.k)} className={`flex-1 rounded-lg py-1 text-xs ${chatFilter === f.k ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>{f.l}</button>
                      ))}
                    </div>
                    <button className="flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                      <Plus className="h-4 w-4" /> Nuova conversazione
                    </button>
                  </div>

                  <div className="h-[calc(100%-140px)] overflow-y-auto">
                    {filteredConversations.map((c) => (
                      <button key={c.id} onClick={() => openConversation(c.id)} className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-muted/50 ${selected === c.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                        <Avatar className="h-10 w-10"><AvatarImage src={c.participant?.avatar ?? undefined} /><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between"><span className="truncate text-sm font-medium">{c.name}</span><span className="text-[11px] text-muted-foreground">{c.lastTime?.slice(11,16) ?? ""}</span></div>
                          <div className="truncate text-xs text-muted-foreground">{c.lastMessage}</div>
                        </div>
                        {c.unread > 0 ? <span className="rounded-full bg-primary px-1.5 text-xs text-white">{c.unread}</span> : null}
                      </button>
                    ))}
                  </div>
                </section>

                <section className={`${mobileThreadOpen ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
                  <div className="flex items-center justify-between border-b px-4 py-4 md:px-6">
                    <div>
                      <button
                        type="button"
                        className="mb-1 text-xs text-primary md:hidden"
                        onClick={() => setMobileThreadOpen(false)}
                      >
                        ← Conversazioni
                      </button>
                      <div className="text-2 font-semibold">{selectedConversation?.name ?? "Seleziona conversazione"}</div>
                      <div className="text-xs text-muted-foreground">{selectedConversation?.participant?.title ?? ""}</div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <VideoIcon className="h-4 w-4" />
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {messages.map((m) => {
                      const mine = selectedConversation?.participant ? m.senderId !== selectedConversation.participant.id : false;
                      return (
                        <div key={m.id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${mine ? "bg-gradient-to-r from-primary to-indigo-500 text-white" : "bg-muted"}`}>
                            {m.text}
                            <div className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-muted-foreground"}`}>{m.time?.slice(11,16) ?? m.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t p-2 md:p-3">
                    <div className="flex items-center gap-2 rounded-2xl border bg-card px-3 py-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Scrivi un messaggio..." className="border-0 bg-transparent shadow-none focus-visible:ring-0" onKeyDown={(e) => e.key === "Enter" && void send()} />
                      <Smile className="h-4 w-4 text-muted-foreground" />
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      <Button size="icon" className="rounded-full" onClick={() => void send()}><SendIcon className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </section>

                <aside className="hidden w-[290px] shrink-0 border-l xl:block">
                  <div className="border-b p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4" /> Notifiche</h3>
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{notifications.length}</span>
                    </div>
                    <div className="space-y-3">
                      {notifications.slice(0, 4).map((n) => (
                        <div key={n.id} className="text-sm">
                          <div className="font-medium">{n.title}</div>
                          <div className="text-xs text-muted-foreground">{n.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-b p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4" /> Suggeriti</h3>
                    <div className="space-y-3">
                      {contacts.slice(0, 4).map((c) => (
                        <div key={c.id} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarImage src={c.avatar ?? undefined} /><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar>
                          <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium">{c.name}</div><div className="text-[11px] text-muted-foreground">{c.role}</div></div>
                          <Button size="sm" variant="outline" onClick={() => void openOrCreateDirect(c.id).then((r)=>setSelected(r.data.conversationId))}>+ Chat</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Canali attivi</h3>
                    {conversations.filter((c) => c.type === "channel").map((c) => (
                      <button key={c.id} onClick={() => setSelected(c.id)} className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate text-xs">{c.name}</span>
                        {c.unread > 0 ? <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] text-white">{c.unread}</span> : null}
                      </button>
                    ))}
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white px-6 py-2 lg:hidden">
        <div className="mx-auto flex max-w-[680px] items-center justify-between">
          <button onClick={() => nav("/community")}><Home className="h-6 w-6" /></button>
          <button onClick={() => nav("/community")}><Search className="h-6 w-6" /></button>
          <button onClick={() => toast.info("Reels in arrivo")}><Clapperboard className="h-6 w-6" /></button>
          <button onClick={() => nav("/chat")}><SendIcon className="h-6 w-6" /></button>
          <button onClick={() => nav("/profile")}><UserCircle2 className="h-6 w-6" /></button>
        </div>
      </nav>
    </div>
  );
}
