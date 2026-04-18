const mangaTR = {
  id: "MangaTR",
  name: "Manga-TR",
  icon: "https://manga-tr.com/favicon.ico",
  site: "https://manga-tr.com",
  version: 1,
  fileType: "image/jpeg",
  lang: "Turkish",
  category: "MANGA",

  popularNovels: async function(page) {
    const url = `https://manga-tr.com/manga-list.html?listType=pagination&sayfa=${page}`;
    const result = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://manga-tr.com"
      }
    });
    const body = await result.text();
    const novels = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");
    
    doc.querySelectorAll("a[href$='.html']").forEach(el => {
      const href = el.getAttribute("href") || "";
      if (href.includes("bolum") || href.includes("index") || href.includes("arama") || href.includes("list")) return;
      const title = el.getAttribute("title") || el.querySelector("img")?.getAttribute("alt") || el.textContent.trim();
      const cover = el.querySelector("img")?.getAttribute("src") || "";
      const id = href.replace(".html", "").split("/").pop();
      if (title && id && title.length > 2) {
        novels.push({
          sourceId: id,
          novelName: title,
          novelCover: cover.startsWith("http") ? cover : `https://manga-tr.com${cover}`,
          novelUrl: href.startsWith("http") ? href : `https://manga-tr.com/${id}.html`,
        });
      }
    });

    return novels;
  },

  searchNovels: async function(searchTerm) {
    const url = `https://manga-tr.com/arama.html?icerik=${encodeURIComponent(searchTerm)}`;
    const result = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac
