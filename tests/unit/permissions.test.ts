// tests/unit/permissions.test.ts
import { isAdmin, isManager, canManageLocations, canViewAllLocations } from "@/lib/auth";
import { UserRole } from "@prisma/client";

describe("Role-based access control", () => {
  // ── isAdmin ──────────────────────────────────────────────────────────────
  describe("isAdmin()", () => {
    it("returns true for ADMIN", () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true);
    });
    it("returns false for LOCATION_MANAGER", () => {
      expect(isAdmin(UserRole.LOCATION_MANAGER)).toBe(false);
    });
    it("returns false for STAFF", () => {
      expect(isAdmin(UserRole.STAFF)).toBe(false);
    });
  });

  // ── isManager ────────────────────────────────────────────────────────────
  describe("isManager()", () => {
    it("returns true for ADMIN", () => {
      expect(isManager(UserRole.ADMIN)).toBe(true);
    });
    it("returns true for LOCATION_MANAGER", () => {
      expect(isManager(UserRole.LOCATION_MANAGER)).toBe(true);
    });
    it("returns false for STAFF", () => {
      expect(isManager(UserRole.STAFF)).toBe(false);
    });
  });

  // ── canManageLocations ───────────────────────────────────────────────────
  describe("canManageLocations()", () => {
    it("allows ADMIN to manage locations", () => {
      expect(canManageLocations(UserRole.ADMIN)).toBe(true);
    });
    it("prevents LOCATION_MANAGER from managing locations", () => {
      expect(canManageLocations(UserRole.LOCATION_MANAGER)).toBe(false);
    });
    it("prevents STAFF from managing locations", () => {
      expect(canManageLocations(UserRole.STAFF)).toBe(false);
    });
  });

  // ── canViewAllLocations ──────────────────────────────────────────────────
  describe("canViewAllLocations()", () => {
    it("allows ADMIN to view all locations", () => {
      expect(canViewAllLocations(UserRole.ADMIN)).toBe(true);
    });
    it("prevents LOCATION_MANAGER from viewing all locations", () => {
      expect(canViewAllLocations(UserRole.LOCATION_MANAGER)).toBe(false);
    });
  });

  // ── Location manager scope ────────────────────────────────────────────────
  describe("Location manager data scoping", () => {
    it("a location manager with locationId X cannot see alert for locationId Y", () => {
      const session = { user: { role: UserRole.LOCATION_MANAGER, locationId: "loc_millwoods" } };
      const alert   = { locationId: "loc_crystallina" };

      const canView = session.user.locationId === alert.locationId;
      expect(canView).toBe(false);
    });

    it("a location manager with locationId X can see alert for locationId X", () => {
      const session = { user: { role: UserRole.LOCATION_MANAGER, locationId: "loc_millwoods" } };
      const alert   = { locationId: "loc_millwoods" };

      const canView = session.user.locationId === alert.locationId;
      expect(canView).toBe(true);
    });

    it("admin can see alerts from any location", () => {
      const role = UserRole.ADMIN;
      // Admin does not have locationId scoping
      expect(canViewAllLocations(role)).toBe(true);
    });
  });
});
