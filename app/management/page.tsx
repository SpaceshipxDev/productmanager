import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import ManagementApp from '../ManagementApp'

export default async function Page() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const session = verifySession(sessionToken);
  if (!session) redirect("/login");
  return <ManagementApp />;
}
