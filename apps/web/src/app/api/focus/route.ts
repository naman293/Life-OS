import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { focusMins } = body;

    if (!focusMins || typeof focusMins !== 'number') {
      return NextResponse.json({ error: 'Invalid focusMins' }, { status: 400 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    const currentXp = (user.unsafeMetadata.focusXp as number) || 0;
    const currentLevel = (user.unsafeMetadata.focusLevel as number) || 1;

    const newXp = currentXp + (focusMins * 10);
    const newLevel = Math.floor(newXp / 500) + 1;

    await client.users.updateUserMetadata(userId, {
      unsafeMetadata: {
        ...user.unsafeMetadata,
        focusXp: newXp,
        focusLevel: newLevel,
      },
    });

    return NextResponse.json({ success: true, xp: newXp, level: newLevel });
  } catch (error) {
    console.error('Error updating focus XP:', error);
    return NextResponse.json({ error: 'Failed to update focus XP' }, { status: 500 });
  }
}
