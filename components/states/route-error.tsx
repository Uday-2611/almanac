type RouteErrorProps = { message: string; retry: () => void };

export function RouteError({ message, retry }: RouteErrorProps) {
  return (
    <main className="flex min-h-[60dvh] flex-col justify-center px-5 py-20 text-[#111111] sm:px-8">
      <div role="alert" className="max-w-lg border-t border-[#eaeaea] pt-5">
        <p className="text-base leading-7">{message}</p>
        <button onClick={retry} type="button" className="ledger-focus mt-5 min-h-11 rounded-[4px] px-2 text-sm font-medium hover:bg-black/[0.04]">Try again</button>
      </div>
    </main>
  );
}
