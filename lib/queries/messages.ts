// Direct messages were removed in phase one (no-DM constraint). This stub keeps
// the section layouts that render <BottomNav /> compiling without change.
export async function getUnreadDMCount(_userId?: string): Promise<number> {
  return 0;
}
