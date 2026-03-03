import { NextResponse } from 'next/server'
import { getEnergyData } from '@/lib/energyData'

export async function GET() {
  try {
    const data = await getEnergyData()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
