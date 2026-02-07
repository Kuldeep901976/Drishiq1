export interface AdConfig {
  id: string;
  title: string;
  content: string;
  position: string;
  conditions: any;
  isActive: boolean;
  type?: string;
  cta?: string;
  link?: string;
  dismissible?: boolean;
}

export function useAdManager() {
  return {
    allAds: [],
    pageSettings: {},
    addAd: () => {},
    removeAd: () => {},
    updateAd: (id: string, data: any) => {},
    updatePageSettings: () => {},
    clearDismissedAds: () => {},
    refreshData: () => {},
    createAd: () => {},
    deleteAd: () => {},
    getAds: () => [],
    isAdManager: false
  };
}
