import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.drishiq.com";

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // 12 language pages (static route set)
    { url: `${base}/hi`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/es`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/ar`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/zh`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/fr`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/de`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/ru`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/pt`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/bn`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/ta`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/ja`, lastModified: new Date(), priority: 0.8 },
  ];
}
