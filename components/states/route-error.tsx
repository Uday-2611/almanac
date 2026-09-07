type RouteErrorProps = { message: string; reset: () => void };

export function RouteError({ message, reset }: RouteErrorProps) {
  return <div role="alert"><p>{message}</p><button onClick={reset} type="button">Try again</button></div>;
}
