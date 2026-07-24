import type { PeerData } from '../components/PeerCursor';

export function usePeerSimulation(_enabled = false): PeerData[] {
  // Mock peer simulation removed as requested.
  // Only real Socket.IO room collaborators will be rendered.
  return [];
}
