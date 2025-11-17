import { createContentLoader } from 'vitepress'

export default createContentLoader('de/**/*.md', {
  transform(rawData) {
    return rawData
      .filter(page => page.frontmatter?.quality)
      .map(page => {
        const quality = page.frontmatter.quality
        const overallScore = quality.reviewed
          ? (quality.completeness + quality.accuracy) / 2
          : (quality.completeness + quality.accuracy) / 2 * 0.8

        // Extract category from URL path
        const pathParts = page.url.split('/')
        let category = 'Allgemein'

        if (pathParts.length >= 3) {
          if (pathParts[2] === 'administrationshandbuch') {
            category = 'Administration'
          } else if (pathParts[2] === 'benutzerhandbuch') {
            category = 'Benutzerhandbuch'
          } else if (pathParts[2] === 'entwicklung') {
            category = 'Entwicklung'
          } else if (pathParts[2] === 'entwicklungsstrategie') {
            category = 'Strategie'
          } else {
            category = pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1)
          }
        }

        const qualityClass = overallScore >= 80 ? 'sehr-gut' :
                            overallScore >= 60 ? 'gut' :
                            overallScore >= 40 ? 'ausreichend' : 'verbesserungsbedarf'

        return {
          title: page.frontmatter.title || page.url.split('/').pop()?.replace('.html', '') || 'Unbenannt',
          path: page.url,
          category,
          quality: {
            completeness: quality.completeness,
            accuracy: quality.accuracy,
            reviewed: quality.reviewed,
            reviewer: quality.reviewer || null,
            reviewDate: quality.reviewDate || null,
            overallScore: Math.round(overallScore)
          },
          qualityClass
        }
      })
      .sort((a, b) => b.quality.overallScore - a.quality.overallScore)
  }
})
