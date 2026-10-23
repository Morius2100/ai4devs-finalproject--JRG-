import { beforeEach, describe, expect, it, vi } from "vitest";
import { FriendshipService } from "@/server/services/friendship-service";
import { VisibilityPolicy } from "@/server/services/visibility-policy";

vi.mock("@/server/services/friendship-service", () => ({
  FriendshipService: { areFriends: vi.fn() },
}));

const AUTHOR_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";

describe("VisibilityPolicy.canAccess", () => {
  it("Tema público: accesible para cualquier visitante", () => {
    const topic = { visibility: "PUBLIC" as const, authorId: AUTHOR_ID };
    expect(VisibilityPolicy.canAccess(topic, OTHER_ID, { areFriends: false })).toBe(true);
  });

  it("Tema privado propio: accesible para su creador", () => {
    const topic = { visibility: "PRIVATE" as const, authorId: AUTHOR_ID };
    expect(VisibilityPolicy.canAccess(topic, AUTHOR_ID, { areFriends: false })).toBe(true);
  });

  it("Tema privado ajeno: no accesible si no son amigos", () => {
    const topic = { visibility: "PRIVATE" as const, authorId: AUTHOR_ID };
    expect(VisibilityPolicy.canAccess(topic, OTHER_ID, { areFriends: false })).toBe(false);
  });

  it("Tema privado ajeno: accesible si son amigos", () => {
    const topic = { visibility: "PRIVATE" as const, authorId: AUTHOR_ID };
    expect(VisibilityPolicy.canAccess(topic, OTHER_ID, { areFriends: true })).toBe(true);
  });
});

describe("VisibilityPolicy.canSeePrivateTopicsOf", () => {
  beforeEach(() => {
    vi.mocked(FriendshipService.areFriends).mockReset();
  });

  it("El propio autor ve sus privados sin consultar amistades", async () => {
    expect(await VisibilityPolicy.canSeePrivateTopicsOf(AUTHOR_ID, AUTHOR_ID)).toBe(true);
    expect(FriendshipService.areFriends).not.toHaveBeenCalled();
  });

  it("Un amigo del autor ve sus privados", async () => {
    vi.mocked(FriendshipService.areFriends).mockResolvedValue(true);
    expect(await VisibilityPolicy.canSeePrivateTopicsOf(AUTHOR_ID, OTHER_ID)).toBe(true);
    expect(FriendshipService.areFriends).toHaveBeenCalledWith(AUTHOR_ID, OTHER_ID);
  });

  it("Quien no es amigo no ve sus privados", async () => {
    vi.mocked(FriendshipService.areFriends).mockResolvedValue(false);
    expect(await VisibilityPolicy.canSeePrivateTopicsOf(AUTHOR_ID, OTHER_ID)).toBe(false);
  });
});
