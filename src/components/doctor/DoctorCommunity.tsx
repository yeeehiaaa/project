"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Bookmark,
  Flag,
  Trash2,
  Send,
  ImagePlus,
  X,
  Loader2,
  Search,
  BarChart3,
  CalendarDays,
  MapPin,
  AtSign,
  Check,
  Share2,
  Eye,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Mention {
  id: string;
  name: string;
}

interface CommentNode {
  id: string;
  text: string;
  doctorId: string;
  createdAt: string;
  edited?: boolean;
  likes: number;
  dislikes: number;
  myVote: string | null;
  author: { name: string; specialtyNames: string[] };
  replies: CommentNode[];
}

interface Post {
  id: string;
  kind: string;
  title: string | null;
  text: string;
  mediaPath: string | null;
  mediaType: string | null;
  targetNames: string[];
  specialtyIds: string[];
  pollOptions: { id: string; text: string }[] | null;
  pollCounts: Record<string, number>;
  pollTotal: number;
  myVote: string | null;
  eventDate: string | null;
  eventPlace: string | null;
  rsvpCount: number;
  myRsvp: boolean;
  likeCount: number;
  liked: boolean;
  dislikeCount: number;
  disliked: boolean;
  commentCount: number;
  views: number;
  outcome: string | null;
  outcomeAt: string | null;
  saved: boolean;
  mine: boolean;
  author: { id?: string; name: string; specialtyNames: string[] };
  createdAt: string;
}

const KINDS = [
  { id: "", label: "Tout" },
  { id: "POST", label: "Publications" },
  { id: "CASE", label: "Cas cliniques" },
  { id: "QUESTION", label: "Questions" },
  { id: "POLL", label: "Sondages" },
  { id: "EVENT", label: "Événements" },
];

