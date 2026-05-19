import { apiGet, apiPost } from "./client";

export type FeedResponse = {
  data: {
    posts: Array<{
      id: string;
      author: { id: string; name: string; role: string | null; avatar: string | null };
      time: string;
      content: string;
      image: string | null;
      likes: number;
      comments: Array<{ id: string; user: string; text: string; createdAt: string }>;
      isLiked: boolean;
      isSaved: boolean;
    }>;
    stories: Array<{ id: string; userId: string; user: string; avatar: string | null; image: string; viewed: boolean; time: string }>;
    suggestions: Array<{ id: string; name: string; role: string | null; avatar: string | null; isFollowing: boolean }>;
  };
};

export function getCommunityFeed() { return apiGet<FeedResponse>("/api/v1/community/feed"); }
export function createPost(payload: { content: string; imageUrl?: string }) {
  return apiPost<{ data: { id: string } }>("/api/v1/community/posts", payload, 30000);
}
export function createStory(payload: { imageUrl: string; hoursToLive?: number }) {
  return apiPost<{ data: { id: string } }>("/api/v1/community/stories", payload, 30000);
}
export function addComment(postId: string, payload: { content: string }) { return apiPost<{ success: boolean }>(`/api/v1/community/posts/${encodeURIComponent(postId)}/comments`, payload); }
export function toggleLike(postId: string) { return apiPost<{ success: boolean }>(`/api/v1/community/posts/${encodeURIComponent(postId)}/like`); }
export function toggleSave(postId: string) { return apiPost<{ success: boolean }>(`/api/v1/community/posts/${encodeURIComponent(postId)}/save`); }
export function toggleFollow(userId: string) { return apiPost<{ success: boolean }>(`/api/v1/community/users/${encodeURIComponent(userId)}/follow`); }
export function getMyProfile() {
  return apiGet<{
    data: {
      id: string;
      name: string;
      username: string;
      title: string | null;
      bio: string | null;
      avatar: string | null;
      stats: { posts: number; followers: number; following: number };
      posts: Array<{ id: string; image: string | null; content: string; createdAt: string }>;
    };
  }>("/api/v1/community/profile/me");
}
