import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Header from '@/components/Header'

// useRouterのモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Supabaseのモック
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn(),
    },
  }),
}))

describe('Header Component', () => {
  it('renders the title correctly', () => {
    render(<Header />)
    expect(screen.getByText('Medical Image Analysis AI')).toBeInTheDocument()
    expect(screen.getByText('DenseNet121 & Grad-CAM Diagnosis')).toBeInTheDocument()
  })
})
