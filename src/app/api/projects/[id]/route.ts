import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function getProjectAndVerifyOwner(id: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return { project: null, error: 'Not found' }
  if (data.user_id !== userId) return { project: null, error: 'Forbidden' }
  return { project: data, error: null }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project, error } = await getProjectAndVerifyOwner(params.id, session.user.id)
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 404 })
  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project, error } = await getProjectAndVerifyOwner(params.id, session.user.id)
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 404 })

  const body = await req.json()
  const allowed = ['title', 'description', 'overlay_config', 'embed_config', 'status', 'video_a', 'video_b']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  updates.updated_at = new Date().toISOString()

  const { data, error: updateError } = await supabaseAdmin
    .from('projects')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await getProjectAndVerifyOwner(params.id, session.user.id)
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 404 })

  const { error: deleteError } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', params.id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
