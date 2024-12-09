import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return new Response("Missing user ID", { status: 400 });
  }
  console.log(uid);
  try {
    // Update user document to set admin status
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, { admin: true, role: 'admin' });

    return new Response("User has been approved as admin.", { status: 200 });
  } catch (error) {
    console.error('Error approving admin:', error);
    return new Response("Failed to approve admin", { status: 500 });
  }
}
