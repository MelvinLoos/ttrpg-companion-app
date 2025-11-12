import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../plugins/supabase'

export interface AssetState {
  assets: Asset[]
  loading: boolean
  error: string | null
}

export interface Asset {
  id: string
  gm_id: string
  asset_type: 'portrait' | 'scene' | 'map'
  type: 'IMAGE' | 'AUDIO'
  storage_bucket: 'portraits' | 'scenes' | 'maps'
  storage_path: string
  public_url: string | null
  friendly_name: string | null
  created_at: string
}

export const useAssetStore = defineStore('asset', () => {
  // State
  const state = ref<AssetState>({
    assets: [],
    loading: false,
    error: null
  })

  // Getters
  const sortedAssets = computed(() => 
    [...state.value.assets].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  )

  const assetsByType = computed(() => ({
    portraits: sortedAssets.value.filter(a => a.asset_type === 'portrait'),
    scenes: sortedAssets.value.filter(a => a.asset_type === 'scene'),
    maps: sortedAssets.value.filter(a => a.asset_type === 'map')
  }))

  // Actions
  async function fetchAssets() {
    state.value.loading = true
    state.value.error = null

    try {
      const { data, error } = await supabase
        .from('session_assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      state.value.assets = (data || []) as Asset[]
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to fetch assets'
    } finally {
      state.value.loading = false
    }
  }

  async function uploadAsset(
    file: File, 
    assetType: Asset['asset_type'],
    friendlyName?: string
  ) {
    state.value.loading = true
    state.value.error = null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Determine storage bucket based on asset type
      const bucket = assetType === 'portrait' ? 'portraits' : 
                     assetType === 'scene' ? 'scenes' : 
                     assetType === 'map' ? 'maps' : 'portraits' // default fallback
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      // Create asset record
      const { data: asset, error: insertError } = await supabase
        .from('session_assets')
        .insert([{
          gm_id: user.id,
          asset_type: assetType,
          type: 'IMAGE', // Default to IMAGE for Feature 3
          storage_bucket: bucket,
          storage_path: fileName,
          public_url: data.publicUrl,
          friendly_name: friendlyName || file.name
        }])
        .select()
        .single()

      if (insertError) throw insertError

      state.value.assets = [asset as Asset, ...state.value.assets]
      return asset
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to upload asset'
      return null
    } finally {
      state.value.loading = false
    }
  }

  async function deleteAsset(asset: Asset) {
    state.value.loading = true
    state.value.error = null

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(asset.storage_bucket)
        .remove([asset.storage_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('session_assets')
        .delete()
        .eq('id', asset.id)

      if (dbError) throw dbError

      state.value.assets = state.value.assets.filter(a => a.id !== asset.id)
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to delete asset'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  // Real-time subscriptions
  function subscribeToChanges() {
    const subscription = supabase
      .channel('asset-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_assets' },
        (payload) => {
          if (!payload.new && !payload.old) return

          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                state.value.assets = [payload.new as Asset, ...state.value.assets]
              }
              break
            case 'DELETE':
              if (payload.old) {
                state.value.assets = state.value.assets.filter(a => a.id !== payload.old.id)
              }
              break
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  return {
    state,
    sortedAssets,
    assetsByType,
    fetchAssets,
    uploadAsset,
    deleteAsset,
    subscribeToChanges
  }
})