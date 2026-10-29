import { Suspense } from "react";
import ResultView from "@/components/ResultView";
import Spinner from "@/components/Spinner";

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-muted">
          <Spinner />
        </div>
      }
    >
      <ResultView />
    </Suspense>
  );
}
