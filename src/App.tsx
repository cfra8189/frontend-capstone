import { useAuth } from "./hooks/use-auth";
import { Route, Switch, useLocation } from "wouter";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreativeSpace from "./pages/CreativeSpace";
import ProjectDetails from "./pages/ProjectDetails";
import Generator from "./pages/Generator";
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
import BackgroundGif from "./components/BackgroundGif";

function App() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (location === "/admin") {
    return (
      <>
        <BackgroundGif />
        <Admin />
      </>
    );
  }

  if (location === "/community") {
    return (
      <>
        <BackgroundGif />
        <Community />
      </>
    );
  }

  if (location === "/docs") {
    return (
      <>
        <BackgroundGif />
        <Docs />
      </>
    );
  }

  if (location === "/capstone") {
    return (
      <>
        <BackgroundGif />
        <CapstoneDoc />
      </>
    );
  }

  if (location.startsWith("/portfolio/")) {
    return (
      <>
        <BackgroundGif />
        <Portfolio />
      </>
    );
  }

  if (location.startsWith("/epk/")) {
    return (
      <>
        <BackgroundGif />
        <EPKView />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <BackgroundGif />
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
        <BackgroundGif />
        <Landing />
      </>
    );
  }

  return (
    <>
      <BackgroundGif />
      <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/creative" component={CreativeSpace} />
      <Route path="/project/:id" component={ProjectDetails} />
      <Route path="/generator" component={Generator} />
      <Route path="/submissions" component={SubmissionGenerator} />
      <Route path="/epk" component={EPKEditor} />
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
    </>
  );
}

export default App;
