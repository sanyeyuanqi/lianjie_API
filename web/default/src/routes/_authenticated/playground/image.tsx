import { createFileRoute, redirect } from '@tanstack/react-router'
import { getFreshSidebarModuleEnabled } from '@/lib/nav-modules'
import { Main } from '@/components/layout/components/main'
import { ImagePlayground } from '@/features/playground/image-playground'

export const Route = createFileRoute('/_authenticated/playground/image')({
  beforeLoad: async () => {
    if (await getFreshSidebarModuleEnabled('chat', 'image')) {
      return
    }

    if (await getFreshSidebarModuleEnabled('chat', 'playground')) {
      throw redirect({ to: '/playground' })
    }

    if (await getFreshSidebarModuleEnabled('chat', 'chat')) {
      throw redirect({ to: '/chat' })
    }

    throw redirect({ to: '/dashboard' })
  },
  component: ImagePlaygroundPage,
})

function ImagePlaygroundPage() {
  return (
    <Main className='p-0'>
      <ImagePlayground />
    </Main>
  )
}
