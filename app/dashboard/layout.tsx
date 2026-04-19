import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const adminSupabase = await createAdminClient()

  await adminSupabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? '',
  }, { onConflict: 'id', ignoreDuplicates: true })

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar profile={profile} />
      </div>

      {/* Mobile Nav */}
      <div className="mobile-nav">
        <MobileNav profile={profile} />
      </div>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
          .mobile-nav { display: none !important; }
          .main-content { margin-left: 240px; min-height: 100vh; }
        }
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-nav { display: block !important; }
          .main-content { 
            margin-left: 0 !important; 
            padding-top: 56px;
            padding-bottom: 70px;
            min-height: 100vh;
          }
        }
      `}</style>
    </div>
  )
}
