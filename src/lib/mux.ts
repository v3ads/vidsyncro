import Mux from '@mux/mux-node'

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export const { video } = muxClient

export async function createUploadUrl(
  projectId: string,
  videoSlot: 'a' | 'b'
): Promise<{ uploadUrl: string; uploadId: string }> {
  const upload = await video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL || '*',
    new_asset_settings: {
      playback_policy: ['public'],
      passthrough: JSON.stringify({ projectId, videoSlot }),
    },
  })

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
  }
}

export async function getAsset(assetId: string) {
  return await video.assets.retrieve(assetId)
}

export async function deleteAsset(assetId: string) {
  return await video.assets.delete(assetId)
}

export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function getThumbnailUrl(playbackId: string, time: number = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=640`
}

export function getAnimatedThumbnailUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/animated.gif?width=320`
}

export default muxClient
