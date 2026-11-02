import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { Spinner, Toaster } from "./components/ui";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import { useStore } from "./store/useStore";

// Les pages sont chargées à la demande : démarrage plus rapide sur mobile.
const Coach = lazy(() => import("./pages/Coach"));
const Translate = lazy(() => import("./pages/Translate"));
const Pronounce = lazy(() => import("./pages/Pronounce"));
const SlangPage = lazy(() => import("./pages/Slang"));
const Practice = lazy(() => import("./pages/Practice"));
const Review = lazy(() => import("./pages/Review"));
const Mistakes = lazy(() => import("./pages/Mistakes"));
const SettingsPage = lazy(() => import("./pages/Settings"));

const page = (el: React.ReactNode) => <Suspense fallback={<div className="py-20"><Spinner label="Chargement…" /></div>}>{el}</Suspense>;

export default function App() {
  const onboarded = useStore((s) => s.settings.onboarded);
  const theme = useStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
  return (
    <HashRouter>
      <Toaster />
      {!onboarded && <Onboarding />}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="coach" element={page(<Coach />)} />
          <Route path="traduire" element={page(<Translate />)} />
          <Route path="prononciation" element={page(<Pronounce />)} />
          <Route path="argot" element={page(<SlangPage />)} />
          <Route path="exercices" element={page(<Practice />)} />
          <Route path="revision" element={page(<Review />)} />
          <Route path="erreurs" element={page(<Mistakes />)} />
          <Route path="reglages" element={page(<SettingsPage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
