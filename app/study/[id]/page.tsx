import { Suspense } from "react";
import Spinner from "@/components/Spinner";
import StudyView from "@/components/StudyView";

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-muted">
          <Spinner />
        </div>
      }
    >
      <StudyView />
    </Suspense>
  );
}
