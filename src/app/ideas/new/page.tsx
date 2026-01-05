'use client'

import { Header } from '@/components/layout/header'
import { NewIdeaForm } from '@/components/ideas/new-idea-form'

export default function NewIdeaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <NewIdeaForm />
      </main>
    </div>
  )
}
