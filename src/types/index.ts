export type Plan = 'free' | 'starter' | 'pro' | 'enterprise' | 'admin'
export type SwitchMode = 'hold' | 'toggle' | 'hover'
export type TransitionType = 'crossfade' | 'slide-left' | 'slide-right' | 'zoom' | 'blur-reveal'
export type HintPosition = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center'

export interface VideoAsset {
  id: string
  muxAssetId: string | null
  muxPlaybackId: string | null
  muxUploadId: string | null
  status: 'pending' | 'preparing' | 'ready' | 'errored'
  duration: number | null
  aspectRatio: string | null
  thumbnailUrl: string | null
}

export interface OverlayConfig {
  switchMode: SwitchMode
  transitionType: TransitionType
  transitionDuration: number
  showHint: boolean
  hintText: string
  hintPosition: HintPosition
  showSwitchIndicator: boolean
  indicatorColor: string
  brandingVisible: boolean
  brandingText: string
  brandingUrl: string
  autoSwitchEnabled: boolean
  autoSwitchInterval: number
  labelA?: string
  labelB?: string
}

export interface EmbedConfig {
  width: string
  height: string
  responsive: boolean
  autoplay: boolean
  muted: boolean
  loop: boolean
  allowFullscreen: boolean
  shareEnabled: boolean
  passwordProtected: boolean
  password: string | null
  domainWhitelist: string[]
  primaryColor: string
  backgroundColor: string
}

export interface Project {
  id: string
  userId: string
  title: string
  slug: string
  description: string | null
  videoA: VideoAsset | null
  videoB: VideoAsset | null
  overlayConfig: OverlayConfig
  embedConfig: EmbedConfig
  status: 'draft' | 'published' | 'archived'
  totalViews: number
  totalInteractions: number
  createdAt: string
  updatedAt: string
}

export interface PlanLimits {
  maxProjects: number
  analytics: boolean
  customBranding: boolean
  domainWhitelist: boolean
  passwordProtect: boolean
  advancedTransitions: boolean
  prioritySupport: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxProjects: 2,
    analytics: false,
    customBranding: false,
    domainWhitelist: false,
    passwordProtect: false,
    advancedTransitions: false,
    prioritySupport: false,
  },
  starter: {
    maxProjects: 20,
    analytics: true,
    customBranding: true,
    domainWhitelist: false,
    passwordProtect: true,
    advancedTransitions: true,
    prioritySupport: false,
  },
  pro: {
    maxProjects: -1,
    analytics: true,
    customBranding: true,
    domainWhitelist: true,
    passwordProtect: true,
    advancedTransitions: true,
    prioritySupport: true,
  },
  enterprise: {
    maxProjects: -1,
    analytics: true,
    customBranding: true,
    domainWhitelist: true,
    passwordProtect: true,
    advancedTransitions: true,
    prioritySupport: true,
  },
  admin: {
    maxProjects: -1,
    analytics: true,
    customBranding: true,
    domainWhitelist: true,
    passwordProtect: true,
    advancedTransitions: true,
    prioritySupport: true,
  },
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  switchMode: 'hold',
  transitionType: 'crossfade',
  transitionDuration: 400,
  showHint: true,
  hintText: 'Hold to reveal',
  hintPosition: 'bottom-center',
  showSwitchIndicator: true,
  indicatorColor: '#8b5cf6',
  brandingVisible: false,
  brandingText: 'VidSyncro',
  brandingUrl: 'https://vidsyncro.com',
  autoSwitchEnabled: false,
  autoSwitchInterval: 5000,
  labelA: '',
  labelB: '',
}

export const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  width: '100%',
  height: '100%',
  responsive: true,
  autoplay: false,
  muted: false,
  loop: false,
  allowFullscreen: true,
  shareEnabled: true,
  passwordProtected: false,
  password: null,
  domainWhitelist: [],
  primaryColor: '#8b5cf6',
  backgroundColor: '#000000',
}
