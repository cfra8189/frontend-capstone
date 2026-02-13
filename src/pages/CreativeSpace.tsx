import Header from "../components/Header";
import CreativeSpaceContent from "../components/Creative/CreativeSpaceContent";
import PageTransition from "../components/PageTransition";

export default function CreativeSpace() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-theme-primary">
        <Header />
        <div className="max-w-7xl mx-auto p-4 sm:p-6 h-[calc(100vh-80px)]">
          <CreativeSpaceContent />
        </div>
      </div>
    </PageTransition>
  );
}
