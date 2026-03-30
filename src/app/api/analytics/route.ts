import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { projectId, sessionId, event_type, metadata } = body

  if (!projectId || !event_type) {
    return NextResponse.json({ error: 'projectId and event_type required' }, { status: 400 })
  }

  // Verify project exists and is published (public access for embed views)
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Record analytics event
  const { error } = await supabaseAdmin
    .from('analytics_events')
    .insert({
      project_id: projectId,
      event_type,
      session_id: sessionId || null,
      metadata: metadata || {},
    })

  if (error) {
    console.error('Analytics insert error:', error)
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }

  // For 'view' events, increment the view counter (deduplicated by session)
  if (event_type === 'view') {
    // Check if this session already counted a view in the last hour
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
    const { data: existing } = await supabaseAdmin
      .from('analytics_events')
      .select('id')
      .eq('project_id', projectId)
      .eq('event_type', 'view')
      .eq('session_id', sessionId)
      .gte('created_at', oneHourAgo)
      .limit(2)

    if (!existing || existing.length <= 1) {
      // First view this session — increment counter
      await supabaseAdmin.rpc('increment_project_views', { p_id: projectId })
    }
  }

  // For hold events, increment interactions counter
  if (event_type === 'hold_start') {
    await supabaseAdmin
      .from('projects')
      .update({ total_interactions: supabaseAdmin.rpc('increment_project_views', { p_id: projectId }) })
      .eq('id', projectId)
  }

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const days = parseInt(searchParams.get('days') || '30')

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  // Verify ownership
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString()

  const { data: events } = await supabaseAdmin
    .from('analytics_events')
    .select('event_type, session_id, metadata, created_at')
    .eq('project_id', projectId)
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (!events) return NextResponse.json({ views: 0, holds: 0, avgHoldDuration: 0, events: [] })

  const views = events.filter(e => e.event_type === 'view').length
  const holdStarts = events.filter(e => e.event_type === 'hold_start')
  const holdEnds = events.filter(e => e.event_type === 'hold_end')
  const holds = holdStarts.length
  const totalHoldDuration = holdEnds.reduce((sum, e) => sum + ((e.metadata as { duration?: number })?.duration || 0), 0)
  const avgHoldDuration = holds > 0 ? totalHoldDuration / holdEnds.length : 0

  // Group views by day for chart
  const viewsByDay: Record<string, number> = {}
  events.filter(e => e.event_type === 'view').forEach(e => {
    const day = e.created_at.slice(0, 10)
    viewsByDay[day] = (viewsByDay[day] || 0) + 1
  })

  const chart = Object.entries(viewsByDay).map(([date, count]) => ({ date, views: count }))

  return NextResponse.json({
    views,
    holds,
    avgHoldDuration: Math.round(avgHoldDuration * 10) / 10,
    holdRate: views > 0 ? Math.round((holds / views) * 100) : 0,
    chart,
  })
}
