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
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://manga-tr.com"
      }
    });
    const body = await result.text();
    const novels = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");

    doc.querySelectorAll("tr, .manga-item").forEach(el => {
      const link = el.querySelector("a[href$='.html']");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.includes("bolum") || href.includes("arama")) return;
      const title = link.textContent.trim() || link.getAttribute("title") || "";
      const cover = el.querySelector("img")?.getAttribute("src") || "";
      const id = href.replace(".html", "").split("/").pop();
      if (title && id) {
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

  parseNovels: async function(novelUrl) {
    const result = await fetch(novelUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://manga-tr.com"
      }
    });
    const body = await result.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");

    const title = doc.querySelector("h2.widget-title, h1")?.textContent.trim() || "";
    const cover = doc.querySelector("img.thumbnail, .imagebig img")?.getAttribute("src") || "";
    const summary = doc.querySelector(".description-summary, #synopsis")?.textContent.trim() || "";

    let author = "";
    let status = "Ongoing";
    const genres = [];

    doc.querySelectorAll("table.table tr, .srepetarz tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return;
      const label = cells[0].textContent.toLowerCase();
      const value = cells[cells.length - 1].textContent.trim();
      if (label.includes("yazar")) author = value;
      if (label.includes("durum")) status = value.toLowerCase().includes("tamam") ? "Completed" : "Ongoing";
      if (label.includes("tür")) genres.push(...value.split(",").map(g => g.trim()).filter(Boolean));
    });

    const chapters = [];
    doc.querySelectorAll("table#chapter_list tr, .chapter-list li").forEach((el, i) => {
      const link = el.querySelector("a[href*='bolum'], a[href*='chapter']");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const chTitle = link.textContent.trim();
      const num = parseFloat(chTitle.match(/[\d.]+/)?.[0] || i);
      const chId = href.replace(".html", "").split("/").pop();
      chapters.push({
        chapterUrl: href.startsWith("http") ? href : `https://manga-tr.com/${chId}.html`,
        chapterName: chTitle || `Bölüm ${num}`,
        releaseTime: null,
      });
    });

    return {
      sourceId: novelUrl.split("/").pop()?.replace(".html", "") || "",
      novelName: title,
      novelCover: cover.startsWith("http") ? cover : `https://manga-tr.com${cover}`,
      summary,
      author,
      status,
      genre: genres.join(", "),
      chapters: chapters.reverse(),
    };
  },

  parseChapter: async function(chapterUrl) {
    const result = await fetch(chapterUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://manga-tr.com"
      }
    });
    const body = await result.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");
    const pages = [];

    doc.querySelectorAll("img.viewer-image, #okuyucu img, img[data-src]").forEach(el => {
      const src = el.getAttribute("data-src") || el.getAttribute("src") || "";
      if (src && !src.includes("logo") && !src.includes("banner")) {
        pages.push(src.startsWith("http") ? src : `https://manga-tr.com${src}`);
      }
    });

    if (pages.length === 0) {
      doc.querySelectorAll("script:not([src])").forEach(s => {
        const match = s.textContent.match(/(?:pages|images|resimler)\s*=\s*(\[.*?\])/s);
        if (match) {
          try {
            JSON.parse(match[1]).forEach(u => pages.push(u.startsWith("http") ? u : `https://manga-tr.com${u}`));
          } catch {}
        }
      });
    }

    return [...new Set(pages)].join("\n");
  },
};
