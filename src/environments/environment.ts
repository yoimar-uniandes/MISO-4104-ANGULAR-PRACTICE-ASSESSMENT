export const environment = {
  production: true,
  /**
   * URL canónica del sitio (sin slash final).
   * Se usa para construir URLs absolutas en og:url, og:image, twitter:image.
   * Cambiar al dominio real al desplegar.
   */
  siteUrl: 'https://ghquerry.example.com',
  apis: {
    users:
      'https://gist.githubusercontent.com/caev03/628509e0b3fe41dd44f6a2ab09d81ef9/raw/f847eafbecca47287ff0faec4de1329b874f5711/users.json',
    repositories:
      'https://gist.githubusercontent.com/caev03/628509e0b3fe41dd44f6a2ab09d81ef9/raw/f847eafbecca47287ff0faec4de1329b874f5711/repositories.json',
  },
} as const;
