declare module '@nanostores/react' {
  // Minimal shim for useStore to keep types happy
  export function useStore<T = any>(store: any): T;
}

