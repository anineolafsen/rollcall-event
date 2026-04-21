// TODO: bytt ut med ekte userId når session/token er implementert
// Sannsynlig implementasjon: bruk useUser() fra @clerk/expo for å hente
// brukerens e-post, og slå opp tilhørende database-ID via GET /api/users.
export function useCurrentUserId(): number {
  return 7;
}
