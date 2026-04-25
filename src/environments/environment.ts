export const environment = {
  production: true,
  /**
   * URL canónica del sitio (sin slash final).
   * Se usa para construir URLs absolutas en og:url, og:image, twitter:image.
   * GitHub Pages → incluye el path del repo porque sirve bajo subpath.
   */
  siteUrl: 'https://yoimar-uniandes.github.io/MISO-4104-ANGULAR-PRACTICE-ASSESSMENT',
  apis: {
    users:
      'https://gist.githubusercontent.com/caev03/628509e0b3fe41dd44f6a2ab09d81ef9/raw/f847eafbecca47287ff0faec4de1329b874f5711/users.json',
    repositories:
      'https://gist.githubusercontent.com/caev03/628509e0b3fe41dd44f6a2ab09d81ef9/raw/f847eafbecca47287ff0faec4de1329b874f5711/repositories.json',
  },
} as const;
