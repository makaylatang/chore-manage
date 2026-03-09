type Subscriber = (data: string) => void;

const subscribers = new Set<Subscriber>();

export function subscribe(fn: Subscriber): void {
  subscribers.add(fn);
}

export function unsubscribe(fn: Subscriber): void {
  subscribers.delete(fn);
}

export function broadcast(data: string): void {
  subscribers.forEach((fn) => {
    try {
      fn(data);
    } catch {
      subscribers.delete(fn);
    }
  });
}
