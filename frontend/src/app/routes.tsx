import { createBrowserRouter, Navigate } from "react-router";
import { Suspense, lazy, type ComponentType } from "react";
import { MainLayout } from "./components/layouts/MainLayout";
import { RequireAuth } from "./components/auth/RequireAuth";

function RouteLoading() {
  return <div className="min-h-[240px] animate-pulse rounded-xl border border-border/50 bg-card/60" />;
}

function buildLazyRoute<TModule extends Record<string, unknown>>(loader: () => Promise<TModule>, exportName: keyof TModule) {
  const LazyComponent = lazy(async () => {
    const module = await loader();
    return { default: module[exportName] as ComponentType };
  });
  return function LazyRouteComponent() {
    return <Suspense fallback={<RouteLoading />}><LazyComponent /></Suspense>;
  };
}

const Login = buildLazyRoute(() => import("./pages/Login"), "Login");
const NoPermission = buildLazyRoute(() => import("./pages/NoPermission"), "NoPermission");
const Chat = buildLazyRoute(() => import("./pages/Chat"), "Chat");
const Community = buildLazyRoute(() => import("./pages/Community"), "Community");
const Profile = buildLazyRoute(() => import("./pages/Profile"), "Profile");

function ProtectedMainLayout() {
  return <RequireAuth><MainLayout /></RequireAuth>;
}

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/unauthorized", Component: NoPermission },
  {
    path: "/",
    Component: ProtectedMainLayout,
    children: [
      { index: true, element: <Navigate to="/community" replace /> },
      { path: "community", Component: Community },
      { path: "chat", Component: Chat },
      { path: "profile", Component: Profile },
      { path: "*", element: <Navigate to="/community" replace /> }
    ]
  }
]);
