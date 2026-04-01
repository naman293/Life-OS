import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/users/sync
// Called on the client after sign-in to upsert the Clerk user into our DB
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Clerk user not found" }, { status: 404 });

  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress ?? "";

  const user = await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      displayName: clerkUser.fullName ?? clerkUser.username ?? "User",
      email: primaryEmail,
      avatarUrl: clerkUser.imageUrl ?? null,
      preferences: {},
    },
    update: {
      displayName: clerkUser.fullName ?? clerkUser.username ?? "User",
      avatarUrl: clerkUser.imageUrl ?? null,
      // Don't overwrite email or preferences on update
    },
  });

  return NextResponse.json(user);
}

// GET /api/users/sync — get current user record
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    // User not synced yet — trigger sync
    return NextResponse.json({ error: "User not synced" }, { status: 404 });
  }

  return NextResponse.json(user);
}
