import Header from "../components/Header";
import CreativeSpaceContent from "../components/Creative/CreativeSpaceContent";
import PageTransition from "../components/PageTransition";

import { useState } from "react";
import TrackReviewModal from "./TrackReviewModal";

export default function CreativeSpace() {
  const [showTrackReviewModal, setShowTrackReviewModal] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen bg-theme-primary">
        <Header />
        <div className="max-w-7xl mx-auto p-4 sm:p-6 h-[calc(100vh-80px)]">
          <CreativeSpaceContent />
        </div>

        {/* Track Review Modal */}
        <TrackReviewModal
          isOpen={!!new URLSearchParams(window.location.search).get("reviewId") || showTrackReviewModal}
          onClose={() => {
            setShowTrackReviewModal(false);
            const url = new URL(window.location.href);
            if (url.searchParams.has("reviewId")) {
              url.searchParams.delete("reviewId");
              window.history.pushState({}, "", url.toString());
            }
          }}
          reviewId={new URLSearchParams(window.location.search).get("reviewId")}
        />
      </div>
    </PageTransition>
  );
}
