import { useState, useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import { NotificationProvider } from "./context/NotificationContext";
import { Route, Switch, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreativeSpace from "./pages/CreativeSpace";
import ProjectDetails from "./pages/ProjectDetails";
import Generator from "./pages/Generator";
import Documents from "./pages/Documents";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Community from "./pages/Community";
import Docs from "./pages/Docs";
import StudioDashboard from "./pages/StudioDashboard";
import Portfolio from "./pages/Portfolio";
import SubmissionGenerator from "./pages/SubmissionGenerator";
import EPKEditor from "./pages/EPKEditor";
import EPKView from "./pages/EPKView";
import CapstoneDoc from "./pages/CapstoneDoc";
import TrackReview from "./pages/TrackReview";
import GlobalEffects from "./components/GlobalEffects"; // Changed import
import GlobalAudioPlayer from "./components/GlobalAudioPlayer";
import { AudioPlayerProvider } from "./context/AudioPlayerContext";

function App() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();


  if (location === "/admin") {
    return (
      <>
        <GlobalEffects />
        <Admin />
      </>
    );
  }

  if (location === "/community") {
    return (
      <>
        <GlobalEffects />
        <Community />
      </>
    );
  }

  if (location === "/docs") {
    return (
      <>
        <GlobalEffects />
        <Docs />
      </>
    );
  }

  if (location === "/capstone") {
    return (
      <>
        <GlobalEffects />
        <CapstoneDoc />
      </>
    );
  }

  if (location.startsWith("/portfolio/")) {
    return (
      <>
        <GlobalEffects />
        <Portfolio />
      </>
    );
  }

  if (location.startsWith("/epk/")) {
    return (
      <>
        <GlobalEffects />
        <EPKView />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <GlobalEffects />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <img src="/box-logo.png" alt="BOX" className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <GlobalEffects />
        <Landing />
      </>
    );
  }

  return (
    <NotificationProvider>
      <AudioPlayerProvider>
        <GlobalEffects />
        <AnimatePresence mode="wait">
          <Switch location={location} key={location}>
            <Route path="/" component={Dashboard} />
            <Route path="/creative" component={CreativeSpace} />
            <Route path="/project/:id" component={ProjectDetails} />
            <Route path="/track-review" component={TrackReview} />
            <Route path="/generator" component={Generator} />
            <Route path="/documents" component={Documents} />
            <Route path="/submissions" component={SubmissionGenerator} />
            <Route path="/epk" component={EPKEditor} />
            <Route path="/epk/editor" component={EPKEditor} />
            <Route path="/epk/:boxCode" component={EPKView} />
            <Route path="/settings" component={Settings} />
            <Route path="/studio" component={StudioDashboard} />
            <Route>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">404</h1>
                  <p className="text-gray-500">Page not found</p>
                </div>
              </div>
            </Route>
          </Switch>
        </AnimatePresence>
        <GlobalAudioPlayer />
      </AudioPlayerProvider>
    </NotificationProvider>
  );
}

export default App;
