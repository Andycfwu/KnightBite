export function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="animate-pulse rounded-[28px] border border-ink/10 bg-white px-4 py-5 shadow-soft sm:px-5"
        >
          <div className="h-3 w-20 rounded-full bg-sand" />
          <div className="mt-4 h-5 w-2/3 rounded-full bg-sand sm:w-1/2" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((cell) => (
              <div key={cell} className="rounded-[22px] border border-sand bg-cream px-4 py-4">
                <div className="h-4 w-1/2 rounded-full bg-sand" />
                <div className="mt-3 flex gap-2">
                  <div className="h-8 w-16 rounded-full bg-sand" />
                  <div className="h-8 w-16 rounded-full bg-sand" />
                  <div className="h-8 w-16 rounded-full bg-sand" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
