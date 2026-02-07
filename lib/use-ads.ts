export function useAds() {
  return {
    loadAd: () => {},
    showAd: () => {},
    hideAd: () => {},
    isAdLoaded: false,
    adError: null
  };
}

export function useAdManager() {
  return {
    allAds: [] as any[],
    pageSettings: {} as any,
    addAd: (ad: any) => {},
    removeAd: (id: string) => {},
    updateAd: (id: string, data: any) => {},
    updatePageSettings: (page: string, settings: any) => {},
    clearDismissedAds: () => {},
    refreshData: () => {},
    createAd: () => {},
    deleteAd: () => {},
    getAds: () => [],
    isAdManager: false
  };
}
