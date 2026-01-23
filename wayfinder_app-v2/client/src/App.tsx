import { useAuth } from "./hooks/use-auth";
import { Route, Switch } from "wouter";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreativeSpace from "./pages/CreativeSpace";
import ProjectDetails from "./pages/ProjectDetails";
import Generator from "./pages/Generator";

function App() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-black font-bold text-xl mx-auto mb-4 animate-pulse">
            W
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/creative" component={CreativeSpace} />
      <Route path="/project/:id" component={ProjectDetails} />
      <Route path="/generator" component={Generator} />
      <Route>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">404</h1>
            <p className="text-gray-500">Page not found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
