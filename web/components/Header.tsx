'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { LogOut, User as UserIcon } from 'lucide-react'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <header className="mb-8 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Medical Image Analysis AI</h1>
        <p className="text-sm text-gray-500">DenseNet121 & Grad-CAM Diagnosis</p>
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
            {user.user_metadata.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="User" 
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <UserIcon className="h-5 w-5 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {user.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  )
}
