import DashboardClient from './components/DashboardClient'
import { getEnergyData } from '@/lib/energyData'

export default async function Home() {
  let payload: any = null
  let error: string | null = null

  try {
    payload = await getEnergyData()
  } catch (e: any) {
    error = e.message
  }

  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      <DashboardClient payload={payload} error={error} />
    </main>
  )
}