const COMPOSER_KINDS = [
  { id: "POST", label: "Publication" },
  { id: "CASE", label: "Cas clinique" },
  { id: "QUESTION", label: "Question" },
  { id: "POLL", label: "Sondage" },
  { id: "EVENT", label: "Événement" },
];

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function renderMentions(text: string) {
  return text.split(/(@[\p{L}\-. ]+?)(?=\s|$)/gu).map((part, i) =>
    part.startsWith("@") && part.trim().length > 1 ? (
      <span key={i} className="font-bold text-violet-500">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Champ texte avec autocomplétion @médecin.
function MentionBox({
  isDark,
  value,
  onChange,
  onMentions,
  placeholder,
  rows = 2,
}: {
  isDark: boolean;
  value: string;
  onChange: (v: string) => void;
  onMentions: (m: Mention[]) => void;
  placeholder: string;
  rows?: number;
}) {
  const [suggest, setSuggest] = useState<Mention[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [picked, setPicked] = useState<Mention[]>([]);

  const fetchDoctors = async (q: string) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/community/doctors?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (d.success) {
        setSuggest(
          (d.doctors || []).map((x: any) => ({
            id: String(x.id),
            name: String(x.name).replace(/^Dr\.\s*/, ""),
          }))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleChange = (v: string) => {
    onChange(v);
    const m = v.match(/@([\p{L}\-.]*)$/u);
    if (m) {
      setMentionQuery(m[1]);
      fetchDoctors(m[1]);
    } else {
      setMentionQuery(null);
      setSuggest([]);
    }
  };

  const pick = (doc: Mention) => {
    const next = value.replace(/@[\p{L}\-.]*$/u, `@${doc.name} `);
    onChange(next);
    const np = [...picked.filter((p) => p.id !== doc.id), doc];
    setPicked(np);
    onMentions(np);
    setMentionQuery(null);
    setSuggest([]);
  };

  return (
    <div className="relative">
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-violet-500 resize-none ${
          isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
        }`}
      />
      {mentionQuery !== null && (
        <div className={`absolute left-0 right-0 bottom-full mb-1 rounded-xl border shadow-xl overflow-hidden z-20 max-h-40 overflow-y-auto ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
          {suggest.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-slate-400">Aucun médecin trouvé…</p>
          ) : (
            suggest.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => pick(d)}
                className={`w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
              >
                <AtSign size={11} className="text-violet-500" /> Dr. {d.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function DoctorCommunity({
  isDark,
  highlightPostId,
  onHighlightSeen,
}: {
  isDark: boolean;
  highlightPostId: string | null;
  onHighlightSeen: () => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [sortTop, setSortTop] = useState(false);
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  // Composer
  const [showComposer, setShowComposer] = useState(false);
  const [cKind, setCKind] = useState("POST");
  const [cTitle, setCTitle] = useState("");
  const [cText, setCText] = useState("");
  const [cMentions, setCMentions] = useState<Mention[]>([]);
  const [cSpecs, setCSpecs] = useState<string[]>([]);
  const [cPoll, setCPoll] = useState<string[]>(["", ""]);
  const [cEventDate, setCEventDate] = useState("");
  const [cEventPlace, setCEventPlace] = useState("");
  const [cAttest, setCAttest] = useState(false);
  const [cFile, setCFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // Comments
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, CommentNode[]>>({});
  const [replyTo, setReplyTo] = useState<{ postId: string; parentId: string | null; name: string } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentMentions, setCommentMentions] = useState<Mention[]>([]);
  const [sendingComment, setSendingComment] = useState(false);

  // Report
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  // Partage en DM
  const [shareFor, setShareFor] = useState<Post | null>(null);
  const [threads, setThreads] = useState<{ id: string; title: string; subtitle: string }[]>([]);
  const [sharing, setSharing] = useState(false);

  // Édition
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [perms, setPerms] = useState<Record<string, { me: string; author: string }>>({});

  // Règles (1ère visite)
  const [showRules, setShowRules] = useState(false);

  // Confrères (recherche + mini-profil)
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<{ id: string; name: string; specialty: string }[]>([]);
  const [memberProfile, setMemberProfile] = useState<{ id: string; name: string; specialty: string; posts: number; likes: number } | null>(null);

  const highlightRef = useRef<HTMLDivElement>(null);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (kind) params.set("kind", kind);
      if (specFilter) params.set("specialty", specFilter);
      if (onlyMine) params.set("mine", "1");
      if (onlySaved) params.set("saved", "1");
      if (sortTop) params.set("sort", "top");
      if (highlightPostId) params.set("postId", highlightPostId);
      const res = await fetch(`/api/community/posts?${params.toString()}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) setPosts(Array.isArray(data.posts) ? data.posts : []);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, specFilter, onlyMine, onlySaved, sortTop, highlightPostId]);

  useEffect(() => {
    load();
  }, [load]);

  // Stats sidebar : un seul chargement sans filtres.
  const loadStats = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/community/posts", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (d.success) setAllPosts(Array.isArray(d.posts) ? d.posts : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/labs/specialties", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (Array.isArray(data.specialties)) setSpecialties(data.specialties);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (highlightPostId && posts.length > 0) {
      highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(onHighlightSeen, 4000);
      return () => clearTimeout(t);
    }
  }, [highlightPostId, posts, onHighlightSeen]);

  const mediaCache = useRef(new Map<string, string>());
  const signedMedia = useCallback(async (path: string): Promise<string> => {
    const hit = mediaCache.current.get(path);
    if (hit) return hit;
    const token = await getToken();
    if (!token) throw new Error("Session expirée.");
    const res = await fetch(`/api/community/upload-url?path=${encodeURIComponent(path)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error("Média indisponible.");
    mediaCache.current.set(path, data.url);
    return data.url;
  }, []);

  const uploadFile = async (f: File): Promise<{ path: string; mediaType: string }> => {
    const token = await getToken();
    if (!token) throw new Error("Session expirée.");
    const res = await fetch("/api/community/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mime: f.type, size: f.size }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || "Upload impossible.");
    const put = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": f.type }, body: f });
    if (!put.ok) throw new Error("Envoi du fichier échoué.");
    return { path: data.path, mediaType: data.mediaType };
  };

  const publish = async () => {
    if (!cText.trim()) {
      setError("Écrivez quelque chose avant de publier.");
      return;
    }
    setPublishing(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expirée, reconnectez-vous.");
      let media: { path: string; mediaType: string } | null = null;
      if (cFile) media = await uploadFile(cFile);
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          kind: cKind,
          title: cTitle.trim() || undefined,
          text: cText.trim(),
          mediaPath: media?.path,
          mediaType: media?.mediaType,
          specialtyIds: cSpecs,
          pollOptions: cKind === "POLL" ? cPoll : undefined,
          eventDate: cKind === "EVENT" ? cEventDate || undefined : undefined,
          eventPlace: cKind === "EVENT" ? cEventPlace.trim() || undefined : undefined,
          mentionedDoctorIds: cMentions.map((m) => m.id),
          anonymized: cKind === "CASE" ? cAttest : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Publication impossible.");
      setShowComposer(false);
      setCTitle("");
      setCText("");
      setCMentions([]);
      setCSpecs([]);
      setCPoll(["", ""]);
      setCEventDate("");
      setCEventPlace("");
      setCAttest(false);
      setCFile(null);
      clearDraft();
      load();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible.");
    } finally {
      setPublishing(false);
    }
  };

  const react = async (postId: string, action: string, extra: Record<string, unknown> = {}) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/community/react", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) return;
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          if (action === "like") return { ...p, liked: !!data.liked, likeCount: p.likeCount + (data.liked ? 1 : -1) };
          if (action === "bookmark") return { ...p, saved: !!data.saved };
          if (action === "rsvp") return { ...p, myRsvp: !!data.rsvp, rsvpCount: p.rsvpCount + (data.rsvp ? 1 : -1) };
          return p;
        })
      );
      if (action === "poll" || action === "report") load();
    } catch {
      // ignore
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/community/comments?postId=${encodeURIComponent(postId)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setComments((p) => ({ ...p, [postId]: data.comments || [] }));
        setPerms((p) => ({
          ...p,
          [postId]: { me: data.myDoctorId || "", author: data.postAuthorId || "" },
        }));
        // Vue comptée à l'ouverture des commentaires (audience réelle).
        react(postId, "view");
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p))
        );
      }
    } catch {
      // ignore
    }
  };

  const toggleComments = (postId: string) => {
    const willOpen = !openComments[postId];
    setOpenComments((p) => ({ ...p, [postId]: willOpen }));
    if (willOpen) {
      loadComments(postId);
      setReplyTo({ postId, parentId: null, name: "" });
      setCommentText("");
      setCommentMentions([]);
    }
  };

  const sendComment = async () => {
    if (!replyTo || !commentText.trim()) return;
    setSendingComment(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          postId: replyTo.postId,
          parentId: replyTo.parentId,
          text: commentText.trim(),
          mentionedDoctorIds: commentMentions.map((m) => m.id),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) return;
      setCommentText("");
      setCommentMentions([]);
      setReplyTo({ postId: replyTo.postId, parentId: null, name: "" });
      loadComments(replyTo.postId);
      setPosts((prev) => prev.map((p) => (p.id === replyTo.postId ? { ...p, commentCount: p.commentCount + 1 } : p)));
    } finally {
      setSendingComment(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Supprimer cette publication ?")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`/api/community/posts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignore
    }
  };

  const submitReport = async () => {
    if (!reportFor) return;
    await react(reportFor, "report", reportReason.trim() ? { reason: reportReason.trim() } : {});
    setReportFor(null);
    setReportReason("");
    load();
  };

  // Règles : affichées à la première visite.
  useEffect(() => {
    try {
      if (!localStorage.getItem("doctorz_community_rules_ok")) setShowRules(true);
    } catch {
      setShowRules(true);
    }
  }, []);
  const acceptRules = () => {
    try {
      localStorage.setItem("doctorz_community_rules_ok", "1");
    } catch {
      // ignore
    }
    setShowRules(false);
  };

  // Brouillon auto-sauvegardé du composer.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("doctorz_community_draft");
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.text === "string" && d.text && !cText) {
          setCText(d.text);
          if (typeof d.title === "string") setCTitle(d.title);
          if (typeof d.kind === "string") setCKind(d.kind);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      if (cText.trim() || cTitle.trim()) {
        localStorage.setItem(
          "doctorz_community_draft",
          JSON.stringify({ text: cText, title: cTitle, kind: cKind })
        );
      } else {
        localStorage.removeItem("doctorz_community_draft");
      }
    } catch {
      // ignore
    }
  }, [cText, cTitle, cKind]);

  const clearDraft = () => {
    try {
      localStorage.removeItem("doctorz_community_draft");
    } catch {
      // ignore
    }
  };

  // Partage en message privé.
  const openShare = async (p: Post) => {
    setShareFor(p);
    setThreads([]);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/doctor-threads", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (d.success && Array.isArray(d.threads)) {
        setThreads(
          d.threads.map((t: any) => ({
            id: String(t.id),
            title: String(t.title || "Discussion"),
            subtitle: String(t.subtitle || ""),
          }))
        );
      }
    } catch {
      // ignore
    }
  };

  const sendShare = async (threadId: string) => {
    if (!shareFor) return;
    setSharing(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      await fetch("/api/doctor-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "send",
          threadId,
          text: `🔗 Post partagé depuis la Communauté — « ${shareFor.title || shareFor.text.slice(0, 80)} » (voir l'onglet Communauté)`,
        }),
      });
      setShareFor(null);
    } finally {
      setSharing(false);
    }
  };

  // Édition de ses contenus.
  const startEditPost = (p: Post) => {
    setEditPostId(p.id);
    setEditTitle(p.title || "");
    setEditText(p.text);
  };

  const saveEditPost = async () => {
    if (!editPostId || !editText.trim()) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/community/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editPostId, title: editTitle, text: editText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.post) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editPostId ? { ...p, title: data.post.title, text: data.post.text } : p
          )
        );
        setEditPostId(null);
      }
    } finally {
      // silencieux
    }
  };

  const [outcomeFor, setOutcomeFor] = useState<string | null>(null);
  const [outcomeText, setOutcomeText] = useState("");

  const saveOutcome = async () => {
    if (!outcomeFor || !outcomeText.trim()) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/community/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: outcomeFor, outcome: outcomeText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.post) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === outcomeFor
              ? { ...p, outcome: data.post.outcome, outcomeAt: data.post.outcomeAt }
              : p
          )
        );
        setOutcomeFor(null);
        setOutcomeText("");
      }
    } finally {
      // silencieux
    }
  };

  const saveEditComment = async (postId: string) => {
    if (!editCommentId || !editCommentText.trim()) return;
    try {
      const token = await getToken();
      if (!token) return;
      await fetch("/api/community/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editCommentId, text: editCommentText.trim() }),
      });
      setEditCommentId(null);
      setEditCommentText("");
      loadComments(postId);
    } finally {
      // silencieux
    }
  };

  const voteComment = async (postId: string, commentId: string, value: "like" | "dislike") => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch("/api/community/react", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "comment-vote", postId, commentId, value }),
      });
      loadComments(postId);
    } catch {
      // ignore
    }
  };

  // Recherche confrères + mini-profil.
  const searchMembers = async (q: string) => {
    setMemberQuery(q);
    if (q.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/community/doctors?q=${encodeURIComponent(q.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (d.success) setMemberResults(d.doctors || []);
    } catch {
      // ignore
    }
  };

  const openMemberProfile = (m: { id: string; name: string; specialty: string }) => {
    const list = allPosts.filter((p) => p.author?.id === m.id || p.author?.name === m.name);
    setMemberProfile({
      id: m.id,
      name: m.name,
      specialty: m.specialty,
      posts: list.length,
      likes: list.reduce((n, p) => n + (p.likeCount || 0), 0),
    });
  };

  const box = isDark ? "bg-slate-900/85 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900";
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-violet-500 ${isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"}`;

  const upcomingEvents = allPosts
    .filter((p) => p.kind === "EVENT" && p.eventDate && new Date(p.eventDate).getTime() > Date.now() - 86400000)
    .sort((a, b) => new Date(a.eventDate as string).getTime() - new Date(b.eventDate as string).getTime())
    .slice(0, 4);
  const myPostsCount = allPosts.filter((p) => p.mine).length;
  const savedCount = allPosts.filter((p) => p.saved).length;
  const likesReceived = allPosts.filter((p) => p.mine).reduce((n, p) => n + p.likeCount, 0);
  const topicCounts = new Map<string, number>();
  for (const p of allPosts) {
    for (const t of p.targetNames || []) {
      if (t === "Toutes spécialités") continue;
      topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
    }
  }
  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Top contributeurs : 2 pts/post + 1 pt/j'aime reçu (mois en cours).
  const topContributors = (() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const scores = new Map<string, { name: string; score: number }>();
    for (const p of allPosts) {
      if (new Date(p.createdAt).getTime() < start.getTime()) continue;
      const key = p.author?.name || "Médecin";
      const cur = scores.get(key) || { name: key, score: 0 };
      cur.score += 2 + (p.likeCount || 0);
      scores.set(key, cur);
    }
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  })();

  return (
    <div className={`min-h-[85vh] px-4 sm:px-6 lg:px-10 py-6 ${isDark ? "bg-gradient-to-b from-violet-950/30 via-slate-950 to-slate-950" : "bg-gradient-to-b from-violet-50 via-slate-50 to-slate-50"}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
              Communauté des médecins
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cas cliniques, questions, sondages et événements — entre confrères.
            </p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px] items-start">
          <div className="space-y-4 min-w-0">
      {/* Barre : recherche + filtre spécialité + mes contenus */}
      <div className={`p-4 rounded-3xl border ${box}`}>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Rechercher : cas, médicament, technique..."
              className={`${inputCls} !pl-9`}
            />
          </div>
          <select value={specFilter} onChange={(e) => setSpecFilter(e.target.value)} className={`${inputCls} md:w-48`}>
            <option value="">Toutes spécialités</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-2.5 flex gap-1.5 flex-wrap items-center">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${kind === k.id ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {k.label}
            </button>
          ))}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setSortTop(!sortTop)}
            title={sortTop ? "Tri : tendances" : "Tri : récent"}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${sortTop ? "bg-gradient-to-r from-amber-500 to-orange-400 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
          >
            {sortTop ? "🔥 Tendances" : "🕘 Récent"}
          </button>
          <button
            type="button"
            onClick={() => { setOnlyMine(!onlyMine); setOnlySaved(false); }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${onlyMine ? "bg-sky-600 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
          >
            Mes posts
          </button>
          <button
            type="button"
            onClick={() => { setOnlySaved(!onlySaved); setOnlyMine(false); }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${onlySaved ? "bg-amber-500 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
          >
            Sauvegardés
          </button>
          <button
            type="button"
            onClick={() => setShowComposer(!showComposer)}
            className="px-4 py-1.5 rounded-xl text-[11px] font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-500 transition cursor-pointer active:scale-95"
          >
            + Publier
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Composer */}
      {showComposer && (
        <div className={`p-5 rounded-3xl border ${box}`}>
          <div className="flex gap-1.5 flex-wrap">
            {COMPOSER_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setCKind(k.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${cKind === k.id ? "bg-violet-600 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          {(cKind === "CASE" || cKind === "QUESTION" || cKind === "POLL" || cKind === "EVENT") && (
            <input
              value={cTitle}
              onChange={(e) => setCTitle(e.target.value)}
              placeholder={cKind === "POLL" ? "Question du sondage *" : cKind === "EVENT" ? "Titre de l'événement *" : "Titre *"}
              className={`${inputCls} mt-2.5`}
            />
          )}
          <div className="mt-2.5">
            <MentionBox
              isDark={isDark}
              value={cText}
              onChange={setCText}
              onMentions={setCMentions}
              rows={3}
              placeholder={cKind === "CASE" ? "Motif, antécédents (anonymisés), examens, question... (@ pour mentionner)" : "Écrivez votre publication... (@ pour mentionner un confrère)"}
            />
          </div>
          {cKind === "POLL" && (
            <div className="mt-2.5 space-y-1.5">
              {cPoll.map((o, i) => (
                <div key={i} className="flex gap-1.5">
                  <input
                    value={o}
                    onChange={(e) => setCPoll((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={`Option ${i + 1}`}
                    className={inputCls}
                  />
                  {cPoll.length > 2 && (
                    <button type="button" onClick={() => setCPoll((p) => p.filter((_, j) => j !== i))} className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-rose-500 transition cursor-pointer">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {cPoll.length < 4 && (
                <button type="button" onClick={() => setCPoll((p) => [...p, ""])} className="text-[11px] font-bold text-violet-500 hover:underline cursor-pointer">
                  + Ajouter une option
                </button>
              )}
            </div>
          )}
          {cKind === "EVENT" && (
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <input type="datetime-local" value={cEventDate} onChange={(e) => setCEventDate(e.target.value)} className={inputCls} />
              <input value={cEventPlace} onChange={(e) => setCEventPlace(e.target.value)} placeholder="Lieu (ex : Alger, visio...)" className={inputCls} />
            </div>
          )}
          <div className="mt-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Spécialités concernées (vide = toutes)</p>
            <div className="flex flex-wrap gap-1">
              {specialties.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCSpecs((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${cSpecs.includes(s.id) ? "bg-violet-600 text-white border-violet-600" : isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <label className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 50 * 1024 * 1024) {
                    setError("Fichier trop lourd (max 50 Mo).");
                    return;
                  }
                  setCFile(f);
                }}
              />
              <ImagePlus size={13} />
              {cFile ? `📎 ${cFile.name}` : "Photo / vidéo"}
            </label>
            {cFile && (
              <button type="button" onClick={() => setCFile(null)} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>
          {cKind === "CASE" && (
            <label className={`mt-2.5 flex items-start gap-2 p-3 rounded-xl border text-[11px] cursor-pointer ${isDark ? "border-amber-500/30 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
              <input type="checkbox" checked={cAttest} onChange={(e) => setCAttest(e.target.checked)} className="mt-0.5" />
              <span>
                Je confirme que ce cas est <strong>anonymisé</strong> : aucun nom, visage, date exacte ou identifiant patient.
              </span>
            </label>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowComposer(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-500/10 transition cursor-pointer">
              Annuler
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={publishing}
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-500 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {publishing ? "Publication..." : "Publier"}
            </button>
          </div>
        </div>
      )}

      {/* Fil */}
      {loading ? (
        <div className="flex py-16 items-center justify-center">
          <Loader2 size={26} className="animate-spin text-violet-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${box}`}>
          <MessageCircle size={30} className="mx-auto text-slate-400 opacity-50" />
          <p className="mt-2 text-sm font-bold">Aucune publication</p>
          <p className="text-xs text-slate-400 mt-1">Soyez le premier à partager avec vos confrères.</p>
        </div>
      ) : (
        posts.map((p) => (
          <div
            key={p.id}
            ref={highlightPostId === p.id ? highlightRef : undefined}
            className={`p-5 rounded-3xl border transition ${box} ${highlightPostId === p.id ? "ring-2 ring-violet-500" : ""}`}
          >
            {/* Auteur */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {p.author.name.replace(/^Dr\.\s*/, "").charAt(0) || "D"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">
                    {p.author.name}
                    {p.author.specialtyNames[0] && <span className="ml-1.5 font-medium text-slate-400">• {p.author.specialtyNames[0]}</span>}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {timeAgo(p.createdAt)} •
                    <span className="ml-1 px-1.5 py-px rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-500 font-bold">
                      {p.kind === "POST" ? "Publication" : p.kind === "CASE" ? "Cas clinique" : p.kind === "QUESTION" ? "Question" : p.kind === "POLL" ? "Sondage" : "Événement"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" title="Sauvegarder" onClick={() => react(p.id, "bookmark")} className={`p-1.5 rounded-lg transition cursor-pointer ${p.saved ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}>
                  <Bookmark size={14} fill={p.saved ? "currentColor" : "none"} />
                </button>
                {!p.mine && (
                  <button type="button" title="Signaler" onClick={() => setReportFor(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer">
                    <Flag size={14} />
                  </button>
                )}
                {p.mine && (
                  <button type="button" title="Supprimer" onClick={() => deletePost(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Contenu */}
            {p.title && <h3 className="mt-2.5 text-sm font-bold">{p.title}</h3>}
            <p className="mt-1 text-xs leading-6 whitespace-pre-wrap">{renderMentions(p.text)}</p>
            <MediaView path={p.mediaPath} type={p.mediaType} getUrl={signedMedia} />

            {/* Sondage */}
            {p.kind === "POLL" && p.pollOptions && (
              <div className="mt-2.5 space-y-1.5">
                {p.pollOptions.map((o) => {
                  const votes = p.pollCounts[o.id] || 0;
                  const pct = p.pollTotal > 0 ? Math.round((votes / p.pollTotal) * 100) : 0;
                  const mine = p.myVote === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => react(p.id, "poll", { optionId: o.id })}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-[11px] transition cursor-pointer relative overflow-hidden ${mine ? "border-violet-500" : isDark ? "border-slate-700 hover:border-violet-500/50" : "border-slate-200 hover:border-violet-300"}`}
                    >
                      <div className="absolute inset-y-0 left-0 bg-violet-500/15" style={{ width: `${pct}%` }} />
                      <span className="relative flex items-center justify-between gap-2">
                        <span className="font-semibold flex items-center gap-1.5">
                          {mine && <Check size={11} className="text-violet-500" />} {o.text}
                        </span>
                        <span className="font-mono text-slate-400">{pct}% ({votes})</span>
                      </span>
                    </button>
                  );
                })}
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <BarChart3 size={10} /> {p.pollTotal} vote{p.pollTotal > 1 ? "s" : ""} • cliquez pour voter / changer
                </p>
              </div>
            )}

            {/* Événement */}
            {p.kind === "EVENT" && (
              <div className={`mt-2.5 p-3 rounded-2xl border flex items-center justify-between gap-2 ${isDark ? "border-slate-700 bg-slate-950/50" : "border-slate-200 bg-slate-50"}`}>
                <div className="text-[11px]">
                  {p.eventDate && (
                    <p className="font-bold flex items-center gap-1"><CalendarDays size={11} /> {new Date(p.eventDate).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  )}
                  {p.eventPlace && <p className="text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {p.eventPlace}</p>}
                  <p className="text-slate-400 mt-0.5">{p.rsvpCount} participant{p.rsvpCount > 1 ? "s" : ""}</p>
                </div>
                <button
                  type="button"
                  onClick={() => react(p.id, "rsvp")}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${p.myRsvp ? "bg-emerald-600 text-white" : "bg-violet-600 text-white hover:bg-violet-500"}`}
                >
                  {p.myRsvp ? "✓ Je participe" : "Je participe"}
                </button>
              </div>
            )}

            {(p.targetNames || []).length > 0 && (p.targetNames[0] !== "Toutes spécialités" || p.targetNames.length > 1) && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {p.targetNames.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-500 text-[10px] font-bold">{t}</span>
                ))}
              </div>
            )}

            {/* Conclusion du cas (auteur uniquement) */}
            {p.kind === "CASE" && p.outcome && (
              <div className={`mt-2.5 p-3 rounded-2xl border ${isDark ? "border-emerald-500/30 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                  ✅ Conclusion du cas{p.outcomeAt ? ` • ${new Date(p.outcomeAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}` : ""}
                </p>
                <p className="mt-1 text-xs leading-6">{p.outcome}</p>
              </div>
            )}
            {p.kind === "CASE" && p.mine && outcomeFor !== p.id && (
              <button
                type="button"
                onClick={() => {
                  setOutcomeFor(p.id);
                  setOutcomeText(p.outcome || "");
                }}
                className="mt-2 text-[11px] font-bold text-emerald-500 hover:underline cursor-pointer"
              >
                {p.outcome ? "Modifier la conclusion" : "+ Ajouter la conclusion du cas"}
              </button>
            )}
            {outcomeFor === p.id && (
              <div className="mt-2 flex gap-1.5">
                <input
                  value={outcomeText}
                  onChange={(e) => setOutcomeText(e.target.value)}
                  placeholder="Diagnostic retenu, traitement, évolution..."
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={saveOutcome}
                  disabled={!outcomeText.trim()}
                  className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50"
                >
                  OK
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-slate-500/10 flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => react(p.id, "like")}
                title="J'aime"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${p.liked ? "text-emerald-500" : "text-slate-400 hover:text-emerald-500"}`}
              >
                <ThumbsUp size={14} fill={p.liked ? "currentColor" : "none"} /> {p.likeCount}
              </button>
              <button
                type="button"
                onClick={() => react(p.id, "dislike")}
                title="Je n'aime pas"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${p.disliked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"}`}
              >
                <ThumbsDown size={14} fill={p.disliked ? "currentColor" : "none"} /> {p.dislikeCount}
              </button>
              <button
                type="button"
                onClick={() => toggleComments(p.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-sky-500 transition cursor-pointer"
              >
                <MessageCircle size={14} /> {p.commentCount}
              </button>
              <span className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-slate-400">
                <Eye size={13} /> {p.views || 0}
              </span>
              <span className="flex-1" />
              {p.mine && editPostId !== p.id && (
                <button
                  type="button"
                  onClick={() => startEditPost(p)}
                  title="Modifier"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-violet-500 transition cursor-pointer"
                >
                  <Pencil size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => openShare(p)}
                title="Partager en message"
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 transition cursor-pointer"
              >
                <Share2 size={13} />
              </button>
            </div>

            {/* Édition du post */}
            {editPostId === p.id && (
              <div className="mt-2 space-y-1.5">
                {p.title !== null && p.kind !== "POST" && (
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titre" className={inputCls} />
                )}
                <textarea
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
                <div className="flex justify-end gap-1.5">
                  <button type="button" onClick={() => setEditPostId(null)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:bg-slate-500/10 transition cursor-pointer">
                    Annuler
                  </button>
                  <button type="button" onClick={saveEditPost} disabled={!editText.trim()} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-500 transition cursor-pointer disabled:opacity-50">
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Commentaires */}
            {openComments[p.id] && (
              <CommentsBlock
                isDark={isDark}
                postId={p.id}
                comments={comments[p.id] || []}
                perm={perms[p.id] || { me: "", author: "" }}
                onReply={(parentId, name) => {
                  setReplyTo({ postId: p.id, parentId, name });
                  setCommentText(parentId ? `@${name} ` : "");
                }}
                onDelete={async (id) => {
                  if (!confirm("Supprimer ce commentaire ?")) return;
                  try {
                    const { data } = await supabase.auth.getSession();
                    const token = data.session?.access_token;
                    if (!token) return;
                    await fetch(`/api/community/comments?id=${encodeURIComponent(id)}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    loadComments(p.id);
                  } catch {
                    // ignore
                  }
                }}
                onEdit={(id, text) => {
                  setEditCommentId(id);
                  setEditCommentText(text);
                }}
                onVote={(commentId, value) => voteComment(p.id, commentId, value)}
              />
            )}
            {openComments[p.id] && replyTo?.postId === p.id && (
              <div className="mt-2 flex gap-1.5">
                <div className="flex-1">
                  <MentionBox
                    isDark={isDark}
                    value={commentText}
                    onChange={setCommentText}
                    onMentions={setCommentMentions}
                    placeholder={replyTo.parentId ? `Répondre...` : "Commenter... (@ pour mentionner)"}
                  />
                </div>
                <button
                  type="button"
                  onClick={sendComment}
                  disabled={sendingComment || !commentText.trim()}
                  className="shrink-0 self-start p-2.5 rounded-xl text-white bg-gradient-to-r from-violet-600 to-fuchsia-500 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {sendingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Signalement */}
      {reportFor && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReportFor(null);
              setReportReason("");
            }
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl p-5 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <h3 className="text-sm font-bold flex items-center gap-1.5"><Flag size={14} className="text-rose-500" /> Signaler cette publication</h3>
            <p className="mt-1 text-[11px] text-slate-400">Motif (optionnel) — 3 signalements = masquage auto.</p>
            <textarea
              rows={2}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Ex : données patient identifiantes, spam..."
              className={`mt-2.5 w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-rose-400 resize-none ${isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 placeholder:text-slate-400"}`}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => { setReportFor(null); setReportReason(""); }} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-500/10 transition cursor-pointer">
                Annuler
              </button>
              <button type="button" onClick={submitReport} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition cursor-pointer">
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Édition commentaire */}
      {editCommentId && (
        <div className="mt-2 flex gap-1.5">
          <input
            value={editCommentText}
            onChange={(e) => setEditCommentText(e.target.value)}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => {
              const pid = Object.keys(comments).find((k) =>
                (comments[k] || []).some(
                  (c) => c.id === editCommentId || c.replies.some((r) => r.id === editCommentId)
                )
              );
              if (pid) saveEditComment(pid);
            }}
            disabled={!editCommentText.trim()}
            className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-500 transition cursor-pointer disabled:opacity-50"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              setEditCommentId(null);
              setEditCommentText("");
            }}
            className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-400 hover:bg-slate-500/10 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Partage en message privé */}
      {shareFor && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareFor(null);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl p-5 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Share2 size={14} className="text-sky-500" /> Partager en message
            </h3>
            <p className="mt-1 text-[11px] text-slate-400 truncate">
              « {shareFor.title || shareFor.text.slice(0, 60)} »
            </p>
            <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
              {threads.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">
                  Aucune discussion — ouvrez l'onglet Messagerie pour en créer une.
                </p>
              ) : (
                threads.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={sharing}
                    onClick={() => sendShare(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-[11px] transition cursor-pointer disabled:opacity-50 ${isDark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}
                  >
                    <span className="font-bold block truncate">{t.title}</span>
                    {t.subtitle && <span className="text-slate-400 truncate block">{t.subtitle}</span>}
                  </button>
                ))
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => setShareFor(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-500/10 transition cursor-pointer">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Règles de la communauté */}
      {showRules && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <h3 className="text-base font-black">📜 Règles de la communauté</h3>
            <ul className="mt-3 space-y-2 text-xs leading-5">
              <li><strong>1. Secret médical absolu</strong> — aucun nom, visage, date exacte ou identifiant patient dans les cas.</li>
              <li><strong>2. Confraternité</strong> — débats d'idées, jamais d'attaques personnelles.</li>
              <li><strong>3. Pas de publicité</strong> — ni produits, ni cliniques, ni liens commerciaux.</li>
              <li><strong>4. Qualité</strong> — sources citées quand possible, pas de diagnostic définitif à distance.</li>
              <li><strong>5. Modération</strong> — 3 signalements = masquage automatique, vérification ensuite.</li>
            </ul>
            <button
              type="button"
              onClick={acceptRules}
              className="mt-4 w-full py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-500 transition cursor-pointer active:scale-[0.98]"
            >
              J'ai compris, j'adhère
            </button>
          </div>
        </div>
      )}

      {/* Mini-profil confrère */}
      {memberProfile && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMemberProfile(null);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className={`w-full max-w-xs rounded-3xl border shadow-2xl p-6 text-center ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white text-lg font-black mx-auto">
              {memberProfile.name.replace(/^Dr\.\s*/, "").charAt(0) || "D"}
            </div>
            <p className="mt-2 text-sm font-bold">{memberProfile.name}</p>
            {memberProfile.specialty && <p className="text-[11px] text-violet-500 font-semibold">{memberProfile.specialty}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className={`p-2.5 rounded-2xl ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
                <p className="text-lg font-black">{memberProfile.posts}</p>
                <p className="text-[10px] text-slate-400">Posts</p>
              </div>
              <div className={`p-2.5 rounded-2xl ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
                <p className="text-lg font-black">{memberProfile.likes}</p>
                <p className="text-[10px] text-slate-400">J'aime reçus</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMemberProfile(null)}
              className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
          </div>

          {/* Sidebar */}
          <aside className="hidden xl:block sticky top-24 space-y-4">
            <div className={`p-4 rounded-3xl border ${box}`}>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Mon activité</p>
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setOnlyMine(true); setOnlySaved(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                >
                  <span>Mes publications</span>
                  <span className="px-2 py-0.5 rounded-lg bg-violet-500/15 text-violet-500 font-black">{myPostsCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setOnlySaved(true); setOnlyMine(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                >
                  <span>Sauvegardés</span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-500 font-black">{savedCount}</span>
                </button>
                <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-400">
                  <span>Likes reçus</span>
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-500 font-black">{likesReceived}</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-3xl border ${box}`}>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Événements à venir</p>
              {upcomingEvents.length === 0 ? (
                <p className="mt-2 text-[11px] text-slate-400 italic">Aucun événement prévu.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {upcomingEvents.map((e) => (
                    <div key={e.id} className={`px-3 py-2 rounded-2xl border ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                      <p className="text-[11px] font-bold truncate">{e.title || "Événement"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {e.eventDate ? new Date(e.eventDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                        {e.eventPlace ? ` • ${e.eventPlace}` : ""} • {e.rsvpCount} participant{e.rsvpCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {topTopics.length > 0 && (
              <div className={`p-4 rounded-3xl border ${box}`}>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Sujets actifs</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {topTopics.map(([t, n]) => (
                    <span key={t} className="px-2 py-0.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-500 text-[10px] font-bold">
                      {t} • {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={`p-4 rounded-3xl border ${box}`}>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">🏆 Top contributeurs</p>
              {topContributors.length === 0 ? (
                <p className="mt-2 text-[11px] text-slate-400 italic">Aucune activité pour le moment.</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {topContributors.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-[11px]">
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${i === 0 ? "bg-amber-500 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
                        {i + 1}
                      </span>
                      <span className="font-bold truncate flex-1">{c.name}</span>
                      <span className="text-slate-400 shrink-0">{c.score} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-3xl border ${box}`}>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Confrères</p>
              <div className="relative mt-2">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={memberQuery}
                  onChange={(e) => searchMembers(e.target.value)}
                  placeholder="Rechercher un médecin..."
                  className={`${inputCls} !pl-8 !text-[11px]`}
                />
              </div>
              {memberResults.length > 0 && (
                <div className="mt-1.5 space-y-1 max-h-48 overflow-y-auto">
                  {memberResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        openMemberProfile(m);
                        setMemberResults([]);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                      <span className="font-bold block truncate">{m.name}</span>
                      {m.specialty && <span className="text-slate-400">{m.specialty}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MediaView({
  path,
  type,
  getUrl,
}: {
  path: string | null;
  type: string | null;
  getUrl: (path: string) => Promise<string>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    getUrl(path)
      .then((u) => {
        if (live) setSrc(u);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [path, getUrl]);
  if (!path) return null;
  if (!src) {
    return (
      <div className="mt-2.5 h-40 rounded-2xl bg-slate-500/10 animate-pulse flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }
  if (type === "video") {
    return <video src={src} controls playsInline preload="metadata" className="mt-2.5 w-full max-h-80 rounded-2xl bg-black" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Média" className="mt-2.5 w-full max-h-80 object-cover rounded-2xl" />;
}

function CommentsBlock({
  isDark,
  postId: _postId,
  comments,
  perm,
  onReply,
  onDelete,
  onEdit,
  onVote,
}: {
  isDark: boolean;
  postId: string;
  comments: CommentNode[];
  perm: { me: string; author: string };
  onReply: (parentId: string | null, name: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onVote: (commentId: string, value: "like" | "dislike") => void;
}) {
  if (comments.length === 0) {
    return <p className="mt-2 text-[11px] text-slate-400 italic">Aucun commentaire — lancez la discussion.</p>;
  }
  // Suppression : auteur du commentaire OU auteur du post uniquement.
  // (un 3e médecin ne supprime jamais le commentaire d'un autre)
  const canDelete = (doctorId: string) =>
    !!perm.me && (doctorId === perm.me || perm.me === perm.author);
  const renderComment = (c: CommentNode, depth: number) => (
    <div key={c.id} className={depth > 0 ? "mt-1.5 ml-3 pl-2.5 border-l-2 border-violet-500/30" : ""}>
      <div className={`px-3 py-2 rounded-2xl ${isDark ? "bg-slate-950/60" : "bg-slate-50"}`}>
        <p className="text-[11px]">
          <span className="font-bold">{c.author.name}</span>
          <span className="ml-1.5 text-slate-400">{timeAgo(c.createdAt)}</span>
          {c.edited && <span className="ml-1.5 text-slate-400 italic">(modifié)</span>}
        </p>
        <p className="mt-0.5 text-xs leading-5">{renderMentions(c.text)}</p>
        <div className="mt-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onVote(c.id, "like")}
            title="J'aime"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${c.myVote === "like" ? "text-emerald-500" : "text-slate-400 hover:text-emerald-500"}`}
          >
            <ThumbsUp size={11} fill={c.myVote === "like" ? "currentColor" : "none"} /> {c.likes || 0}
          </button>
          <button
            type="button"
            onClick={() => onVote(c.id, "dislike")}
            title="Je n'aime pas"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${c.myVote === "dislike" ? "text-rose-500" : "text-slate-400 hover:text-rose-500"}`}
          >
            <ThumbsDown size={11} fill={c.myVote === "dislike" ? "currentColor" : "none"} /> {c.dislikes || 0}
          </button>
          {depth === 0 && (
            <button
              type="button"
              onClick={() => onReply(c.id, c.author.name.replace(/^Dr\.\s*/, ""))}
              className="px-1.5 py-0.5 text-[10px] font-bold text-sky-500 hover:underline cursor-pointer"
            >
              Répondre
            </button>
          )}
          {perm.me && c.doctorId === perm.me && (
            <button
              type="button"
              onClick={() => onEdit(c.id, c.text)}
              className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-violet-500 cursor-pointer"
            >
              Modifier
            </button>
          )}
          {canDelete(c.doctorId) && (
            <button
              type="button"
              onClick={() => onDelete(c.id)}
              className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
      {depth === 0 &&
        c.replies.map((r) => (
          <div key={r.id} className="mt-1.5 ml-3 pl-2.5 border-l-2 border-violet-500/30">
            <div className={`px-3 py-2 rounded-2xl ${isDark ? "bg-slate-950/60" : "bg-slate-50"}`}>
              <p className="text-[11px]">
                <span className="font-bold">{r.author.name}</span>
                <span className="ml-1.5 text-slate-400">{timeAgo(r.createdAt)}</span>
                {r.edited && <span className="ml-1.5 text-slate-400 italic">(modifié)</span>}
              </p>
              <p className="mt-0.5 text-xs leading-5">{renderMentions(r.text)}</p>
              <div className="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onVote(r.id, "like")}
                  title="J'aime"
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${r.myVote === "like" ? "text-emerald-500" : "text-slate-400 hover:text-emerald-500"}`}
                >
                  <ThumbsUp size={11} fill={r.myVote === "like" ? "currentColor" : "none"} /> {r.likes || 0}
                </button>
                <button
                  type="button"
                  onClick={() => onVote(r.id, "dislike")}
                  title="Je n'aime pas"
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${r.myVote === "dislike" ? "text-rose-500" : "text-slate-400 hover:text-rose-500"}`}
                >
                  <ThumbsDown size={11} fill={r.myVote === "dislike" ? "currentColor" : "none"} /> {r.dislikes || 0}
                </button>
                {perm.me && r.doctorId === perm.me && (
                  <button
                    type="button"
                    onClick={() => onEdit(r.id, r.text)}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-violet-500 cursor-pointer"
                  >
                    Modifier
                  </button>
                )}
                {canDelete(r.doctorId) && (
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
  return <div className="mt-2 space-y-2">{comments.map((c) => renderComment(c, 0))}</div>;
}
